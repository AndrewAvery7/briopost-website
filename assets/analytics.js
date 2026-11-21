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
  // The address Google sees is rebuilt from an allowlist: only these attribution fields are kept, and every other query
  // field is dropped (the confirm/unsubscribe ?token=, a beta tester's personal ?invite= code, an email address, and
  // anything unknown). The #fragment is dropped too. Google never reads the raw address: page_location and
  // page_referrer are always set explicitly.
  var KEEP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'ref'];
  function safeAddress(href) {
    var src;
    try { src = new URL(href, location.href); } catch (e) { return ''; }
    if (!/^https?:$/.test(src.protocol)) return '';
    var out = new URL(src.origin + src.pathname);
    KEEP.forEach(function (k) {
      var v = src.searchParams.get(k);
      if (v !== null) out.searchParams.set(k, v.slice(0, 200));
    });
    return out.href;
  }
  var url = new URL(safeAddress(location.href));
  if (ref && !tagged) {
    url.searchParams.set('utm_source', ref);
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'ref_link');
  }
  config.page_location = url.href;
  var referrer = document.referrer ? safeAddress(document.referrer) : '';
  if (referrer) config.page_referrer = referrer;

  gtag('js', new Date());
  // Every later event uses the cleaned addresses too.
  gtag('set', referrer ? { page_location: config.page_location, page_referrer: referrer } : { page_location: config.page_location });
  gtag('config', GA_MEASUREMENT_ID, config);
  // Google's own script (about 150 KB) loads only after the page has loaded and painted, so it never competes with the
  // page's fonts, styles and first picture. Everything sent before then waits in dataLayer and goes out once it loads.
  var tagAdded = false;
  function addTag() {
    if (tagAdded) return;
    tagAdded = true;
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(tag);
  }
  function afterPaint() {
    if (window.requestIdleCallback) window.requestIdleCallback(addTag, { timeout: 2000 });
    else setTimeout(addTag, 1);
  }
  if (document.readyState === 'complete') afterPaint();
  else window.addEventListener('load', afterPaint);

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
  // The free tools (assets/pages/formatter.js, size-checker.js) report which control was used. Never the visitor's
  // text or file: only the tool, the action and, for the size checker, which size it matched.
  // hook-preview.js and slide-planner.js report the same way (hook_preview, slide_planner).
  var TOOL_NAMES = { post_formatter: 1, size_checker: 1, hook_preview: 1, slide_planner: 1 };
  document.addEventListener('briopost:tool', function (e) {
    var d = e.detail || {};
    var tool = TOOL_NAMES.hasOwnProperty(d.tool) ? d.tool : 'post_formatter';
    if (d.action === 'copy') track('tool_copy', { tool_name: tool });
    else if (d.action === 'checked') track('tool_result', { tool_name: tool, size_match: String(d.match || 'none').slice(0, 20), file_kind: d.kind === 'pdf' ? 'pdf' : 'image' });
    else if (d.action === 'error') track('tool_error', { tool_name: tool, error_reason: String(d.reason || 'unknown').slice(0, 30) });
    else if (d.action) track('tool_use', { tool_name: tool, tool_action: String(d.action).slice(0, 20) });
  });

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

  // ----- The home page film (#briopost-film): started, halfway, finished, once each per page view. Nothing about the
  // visitor. Media events do not bubble, so these listen on the way down (capture), like the click tracking below.
  var filmSent = {};
  function filmOnce(e, key, name, extra) {
    var t = e.target;
    if (!t || t.id !== 'briopost-film' || filmSent[key]) return;
    filmSent[key] = 1;
    track(name, Object.assign({ video_title: 'briopost_overview' }, extra || {}));
  }
  document.addEventListener('play', function (e) { filmOnce(e, 'start', 'video_start'); }, true);
  document.addEventListener('timeupdate', function (e) {
    var t = e.target;
    if (t && t.duration && t.currentTime / t.duration >= 0.5) filmOnce(e, 'half', 'video_progress', { video_percent: 50 });
  }, true);
  document.addEventListener('ended', function (e) { filmOnce(e, 'done', 'video_complete'); }, true);

  // ----- Clicks: calls to action, PDF downloads, outside links, email links, the interactive sample -----
  // Listened to on the way down (capture), before assets/sample/sample.js redraws the sample and replaces the clicked button.
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    // The scripted moments on the home page (assets/home.js): the "Give my OK" card and the cost before an AI action.
    var okBtn = target.closest('#ok-confirm, #ok-undo');
    if (okBtn) { track('demo_interaction', { demo_action: okBtn.id === 'ok-confirm' ? 'give_ok' : 'take_back_ok', demo_value: '(none)' }); return; }
    var costBtn = target.closest('#cost-btn');
    if (costBtn) {
      var costDemo = document.getElementById('cost-demo');
      track('demo_interaction', { demo_action: costDemo && costDemo.getAttribute('data-state') === 'done' ? 'cost_reset' : 'cost_preview', demo_value: '(none)' });
      return;
    }

    // The interactive sample (assets/sample/sample.js) inside #preview. Only which control was used is sent, never the
    // visitor's own words (the "Shape it" text stays on the page).
    var demo = target.closest('#preview button');
    if (demo) {
      var action = '', value = '';
      if (demo.getAttribute('role') === 'tab') { action = 'format_tab'; value = demo.getAttribute('data-format'); }
      else if (demo.hasAttribute('data-step')) { action = Number(demo.getAttribute('data-step')) > 0 ? 'next_slide' : 'previous_slide'; }
      else if (demo.hasAttribute('data-slide')) { action = 'go_to_slide'; value = String(Number(demo.getAttribute('data-slide')) + 1); }
      else if (demo.hasAttribute('data-vote')) { action = 'poll_vote'; value = clean(demo.textContent.replace('Your choice', '').replace(/\d+%$/, ''), 60); } // a sample option, never typed text
      else if (demo.classList.contains('reset-vote')) { action = 'poll_reset'; }
      else if (demo.hasAttribute('data-topic')) { action = 'sample_topic'; value = demo.getAttribute('data-topic'); }
      else if (demo.hasAttribute('data-brand')) { action = 'brand_switch'; value = demo.getAttribute('data-brand'); }
      else if (demo.hasAttribute('data-size')) { action = 'size_switch'; value = demo.getAttribute('data-size'); }
      else if (demo.hasAttribute('data-chart')) { action = 'chart_kind'; value = demo.getAttribute('data-chart'); }
      else if (demo.classList.contains('shape-btn')) { action = 'shape_own'; } // the visitor's own words are never sent
      // On the home page #preview also holds the hero sign-up; its button is not a sample control, so it falls through to
      // the call-to-action tracking below.
      if (action) { track('demo_interaction', { demo_action: action, demo_value: value || '(none)' }); return; }
    }

    // Primary buttons and links ("Become a beta tester" buttons and links, "See all 150 carousel designs", Confirm /
    // Unsubscribe, "Open Briopost"). Buttons use the class "btn" (site.css) or the older "button".
    var cta = target.closest('a.btn, button.btn, a.button, button.button, a[href$="#waitlist"]');
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
    track('page_not_found', { page_path: location.pathname.slice(0, 120), page_referrer: referrer ? clean(referrer, 200) : '(none)' });
  }
})();
