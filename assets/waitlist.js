// Briopost waitlist: the sign-up form on the home page, and the confirm / unsubscribe pages under /waitlist/.
// The API address comes from the page's data-api attribute (https://app.briopost.com/api/waitlist).
// Messages from the server are shown with textContent only, never as HTML.
(function () {
  'use strict';
  var CONTACT = 'info@briopost.com';

  function call(api, path, options, timeoutMs) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    var init = Object.assign({ mode: 'cors', credentials: 'omit', cache: 'no-store' }, options || {});
    if (controller) init.signal = controller.signal;
    return fetch(api.replace(/\/+$/, '') + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { http: res.status, body: body || {} };
      });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }
  function postJSON(api, path, data, timeoutMs) {
    return call(api, path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }, timeoutMs);
  }
  // Tells assets/analytics.js what happened (a page event only: it changes nothing here and sends nothing by itself).
  function signal(detail) {
    try { document.dispatchEvent(new CustomEvent('briopost:waitlist', { detail: detail })); } catch (e) { /* never break the form */ }
  }
  function serverText(body, fallback) {
    return body && typeof body.error === 'string' && body.error.trim() ? body.error.trim().slice(0, 300) : fallback;
  }

  // ---------- Home page forms ----------
  // Two forms share this code: the short one in the hero (prefix "hw": first name and email) and the full one in the
  // #waitlist section (prefix "wl": adds the optional role). One status check opens or closes both.
  var source = '';
  try {
    source = (new URLSearchParams(location.search).get('ref') || '').replace(/[^\w .\-]/g, '').trim().slice(0, 60);
  } catch (e) { source = ''; }

  function setupForm(prefix) {
    var form = document.getElementById(prefix + '-form');
    if (!form) return null;
    var el = function (name) { return document.getElementById(prefix + '-' + name); };
    var api = form.getAttribute('data-api');
    var fields = el('fields');
    var closed = el('closed');
    var msg = el('msg');
    var submit = form.querySelector('button[type="submit"]');
    var submitHTML = submit.innerHTML;
    var nameInput = el('name');
    var emailInput = el('email');
    var roleInput = el('role');
    var honeypot = el('website');
    var done = el('done');
    var doneTitle = el('done-title');
    var doneText = el('done-text');
    var startedAt = Date.now();
    var busy = false;

    var say = function (text, kind) {
      msg.textContent = text || '';
      msg.className = 'form-msg' + (kind ? ' is-' + kind : '');
    };
    var setFieldError = function (input, text) {
      var err = document.getElementById(input.id + '-err');
      if (err) err.textContent = text || '';
      if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };
    var showClosed = function () {
      fields.disabled = true;
      if (closed) { closed.hidden = false; say(''); }
      else say('Sign-ups open shortly. Questions in the meantime? Write to ' + CONTACT + '.');
    };
    var open = function () {
      if (closed) closed.hidden = true;
      fields.disabled = false;
      startedAt = Date.now();
    };

    [nameInput, emailInput].forEach(function (input) {
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setFieldError(input, ''); });
    });

    var finish = function (status, email, quiet) {
      var panel = form.parentElement;
      if (panel.classList.contains('form-panel')) panel.style.minHeight = panel.getBoundingClientRect().height + 'px'; // keep the panel the same height, so nothing below jumps
      form.hidden = true;
      if (status === 'already_confirmed') {
        doneTitle.textContent = 'You’re already on the list.';
        doneText.textContent = 'Nothing else to do. We’ll email you when Briopost opens.';
      } else {
        doneTitle.textContent = 'Check your inbox.';
        doneText.textContent = '';
        doneText.appendChild(document.createTextNode('We sent a link to '));
        var strong = document.createElement('span');
        strong.className = 'copyable';
        strong.textContent = email;
        doneText.appendChild(strong);
        doneText.appendChild(document.createTextNode('. Click it to confirm your place. If it isn’t there in a few minutes, check your spam folder.'));
      }
      done.hidden = false;
      if (!quiet) doneTitle.focus();
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy || fields.disabled) return;
      var firstName = nameInput.value.trim();
      var email = emailInput.value.trim();
      var problems = [];
      var firstProblem = '';
      var flag = function (input, text) { setFieldError(input, text); problems.push(input); if (!firstProblem) firstProblem = text; };
      setFieldError(nameInput, '');
      setFieldError(emailInput, '');
      if (!firstName) flag(nameInput, 'Please enter your first name.');
      else if (firstName.length > 60) flag(nameInput, 'Please keep your first name under 60 characters.');
      if (!email) flag(emailInput, 'Please enter your email address.');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) flag(emailInput, 'Please check your email address. It should look like name@example.com.');
      if (problems.length) {
        signal({ action: 'error', form: form.id, reason: 'validation' });
        say(problems.length === 1 ? firstProblem : 'Please add your first name and email address.', 'error');
        problems[0].focus();
        return;
      }

      busy = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = 'Saving…';
      say('Sending…');

      postJSON(api, '/join', {
        firstName: firstName,
        email: email,
        role: roleInput ? (roleInput.value || '') : '',
        source: source,
        website: honeypot.value,
        startedAt: startedAt
      }, 15000).then(function (r) {
        var body = r.body || {};
        if (r.http === 200 && body.ok && (body.status === 'check_email' || body.status === 'already_confirmed')) {
          // Close every home-page form, so nobody is offered a second sign-up after "Check your inbox."
          homeForms.forEach(function (f) { if (f.finish !== finish) f.finish(body.status, email, true); });
          finish(body.status, email);
          signal({ action: 'joined', form: form.id, status: body.status });
          return;
        }
        signal({ action: 'error', form: form.id, reason: r.http === 503 ? 'closed' : r.http === 429 ? 'rate_limited' : r.http === 400 ? 'rejected' : 'server_' + r.http });
        if (r.http === 503) {
          showClosed();
          say(serverText(body, 'Sign-ups open shortly.'), 'error');
          return;
        }
        if (r.http === 429) { say(serverText(body, 'Too many tries. Please wait a few minutes.'), 'error'); return; }
        if (r.http === 400) { say(serverText(body, 'Please check your first name and email address.'), 'error'); return; }
        say('Something went wrong on our side. Please try again in a moment, or write to ' + CONTACT + '.', 'error');
      }).catch(function () {
        signal({ action: 'error', form: form.id, reason: 'network' });
        say('We couldn’t reach the sign-up service. Please check your connection and try again, or write to ' + CONTACT + '.', 'error');
      }).finally(function () {
        busy = false;
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.innerHTML = submitHTML; // the page's own fixed label and arrow icon, never server text
      });
    });

    return { api: api, open: open, closed: showClosed, finish: finish };
  }

  var homeForms = ['hw', 'wl'].map(setupForm).filter(Boolean);
  if (homeForms.length) {
    // Ask the API whether sign-ups are open. Until it answers yes, the forms stay disabled.
    call(homeForms[0].api, '/status', { method: 'GET' }, 8000).then(function (r) {
      var isOpen = r.http === 200 && r.body && r.body.open === true;
      homeForms.forEach(function (f) { if (isOpen) f.open(); else f.closed(); });
    }).catch(function () { homeForms.forEach(function (f) { f.closed(); }); });
  }

  // ---------- Confirm and unsubscribe pages ----------
  var card = document.querySelector('[data-waitlist-action]');
  if (card) {
    var action = card.getAttribute('data-waitlist-action');
    var actionApi = card.getAttribute('data-api');
    var button = card.querySelector('button');
    var out = card.querySelector('.form-msg');
    var after = card.querySelector('[data-after]');
    var token = '';
    try { token = (new URLSearchParams(location.search).get('token') || '').trim(); } catch (e) { token = ''; }
    var label = button.textContent;
    var texts = action === 'confirm' ? {
      confirmed: ['ok', 'You’re on the list. Thank you! We’ll email you when Briopost opens.'],
      already_confirmed: ['ok', 'You’re already confirmed. Nothing else to do.'],
      invalid: ['error', 'This link has expired or was replaced by a newer one. Join the waitlist again to get a fresh link.']
    } : {
      unsubscribed: ['ok', 'You’re unsubscribed. We won’t send you waitlist emails again.'],
      invalid: ['error', 'This link doesn’t work any more. If you still get our emails, write to ' + CONTACT + ' and we’ll remove you.']
    };
    var show = function (kind, text) {
      out.textContent = text;
      out.className = 'form-msg' + (kind ? ' is-' + kind : '');
    };

    if (!/^\S{8,400}$/.test(token)) {
      signal({ action: 'link_error', page: action, reason: 'missing_code' });
      button.hidden = true;
      show('error', 'This link is missing its code. Please open the link straight from your email' + (action === 'confirm' ? ', or join the waitlist again.' : ', or write to ' + CONTACT + '.'));
      if (after) after.hidden = false;
    } else {
      button.addEventListener('click', function () {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = action === 'confirm' ? 'Confirming…' : 'Unsubscribing…';
        show('', '');
        postJSON(actionApi, '/' + action, { token: token }, 15000).then(function (r) {
          var body = r.body || {};
          var status = body.status || (r.http === 400 ? 'invalid' : '');
          if (texts[status] && (body.ok || status === 'invalid')) {
            if (status === 'invalid') signal({ action: 'link_error', page: action, reason: 'invalid_link' });
            else signal({ action: action === 'confirm' ? 'confirmed' : 'unsubscribed', status: status });
            show(texts[status][0], texts[status][1]);
            button.hidden = true;
            if (after) after.hidden = false;
            return;
          }
          signal({ action: 'link_error', page: action, reason: r.http === 429 ? 'rate_limited' : 'server_' + r.http });
          if (r.http === 429) { show('error', serverText(body, 'Too many tries. Please wait a few minutes.')); return; }
          show('error', 'Something went wrong on our side. Please try again in a moment, or write to ' + CONTACT + '.');
        }).catch(function () {
          signal({ action: 'link_error', page: action, reason: 'network' });
          show('error', 'We couldn’t reach Briopost. Please check your connection and try again.');
        }).finally(function () {
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = label;
        });
      });
    }
  }
})();
