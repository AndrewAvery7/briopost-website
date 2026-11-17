/* Free carousel slide planner (/free-tools/carousel-slide-planner/). Runs only in the visitor's browser: nothing is
   sent or stored. One idea (slide 1), one slide per point, and a last slide with a next step; words counted per slide,
   with a gentle note past about 25 and 30 words (a readability guideline for phones, not a LinkedIn rule).
   Tells the analytics file which control was used through a page event (briopost:tool); never the words. */
(function () {
  'use strict';
  var root = document.getElementById('slide-planner');
  if (!root) return;

  var WARM = 25; // past this, a soft note
  var LONG = 30; // past this, suggest splitting
  var title = document.getElementById('sp-title');
  var points = document.getElementById('sp-points');
  var next = document.getElementById('sp-next');
  var list = document.getElementById('sp-slides');
  var count = document.getElementById('sp-count');
  var status = document.getElementById('sp-status');
  var shapeName = document.getElementById('sp-shape-name');
  var SHAPES = { portrait: '4:5 portrait, 1080 x 1350', square: '1:1 square, 1080 x 1080', tall: '9:16 tall, 1080 x 1920' };
  var announceTimer = 0;

  function tell(action) {
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: { tool: 'slide_planner', action: action } })); } catch (e) { /* never break the tool */ }
  }
  function say(msg) { status.textContent = ''; window.setTimeout(function () { status.textContent = msg; }, 30); }
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };

  function words(s) { s = s.trim(); return s ? s.split(/\s+/).length : 0; }
  function parsePoints(v) {
    return v.split('\n').map(function (l) { return l.replace(/^\s*(?:[•*\-–—]|\d+[.)])\s+/, '').trim(); }).filter(Boolean);
  }
  function plan() {
    var slides = [{ kind: 'hook', text: title.value.trim() }];
    parsePoints(points.value).forEach(function (p) { slides.push({ kind: 'point', text: p }); });
    slides.push({ kind: 'next', text: next.value.trim() });
    return slides;
  }
  var EMPTY = { hook: 'Your title goes here.', point: '', next: 'Your next step goes here.' };
  var LABEL = { hook: 'Hook', point: 'Point', next: 'Next step' };

  function el(tag, cls, text) { var e = document.createElement(tag); e.className = cls; if (text) e.textContent = text; return e; }

  function render() {
    var slides = plan(), long = 0, nPoints = slides.length - 2;
    list.textContent = '';
    slides.forEach(function (s, i) {
      var w = words(s.text);
      var li = el('li', 'sp-slide');
      li.appendChild(el('p', 'sp-num', 'Slide ' + (i + 1) + ' · ' + LABEL[s.kind]));
      li.appendChild(el('p', 'sp-text', s.text || EMPTY[s.kind]));
      li.appendChild(el('p', 'sp-words', s.text ? plural(w, 'word', 'words') : 'Empty'));
      if (!s.text) li.classList.add('is-empty');
      else if (w > LONG) {
        long++;
        li.classList.add('is-long');
        li.appendChild(el('p', 'sp-tip', 'May be hard to read on a phone. Try splitting it into two slides.'));
      } else if (w > WARM) {
        li.classList.add('is-warm');
        li.appendChild(el('p', 'sp-tip', 'Getting long for a phone. Could a word or two go?'));
      }
      list.appendChild(li);
    });
    var text = plural(slides.length, 'slide', 'slides') + ': a hook, ' + plural(nPoints, 'point', 'points') + ' and a next step.';
    if (!nPoints) text += ' Add your points, one per line, to fill the middle.';
    if (long) text += ' ' + plural(long, 'slide', 'slides') + ' may be hard to read on a phone.';
    count.textContent = text;
    return text;
  }
  function announce() {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(function () { say(count.textContent); }, 1200);
  }

  function asText() {
    var slides = plan();
    var out = ['Carousel plan (' + plural(slides.length, 'slide', 'slides') + ')', ''];
    slides.forEach(function (s, i) {
      var label = 'Slide ' + (i + 1) + (s.kind === 'hook' ? ' (hook)' : s.kind === 'next' ? ' (next step)' : '');
      out.push(label + ': ' + (s.text || '[empty]'));
    });
    return out.join('\n');
  }

  // ---- Wire up ----------------------------------------------------------------------------------------------------
  root.classList.add('is-live');
  [title, points, next].forEach(function (f) {
    f.addEventListener('input', function () { render(); announce(); });
    f.addEventListener('change', function () { tell('plan_update'); });
  });

  root.querySelectorAll('[data-shape]').forEach(function (b) {
    b.addEventListener('click', function () {
      var shape = b.getAttribute('data-shape');
      root.querySelectorAll('[data-shape]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      root.setAttribute('data-shape-view', shape);
      shapeName.textContent = SHAPES[shape];
      say('Slides drawn as ' + SHAPES[shape] + '.');
      tell('shape_switch');
    });
  });

  document.getElementById('sp-copy').addEventListener('click', function () {
    if (!title.value.trim() && !parsePoints(points.value).length && !next.value.trim()) { say('There is nothing to copy yet. Add a title and some points.'); title.focus(); return; }
    var text = asText();
    var ok = function () { say('Plan copied as plain text.'); tell('copy'); };
    var fallback = function () {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { done = false; }
      document.body.removeChild(t);
      if (done) ok(); else say('Your browser blocked copying. Select the slides and press Ctrl+C (Cmd+C on a Mac).');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  });

  document.getElementById('sp-clear').addEventListener('click', function () {
    title.value = ''; points.value = ''; next.value = '';
    render();
    title.focus();
    say('Cleared. Type a title to start a new plan.');
    tell('clear');
  });

  render();
})();
