/* /linkedin-carousel-templates/: the wall's Pause button and off-screen pause, the gallery filters, and the brand kit
   stage. Every section is complete in the HTML; this file only adds behavior. It sends nothing anywhere.
   The field names and the per-field counts come from the studio's own catalog (shared/templateCatalog.ts and
   shared/graphicProfessions.ts), counted on 2026-11-16: how many of the 150 carousel designs suit each field. */
(function () {
  'use strict';
  var PROFS = {"accountants":"Accountants","architects":"Architects","coaches":"Coaches","consultants":"Consultants","customer-success":"Customer success","dentists":"Dentists","designers":"Designers","developers":"Developers","doctors":"Doctors","engineers":"Engineers","financial-advisors":"Financial advisors","fitness-coaches":"Fitness coaches","founders":"Founders","hr":"HR & people","insurance-agents":"Insurance agents","lawyers":"Lawyers","marketing":"Marketing consultants","mortgage-brokers":"Mortgage brokers","nonprofits":"Nonprofits","nutritionists":"Nutritionists","photographers":"Photographers","product":"Product managers","real-estate":"Real estate agents","recruiters":"Recruiters","sales":"Sales leaders","teachers":"Teachers & trainers","therapists":"Therapists","writers":"Writers & creators"};
  var COUNTS = {"accountants":50,"architects":29,"coaches":62,"consultants":45,"customer-success":37,"dentists":33,"designers":30,"developers":18,"doctors":29,"engineers":25,"financial-advisors":24,"fitness-coaches":56,"founders":38,"hr":45,"insurance-agents":31,"lawyers":43,"marketing":44,"mortgage-brokers":31,"nonprofits":30,"nutritionists":18,"photographers":13,"product":37,"real-estate":24,"recruiters":23,"sales":38,"teachers":57,"therapists":53,"writers":31};

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* The wall: decorative drift, one slow pass, then it stops. CSS pauses it on hover and focus; this adds the button
     (Pause while it moves, Play to go on or to run it again once it has stopped) and the off-screen pause.
     Under reduced motion it never moves and the button stays hidden. */
  var wall = $('#tp-wall'), wp = $('.tp-wall-pause');
  if (wall && wp && !reduce.matches) {
    wp.hidden = false;
    var label = function (paused) {
      wp.setAttribute('aria-pressed', String(paused));
      $('.tp-wp-label', wp).textContent = paused ? 'Play motion' : 'Pause motion';
    };
    var running = function () {
      return !wall.getAnimations || wall.getAnimations({ subtree: true }).some(function (a) { return a.playState !== 'finished'; });
    };
    wall.addEventListener('animationend', function () {
      if (running()) return;
      wall.classList.add('is-done'); wall.classList.remove('is-paused'); label(true);
    });
    wp.addEventListener('click', function () {
      if (wall.classList.contains('is-done')) {
        // Run the pass again from the start.
        $$('.tp-track', wall).forEach(function (t) { t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; });
        wall.classList.remove('is-done'); label(false);
        return;
      }
      var paused = wp.getAttribute('aria-pressed') !== 'true';
      label(paused);
      wall.classList.toggle('is-paused', paused);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { wall.classList.toggle('is-off', !en[0].isIntersecting); }).observe(wall);
    }
  }

  /* Gallery filters: by format and by field. */
  var grid = $('#tp-grid'), filters = $('#tp-filters'), status = $('#tp-status'), sel = $('#tp-prof-select'), empty = $('#tp-empty');
  if (grid && filters && sel && status && empty) {
    filters.hidden = false;
    var tiles = $$('.tp-tile', grid), fmt = 'all', prof = '', expanded = false;
    var phone = window.matchMedia('(max-width: 599px)'), more = $('#tp-more'), moreBtn = $('#tp-more-btn');
    Object.keys(PROFS).sort(function (a, b) { return PROFS[a].localeCompare(PROFS[b]); }).forEach(function (id) {
      var o = document.createElement('option'); o.value = id; o.textContent = PROFS[id]; sel.appendChild(o);
    });
    var apply = function (animate) {
      var shownC = 0, shownG = 0, match = 0, limit = phone.matches && !expanded ? 8 : 1e9;
      tiles.forEach(function (t) {
        var ok = (fmt === 'all' || t.dataset.f === fmt) && (!prof || (' ' + t.dataset.p + ' ').indexOf(' ' + prof + ' ') > -1);
        if (ok) { match++; if (match > limit) ok = false; }
        var was = !t.hidden; t.hidden = !ok;
        t.classList.remove('is-in');
        if (ok && animate && !was && !reduce.matches) { void t.offsetWidth; t.classList.add('is-in'); }
        if (ok) { if (t.dataset.f === 'c') shownC++; else shownG++; }
      });
      var n = shownC + shownG;
      empty.hidden = n > 0;
      if (n === 0) {
        // Say which filters are set, so the empty page is never a dead end: the button clears the field and the format.
        var msg = empty.firstChild, clearBtn = $('[data-clear]', empty);
        if (msg && msg.nodeType === 3) msg.nodeValue = (fmt === 'g' ? 'None of the graphics on this page' : fmt === 'c' ? 'None of the carousel designs on this page' : 'None of the designs on this page') + ' are tagged for that field yet. ';
        if (clearBtn) clearBtn.textContent = fmt === 'all' ? 'Show every field' : 'Show every field and format';
      }
      if (more && moreBtn) { more.hidden = match <= n; moreBtn.textContent = 'Show all ' + match + ' designs'; }
      var parts = [];
      if (fmt !== 'g') parts.push(shownC + ' carousel ' + (shownC === 1 ? 'design' : 'designs'));
      if (fmt !== 'c') parts.push(shownG + ' ' + (shownG === 1 ? 'graphic' : 'graphics'));
      var what = match > n ? 'the first ' + n + ' of ' + match + ' designs' : parts.join(' and ');
      status.textContent = '';
      if (prof) {
        status.appendChild(document.createTextNode(PROFS[prof] + ': showing ' + what + '. In the studio, '));
        var s = document.createElement('strong'); s.textContent = COUNTS[prof] + ' of the 150'; status.appendChild(s);
        status.appendChild(document.createTextNode(' carousel designs suit this field.'));
      } else {
        status.textContent = 'Showing ' + what + ' on this page.';
      }
    };
    $$('[data-fmt]', filters).forEach(function (b) {
      b.addEventListener('click', function () {
        fmt = b.dataset.fmt;
        $$('[data-fmt]', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        apply(true);
      });
    });
    if (moreBtn) moreBtn.addEventListener('click', function () {
      var first = tiles.filter(function (t) { return !t.hidden; }).length;
      expanded = true; apply(true);
      var t = tiles.filter(function (x) { return !x.hidden; })[first];
      if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
    });
    if (phone.addEventListener) phone.addEventListener('change', function () { apply(false); });
    sel.addEventListener('change', function () { prof = sel.value; apply(true); });
    var clr = $('[data-clear]', empty);
    if (clr) clr.addEventListener('click', function () {
      sel.value = ''; prof = ''; fmt = 'all';
      $$('[data-fmt]', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.fmt === 'all')); });
      apply(true); sel.focus();
    });
    apply(false);
  }

  /* Brand kit stage: the chosen kit sweeps in from left to right over the last one. */
  var stage = $('#tp-kit-stage'), kseg = $('.tp-kit-seg');
  if (stage && kseg) {
    var figs = $$('.tp-kit-fig', stage), cur = 1;
    stage.classList.add('is-live'); kseg.hidden = false;
    figs.forEach(function (f, i) { f.setAttribute('aria-hidden', String(i !== cur)); });
    $$('button', kseg).forEach(function (b) {
      b.addEventListener('click', function () {
        var next = +b.dataset.kit; if (next === cur) return;
        $$('button', kseg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        figs.forEach(function (f) { f.classList.remove('is-under', 'is-on', 'is-start'); });
        figs[cur].classList.add('is-under');
        var nf = figs[next]; nf.classList.add('is-on', 'is-start'); void nf.offsetWidth; nf.classList.remove('is-start');
        figs.forEach(function (f, i) { f.setAttribute('aria-hidden', String(i !== next)); });
        cur = next;
      });
    });
  }
})();
