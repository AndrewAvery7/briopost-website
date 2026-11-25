/* Briopost combined preview. Every moment here is a sample: nothing is sent, generated, scheduled or posted.
   The pages read fully without this file. The sign-up form is assets/waitlist.js; the format demos are assets/sample/sample.js. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function watch(el, fn, threshold) {
    if (!hasIO) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { threshold: threshold || 0.3 }).observe(el);
  }

  /* ---- Anchor links: sections below the first screen skip layout until needed (content-visibility); before a jump
     to an anchor on this page, lay them all out so the jump lands on the right heading ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (a && a.pathname === location.pathname && a.hash) document.documentElement.classList.add('cv-off');
  }, true);

  /* The phone menu is handled by assets/site.js, shared by every page. */

  function arrows(items, onMove) {
    items.forEach(function (el, i) {
      el.addEventListener('keydown', function (e) {
        var k = e.key, n = -1;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % items.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + items.length) % items.length;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = items.length - 1;
        if (n < 0) return;
        e.preventDefault(); items[n].focus(); if (onMove) onMove(n);
      });
    });
  }

  /* ---- Opening (B1, fanned deal): tabs choose a format; its pieces page in order. The clock runs only while the
     opening is on screen, not paused, and not pointed at or focused. ---- */
  var PER = 1700;
  $$('[data-b]').forEach(function (obj) {
    var tabs = $$('.tab', obj), grps = $$('.grp', obj), pauseBtn = $('.pause', obj);
    var fi = 0, ii = 0, elapsed = 0, last = 0, vis = false, raf = 0, setTimer = 0;
    function its() { return $$('.it', grps[fi]); }
    function total() { return its().length * PER; }
    function setItem(k) {
      ii = k;
      its().forEach(function (it, j) { it.classList.toggle('is-cur', j === k); it.style.zIndex = String(30 - Math.abs(j - k)); });
    }
    function paint() { tabs.forEach(function (t, k) { $('.tab-bar i', t).style.transform = 'scaleX(' + (k === fi ? Math.min(1, elapsed / total()) : 0) + ')'; }); }
    function setFormat(n, focus) {
      fi = n; elapsed = 0;
      tabs.forEach(function (t, k) { var on = k === n; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      grps.forEach(function (g, k) { var on = k === n; g.classList.toggle('is-on', on); g.classList.remove('is-set'); g.setAttribute('aria-hidden', String(!on)); });
      /* The new format's cards fan out one after another; after that, card changes move together (is-set). */
      clearTimeout(setTimer); setTimer = setTimeout(function () {
        if (fi !== n) return;
        grps[n].classList.add('is-set');
        /* The formats now hidden go back to their first card while nobody can see them, so next time they rise in
           already in order. */
        grps.forEach(function (g, k) { if (k !== n) $$('.it', g).forEach(function (it, j) { it.classList.toggle('is-cur', j === 0); it.style.zIndex = String(30 - j); }); });
      }, 1300);
      setItem(0); paint();
      if (focus) tabs[n].focus();
    }
    /* Held only while a mouse that has actually moved is over the cards, or keyboard focus is inside. A pointer that
       happened to rest there when the page loaded, or a tab that kept focus after a mouse click, used to hold the
       clock too, so the opening sometimes never started. */
    var stage = $('.bstage', obj), pointerOn = false;
    stage.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') pointerOn = true; });
    stage.addEventListener('pointerleave', function () { pointerOn = false; });
    function held() {
      var a = document.activeElement;
      return pointerOn || (obj.contains(a) && a !== pauseBtn && a.matches(':focus-visible'));
    }
    function running() { return vis && pauseBtn.getAttribute('aria-pressed') !== 'true' && !held(); }
    function tick(t) {
      raf = 0;
      var dt = last ? Math.min(100, t - last) : 0; last = t;
      if (running()) {
        elapsed += dt;
        if (elapsed >= total()) setFormat((fi + 1) % tabs.length);
        else { var k = Math.floor(elapsed / PER); if (k !== ii) setItem(k); }
        paint();
      }
      if (vis) raf = requestAnimationFrame(tick); else last = 0;
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { setFormat(i); }); });
    arrows(tabs, function (n) { setFormat(n); });
    grps.forEach(function (g, gi) {
      $$('.it', g).forEach(function (it, j) { it.addEventListener('click', function () { if (gi === fi) { setItem(j); elapsed = j * PER; paint(); } }); });
    });
    pauseBtn.addEventListener('click', function () {
      var paused = pauseBtn.getAttribute('aria-pressed') !== 'true';
      pauseBtn.setAttribute('aria-pressed', String(paused));
      $('.pause-label', pauseBtn).textContent = paused ? 'Play' : 'Pause';
    });
    if (reduce) { pauseBtn.setAttribute('aria-pressed', 'true'); $('.pause-label', pauseBtn).textContent = 'Play'; }
    setFormat(0);
    function start() { if (vis && !raf) { last = 0; raf = requestAnimationFrame(tick); } }
    watch(obj, function (v) { vis = v; start(); });
    /* Coming back with the Back button restores the page from memory: start the clock again. */
    window.addEventListener('pageshow', function (e) { if (e.persisted) { pointerOn = false; var r = obj.getBoundingClientRect(); vis = r.bottom > 0 && r.top < innerHeight; start(); } });
  });

  /* ---- How it works, step 3: Give my OK on the sample post, and take it back ---- */
  $$('[data-ok]').forEach(function (card) {
    var btn = $('.ok-btn', card), text = $('.ok-text', card);
    if (!btn) return;
    var label = $('span', btn), use = $('use', btn);
    btn.addEventListener('click', function () {
      var on = !card.classList.contains('is-ok');
      card.classList.toggle('is-ok', on);
      text.textContent = on ? 'Confirmed with your OK' : 'Needs your OK';
      label.textContent = on ? 'Undo my OK' : 'Give my OK';
      use.setAttribute('href', on ? '#i-undo' : '#i-check');
    });
  });
  if (!reduce && hasIO) {
    var wio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); }); }, { threshold: 0.4 });
    $$('.ss .wave').forEach(function (w) { wio.observe(w); });
  }

  /* ---- Format demos, home-page extras. The carousel arrows, dots and keys live in sample.js (shared by every page with a sample). ---- */
  $$('.bp-demo').forEach(function (demo) {
    var out = $('.bp-output', demo);
    if (!out) return;
    // A format switch fades the new output in (the stage keeps its size, so nothing below moves). Chart kinds,
    // votes and Shape it redraw without the fade.
    var fadeT = 0;
    demo.addEventListener('click', function (e) {
      var b = e.target.closest('[role=tab][data-format]');
      if (!b || reduce || b.getAttribute('aria-selected') === 'true') return;
      out.classList.add('fmt-swap'); clearTimeout(fadeT); fadeT = setTimeout(function () { out.classList.remove('fmt-swap'); }, 400);
    }, true);
    // After "Shape it" the sample holds the visitor's own words (and the carousel adds a note): reserve that room for
    // every format, so switching formats still moves nothing.
    demo.addEventListener('click', function (e) {
      var b = e.target.closest('.shape-btn,[data-topic]'); if (!b) return;
      if (b.classList.contains('shape-btn')) { var ta = $('textarea', demo); if (ta && ta.value.trim()) demo.setAttribute('data-own', ''); }
      else demo.removeAttribute('data-own');
    });
    // The format list is vertical on wide screens: Up and Down move between tabs as Left and Right do.
    demo.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var t = e.target.closest && e.target.closest('[role=tab][data-format]'); if (!t) return;
      var list = t.closest('[role=tablist]');
      if (!list || list.getAttribute('aria-orientation') !== 'vertical') return;
      var tabs = $$('[role=tab][data-format]', list), i = tabs.indexOf(t);
      e.preventDefault();
      var n = (i + (e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus(); tabs[n].click();
    });
    // The four-formats list is a column on wide screens and a row on phones: keep aria-orientation true to it.
    var vlist = $('.fmt-tabs[role=tablist]', demo);
    if (vlist && window.matchMedia) {
      var mq = window.matchMedia('(min-width: 761px)');
      var orient = function () { vlist.setAttribute('aria-orientation', mq.matches ? 'vertical' : 'horizontal'); };
      orient(); if (mq.addEventListener) mq.addEventListener('change', orient);
    }
  });

  /* ---- Make it yours: the same design in another brand kit ---- */
  var kits = $('[data-kits]');
  if (kits) {
    var main = $('[data-kit-main]', kits);
    $$('[data-kit]', kits).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-kit]', kits).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        var src = b.getAttribute('data-kit');
        var swap = function () { main.src = src; main.alt = b.getAttribute('data-alt'); main.style.opacity = 1; };
        if (reduce) { swap(); return; }
        main.style.opacity = 0; setTimeout(swap, 180);
      });
    });
  }

  /* ---- Design strip: each design opens larger with its details. Native dialog: Esc closes, focus returns ---- */
  var pop = $('#swatch-pop'), strip = $('.design-strip');
  if (pop && strip && typeof pop.showModal === 'function') {
    var opener = null, joining = false, popImg = $('#pop-img'), popTitle = $('#pop-title'), popKind = $('#pop-kind'), popCount = $('#pop-count'), popSizes = $('#pop-sizes');
    $$('li > img', strip).forEach(function (img) {
      var alt = img.getAttribute('alt') || '', cut = alt.indexOf(': ');
      var isGraphic = /^Graphic/.test(alt), title = cut > -1 ? alt.slice(cut + 2) : alt;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sw-open';
      btn.setAttribute('aria-label', 'Open larger: ' + title);
      img.parentNode.insertBefore(btn, img); btn.appendChild(img);
      btn.addEventListener('click', function () {
        opener = btn; joining = false;
        popImg.src = img.currentSrc || img.src; popImg.alt = alt;
        popTitle.textContent = title;
        popKind.textContent = isGraphic ? 'Graphic design' : 'Carousel design';
        popCount.textContent = isGraphic ? '100 graphic designs' : '150 carousel designs';
        popSizes.textContent = isGraphic ? 'Square, portrait or story, plus wide and banner' : 'Square, portrait or story';
        pop.showModal();
      });
    });
    strip.removeAttribute('tabindex');
    strip.setAttribute('aria-label', 'A few real designs, scrolls sideways. Choose one to see it larger.');
    $('#pop-close').addEventListener('click', function () { pop.close(); });
    $('#pop-join').addEventListener('click', function () { joining = true; pop.close(); });
    pop.addEventListener('click', function (e) { if (e.target === pop) pop.close(); });
    pop.addEventListener('close', function () {
      if (joining) {
        var nm = $('#wl-name'), jt = $('#join-title');
        if (nm && !nm.matches(':disabled')) nm.focus({ preventScroll: true });
        else if (jt) jt.focus({ preventScroll: true });
      }
      else if (opener) opener.focus();
    });
  }

  /* ---- Plan it: Give my OK, and take it back ---- */
  var card = $('#ok-card'), give = $('#ok-give'), undo = $('#ok-undo'), badge = $('#ok-badge'), okStatus = $('#ok-status');
  if (card && give && undo && badge && okStatus) {
    give.addEventListener('click', function () {
      card.setAttribute('data-state', 'confirmed'); badge.textContent = 'Confirmed';
      okStatus.textContent = 'Confirmed for Thursday at 9:00 AM. You can take it back until then. This sample stays on this page.';
      if (!reduce) { card.classList.remove('is-springing'); void card.offsetWidth; card.classList.add('is-springing'); }
      give.hidden = true; undo.hidden = false; undo.focus();
    });
    undo.addEventListener('click', function () {
      card.setAttribute('data-state', 'waiting'); card.classList.remove('is-springing'); badge.textContent = 'Needs your OK';
      okStatus.textContent = 'Back to waiting. Nothing happens until you confirm.';
      undo.hidden = true; give.hidden = false; give.focus();
    });
  }

  /* ---- Cost first: the estimate shows before Run; Run walks three short steps, then shows sample slides.
     The link is only read as text for the caption: it is never opened or sent. ---- */
  var go = $('#run-go'), reset = $('#run-reset'), result = $('#run-result'), runStatus = $('#run-status'), runCard = $('#run-card');
  var runUrl = $('#run-url'), runSrc = $('#run-src'), runProg = $('#run-progress');
  if (go && reset && result && runStatus) {
    result.hidden = true;
    var host = function () {
      var v = (runUrl && runUrl.value || '').trim(); if (!v) return 'your link';
      try { return new URL(/^[a-z]+:\/\//i.test(v) ? v : 'https://' + v).hostname.replace(/^www\./, ''); } catch (e) { return 'your link'; }
    };
    var steps = runProg ? $$('.run-step', runProg) : [];
    go.addEventListener('click', function () {
      go.disabled = true; runCard.classList.add('is-busy'); runStatus.textContent = 'Running the sample.';
      if (runUrl) runUrl.readOnly = true;
      var showResult = function () {
        runCard.classList.remove('is-busy'); if (runProg) runProg.hidden = true;
        go.disabled = false; go.hidden = true; reset.hidden = false;
        if (runSrc) runSrc.textContent = 'from ' + host();
        result.hidden = false; result.classList.remove('is-in'); void result.offsetWidth; result.classList.add('is-in');
        runCard.classList.add('is-done');
        runStatus.textContent = 'Sample result shown: three of five slides. Used about 6 of 300 credits. Nothing was sent, generated or charged.';
        reset.focus();
      };
      if (reduce || !runProg) { showResult(); return; }
      runProg.hidden = false; steps.forEach(function (s) { s.classList.remove('is-on', 'is-done'); });
      var i = 0;
      (function next() {
        if (i > 0) steps[i - 1].classList.replace('is-on', 'is-done');
        if (i >= steps.length) { setTimeout(showResult, 250); return; }
        steps[i].classList.add('is-on'); i++; setTimeout(next, 650);
      })();
    });
    reset.addEventListener('click', function () {
      result.hidden = true; reset.hidden = true; go.hidden = false; runCard.classList.remove('is-done');
      if (runUrl) { runUrl.readOnly = false; runUrl.focus(); runUrl.select(); }
      runStatus.textContent = 'Back to the start. Nothing has run.';
    });
  }

  /* ---- Counting numbers: the real value is already in the page; it counts up once when first seen ---- */
  var counts = $$('[data-count]');
  if (counts.length && !reduce && hasIO) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        var tick = function (t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 900); el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 4)))); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (c) { cio.observe(c); });
  }

  /* ---- Features page: mark the section you are reading in the sticky nav ---- */
  var fnav = $$('.f-nav a'), fsecs = $$('.f-sec');
  if (fnav.length && fsecs.length) {
    var map = {}, cur = null, lockUntil = 0, fq = 0;
    fnav.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var setCur = function (a) {
      if (a === cur) return;
      fnav.forEach(function (x) { x.removeAttribute('aria-current'); });
      cur = a;
      if (!a) return;
      a.setAttribute('aria-current', 'true');
      if (window.innerWidth < 961) { var ul = a.parentNode.parentNode; ul.scrollLeft = a.offsetLeft - 16; }
    };
    var pick = function () {
      fq = 0;
      if (Date.now() < lockUntil) return;
      var line = window.innerWidth < 961 ? 120 : 160, found = null;
      fsecs.forEach(function (sec) { if (sec.getBoundingClientRect().top <= line) found = sec; });
      setCur(found ? map[found.id] : null);
    };
    window.addEventListener('scroll', function () { if (!fq) fq = requestAnimationFrame(pick); }, { passive: true });
    fnav.forEach(function (a) { a.addEventListener('click', function () { setCur(a); lockUntil = Date.now() + (reduce ? 300 : 1000); setTimeout(pick, reduce ? 320 : 1020); }); });
    pick();
  }

  /* ---- Beta tester card: while sign-ups are closed (the fieldset is disabled by waitlist.js), the button keeps full
     color and says it is unavailable through aria-disabled; the note above the form says why. ---- */
  $$('#join fieldset').forEach(function (fs) {
    var btn = $('button[type=submit]', fs);
    if (!btn) return;
    var syncBtn = function () { if (fs.disabled) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled'); };
    syncBtn();
    new MutationObserver(syncBtn).observe(fs, { attributes: true, attributeFilter: ['disabled'] });
  });

  /* ---- Story reveal: the steps, the calendar, the apps and the plans rise in a little, once, as they arrive. Content is never hidden without
     this script, nothing moves under reduced motion, and scrolling is never taken over. ---- */
  if (!reduce && hasIO) {
    var blocks = $$('#main .how .steps, #main .plan .cal, #main .apps-grid, #main .plan-cols');
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    blocks.forEach(function (b) {
      if (b.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
      b.classList.add('rv'); rio.observe(b);
    });
  }
})();
/* Try it: text style buttons. Select words in "Your thought" and press a style: exactly those characters change in the
   preview (every format). With nothing selected, the style applies to the whole thought. Styles are kept per
   character of the thought (whitespace collapsed, as sample.js shows it) and re-applied after every sample.js redraw.
   Sample only: nothing is sent. */
(function () {
  var demo = document.getElementById('try-demo'); if (!demo) return;
  var row = demo.querySelector('.fx-row'), ta = demo.querySelector('textarea'), out = demo.querySelector('.bp-output');
  if (!row || !ta || !out) return;
  row.hidden = false;
  var FX = ['bold', 'italic', 'underline', 'highlight'], BIT = { bold: 1, italic: 2, underline: 4, highlight: 8 };
  var TARGETS = '.s-title,.s-graphic-line,.s-heading.s-big,.s-quote p,.bp-feed>p:first-of-type,.bp-poll-q';
  var btns = Array.prototype.slice.call(row.querySelectorAll('.fx-btn'));
  var norm = '', mask = [], lastSel = { s: 0, e: 0 };

  // the thought as sample.js shows it: trimmed, whitespace collapsed; plus a map from raw textarea offsets to it
  function normalize() {
    var raw = ta.value, n = '', map = [], lead = raw.length - raw.replace(/^\s+/, '').length, prevSpace = false;
    for (var i = 0; i < raw.length; i++) {
      map[i] = n.length;
      if (i < lead) continue;
      var c = raw[i];
      if (/\s/.test(c)) { if (!prevSpace) { n += ' '; prevSpace = true; } }
      else { n += c; prevSpace = false; }
    }
    map[raw.length] = n.length;
    n = n.replace(/ $/, '');
    return { text: n, map: map };
  }
  function syncText() {
    var r = normalize();
    if (r.text !== norm) { norm = r.text; mask = new Array(norm.length).fill(0); }
    return r;
  }
  function selRange() { // selection in normalized offsets; whole thought when nothing is selected
    var r = syncText(), s = ta.selectionStart, e = ta.selectionEnd;
    if (document.activeElement !== ta) { s = lastSel.s; e = lastSel.e; }
    var a = Math.min(r.map[s] || 0, norm.length), b = Math.min(r.map[e] || 0, norm.length);
    while (a < b && norm[a] === ' ') a++;
    while (b > a && norm[b - 1] === ' ') b--;
    return a < b ? { a: a, b: b, whole: false } : { a: 0, b: norm.length, whole: true };
  }
  function allHave(rg, bit) { if (rg.a >= rg.b) return false; for (var i = rg.a; i < rg.b; i++) if (norm[i] !== ' ' && !(mask[i] & bit)) return false; return true; }
  function syncPressed() {
    var rg = selRange();
    btns.forEach(function (b) { b.setAttribute('aria-pressed', allHave(rg, BIT[b.getAttribute('data-fx')]) ? 'true' : 'false'); });
  }

  var mo;
  function unwrap() {
    Array.prototype.slice.call(out.querySelectorAll('span.fx-span')).forEach(function (s) {
      var par = s.parentNode; while (s.firstChild) par.insertBefore(s.firstChild, s); par.removeChild(s); par.normalize();
    });
  }
  function textNodes(el) { var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, list = [], pos = 0; while ((n = w.nextNode())) { list.push({ node: n, start: pos }); pos += n.nodeValue.length; } return { list: list, text: list.map(function (x) { return x.node.nodeValue; }).join('') }; }
  function runs() { var r = [], i = 0; while (i < norm.length) { var m = mask[i]; if (!m) { i++; continue; } var j = i; while (j < norm.length && mask[j] === m) j++; r.push({ a: i, b: j, m: m }); i = j; } return r; }
  function cls(m) { return 'fx-span' + FX.filter(function (f) { return m & BIT[f]; }).map(function (f) { return ' fxs-' + f; }).join(''); }
  function apply() {
    if (mo) mo.disconnect();
    unwrap();
    var rs = runs();
    if (rs.length && norm) {
      Array.prototype.slice.call(out.querySelectorAll(TARGETS)).forEach(function (el) {
        var tn = textNodes(el);
        // sample.js may shorten a long thought (ending it with an ellipsis): match as much of it as is shown
        var at = tn.text.indexOf(norm), len = norm.length;
        if (at < 0) { for (len = norm.length - 1; len > 10; len--) { at = tn.text.indexOf(norm.slice(0, len)); if (at >= 0) break; } }
        if (at < 0) return;
        rs.slice().reverse().forEach(function (r) {
          var a = at + r.a, b = at + Math.min(r.b, len); if (a >= b) return;
          for (var k = tn.list.length - 1; k >= 0; k--) {
            var t = tn.list[k], ts = t.start, te = ts + t.node.nodeValue.length;
            if (te <= a || ts >= b) continue;
            var s0 = Math.max(a, ts) - ts, e0 = Math.min(b, te) - ts;
            var node = t.node; if (e0 < node.nodeValue.length) node.splitText(e0);
            var mid = s0 > 0 ? node.splitText(s0) : node;
            var span = document.createElement('span'); span.className = cls(r.m);
            mid.parentNode.insertBefore(span, mid); span.appendChild(mid);
          }
          tn = textNodes(el); // offsets are unchanged, nodes changed: re-read before the next run
        });
      });
    }
    if (mo) mo.observe(out, { childList: true, subtree: true, characterData: true });
  }
  if ('MutationObserver' in window) { mo = new MutationObserver(function () { apply(); }); mo.observe(out, { childList: true, subtree: true, characterData: true }); }

  function remember() { lastSel = { s: ta.selectionStart, e: ta.selectionEnd }; syncPressed(); }
  ['select', 'keyup', 'mouseup', 'input'].forEach(function (ev) { ta.addEventListener(ev, remember); });
  document.addEventListener('selectionchange', function () { if (document.activeElement === ta) remember(); });
  // keep the textarea's selection when a style button is pressed with the mouse or a finger
  row.addEventListener('mousedown', function (e) { if (e.target.closest('.fx-btn')) e.preventDefault(); });
  row.addEventListener('click', function (e) {
    var b = e.target.closest('.fx-btn'); if (!b) return;
    var bit = BIT[b.getAttribute('data-fx')], rg = selRange();
    if (rg.a >= rg.b) return;
    var on = !allHave(rg, bit);
    for (var i = rg.a; i < rg.b; i++) { if (norm[i] === ' ' && !rg.whole && (i === rg.a || i === rg.b - 1)) continue; mask[i] = on ? (mask[i] | bit) : (mask[i] & ~bit); }
    apply();
    if (!rg.whole) { ta.focus(); ta.setSelectionRange(lastSel.s, lastSel.e); }
    syncPressed();
  });
  syncText(); syncPressed();
})();

/* Make it yours: rotate through the four brand kits on their own (owner request). Every 2.5 s while the section is on
   screen; pauses while the pointer or keyboard focus is inside; stops for good once the visitor picks a kit; a
   Pause / Play button for anyone who wants it still; off under reduced motion. */
(function () {
  var kits = document.querySelector('[data-kits]'); if (!kits) return;
  var btns = Array.prototype.slice.call(kits.querySelectorAll('[data-kit]')); if (btns.length < 2) return;
  var toggle = kits.querySelector('.kit-auto');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (toggle) toggle.hidden = true; return; }
  var timer = null, inView = false, held = false, paused = false, stopped = false;
  function current() { for (var i = 0; i < btns.length; i++) if (btns[i].getAttribute('aria-pressed') === 'true') return i; return 0; }
  function tick() { if (inView && !held && !paused && !stopped) btns[(current() + 1) % btns.length].click(); }
  function run() { if (!timer) timer = setInterval(tick, 2500); }
  function label() { if (!toggle) return; var on = !paused && !stopped; toggle.setAttribute('aria-pressed', on ? 'false' : 'true'); toggle.querySelector('span').textContent = on ? 'Pause' : 'Play'; toggle.classList.toggle('is-paused', !on); }
  btns.forEach(function (b) { b.addEventListener('click', function (e) { if (e.isTrusted) { stopped = true; label(); } }); });
  kits.addEventListener('mouseenter', function () { held = true; });
  kits.addEventListener('mouseleave', function () { held = false; });
  kits.addEventListener('focusin', function (e) { if (e.target !== toggle) held = true; });
  kits.addEventListener('focusout', function () { held = false; });
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () { if (stopped || paused) { stopped = false; paused = false; } else { paused = true; } label(); });
    label();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); }, { threshold: 0.35 }).observe(kits);
  } else { inView = true; }
  run();
})();
