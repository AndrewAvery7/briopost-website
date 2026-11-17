/* Free LinkedIn post formatter (/free-tools/linkedin-post-formatter/). Runs only in the visitor's browser: nothing is
   sent or stored, except an optional draft the visitor chooses to keep in this browser (localStorage).
   Bold and italic use Unicode sans-serif math letters, the only way to style text in a plain LinkedIn post.
   Tells the analytics file what was used through a page event (briopost:tool); never the words. */
(function () {
  'use strict';
  var root = document.getElementById('formatter');
  if (!root) return;

  var ta = document.getElementById('fmt-text');
  var count = document.getElementById('fmt-count');
  var countNote = document.getElementById('fmt-count-note');
  var bar = document.getElementById('fmt-meter-fill');
  var status = document.getElementById('fmt-status');
  var keep = document.getElementById('fmt-keep');
  var body = document.getElementById('fmt-preview-body');
  var more = document.getElementById('fmt-more');
  var less = document.getElementById('fmt-less');
  var LIMIT = 3000;
  var DRAFT_KEY = 'briopost-formatter-draft';
  var view = 'phone';
  var expanded = false;

  function tell(action) {
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: { tool: 'post_formatter', action: action } })); } catch (e) { /* never break the tool */ }
  }
  function say(msg) { status.textContent = ''; window.setTimeout(function () { status.textContent = msg; }, 30); }

  // ---- Unicode styles ---------------------------------------------------------------------------------------------
  // Sans-serif bold, italic and bold italic (Mathematical Alphanumeric Symbols). Italic has no digits; bold italic
  // digits fall back to bold digits.
  var START = {
    b: { A: 0x1D5D4, a: 0x1D5EE, d: 0x1D7EC },
    i: { A: 0x1D608, a: 0x1D622, d: null },
    bi: { A: 0x1D63C, a: 0x1D656, d: 0x1D7EC }
  };
  var REVERSE = {}; // code point -> { base, b, i }
  (function build() {
    var styles = { b: [true, false], i: [false, true], bi: [true, true] };
    Object.keys(styles).forEach(function (k) {
      for (var n = 0; n < 26; n++) {
        REVERSE[START[k].A + n] = { base: String.fromCharCode(65 + n), b: styles[k][0], i: styles[k][1] };
        REVERSE[START[k].a + n] = { base: String.fromCharCode(97 + n), b: styles[k][0], i: styles[k][1] };
      }
      if (START[k].d && k === 'b') for (var d = 0; d < 10; d++) REVERSE[START[k].d + d] = { base: String.fromCharCode(48 + d), b: true, i: false };
    });
  })();

  function info(ch) {
    var cp = ch.codePointAt(0);
    if (REVERSE[cp]) return REVERSE[cp];
    if (/^[A-Za-z0-9]$/.test(ch)) return { base: ch, b: false, i: false };
    return null; // not a letter or digit: never styled
  }
  function styled(base, b, i) {
    var k = b && i ? 'bi' : b ? 'b' : i ? 'i' : '';
    if (!k) return base;
    var c = base.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(START[k].A + c - 65);
    if (c >= 97 && c <= 122) return String.fromCodePoint(START[k].a + c - 97);
    if (c >= 48 && c <= 57) { var d = START[k].d || (b ? START.b.d : null); return d ? String.fromCodePoint(d + c - 48) : base; }
    return base;
  }
  function plain(text) {
    return Array.from(text).map(function (ch) { var f = info(ch); return f ? f.base : ch; }).join('');
  }
  // Turn bold or italic on for the whole selection, or off when every letter in it already has it.
  function toggle(text, which) {
    var chars = Array.from(text), all = true, any = false;
    // Digits have no italic form, so they never decide whether italics go on or off.
    chars.forEach(function (ch) { var f = info(ch); if (f && !(which === 'i' && /[0-9]/.test(f.base))) { any = true; if (!f[which]) all = false; } });
    if (!any) return null;
    var on = !all;
    return chars.map(function (ch) {
      var f = info(ch); if (!f) return ch;
      var b = which === 'b' ? on : f.b, i = which === 'i' ? on : f.i;
      return styled(f.base, b, i);
    }).join('');
  }

  // ---- Lists ------------------------------------------------------------------------------------------------------
  var PREFIX = /^(\s*)(?:•|\d+[.)])\s+/;
  function lineRange(value, a, b) {
    var start = value.lastIndexOf('\n', a - 1) + 1;
    var endBase = b > a && value.charAt(b - 1) === '\n' ? b - 1 : b;
    var end = value.indexOf('\n', endBase);
    return [start, end < 0 ? value.length : end];
  }
  function list(lines, kind) {
    var filled = lines.filter(function (l) { return l.trim(); });
    if (!filled.length) return null;
    var isBullet = function (l) { return /^\s*•\s+/.test(l); };
    var isNum = function (l) { return /^\s*\d+[.)]\s+/.test(l); };
    var already = filled.every(kind === 'bullets' ? isBullet : isNum);
    var n = 0;
    return lines.map(function (l) {
      if (!l.trim()) return l;
      var bare = l.replace(PREFIX, '$1');
      if (already) return bare;
      n++;
      return (kind === 'bullets' ? '• ' : n + '. ') + bare.replace(/^\s+/, '');
    });
  }

  // ---- Editing helpers --------------------------------------------------------------------------------------------
  function replace(a, b, text) {
    ta.focus();
    ta.setSelectionRange(a, b);
    var done = false;
    try { done = document.execCommand('insertText', false, text); } catch (e) { done = false; }
    if (!done || ta.value.slice(a, a + text.length) !== text) ta.setRangeText(text, a, b, 'end');
    ta.setSelectionRange(a, a + text.length);
    update();
  }

  function apply(kind) {
    var a = ta.selectionStart, b = ta.selectionEnd, value = ta.value;
    if (kind === 'b' || kind === 'i') {
      if (a === b) { say('Select the words you want in ' + (kind === 'b' ? 'bold' : 'italics') + ' first.'); ta.focus(); return; }
      var out = toggle(value.slice(a, b), kind);
      if (out === null) { say('Only letters and numbers can be styled. Select some words.'); return; }
      replace(a, b, out);
      say(kind === 'b' ? 'Bold changed.' : 'Italics changed.');
      tell(kind === 'b' ? 'bold' : 'italic');
    } else if (kind === 'bullets' || kind === 'numbers') {
      var r = lineRange(value, a, b);
      var lines = list(value.slice(r[0], r[1]).split('\n'), kind);
      if (!lines) { say('Type or select the lines you want in a list first.'); ta.focus(); return; }
      replace(r[0], r[1], lines.join('\n'));
      say(kind === 'bullets' ? 'Bullet list changed.' : 'Numbered list changed.');
      tell(kind);
    } else if (kind === 'plain') {
      if (a === b) { a = 0; b = value.length; }
      var p = plain(value.slice(a, b));
      if (p === value.slice(a, b)) { say('There is no bold or italic text to remove.'); return; }
      replace(a, b, p);
      say('Styling removed.');
      tell('plain');
    }
  }

  // ---- Counter, preview, draft ------------------------------------------------------------------------------------
  var fmtNum = function (n) { return n.toLocaleString('en-US'); };
  function cut(text) {
    // An approximation of the feed's "...see more" cut: about three lines, or fewer characters on a phone.
    var max = view === 'phone' ? 140 : 210;
    var chars = Array.from(text), lines = text.split('\n');
    var byLines = lines.slice(0, 3).join('\n');
    var short = Array.from(byLines).length < chars.length ? byLines : text;
    if (Array.from(short).length > max) short = chars.slice(0, max).join('').replace(/\s+\S*$/, '');
    return short.length < text.length ? short.replace(/\s+$/, '') : null;
  }
  function update() {
    var text = ta.value;
    var chars = Array.from(text).length, units = text.length;
    count.textContent = fmtNum(chars) + ' of about ' + fmtNum(LIMIT) + ' characters';
    var over = Math.max(chars, units) > LIMIT;
    root.classList.toggle('is-over', over);
    countNote.textContent = over
      ? 'This is longer than LinkedIn usually allows for a post. Shorten it before you paste it.'
      : units > chars
        ? 'Styled letters can count as two characters each. Counted that way, this post is ' + fmtNum(units) + '.'
        : '';
    bar.style.width = Math.min(100, (Math.max(chars, units) / LIMIT) * 100) + '%';
    var c = text.trim() ? cut(text) : null;
    if (!text.trim()) {
      body.textContent = 'Your post shows here as you type.';
      body.classList.add('is-empty');
    } else {
      body.classList.remove('is-empty');
      body.textContent = c && !expanded ? c : text;
    }
    more.hidden = !(c && !expanded);
    less.hidden = !(c && expanded);
    if (keep.checked) { try { localStorage.setItem(DRAFT_KEY, text); } catch (e) { /* storage blocked: the tool still works */ } }
  }

  // ---- Wire up ----------------------------------------------------------------------------------------------------
  root.classList.add('is-live');
  root.querySelector('.fmt-bar').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-fmt]'); if (!b) return;
    apply(b.getAttribute('data-fmt'));
  });
  // Keep the selection when a toolbar button is pressed with the mouse.
  root.querySelector('.fmt-bar').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  ta.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    var k = e.key.toLowerCase();
    if (k === 'b' || k === 'i') { e.preventDefault(); apply(k); }
  });
  ta.addEventListener('input', function () { expanded = false; update(); });

  more.addEventListener('click', function () { expanded = true; update(); less.focus(); tell('see_more'); });
  less.addEventListener('click', function () { expanded = false; update(); more.focus(); });

  root.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      view = b.getAttribute('data-view');
      root.querySelectorAll('[data-view]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      root.setAttribute('data-view', view);
      update();
      tell('view_' + view);
    });
  });

  document.getElementById('fmt-copy').addEventListener('click', function () {
    var text = ta.value;
    if (!text.trim()) { say('There is nothing to copy yet.'); ta.focus(); return; }
    var ok = function () { say('Copied. Paste it into LinkedIn.'); tell('copy'); };
    var fallback = function () {
      ta.focus(); ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { done = false; }
      if (done) ok(); else say('Your browser blocked copying. Select the text and press Ctrl+C (Cmd+C on a Mac).');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  });
  document.getElementById('fmt-clear').addEventListener('click', function () {
    if (!ta.value) { ta.focus(); return; }
    replace(0, ta.value.length, '');
    say('Cleared. Press Ctrl+Z (Cmd+Z on a Mac) to undo.');
    tell('clear');
  });
  document.getElementById('fmt-example').addEventListener('click', function () {
    var ex = 'I used to write LinkedIn posts the night before.\n\nNow I keep a list of the questions clients ask me. Every question is a post.\n\nThree I answered this month:\n• How long does onboarding take?\n• What should we measure first?\n• When is it too early to hire?\n\nWhat question do you hear every week?';
    replace(0, ta.value.length, ex);
    ta.setSelectionRange(0, 0);
    say('Example added. Select a few words and try Bold.');
    tell('example');
  });
  keep.addEventListener('change', function () {
    try {
      if (keep.checked) { localStorage.setItem(DRAFT_KEY, ta.value); say('Your draft will stay in this browser until you untick the box.'); }
      else { localStorage.removeItem(DRAFT_KEY); say('Draft removed from this browser.'); }
    } catch (e) { say('This browser does not allow saving drafts. The formatter still works.'); keep.checked = false; }
    tell(keep.checked ? 'draft_on' : 'draft_off');
  });

  try {
    var saved = localStorage.getItem(DRAFT_KEY);
    if (saved !== null) { keep.checked = true; if (!ta.value) ta.value = saved; }
  } catch (e) { /* storage blocked: start empty */ }
  update();
})();
