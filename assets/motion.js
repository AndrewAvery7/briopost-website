/* Home page motion and small interactions: sections rise in as they are reached, the "How it works" steps light up
   in order, the "Give my OK" sample, larger screenshots on click, and a gentle tilt on the template cards.
   Everything is decoration on top of a page that already works without it; reduced motion turns the movement off. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Rise in on scroll. Without IntersectionObserver (or with reduced motion) everything is simply visible.
  var targets = [].slice.call(document.querySelectorAll('.section-head, .step, .ok-demo, .shot, .faq details, .maker, .form-panel, .about-inner > *'));
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    targets.forEach(function (el) {
      el.classList.add('reveal');
      var parent = el.parentElement, sibs = parent ? [].slice.call(parent.children).filter(function (c) { return c.classList.contains('reveal'); }) : [];
      el.style.setProperty('--delay', Math.min(sibs.indexOf(el), 5) * 70 + 'ms');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });

    // The steps also draw a line from 1 to 5 once the list is in view.
    var steps = document.querySelector('.steps');
    if (steps) {
      var so = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { steps.classList.add('run'); so.disconnect(); }
      }, { threshold: 0.35 });
      so.observe(steps);
    }
  }

  // 2. The stacked cards behind the demo follow the pointer a little (desktop only).
  var win = document.querySelector('.studio-window');
  if (win && !reduce && window.matchMedia && matchMedia('(hover: hover) and (min-width: 801px)').matches) {
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = win.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
      win.style.setProperty('--px', (Math.max(-1, Math.min(1, x)) * 10).toFixed(1) + 'px');
      win.style.setProperty('--py', (Math.max(-1, Math.min(1, y)) * 8).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', function () { win.style.setProperty('--px', '0px'); win.style.setProperty('--py', '0px'); });
  }

  // 3. "Give my OK": a sample post waiting for confirmation. Nothing is sent anywhere.
  var card = document.querySelector('.ok-card');
  var ok = document.getElementById('ok-confirm'), undo = document.getElementById('ok-undo');
  var badge = document.getElementById('ok-badge'), status = document.getElementById('ok-status');
  if (card && ok && undo) {
    ok.addEventListener('click', function () {
      card.dataset.state = 'confirmed';
      badge.textContent = 'Confirmed';
      status.textContent = 'Confirmed. In the real studio this post would go out Tuesday at 9:00 AM. This sample stays on this page.';
      ok.hidden = true; undo.hidden = false; undo.focus();
    });
    undo.addEventListener('click', function () {
      card.dataset.state = 'waiting';
      badge.textContent = 'Needs your OK';
      status.textContent = 'Taken back. It waits again, and nothing happens until you confirm.';
      undo.hidden = true; ok.hidden = false; ok.focus();
    });
  }

  // 4. Click a screenshot or template to see it larger.
  var box = document.getElementById('lightbox');
  if (box && typeof box.showModal === 'function') {
    var img = box.querySelector('img'), cap = box.querySelector('.lightbox-cap');
    [].slice.call(document.querySelectorAll('.shots .shot img, .templates .shot img')).forEach(function (pic) {
      var fig = pic.closest('figure');
      fig.classList.add('zoomable');
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'See larger: ' + (fig.querySelector('figcaption') || {}).textContent);
      var open = function () {
        var set = pic.getAttribute('srcset') || '';
        var big = set.split(',').map(function (s) { return s.trim().split(' ')[0]; }).pop() || pic.src;
        img.src = big; img.alt = pic.alt;
        cap.textContent = (fig.querySelector('figcaption') || {}).textContent || '';
        box.showModal();
      };
      fig.addEventListener('click', open);
      fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.lightbox-close')) box.close(); });
  }

  // 5. Template cards tilt toward the pointer.
  if (!reduce && window.matchMedia && matchMedia('(hover: hover)').matches) {
    [].slice.call(document.querySelectorAll('.templates .shot')).forEach(function (fig) {
      fig.addEventListener('pointermove', function (e) {
        var r = fig.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        fig.style.transform = 'perspective(800px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateY(-4px)';
      });
      fig.addEventListener('pointerleave', function () { fig.style.transform = ''; });
    });
  }
})();
