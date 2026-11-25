// Fills the shared parts into every hand-written page (see README, "Pages and shared parts").
//
//   <!--HEADER-->...<!--/HEADER-->   partials/header.html (skip link, logo, menu)
//   <!--FOOTER-->...<!--/FOOTER-->   partials/footer.html (page links, legal links, assets/site.js)
//   <!--SAMPLE-->...<!--/SAMPLE-->   the interactive sample as plain HTML (assets/sample/sample.js render()), so it reads
//                                    without JavaScript. Options go in the opening marker, for example
//                                    <!--SAMPLE topic="career" size="square" chart="line" brand="harbor" format="carousel"-->
//
// Usage:  node scripts/build-pages.mjs           fill every page
//         node scripts/build-pages.mjs --check   change nothing; exit 1 if a page is out of date or lacks its markers
//
// The four legal pages (privacy, terms, email-policy, contact) are written by the generator in the studio repo
// (docs/legal/build_legal.py), which writes empty HEADER/FOOTER markers; this script fills only those markers. Everything between a pair of markers is replaced, so never hand-edit inside them.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');
const require = createRequire(import.meta.url);
const Sample = require(join(root, 'assets/sample/sample.js'));

const GENERATED = new Set(['privacy/index.html', 'terms/index.html', 'email-policy/index.html', 'contact/index.html']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', 'partials', '.github']);
// Pages that deliberately show no site header or footer: /film/ is the film on its own, made to be texted.
const BARE = new Set(['film/index.html', 'film-test/index.html']);

const read = (f) => readFileSync(f, 'utf8');
// Partials are stored with LF; a trailing newline is dropped so the marker pair reads <!--HEADER-->\n...\n<!--/HEADER-->.
const partial = (name) => read(join(root, 'partials', name)).replace(/\r\n/g, '\n').replace(/\n+$/, '');
const parts = { HEADER: partial('header.html'), FOOTER: partial('footer.html') };

const SAMPLE_DEFAULTS = { topic: 'sales', brand: 'midnight', size: 'portrait', chart: 'bar', format: 'carousel' };
const ALLOWED = {
  topic: Object.keys(Sample.TOPICS), brand: Object.keys(Sample.BRANDS), size: ['portrait', 'square'],
  chart: ['bar', 'line', 'area'], format: ['carousel', 'graphic', 'text', 'poll', 'cover']
};
function sampleHTML(args, file) {
  const state = { ...SAMPLE_DEFAULTS, own: '', vote: null, img: Sample.IMG };
  for (const m of (args || '').matchAll(/(\w+)="([^"]*)"/g)) {
    const [, key, value] = m;
    if (!ALLOWED[key]) throw new Error(file + ': unknown SAMPLE option ' + key);
    if (!ALLOWED[key].includes(value)) throw new Error(file + ': SAMPLE ' + key + ' must be one of ' + ALLOWED[key].join(', '));
    state[key] = value;
  }
  return Sample.render(state);
}

function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : pages(join(dir, e.name));
    return e.name.endsWith('.html') ? [join(dir, e.name)] : [];
  });
}

function fill(text, file) {
  // Keep the file's own line endings.
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const eol = (s) => s.replace(/\n/g, nl);
  let out = text;
  for (const name of ['HEADER', 'FOOTER']) {
    out = out.replace(new RegExp('<!--' + name + '-->[\\s\\S]*?<!--/' + name + '-->', 'g'),
      () => '<!--' + name + '-->' + nl + eol(parts[name]) + nl + '<!--/' + name + '-->');
  }
  out = out.replace(/<!--SAMPLE((?:\s+\w+="[^"]*")*)\s*-->[\s\S]*?<!--\/SAMPLE-->/g,
    (m, args) => '<!--SAMPLE' + args + '-->' + sampleHTML(args, file) + '<!--/SAMPLE-->');
  return out;
}

const stale = [], missing = [];
let written = 0;
for (const abs of pages(root)) {
  const file = relative(root, abs).split('\\').join('/');
  const text = read(abs);
  const lacks = ['HEADER', 'FOOTER'].filter((n) => !text.includes('<!--' + n + '-->') || !text.includes('<!--/' + n + '-->'));
  if (lacks.length && !BARE.has(file)) missing.push(file + ' (no ' + lacks.join(' or ') + ' markers)');
  const next = fill(text, file);
  if (next === text) continue;
  if (check) stale.push(file);
  else { writeFileSync(abs, next); written++; console.log('filled ' + file); }
}

if (missing.length) {
  console.error('Pages without the shared header/footer markers:\n  - ' + missing.join('\n  - '));
}
if (check) {
  if (stale.length) console.error('Out of date (run node scripts/build-pages.mjs):\n  - ' + stale.join('\n  - '));
  if (stale.length || missing.length) process.exit(1);
  console.log('Shared page parts are up to date.');
} else {
  console.log(written ? 'Filled ' + written + ' page(s).' : 'All pages were already up to date.');
  if (missing.length) process.exit(1);
}
