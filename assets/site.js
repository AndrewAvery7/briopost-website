/* Briopost website: behavior shared by every hand-written page (loaded by partials/footer.html).
   The phone menu: the Menu button opens the panel under the header; Esc and a click outside close it, and focus
   returns to the button. Without JavaScript the main links wrap under the logo instead (chrome.css, html:not(.js)). */
(function () {
  'use strict';
  var btn = document.querySelector('.site-head .menu-btn'), panel = document.getElementById('menu-panel');
  if (btn && panel) {
    var setMenu = function (open, focusBack) {
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (open) { var first = panel.querySelector('a'); if (first) first.focus(); }
      else if (focusBack) btn.focus();
    };
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true', false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setMenu(false, true); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setMenu(false, false); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false, false); });
    panel.addEventListener('focusout', function (e) { var to = e.relatedTarget; if (to && !panel.contains(to) && to !== btn) setMenu(false, false); });
    window.addEventListener('scroll', function () { if (!panel.hidden && window.scrollY > btn.closest('header').offsetHeight + 40) setMenu(false, false); }, { passive: true });
  }
  // The home page film (#briopost-film). On iPhone the first tap on Play can stall before the film has loaded: Play
  // flips back to paused at 0:00 and a second tap was needed. If the film pauses at the very start, without having
  // played, within two seconds of a Play, start it again (once per page view, so a deliberate pause is never fought).
  var film = document.getElementById('briopost-film');
  if (film) {
    var playAt = 0, retried = false;
    film.addEventListener('play', function () { playAt = Date.now(); });
    film.addEventListener('pause', function () {
      if (retried || !playAt || film.ended || film.currentTime > 0.25 || Date.now() - playAt > 2000) return;
      retried = true;
      var p = film.play();
      if (p && p.catch) p.catch(function () {});
    });
  }
  // Mark the menu link for the page being read (a link to this page's own address).
  var here = location.pathname;
  document.querySelectorAll('.site-head a[href^="/"]').forEach(function (a) {
    if (a.getAttribute('href') === here && here !== '/') a.setAttribute('aria-current', 'page');
  });
})();
