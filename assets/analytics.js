/* Briopost Google Analytics 4. Loaded on every page with <script src="/assets/analytics.js" defer></script>.
   Off until a Measurement ID is filled in below: with an empty ID this file does nothing at all
   (no Google request, no cookies, no events). */
(function () {
  'use strict';

  // ===== Google Analytics 4 Measurement ID =====
  // Paste the ID from Google Analytics (Admin > Data streams > briopost.com), for example "G-AB12CD34EF".
  // It is not a secret. Leave it as "" to keep Google Analytics switched off.
  const GA_MEASUREMENT_ID = "G-5996X6Z2PP";
  // ==============================================

  if (!/^G-[A-Z0-9]{4,20}$/.test(GA_MEASUREMENT_ID)) return;

  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { return; }
  // Count only the live site. Add ?ga_debug=1 to any address to test elsewhere; it also shows the visit in
  // Google Analytics' DebugView (Admin > DebugView).
  var debug = params.get('ga_debug') === '1';
  if (!/(^|\.)briopost\.com$/.test(location.hostname) && !debug) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var gtag = window.gtag;

  var config = {};
  if (debug) config.debug_mode = true;
  // A link like briopost.com/?ref=newsletter counts as source "newsletter", unless the link already has utm_ tags
  // (or an ad click ID), which Google Analytics reads on its own.
  var ref = (params.get('ref') || '').replace(/[^\w.\-]/g, '').slice(0, 60);
  var tagged = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'gclid', 'gbraid', 'wbraid'].some(function (k) { return params.has(k); });
  var url = new URL(location.href);
  // The confirm and unsubscribe links carry a private ?token=; it never goes to Google.
  url.searchParams.delete('token');
  if (ref && !tagged) {
    url.searchParams.set('utm_source', ref);
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'ref_link');
  }
  if (url.href !== location.href) config.page_location = url.href;

  gtag('js', new Date());
  if (config.page_location) gtag('set', { page_location: config.page_location }); // every later event uses the cleaned address too
  gtag('config', GA_MEASUREMENT_ID, config);
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(tag);

  function track(name, data) {
    try { gtag('event', name, data || {}); } catch (e) { /* analytics must never break the page */ }
  }
  function clean(text, max) { return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max || 100); }
  var formNames = { 'hw-form': 'hero', 'wl-form': 'waitlist_section' };
  // Where on the page something sits: the waitlist form, the nearest section (by id or its heading), or header / footer.
  function where(node) {
    var form = node.closest('form.wl-form');
    if (form && formNames[form.id]) return formNames[form.id];
    var section = node.closest('section, header, footer, main, [id="preview"]');
    if (!section) return 'page';
    var label = section.id || (section.getAttribute('aria-labelledby') || '').replace(/-title$/, '');
    return label || section.tagName.toLowerCase();
  }

  // ----- Waitlist (events come from assets/waitlist.js, which says what happened) -----
  document.addEventListener('briopost:waitlist', function (e) {
    var d = e.detail || {};
    var form = formNames[d.form] || d.form || 'page';
    if (d.action === 'joined') {
      if (d.status === 'check_email') {
        track('generate_lead', { form_location: form, lead_source: ref || '(none)', method: 'waitlist' });
        track('sign_up', { method: 'waitlist', form_location: form });
      } else {
        track('waitlist_already_joined', { form_location: form });
      }
    } else if (d.action === 'error') {
      track('waitlist_error', { form_location: form, error_reason: d.reason || 'unknown' });
    } else if (d.action === 'confirmed') {
      track('waitlist_confirmed', { confirm_status: d.status || 'confirmed' });
    } else if (d.action === 'unsubscribed') {
      track('waitlist_unsubscribed', {});
    } else if (d.action === 'link_error') {
      track('waitlist_error', { form_location: d.page || 'link', error_reason: d.reason || 'unknown' });
    }
  });

  // First time someone starts filling in a waitlist form (once per form per page view).
  var started = {};
  function formStart(e) {
    var form = e.target && e.target.closest && e.target.closest('form.wl-form');
    if (!form || started[form.id] || !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    started[form.id] = true;
    track('waitlist_form_start', { form_location: formNames[form.id] || form.id });
  }
  ['focusin', 'input', 'change'].forEach(function (type) { document.addEventListener(type, formStart, true); });

  // ----- Clicks: calls to action, PDF downloads, outside links, email links, the interactive sample -----
  // Listened to on the way down (capture), before assets/preview.js redraws the sample and replaces the clicked button.
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    // The interactive sample on the home page (assets/preview.js).
    var okBtn = target.closest('#ok-confirm, #ok-undo');
    if (okBtn) track('demo_interaction', { demo_action: okBtn.id === 'ok-confirm' ? 'give_ok' : 'take_back_ok', demo_value: '(none)' });
    var demo = target.closest('#preview button');
    if (demo) {
      var action = '', value = '';
      if (demo.getAttribute('role') === 'tab') { action = 'format_tab'; value = demo.getAttribute('data-format'); }
      else if (demo.hasAttribute('data-step')) { action = Number(demo.getAttribute('data-step')) > 0 ? 'next_slide' : 'previous_slide'; }
      else if (demo.hasAttribute('data-slide')) { action = 'go_to_slide'; value = String(Number(demo.getAttribute('data-slide')) + 1); }
      else if (demo.hasAttribute('data-vote')) { action = 'poll_vote'; value = clean(demo.textContent.replace('Your choice', '').replace(/\d+%$/, ''), 60); }
      else if (demo.classList.contains('reset-vote')) { action = 'poll_reset'; }
      else if (demo.classList.contains('chip')) { action = 'sample_topic'; value = demo.getAttribute('data-topic'); }
      else if (demo.id === 'shape-btn') { action = 'shape_own'; } // the visitor's own words are never sent
      if (action) track('demo_interaction', { demo_action: action, demo_value: value || '(none)' });
      return;
    }

    // Primary buttons and links ("Save my spot", "Join the waitlist", "Take a first look", Confirm / Unsubscribe).
    var cta = target.closest('a.button, button.button, a[href$="#waitlist"]');
    if (cta) {
      track('cta_click', {
        cta_label: clean(cta.textContent, 60) || clean(cta.getAttribute('aria-label'), 60),
        cta_location: where(cta),
        link_url: cta.getAttribute('href') || '(button)'
      });
    }

    var link = target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (/^mailto:/i.test(href)) {
      track('email_click', { link_location: where(link) });
      return;
    }
    var dest;
    try { dest = new URL(link.href, location.href); } catch (err) { return; }
    if (/\.pdf$/i.test(dest.pathname)) {
      var name = dest.pathname.split('/').pop();
      track('file_download', { file_name: name, file_extension: 'pdf', link_text: clean(link.textContent, 60), link_url: dest.href });
    } else if (/^https?:$/.test(dest.protocol) && dest.hostname !== location.hostname) {
      track('outbound_click', { link_domain: dest.hostname, link_url: dest.href, link_text: clean(link.textContent, 60), link_location: where(link) });
    }
  }, true);

  // ----- Questions opened on the home page -----
  document.addEventListener('toggle', function (e) {
    var details = e.target;
    if (!details || details.tagName !== 'DETAILS' || !details.open) return;
    var summary = details.querySelector('summary');
    track('faq_open', { faq_question: clean(summary ? summary.textContent : '', 100) });
  }, true);

  // ----- How far down the page people read: 25, 50, 75 and 90 percent, once each -----
  var marks = [25, 50, 75, 90];
  var reached = {};
  var pending = false;
  function measure() {
    pending = false;
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    var percent = scrollable <= 0 ? 100 : Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100);
    marks.forEach(function (m) {
      if (percent >= m && !reached[m]) {
        reached[m] = true;
        track('scroll_depth', { percent_scrolled: m });
      }
    });
    if (reached[90]) window.removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    if (!pending) { pending = true; window.requestAnimationFrame(measure); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ----- Page not found -----
  if (document.body && document.body.hasAttribute('data-not-found')) {
    track('page_not_found', { page_path: location.pathname.slice(0, 120), page_referrer: document.referrer ? clean(document.referrer, 200) : '(none)' });
  }
})();
