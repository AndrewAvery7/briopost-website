// Turns one readable stylesheet into small compact pieces (used by build-pages.mjs for assets/home.css).
//
// Why: site checkers (Ahrefs, 2026-11-23) flag any stylesheet over 15 kB as sent over the wire (compressed), and
// home.css is about 31 kB compressed. So the home page loads compact copies instead: comments and spare spaces
// removed, then cut into pieces of at most BUDGET bytes compressed. Each cut falls between two top-level rules, and
// the pieces load in order, so the page gets exactly the same rules in the same order as from home.css itself.
// Edit assets/home.css only; the pieces (assets/home.min-N.css) are rebuilt by node scripts/build-pages.mjs.
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

export const BUDGET = 14000; // bytes compressed per piece, under the 15 kB (15,360 bytes) checkers use

// Remove comments and spare whitespace. Strings ("..." and '...') are copied untouched. Spaces are dropped only
// where CSS never needs them: around { } ; , > and after a colon. A space before a colon is kept, because in a
// selector it means "any descendant" (".a :hover" is not ".a:hover"). "+" and "~" keep their spaces (calc()).
export function minify(css) {
  let out = '', i = 0, pendingSpace = false;
  const tight = '{};,>';
  const push = (s) => {
    if (pendingSpace && out && !tight.includes(out.at(-1)) && out.at(-1) !== ':' && !tight.includes(s[0])) out += ' ';
    pendingSpace = false;
    if (s === '}' && out.at(-1) === ';') out = out.slice(0, -1); // the last declaration needs no semicolon
    out += s;
  };
  while (i < css.length) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') { const end = css.indexOf('*/', i + 2); i = end < 0 ? css.length : end + 2; pendingSpace = true; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1;
      push(css.slice(i, j + 1)); i = j + 1; continue;
    }
    if (/\s/.test(c)) { pendingSpace = true; i++; continue; }
    push(c); i++;
  }
  return out.trim();
}

// Positions just after each top-level rule ends (depth 0, outside strings).
function boundaries(css) {
  const cuts = []; let depth = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") { let j = i + 1; while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1; i = j; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) cuts.push(i + 1); }
    else if (c === ';' && depth === 0) cuts.push(i + 1);
  }
  if (depth !== 0) throw new Error('split-css: unbalanced braces');
  return cuts;
}

const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;

export function splitCss(source, name) {
  const css = minify(source.replace(/\r\n/g, '\n'));
  const cuts = boundaries(css);
  const pieces = []; let start = 0;
  while (start < css.length) {
    const ahead = cuts.filter((c) => c > start);
    // The furthest cut whose piece still fits (compressed size grows with length, so search for the last fit).
    let lo = 0, hi = ahead.length - 1, best = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (gz(css.slice(start, ahead[mid])) <= BUDGET) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    if (best < 0) throw new Error('split-css: one rule in ' + name + ' is larger than ' + BUDGET + ' bytes compressed');
    pieces.push(css.slice(start, ahead[best])); start = ahead[best];
  }
  return pieces.map((text, n) => ({
    file: name.replace(/\.css$/, '.min-' + (n + 1) + '.css'),
    text: '/* Built from ' + name + ' by scripts/build-pages.mjs. Do not edit: change ' + name + ' instead. */\n' + text + '\n',
    get version() { return createHash('sha256').update(this.text).digest('hex').slice(0, 10); },
    get compressed() { return gz(this.text); },
  }));
}
