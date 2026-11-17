/* Free LinkedIn hook preview (/free-tools/linkedin-hook-preview/). Runs only in the visitor's browser: nothing is
   sent or stored. Up to three versions of a post's opening, each shown in a phone-width sample feed card with an
   approximate "...see more" cut (the same approximation as the post formatter's phone view: about three lines, or
   about 140 characters when the opening runs long). LinkedIn decides the real cut, and it varies by device.
   Tells the analytics file which control was used through a page event (briopost:tool); never the words. */
(function () {
  'use strict';
  var root = document.getElementById('hook-preview');
  if (!root) return;

  var MAX_CHARS = 140; // phone view, as in formatter.js
  var MAX_LINES = 3;
  var FILLER = 'This is where the rest of your post would go: the story, the steps or the details that make your opening worth the click.';
  var items = [].slice.call(root.querySelectorAll('.hp-item'));
  var addBtn = document.getElementById('hp-add');
  var addNote = document.getElementById('hp-add-note');
  var status = document.getElementById('hp-status');
  var announceTimer = 0;

  function tell(action) {
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: { tool: 'hook_preview', action: action } })); } catch (e) { /* never break the tool */ }
  }
  function say(msg) { status.textContent = ''; window.setTimeout(function () { status.textContent = msg; }, 30); }
  var fmtNum = function (n) { return n.toLocaleString('en-US'); };
  var plural = function (n, one, many) { return n === 1 ? one : many; };

  // An approximation of the feed's "...see more" cut on a phone (same rule as formatter.js).
  function cut(text) {
    var chars = Array.from(text), lines = text.split('\n');
    var byLines = lines.slice(0, MAX_LINES).join('\n');
    var short = Array.from(byLines).length < chars.length ? byLines : text;
    if (Array.from(short).length > MAX_CHARS) short = chars.slice(0, MAX_CHARS).join('').replace(/\s+\S*$/, '');
    return short.length < text.length ? short.replace(/\s+$/, '') : null;
  }

  // What one hook looks like in the feed: the visible part of the hook, the visible part of the sample text after it,
  // and how many of the hook's lines show before the cut.
  function measure(raw) {
    var hook = raw.replace(/^\s+|\s+$/g, '');
    if (!hook) return null;
    var full = hook + '\n\n' + FILLER;
    var visible = cut(full) || full;
    var shownHook = visible.slice(0, Math.min(visible.length, hook.length)).replace(/\s+$/, '');
    var rest = visible.length > hook.length ? visible.slice(hook.length) : '';
    var lines = hook.split('\n');
    var shownLines = 0, at = 0;
    lines.forEach(function (l) { if (at < shownHook.length) shownLines++; at += l.length + 1; });
    return {
      hook: hook,
      chars: Array.from(hook).length,
      lines: lines.length,
      shownLines: shownLines,
      whole: visible.length >= hook.length,
      shownChars: Array.from(shownHook).length,
      shownHook: shownHook,
      rest: rest
    };
  }

  function statsText(m) {
    if (!m) return 'Type an opening to see it in the preview.';
    var a = fmtNum(m.chars) + ' ' + plural(m.chars, 'character', 'characters') + ' · ' + m.shownLines + ' of ' + m.lines + ' ' +
      plural(m.lines, 'line shows', 'lines show') + ' before “…see more”.';
    var b = m.whole ? ' The whole hook shows before the cut.' : ' The cut may fall inside this hook, after about ' + fmtNum(m.shownChars) + ' characters.';
    return a + b;
  }

  function visibleItems() { return items.filter(function (it) { return !it.hidden; }); }
  function field(it) { return it.querySelector('textarea'); }

  function renderItem(it) {
    var m = measure(field(it).value);
    var stats = it.querySelector('.hp-stats');
    var body = it.querySelector('.feed-body');
    stats.textContent = statsText(m);
    it.classList.toggle('is-cut', !!(m && !m.whole));
    body.textContent = '';
    if (!m) {
      body.classList.add('is-empty');
      body.textContent = 'Your opening shows here as you type.';
      return;
    }
    body.classList.remove('is-empty');
    body.appendChild(document.createTextNode(m.shownHook));
    if (m.rest) {
      var r = document.createElement('span');
      r.className = 'feed-rest';
      r.textContent = m.rest;
      body.appendChild(r);
    }
    var more = document.createElement('span');
    more.className = 'feed-cut';
    more.textContent = '…see more';
    body.appendChild(more);
  }

  function summary() {
    var parts = visibleItems().map(function (it, i) {
      var m = measure(field(it).value);
      if (!m) return 'Hook ' + (i + 1) + ' is empty.';
      return 'Hook ' + (i + 1) + (m.whole ? ' shows in full before the cut.' : ' may be cut after about ' + fmtNum(m.shownChars) + ' characters.');
    });
    return parts.join(' ');
  }
  function announce() {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(function () { say(summary()); }, 1200);
  }

  function layout() {
    var n = visibleItems().length;
    items.forEach(function (it) {
      var rm = it.querySelector('[data-remove]');
      if (rm) rm.hidden = n < 2;
    });
    addBtn.hidden = n >= items.length;
    addNote.hidden = n < items.length;
  }

  function copyText(text, done, fallbackField) {
    var fallback = function () {
      fallbackField.focus(); fallbackField.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      if (ok) done(); else say('Your browser blocked copying. Select the text and press Ctrl+C (Cmd+C on a Mac).');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  // ---- Wire up ----------------------------------------------------------------------------------------------------
  root.classList.add('is-live');
  items.forEach(function (it, i) {
    var ta = field(it);
    ta.addEventListener('input', function () { renderItem(it); announce(); });
    ta.addEventListener('change', function () { tell('hook_edit'); });
    it.querySelector('[data-copy]').addEventListener('click', function () {
      var text = ta.value.replace(/^\s+|\s+$/g, '');
      if (!text) { say('Hook ' + (i + 1) + ' is empty. Type an opening first.'); ta.focus(); return; }
      copyText(text, function () { say('Hook ' + (i + 1) + ' copied. Paste it at the top of your post.'); tell('copy'); }, ta);
    });
    var rm = it.querySelector('[data-remove]');
    if (rm) rm.addEventListener('click', function () {
      var vis = visibleItems(), n = vis.length;
      if (n < 2) return;
      for (var j = i; j < n - 1; j++) field(items[j]).value = field(items[j + 1]).value;
      field(items[n - 1]).value = '';
      items[n - 1].hidden = true;
      items.forEach(renderItem);
      layout();
      field(items[Math.min(i, n - 2)]).focus();
      say('Hook removed. ' + (n - 1) + ' ' + plural(n - 1, 'hook', 'hooks') + ' left.');
      tell('hook_remove');
    });
  });

  addBtn.addEventListener('click', function () {
    var next = items.filter(function (it) { return it.hidden; })[0];
    if (!next) return;
    next.hidden = false;
    field(next).value = '';
    renderItem(next);
    layout();
    field(next).focus();
    say('Hook ' + (items.indexOf(next) + 1) + ' added. Type another version of your opening.');
    tell('hook_add');
  });

  items.forEach(renderItem);
  layout();
})();
