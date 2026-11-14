/* The home page sample: one thought, four formats.
   Visitors pick a sample topic or type their own thought and press "Shape it". Everything happens on this page:
   nothing is sent, generated or posted. The sample topics are hand-written; a visitor's own thought is laid into a
   fixed design (cover, the idea, a closing question), and the page says so. */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('#preview [role="tab"]'));
  var panel = document.getElementById('sample');
  if (!panel || !tabs.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var esc = function (v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var arrow = function (next) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="' + (next ? 'M5 12h14m-6-6 6 6-6 6' : 'M19 12H5m6-6-6 6 6 6') + '"/></svg>'; };
  var PHOTO = '<div class="conversation-photo"><img src="assets/conversation-cafe.jpg" width="1289" height="1600" alt="Illustrative café conversation between two people"></div>';

  // Hand-written samples. Slide = [class, html]. Headlines: one highlighted phrase (<em>) at most.
  var TOPICS = {
    sales: {
      thought: 'Our best customer conversations happen when we stop pitching and start asking better questions.',
      slides: [
        ['cover', '<p class="slide-topic">The art of a better conversation</p><h3>Stop pitching.<br><em>Start asking.</em></h3><p class="slide-sub">Three questions that change the conversation.</p>' + PHOTO],
        ['question', '<span class="question-number" aria-hidden="true">01</span><h3>“What’s getting<br>in your way?”</h3><p class="slide-sub">Find the problem before you offer a solution.</p><div class="answer-note">Listen for the frustration behind the first answer.</div>'],
        ['question warm', '<span class="question-number" aria-hidden="true">02</span><h3>“What have<br>you tried?”</h3><p class="slide-sub">Make room for their experience.</p><div class="answer-note">A better conversation starts where their last one ended.</div>'],
        ['question', '<span class="question-number" aria-hidden="true">03</span><h3>“What would<br>better look like?”</h3><p class="slide-sub">Let them describe the outcome that matters.</p><div class="answer-note">Then decide together whether you can help.</div>'],
        ['closing', '<div class="closing-mark" aria-hidden="true">?</div><h3>Good questions.<br><em>Real connection.</em></h3><p class="slide-sub">Try one in your next conversation.</p>']
      ],
      graphic: { photo: true, caption: 'Make space for a better conversation.', h: 'Ask more.<br><em>Pitch less.</em>' },
      text: ['<strong>The best sales tool I’ve found?<br>A better question.</strong>', 'We used to lead with our pitch.<br>Now we lead with curiosity.', '“What’s getting in your way?”<br>“What have you already tried?”<br>“What would better look like?”', 'People don’t need another presentation.<br>They need to feel heard.', 'What question has opened a door for you?'],
      poll: { q: 'The best conversations start with curiosity.<br>What makes a customer conversation click for you?', options: ['A thoughtful question', 'A clear example', 'A fresh perspective', 'Listening first'] }
    },
    leadership: {
      thought: 'The most useful thing I do as a manager is ask for feedback before I give it.',
      slides: [
        ['cover type', '<p class="slide-topic">Notes on better one-to-ones</p><h3>Ask first.<br><em>Then advise.</em></h3><p class="slide-sub">Three questions I bring to every one-to-one.</p><div class="type-mark" aria-hidden="true">1:1</div>'],
        ['question', '<span class="question-number" aria-hidden="true">01</span><h3>“What should<br>I keep doing?”</h3><p class="slide-sub">Start with what works. It makes the rest easier to hear.</p><div class="answer-note">Write it down where they can see it.</div>'],
        ['question warm', '<span class="question-number" aria-hidden="true">02</span><h3>“What should<br>I stop?”</h3><p class="slide-sub">The hardest one to ask. The most useful one to hear.</p><div class="answer-note">Say thank you. Don’t explain.</div>'],
        ['question', '<span class="question-number" aria-hidden="true">03</span><h3>“What would make<br>next week easier?”</h3><p class="slide-sub">Turn the answer into one small change.</p><div class="answer-note">Then report back on it next time.</div>'],
        ['closing', '<div class="closing-mark" aria-hidden="true">?</div><h3>Listen first.<br><em>Lead better.</em></h3><p class="slide-sub">Ask one of these this week.</p>']
      ],
      graphic: { photo: false, caption: 'A habit worth stealing.', h: 'Feedback goes<br><em>both ways.</em>' },
      text: ['<strong>The most useful thing I do as a manager?<br>I ask for feedback before I give it.</strong>', 'Every one-to-one starts with three questions:', '“What should I keep doing?”<br>“What should I stop?”<br>“What would make next week easier?”', 'The second one is hard to ask.<br>It’s also where the best ideas come from.', 'What’s one question you ask your team?'],
      poll: { q: 'Feedback works best when it goes both ways.<br>How often do you ask your team for feedback?', options: ['Every week', 'Every month', 'Only at reviews', 'Not yet'] }
    },
    career: {
      thought: 'Changing careers taught me that my old skills were more useful than I thought.',
      slides: [
        ['cover type', '<p class="slide-topic">Notes from a career change</p><h3>Your skills<br><em>travel further.</em></h3><p class="slide-sub">Three steps that helped me make the move.</p><div class="type-mark" aria-hidden="true">→</div>'],
        ['question', '<span class="question-number" aria-hidden="true">01</span><h3>List what you<br>actually did.</h3><p class="slide-sub">Not your job title. The work.</p><div class="answer-note">“Ran a team of six” beats “Operations lead”.</div>'],
        ['question warm', '<span class="question-number" aria-hidden="true">02</span><h3>Say it in<br>their words.</h3><p class="slide-sub">Read five job posts. Borrow their language.</p><div class="answer-note">Same skill, new vocabulary.</div>'],
        ['question', '<span class="question-number" aria-hidden="true">03</span><h3>Tell one story,<br>not ten.</h3><p class="slide-sub">Pick the example that proves the move makes sense.</p><div class="answer-note">Practice it out loud.</div>'],
        ['closing', '<div class="closing-mark" aria-hidden="true">?</div><h3>Start where<br><em>you are.</em></h3><p class="slide-sub">Your next role may need what you already know.</p>']
      ],
      graphic: { photo: false, caption: 'A note for anyone changing careers.', h: 'Old skills.<br><em>New room.</em>' },
      text: ['<strong>Changing careers taught me something I didn’t expect:<br>my old skills were more useful than I thought.</strong>', 'What helped most:', '1. List what you actually did, not your title.<br>2. Say it in the words the new field uses.<br>3. Tell one story, not ten.', 'You’re not starting over.<br>You’re starting from somewhere.', 'What skill surprised you when you changed roles?'],
      poll: { q: 'Changing careers is easier with a plan.<br>What held you back most?', options: ['Knowing where to start', 'Explaining my experience', 'Confidence', 'Timing'] }
    }
  };

  // A visitor's own thought, laid into a fixed design.
  function fromThought(raw) {
    var t = raw.replace(/\s+/g, ' ').trim();
    var sentences = t.match(/[^.!?]+[.!?]*/g) || [t];
    var first = sentences[0].trim().replace(/[.!?,;:]+$/, '');
    var words = first.split(' ');
    if (words.length > 9) words = words.slice(0, 8).concat('…');
    var cut = Math.max(1, Math.ceil(words.length / 2));
    var head = esc(words.slice(0, cut).join(' ')) + '<br><em>' + esc(words.slice(cut).join(' ').replace(/ …$/, '…')) + (words[words.length - 1] === '…' ? '' : '.') + '</em>';
    if (words.length === 1) head = '<em>' + esc(words[0]) + '.</em>';
    var rest = sentences.slice(1).join(' ').trim();
    return {
      thought: t,
      custom: true,
      slides: [
        ['cover type', '<p class="slide-topic">Your thought</p><h3' + (words.length > 4 ? ' class="fit"' : '') + '>' + head + '</h3><p class="slide-sub">Swipe for the idea.</p><div class="type-mark" aria-hidden="true">“</div>'],
        ['question warm', '<span class="question-number" aria-hidden="true">01</span><h3 class="long">' + esc(t) + '</h3><div class="answer-note">In the studio, the assistant writes the slides in between from your notes, in your voice.</div>'],
        ['closing', '<div class="closing-mark" aria-hidden="true">?</div><h3>What do<br><em>you think?</em></h3><p class="slide-sub">Ask your readers to add their view.</p>']
      ],
      graphic: { photo: false, caption: 'Your thought, as a graphic.', h: head, fit: words.length > 4 },
      text: ['<strong>' + esc(sentences[0].trim()) + '</strong>'].concat(rest ? [esc(rest)] : []).concat(['In the studio, the assistant shapes the rest of this post from your notes, in your voice.', 'What would you add?']),
      poll: { q: esc(t) + '<br>Where do you stand?', options: ['Completely agree', 'Mostly agree', 'Not sure yet', 'It depends'] }
    };
  }

  var data = TOPICS.sales, topicKey = 'sales';
  var currentFormat = 'carousel', slide = 0, vote = null;

  var footer = function () { return '<div class="deck-footer"><span>Post with brio.</span><img src="assets/briopost-icon.svg" alt="" width="24" height="24"></div>'; };
  var profile = function () { return '<div class="feed-profile"><img src="assets/briopost-icon.svg" alt="" width="38" height="38"><div><strong>Jordan Ellis</strong><span>Sample post · Preview only</span></div></div>'; };

  function render(animate) {
    panel.dataset.format = currentFormat;
    var slides = data.slides, html;
    if (currentFormat === 'carousel') {
      html = '<div class="deck-wrap"><article class="deck-slide ' + slides[slide][0] + '" aria-label="Carousel slide ' + (slide + 1) + ' of ' + slides.length + '">' + slides[slide][1] + footer() + '</article></div>'
        + '<div class="deck-controls"><button type="button" class="deck-arrow" data-step="-1" aria-label="Previous slide" ' + (slide === 0 ? 'disabled' : '') + '>' + arrow(false) + '</button><div class="deck-dots" aria-label="Carousel slides">'
        + slides.map(function (s, i) { return '<button type="button" aria-label="Go to slide ' + (i + 1) + '" aria-pressed="' + (i === slide) + '" data-slide="' + i + '"><span></span></button>'; }).join('')
        + '</div><button type="button" class="deck-arrow" data-step="1" aria-label="Next slide" ' + (slide === slides.length - 1 ? 'disabled' : '') + '>' + arrow(true) + '</button></div>'
        + '<p class="format-hint" role="status">Slide ' + (slide + 1) + ' of ' + slides.length + ' · Swipe or use the arrows</p>';
    } else if (currentFormat === 'graphic') {
      var g = data.graphic;
      html = '<figure class="graphic-art' + (g.photo ? '' : ' graphic-type') + '">' + (g.photo ? '<img class="graphic-photo" src="assets/conversation-cafe.jpg" width="1289" height="1600" alt="Illustrative conversation over coffee">' : '<div class="graphic-cards" aria-hidden="true"><i></i><i></i><i></i></div>')
        + '<figcaption><span class="graphic-caption">' + g.caption + '</span><h3' + (g.fit ? ' class="fit"' : '') + '>' + g.h + '</h3>' + footer() + '</figcaption></figure><p class="format-hint">A finished graphic for the feed · Sample design</p>';
    } else if (currentFormat === 'text') {
      html = '<article class="feed-post">' + profile() + '<div class="feed-copy">' + data.text.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div><div class="feed-actions" aria-label="Illustrative feed actions"><span>Like</span><span>Comment</span><span>Repost</span><span>Send</span></div></article><p class="format-hint">Your voice, ready for the feed · Sample post</p>';
    } else {
      var options = data.poll.options;
      // Illustrative results, shown only after a vote. Fixed numbers, labeled as a sample.
      var shares = [46, 27, 18, 9];
      html = '<article class="feed-post poll-post">' + profile() + '<p class="poll-intro">' + data.poll.q + '</p><fieldset class="poll-options' + (vote !== null ? ' voted' : '') + '"><legend>Choose an answer to try the poll</legend>'
        + options.map(function (option, i) { return '<button type="button" class="poll-choice ' + (vote === i ? 'chosen' : '') + '" data-vote="' + i + '" aria-pressed="' + (vote === i) + '" style="--share:' + shares[i] + '%"><span class="poll-bar" aria-hidden="true"></span><span class="poll-radio" aria-hidden="true"></span><span class="poll-text">' + option + '</span>' + (vote !== null ? '<span class="poll-share">' + shares[i] + '%</span>' : '') + '</button>'; }).join('')
        + '</fieldset><p class="poll-feedback" role="status">' + (vote === null ? 'Try an answer. This is a preview.' : 'You chose “' + options[vote] + '”. Sample results, made up for this preview. Your choice stays on this page.') + '</p>' + (vote !== null ? '<button class="reset-vote" type="button">Clear my choice</button>' : '') + '</article><p class="format-hint">A question your audience can answer · Sample poll</p>';
    }
    panel.innerHTML = html;
    if (animate && !reduce) { panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); }
  }

  function activate(tab) {
    currentFormat = tab.dataset.format;
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    render(true);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activate(tab); });
    tab.addEventListener('keydown', function (e) {
      var next;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault(); activate(tabs[next]); tabs[next].focus();
    });
  });

  function goSlide(n) {
    var max = data.slides.length - 1;
    var to = Math.max(0, Math.min(max, n));
    if (to === slide) return false;
    panel.dataset.dir = to > slide ? 'next' : 'prev';
    slide = to; render(true); return true;
  }

  panel.addEventListener('click', function (e) {
    var button = e.target.closest('button'); if (!button) return;
    var selector;
    if (button.hasAttribute('data-step')) {
      goSlide(slide + Number(button.dataset.step));
      selector = slide === 0 ? '[data-step="1"]' : slide === data.slides.length - 1 ? '[data-step="-1"]' : '[data-step="' + button.dataset.step + '"]';
    } else if (button.hasAttribute('data-slide')) { goSlide(Number(button.dataset.slide)); selector = '[data-slide="' + slide + '"]'; }
    else if (button.hasAttribute('data-vote')) { vote = Number(button.dataset.vote); render(false); selector = '[data-vote="' + vote + '"]'; }
    else if (button.classList.contains('reset-vote')) { vote = null; render(false); selector = '[data-vote="0"]'; }
    else return;
    var f = panel.querySelector(selector); if (f) f.focus({ preventScroll: true });
  });

  // Swipe through the carousel on touch screens (and with a mouse drag).
  var startX = null, startY = null;
  panel.addEventListener('pointerdown', function (e) { if (currentFormat === 'carousel' && e.target.closest('.deck-slide')) { startX = e.clientX; startY = e.clientY; } });
  panel.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX, dy = e.clientY - startY; startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goSlide(slide + (dx < 0 ? 1 : -1));
  });
  panel.addEventListener('pointercancel', function () { startX = null; });

  // The thought box: sample topics, or the visitor's own words.
  var tool = document.getElementById('thought-tool');
  var box = document.getElementById('thought');
  var count = document.getElementById('thought-count');
  var shapeBtn = document.getElementById('shape-btn');
  var chips = tool ? [].slice.call(tool.querySelectorAll('.chip')) : [];
  var disclosure = document.getElementById('demo-disclosure');
  if (tool && box && shapeBtn) {
    tool.hidden = false;
    [].slice.call(document.querySelectorAll('.notes-static')).forEach(function (n) { n.hidden = true; });
    var updateCount = function () { if (count) count.textContent = box.value.length + ' / ' + box.maxLength; };
    updateCount();
    var setChip = function (key) { chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.topic === key)); }); };
    var shape = function (next, key) {
      var go = function () {
        data = next; topicKey = key; slide = 0; vote = null;
        if (disclosure) disclosure.textContent = next.custom
          ? 'Your words, laid into a sample design. In the studio, the assistant writes the whole post in your voice. Nothing is sent or posted.'
          : 'Interactive sample · Nothing is generated or posted.';
        panel.classList.remove('shaping'); panel.removeAttribute('aria-busy');
        render(true);
      };
      if (reduce) { go(); return; }
      panel.setAttribute('aria-busy', 'true');
      panel.classList.add('shaping');
      setTimeout(go, 750);
    };
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.dataset.topic; setChip(key);
        box.value = TOPICS[key].thought; updateCount();
        shape(TOPICS[key], key);
      });
    });
    box.addEventListener('input', function () { updateCount(); setChip(null); });
    var shapeOwn = function () {
      var v = box.value.trim();
      if (!v) { box.focus(); return; }
      var match = null;
      Object.keys(TOPICS).forEach(function (k) { if (TOPICS[k].thought === v) match = k; });
      if (match) { setChip(match); shape(TOPICS[match], match); }
      else shape(fromThought(v), 'custom');
      if (window.matchMedia && matchMedia('(max-width: 800px)').matches) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    };
    shapeBtn.addEventListener('click', shapeOwn);
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); shapeOwn(); } });
  }

  render(false);
})();
