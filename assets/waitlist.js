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
  function serverText(body, fallback) {
    return body && typeof body.error === 'string' && body.error.trim() ? body.error.trim().slice(0, 300) : fallback;
  }

  // ---------- Home page form ----------
  var form = document.getElementById('wl-form');
  if (form) {
    var api = form.getAttribute('data-api');
    var fields = document.getElementById('wl-fields');
    var closed = document.getElementById('wl-closed');
    var msg = document.getElementById('wl-msg');
    var submit = form.querySelector('button[type="submit"]');
    var nameInput = document.getElementById('wl-name');
    var emailInput = document.getElementById('wl-email');
    var roleInput = document.getElementById('wl-role');
    var honeypot = document.getElementById('wl-website');
    var done = document.getElementById('wl-done');
    var doneTitle = document.getElementById('wl-done-title');
    var doneText = document.getElementById('wl-done-text');
    var startedAt = Date.now();
    var busy = false;

    var source = '';
    try {
      source = (new URLSearchParams(location.search).get('ref') || '').replace(/[^\w .\-]/g, '').trim().slice(0, 60);
    } catch (e) { source = ''; }

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
      closed.hidden = false;
      say('');
    };
    var open = function () {
      closed.hidden = true;
      fields.disabled = false;
      startedAt = Date.now();
    };

    // Ask the API whether sign-ups are open. Until it answers yes, the form stays disabled.
    call(api, '/status', { method: 'GET' }, 8000).then(function (r) {
      if (r.http === 200 && r.body && r.body.open === true) open(); else showClosed();
    }).catch(showClosed);

    [nameInput, emailInput].forEach(function (input) {
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setFieldError(input, ''); });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy || fields.disabled) return;
      var firstName = nameInput.value.trim();
      var email = emailInput.value.trim();
      var problems = [];
      setFieldError(nameInput, '');
      setFieldError(emailInput, '');
      if (!firstName) { setFieldError(nameInput, 'Please enter your first name.'); problems.push(nameInput); }
      else if (firstName.length > 60) { setFieldError(nameInput, 'Please keep your first name under 60 characters.'); problems.push(nameInput); }
      if (!email) { setFieldError(emailInput, 'Please enter your email address.'); problems.push(emailInput); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) { setFieldError(emailInput, 'Please check your email address. It should look like name@example.com.'); problems.push(emailInput); }
      if (problems.length) {
        say(problems.length === 1 ? document.getElementById(problems[0].id + '-err').textContent : 'Please add your first name and email address.', 'error');
        problems[0].focus();
        return;
      }

      busy = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = 'Joining…';
      say('Sending…');

      postJSON(api, '/join', {
        firstName: firstName,
        email: email,
        role: roleInput.value || '',
        source: source,
        website: honeypot.value,
        startedAt: startedAt
      }, 15000).then(function (r) {
        var body = r.body || {};
        if (r.http === 200 && body.ok && (body.status === 'check_email' || body.status === 'already_confirmed')) {
          finish(body.status, email);
          return;
        }
        if (r.http === 503) {
          showClosed();
          say(serverText(body, 'Sign-ups open shortly.'), 'error');
          return;
        }
        if (r.http === 429) { say(serverText(body, 'Too many tries. Please wait a few minutes.'), 'error'); return; }
        if (r.http === 400) { say(serverText(body, 'Please check your first name and email address.'), 'error'); return; }
        say('Something went wrong on our side. Please try again in a moment, or write to ' + CONTACT + '.', 'error');
      }).catch(function () {
        say('We couldn’t reach the sign-up service. Please check your connection and try again, or write to ' + CONTACT + '.', 'error');
      }).finally(function () {
        busy = false;
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.textContent = 'Join the waitlist';
      });
    });

    var finish = function (status, email) {
      var panel = form.parentElement;
      panel.style.minHeight = panel.getBoundingClientRect().height + 'px'; // keep the panel the same height, so nothing below jumps
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
      doneTitle.focus();
    };
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
            show(texts[status][0], texts[status][1]);
            button.hidden = true;
            if (after) after.hidden = false;
            return;
          }
          if (r.http === 429) { show('error', serverText(body, 'Too many tries. Please wait a few minutes.')); return; }
          show('error', 'Something went wrong on our side. Please try again in a moment, or write to ' + CONTACT + '.');
        }).catch(function () {
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
