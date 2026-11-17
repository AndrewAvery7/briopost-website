/* Briopost home page: the scripted moments around the sample. Every one is a sample: nothing is sent, generated,
   scheduled or posted. The sample itself is assets/sample/sample.js; the menu is assets/site.js; the sign-up forms are
   assets/waitlist.js. The page is complete and readable without this file. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // 1. The format tabs, "Shape it" and the size switch sit below the sample. After a click (sample.js redraws first),
  //    bring the changed sample back into view if it has scrolled away. Only ever in answer to the visitor's own click.
  var demo = $('#preview'), output = demo && demo.querySelector('.bp-output');
  if (demo && output) {
    demo.addEventListener('click', function (e) {
      if (!e.target.closest('.stage-more button')) return;
      // On a phone, sample.js itself brings the first slide back after "Shape it".
      if (e.target.closest('.shape-btn') && window.matchMedia('(max-width: 959px)').matches) return;
      setTimeout(function () {
        var r = output.getBoundingClientRect();
        if (r.top < 60 || r.top > window.innerHeight * 0.6) output.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }, 30);
    });
  }

  // 2. "Give my OK": the only springy moment on the page.
  var card = $('.ok-card'), ok = $('#ok-confirm'), undo = $('#ok-undo'), badge = $('.ok-badge-text'), status = $('#ok-status');
  if (card && ok && undo && badge && status) {
    ok.addEventListener('click', function () {
      card.setAttribute('data-state', 'confirmed');
      badge.textContent = 'Confirmed';
      status.textContent = 'Confirmed for Tuesday at 9:00 AM. You can take it back until then. (This sample stays on this page.)';
      if (!reduce) { card.classList.remove('is-springing'); void card.offsetWidth; card.classList.add('is-springing'); }
      ok.hidden = true; undo.hidden = false; undo.focus();
    });
    undo.addEventListener('click', function () {
      card.setAttribute('data-state', 'waiting');
      card.classList.remove('is-springing');
      badge.textContent = 'Needs your OK';
      status.textContent = 'Back to waiting. Nothing happens until you confirm.';
      undo.hidden = true; ok.hidden = false; ok.focus();
    });
  }

  // 3. "Plan the month": posts below the screen at load start as dashed outlines (their words stay visible) and fill
  //    in one at a time once the calendar is a third on screen. Anything already on screen stays filled.
  var cal = $('#cal');
  if (cal && hasIO && !reduce && cal.getBoundingClientRect().top > window.innerHeight) {
    var posts = Array.prototype.slice.call(cal.querySelectorAll('.post[data-fill]'))
      .sort(function (a, b) { return a.getAttribute('data-fill') - b.getAttribute('data-fill'); });
    posts.forEach(function (p) { p.classList.add('is-ghost'); });
    var cio = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      cio.disconnect();
      posts.forEach(function (p, i) { setTimeout(function () { p.classList.remove('is-ghost'); }, 200 + i * 300); });
    }, { threshold: 0.35 });
    cio.observe(cal);
  }

  // 4. Cost before action: the cost is on the button and in the line under it before anything runs.
  var costDemo = $('#cost-demo'), costBtn = $('#cost-btn'), costStatus = $('#cost-status');
  if (costDemo && costBtn && costStatus) {
    var costLabel = costBtn.innerHTML;
    costBtn.addEventListener('click', function () {
      if (costDemo.getAttribute('data-state') === 'done') {
        costDemo.setAttribute('data-state', 'idle');
        costBtn.innerHTML = costLabel; costBtn.classList.replace('btn-ghost', 'btn-spark');
        costStatus.textContent = '';
        return;
      }
      costDemo.setAttribute('data-state', 'done');
      costStatus.textContent = 'Sample: three draft slides appear, ready to edit. Nothing was written and no credits were used.';
      costBtn.textContent = 'Reset the sample'; costBtn.classList.replace('btn-spark', 'btn-ghost');
    });
  }

  // 5. The silent film plays only while it is on screen, has a Pause/Play button, and waits for Play with reduced
  //    motion. Without JavaScript it keeps the browser's own controls.
  var vid = $('#film-video'), tog = $('#film-toggle');
  if (vid && tog) {
    vid.removeAttribute('controls');
    tog.hidden = false;
    var userPaused = reduce, onScreen = false;
    var show = function () {
      tog.textContent = vid.paused ? 'Play' : 'Pause';
      tog.setAttribute('aria-label', (vid.paused ? 'Play' : 'Pause') + ' the silent film');
    };
    var tryPlay = function () { vid.preload = 'auto'; var p = vid.play(); if (p && p.catch) p.catch(show); };
    vid.addEventListener('play', show); vid.addEventListener('pause', show); show();
    tog.addEventListener('click', function () {
      if (vid.paused) { userPaused = false; tryPlay(); } else { userPaused = true; vid.pause(); }
    });
    if (hasIO) {
      new IntersectionObserver(function (es) {
        onScreen = es[es.length - 1].isIntersecting;
        if (onScreen && !userPaused) tryPlay(); else if (!onScreen && !vid.paused) vid.pause();
      }, { threshold: 0.4 }).observe(vid);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden && !vid.paused) vid.pause(); else if (!document.hidden && onScreen && !userPaused) tryPlay(); });
  }

  // 6. "Watch with sound": the narrated film in a dialog. It starts from the click (browsers allow sound only then),
  //    the silent loop pauses while it plays, and Captions On/Off shows or hides the English captions. The choice is
  //    kept in this browser only; the player's own CC menu stays in step with the button.
  var sOpen = $('#film-sound-open'), sBox = $('#film-sound'), sVid = $('#film-sound-video'), sCc = $('#film-captions');
  if (sOpen && sBox && sVid && sCc && typeof sBox.showModal === 'function') {
    var CC_KEY = 'briopost-film-captions';
    var ccTrack = function () { return sVid.textTracks && sVid.textTracks[0]; };
    var ccOn = false;
    try { ccOn = localStorage.getItem(CC_KEY) === 'on'; } catch (e) { /* storage blocked: captions start off */ }
    var ccLabel = function () { sCc.textContent = ccOn ? 'Captions: On' : 'Captions: Off'; sCc.setAttribute('aria-pressed', String(ccOn)); };
    var showCc = function () { ccLabel(); var t = ccTrack(); if (t) t.mode = ccOn ? 'showing' : 'hidden'; };
    sCc.addEventListener('click', function () {
      ccOn = !ccOn; showCc();
      try { localStorage.setItem(CC_KEY, ccOn ? 'on' : 'off'); } catch (e) { /* not remembered */ }
    });
    if (sVid.textTracks && sVid.textTracks.addEventListener) {
      sVid.textTracks.addEventListener('change', function () {
        var t = ccTrack(); if (!t) return;
        var now = t.mode === 'showing';
        if (now !== ccOn) { ccOn = now; ccLabel(); }
      });
    }
    var loopWasPlaying = false;
    sOpen.hidden = false; // shown only where the dialog works (the page is complete without it)
    sOpen.addEventListener('click', function () {
      loopWasPlaying = !!(vid && !vid.paused);
      if (vid && !vid.paused) vid.pause();
      sBox.showModal();
      showCc();
      try { sVid.currentTime = 0; } catch (e) { /* not loaded yet */ }
      var p = sVid.play(); if (p && p.catch) p.catch(function () { /* the visitor can press Play */ });
    });
    sBox.addEventListener('click', function (e) { if (e.target === sBox || e.target.closest('.film-dialog-close')) sBox.close(); });
    sBox.addEventListener('close', function () {
      sVid.pause();
      if (loopWasPlaying && vid) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
      sOpen.focus();
    });
    showCc();
  }
})();
