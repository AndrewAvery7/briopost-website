/* Free carousel tool scorecard (on /how-to-choose-a-linkedin-carousel-tool/). The visitor names up to three tools and
   answers the page's ten questions for each with Yes, Partly or No; the page adds up a score out of 10 (Yes 1, Partly
   half) and flags a tool that can post without the visitor's OK. Runs only in the browser: nothing is sent or stored.
   Tells the analytics file which control was used through a page event (briopost:tool); never tool names or answers. */
(function () {
  'use strict';
  var root = document.getElementById('scorecard');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var namesBox = $('sk-names'), qList = $('sk-questions'), results = $('sk-results'), status = $('sk-status');
  var addBtn = $('sk-add');
  var MAX = 3;
  // The ten questions, in the page's order. ok:true marks the one a "No" makes a deal-breaker.
  var QUESTIONS = [
    { id: 'ok', text: 'Nothing posts without your OK', ok: true },
    { id: 'cost', text: 'Shows AI costs before you spend' },
    { id: 'brand', text: 'Uses your brand kit' },
    { id: 'editor', text: 'A real editor, not fixed templates' },
    { id: 'export', text: 'Exports a PDF, images and the sizes you post in' },
    { id: 'approval', text: 'Clients can approve before it goes out' },
    { id: 'privacy', text: 'Clear about what it sends, and where' },
    { id: 'data', text: 'You can take your data with you' },
    { id: 'team', text: 'Works for a team' },
    { id: 'linkedin', text: 'Posts where you need it to' }
  ];
  var CHOICES = [['yes', 'Yes'], ['part', 'Partly'], ['no', 'No']];
  // Briopost's own answers, as the page states them under "Briopost today".
  var BRIOPOST = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'part'];
  var tools = [];
  var uid = 0;

  function tell(action) {
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: { tool: 'tool_scorecard', action: action } })); } catch (e) { /* never break the tool */ }
  }
  function say(msg) { status.textContent = ''; window.setTimeout(function () { status.textContent = msg; }, 30); }
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  var label = function (t, i) { return (t.name || '').trim() || 'Tool ' + 'ABC'.charAt(i); };

  function newTool(name, answers) { uid += 1; return { key: 't' + uid, name: name || '', answers: answers ? answers.slice() : QUESTIONS.map(function () { return null; }) }; }

  function score(t) {
    var s = 0, open = 0;
    t.answers.forEach(function (a) { if (a === 'yes') s += 1; else if (a === 'part') s += 0.5; else if (!a) open += 1; });
    return { points: s, open: open, breaker: t.answers[0] === 'no' };
  }
  var pts = function (n) { return (n % 1 ? n.toFixed(1) : String(n)); };

  // ---- Building the form ------------------------------------------------------------------------------------------
  function buildNames() {
    namesBox.innerHTML = '';
    tools.forEach(function (t, i) {
      var row = el('div', 'sk-name');
      var id = 'sk-name-' + t.key;
      var lab = el('label', 'tool-label', 'Tool ' + (i + 1));
      lab.setAttribute('for', id);
      var input = el('input', 'sk-input');
      input.type = 'text'; input.id = id; input.maxLength = 40; input.autocomplete = 'off'; input.value = t.name;
      input.placeholder = 'Tool ' + 'ABC'.charAt(i);
      input.addEventListener('input', function () { t.name = input.value; refreshLegends(); renderResults(); });
      row.appendChild(lab);
      var line = el('div', 'sk-name-line');
      line.appendChild(input);
      if (tools.length > 1) {
        var rm = el('button', 'mini-btn', 'Remove');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove ' + label(t, i));
        rm.addEventListener('click', function () {
          var gone = label(t, i);
          tools.splice(i, 1);
          build();
          say(gone + ' removed.');
          tell('remove');
          var first = namesBox.querySelector('input'); if (first) first.focus();
        });
        line.appendChild(rm);
      }
      row.appendChild(line);
      namesBox.appendChild(row);
    });
    addBtn.hidden = tools.length >= MAX;
  }

  function buildQuestions() {
    qList.innerHTML = '';
    QUESTIONS.forEach(function (q, qi) {
      var li = el('li', 'sk-q');
      li.appendChild(el('p', 'sk-q-text', (qi + 1) + '. ' + q.text));
      var link = el('a', 'sk-q-more', 'What to look for');
      link.href = '#' + q.id;
      li.appendChild(link);
      tools.forEach(function (t, ti) {
        var fs = el('fieldset', 'sk-row');
        var lg = el('legend', 'sk-legend', label(t, ti));
        lg.setAttribute('data-tool', t.key);
        fs.appendChild(lg);
        var seg = el('div', 'sk-seg');
        CHOICES.forEach(function (c) {
          var id = 'sk-' + t.key + '-' + q.id + '-' + c[0];
          var input = el('input');
          input.type = 'radio'; input.name = 'sk-' + t.key + '-' + q.id; input.id = id; input.value = c[0];
          input.checked = t.answers[qi] === c[0];
          input.addEventListener('change', function () { t.answers[qi] = c[0]; renderResults(); });
          var lab = el('label', 'sk-opt sk-' + c[0], c[1]);
          lab.setAttribute('for', id);
          seg.appendChild(input); seg.appendChild(lab);
        });
        fs.appendChild(seg);
        li.appendChild(fs);
      });
      qList.appendChild(li);
    });
  }
  function refreshLegends() {
    tools.forEach(function (t, i) {
      qList.querySelectorAll('legend[data-tool="' + t.key + '"]').forEach(function (lg) { lg.textContent = label(t, i); });
    });
  }

  // ---- Results ----------------------------------------------------------------------------------------------------
  function renderResults() {
    results.innerHTML = '';
    var scored = tools.map(function (t, i) { return { t: t, i: i, s: score(t) }; });
    var list = el('ul', 'sk-scores');
    scored.forEach(function (x) {
      var li = el('li', 'sk-score' + (x.s.breaker ? ' is-breaker' : ''));
      li.appendChild(el('p', 'sk-score-name', label(x.t, x.i)));
      li.appendChild(el('p', 'sk-score-num', pts(x.s.points) + ' of 10'));
      var bar = el('span', 'sk-bar'); bar.setAttribute('aria-hidden', 'true');
      var fill = el('span', 'sk-fill'); fill.style.setProperty('width', (x.s.points * 10) + '%');
      bar.appendChild(fill); li.appendChild(bar);
      if (x.s.breaker) li.appendChild(el('p', 'sk-breaker', 'Deal-breaker: it can post without your OK.'));
      // The OK question already shows as the deal-breaker line, so it is not repeated here.
      var noes = QUESTIONS.filter(function (q, qi) { return x.t.answers[qi] === 'no' && !q.ok; }).map(function (q) { return q.text; });
      if (noes.length) li.appendChild(el('p', 'sk-detail', 'No: ' + noes.join('; ') + '.'));
      if (x.s.open) li.appendChild(el('p', 'sk-detail', x.s.open + (x.s.open === 1 ? ' question' : ' questions') + ' not answered yet.'));
      list.appendChild(li);
    });
    results.appendChild(list);
    var answered = scored.filter(function (x) { return x.s.open < QUESTIONS.length; });
    var summary;
    if (!answered.length) summary = 'Answer the questions for each tool to see the scores.';
    else if (scored.length === 1) summary = label(scored[0].t, 0) + ': ' + pts(scored[0].s.points) + ' of 10' + (scored[0].s.open ? ' so far.' : '.');
    else {
      var ok = scored.filter(function (x) { return !x.s.breaker; });
      var pool = ok.length ? ok : scored;
      var top = pool.slice().sort(function (a, b) { return b.s.points - a.s.points; });
      var tie = top.length > 1 && top[0].s.points === top[1].s.points;
      var open = scored.some(function (x) { return x.s.open; });
      summary = tie ? 'Tied so far at ' + pts(top[0].s.points) + ' of 10.' : label(top[0].t, top[0].i) + ' leads with ' + pts(top[0].s.points) + ' of 10' + (open ? ', with questions still open.' : '.');
      if (ok.length && ok.length < scored.length) summary += ' Tools that can post without your OK are left out of the lead.';
    }
    results.insertBefore(el('p', 'sk-summary', summary), list);
  }

  function build() { buildNames(); buildQuestions(); renderResults(); }

  function asText() {
    var lines = ['LinkedIn carousel tool scorecard (10 questions from briopost.com)', ''];
    tools.forEach(function (t, i) {
      var s = score(t);
      lines.push(label(t, i) + ': ' + pts(s.points) + ' of 10' + (s.open ? ' (' + s.open + ' not answered)' : '') + (s.breaker ? ' – deal-breaker: can post without your OK' : ''));
      QUESTIONS.forEach(function (q, qi) {
        var a = t.answers[qi];
        lines.push('  ' + (qi + 1) + '. ' + q.text + ': ' + (a === 'yes' ? 'Yes' : a === 'part' ? 'Partly' : a === 'no' ? 'No' : 'not answered'));
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  addBtn.addEventListener('click', function () {
    if (tools.length >= MAX) return;
    tools.push(newTool());
    build();
    say('Tool ' + tools.length + ' added. Answer the questions for it below.');
    tell('add');
    var inputs = namesBox.querySelectorAll('input'); inputs[inputs.length - 1].focus();
  });
  $('sk-example').addEventListener('click', function () {
    var i = tools.findIndex(function (t) { return t.name.trim() === 'Briopost'; });
    if (i < 0) {
      var empty = tools.findIndex(function (t) { return !t.name.trim() && t.answers.every(function (a) { return !a; }); });
      if (empty < 0 && tools.length >= MAX) { say('Remove a tool first: the scorecard compares up to three.'); return; }
      if (empty < 0) { tools.push(newTool()); empty = tools.length - 1; }
      i = empty;
    }
    tools[i].name = 'Briopost'; tools[i].answers = BRIOPOST.slice();
    build();
    say('Briopost’s answers added, as this page states them: ' + pts(score(tools[i]).points) + ' of 10.');
    tell('example');
  });
  $('sk-copy').addEventListener('click', function () {
    var text = asText();
    var done = function () { say('Scorecard copied. Paste it into an email or a note.'); tell('copy'); };
    var btn = $('sk-copy');
    // Same fallback as the post formatter: when the clipboard API is refused, copy from a hidden text box.
    var fallback = function () {
      var box = document.createElement('textarea');
      box.value = text; box.setAttribute('readonly', ''); box.className = 'sk-copy-box';
      document.body.appendChild(box);
      box.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(box);
      btn.focus();
      if (ok) done(); else say('Your browser blocked copying. Select the scores and press Ctrl+C (Cmd+C on a Mac).');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });
  $('sk-clear').addEventListener('click', function () {
    tools = [newTool(), newTool()];
    build();
    say('Cleared. Name the tools you are comparing to start again.');
    tell('clear');
  });

  tools = [newTool(), newTool()];
  root.classList.add('is-live');
  build();
})();
