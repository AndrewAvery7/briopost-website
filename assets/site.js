/* Briopost website: behavior shared by every hand-written page (loaded by partials/footer.html).
   The phone menu. Without JavaScript the menu links simply wrap under the logo (site.css, html:not(.js)). */
(function () {
  'use strict';
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  function setMenu(open) {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
  });
  // Mark the menu link for the page being read (a link to this page's own address).
  var here = location.pathname;
  nav.querySelectorAll('a[href^="/"]').forEach(function (a) {
    if (a.getAttribute('href') === here && here !== '/') a.setAttribute('aria-current', 'page');
  });
})();
