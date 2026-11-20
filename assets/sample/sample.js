/* Briopost website: the interactive sample (shared by every page that shows it).
   Everything here is a scripted sample. Nothing is sent, generated or posted: the visitor's own words never leave the
   page, and analytics (assets/analytics.js) records only which control was used.
   Slides are drawn at the studio's native 1080 px width in "slide units" (--u = 1/1080 of the slide's width, see
   sample.css), matching src/slides/SlideView.tsx in the studio, so they look like a real export at any size.
   The same render() runs in Node (scripts/build-pages.mjs) to write the no-JavaScript version into each page between
   <!--SAMPLE--> and <!--/SAMPLE-->. Pictures load from /assets/sample/img/ unless the .bp-demo root sets data-img. */
(function (root) {
  'use strict';

  var IMG = '/assets/sample/img/';
  var PERSON = { name: 'Jordan Ellis', initials: 'JE', site: 'Sample · Jordan Ellis' };

  // Three brand kits, each from a real studio design (docs/website-rebuild/inventory/SLIDE-KINDS.md).
  var BRANDS = {
    midnight: { label: 'Midnight', note: 'Bricolage and Inter, orange spark' },
    harbor: { label: 'Harbor', note: 'Playfair Display and Inter, gold' },
    daylight: { label: 'Daylight', note: 'Inter, teal on light' }
  };

  var ICONS = {
    ask: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    send: '<path d="m4 12 16-8-6 16-2-6-8-2Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>'
  };

  // Sample topics. Every number is sample content and the slides say so.
  var TOPICS = {
    sales: {
      chip: 'Sales',
      photo: 'hearth-cafe', photoAlt: 'A coach and a client talking across a small cafe table in warm light',
      cover: { eyebrow: 'Sales', title: ['Stop pitching. ', 'Start ', '[asking.]'], text: 'Three questions that turn a sales call into a conversation.' },
      chart: { eyebrow: 'What changed', title: 'Second meetings, by month', unit: '', labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], values: [3, 4, 5, 7, 9, 12], note: 'Sample numbers. Yours come from you.' },
      compare: { eyebrow: 'The difference', title: 'Pitch first or ask first?', left: { label: 'Pitch first', items: ['Talk for ten minutes', 'Guess their problem', 'Send a deck after'] }, right: { label: 'Ask first', items: ['Listen for ten minutes', 'Hear their problem', 'Send one useful idea'] } },
      cards: { big: '3', bigLabel: 'questions that open every call', items: [['ask', 'What’s in your way?', 'Start with their week, not your offer.'], ['clock', 'What have you tried?', 'Skip ideas they already tested.'], ['target', 'What would better look like?', 'Let them name the goal.']] },
      end: { kind: 'cta', title: 'Try one question on your next call.', text: 'Save this for Monday.', button: 'Save for Monday' },
      graphic: { line: 'The best sales tool I’ve found is a better question.', sub: 'Three of them, on my next post.' },
      text: ['The best sales tool I’ve found? A better question.', 'We used to lead with our pitch. Now we lead with curiosity:', '→ What’s getting in your way?\n→ What have you already tried?\n→ What would better look like?', 'Second meetings went up the month we switched.', 'Which question do you start with?'],
      poll: { q: 'How do you open a sales call?', options: ['With our pitch', 'With a case study', 'With a question', 'Depends on the client'], results: [14, 19, 48, 19] }
    },
    leadership: {
      chip: 'Leadership',
      photo: 'northfield-team', photoAlt: 'A small team planning together in a bright meeting room with plants',
      cover: { eyebrow: 'Leadership', title: ['Your team needs ', '[fewer meetings,]', ' not more.'], text: 'How we cut status meetings and got faster.' },
      chart: { eyebrow: 'Six weeks in', title: 'Hours in meetings, per week', unit: ' h', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], values: [14, 13, 11, 9, 8, 7], note: 'Sample numbers. Yours come from you.' },
      compare: { eyebrow: 'What we swapped', title: 'Status meeting or written update?', left: { label: 'Status meeting', items: ['Everyone waits their turn', 'Decisions get lost', 'Thirty minutes, every day'] }, right: { label: 'Written update', items: ['Read it when it suits you', 'Decisions are written down', 'Five minutes to write'] } },
      cards: { big: '7 h', bigLabel: 'back in every manager’s week', items: [['pen', 'Write it down', 'Updates go in one shared note.'], ['check', 'Decide in writing', 'Small calls don’t need a room.'], ['people', 'Meet to solve', 'Keep meetings for real problems.']] },
      end: { kind: 'quote', quote: 'Meetings are for decisions. Updates can be written.', who: 'Jordan Ellis (sample)' },
      graphic: { line: 'Meetings are for decisions. Updates can be written.', sub: 'What six weeks of fewer meetings taught us.' },
      text: ['We cut our status meetings. Work got faster.', 'For six weeks we swapped the daily stand-up for a written update.', '→ Everyone reads it when it suits them\n→ Decisions are written down\n→ Meetings are kept for real problems', 'Our managers got hours back every week.', 'What meeting would you cut first?'],
      poll: { q: 'Which meeting would you cut first?', options: ['The daily stand-up', 'The weekly status call', 'The monthly all-hands', 'None, we need them'], results: [41, 33, 9, 17] }
    },
    career: {
      chip: 'Career',
      photo: 'cobalt-portrait', photoAlt: 'A smiling professional on a video call at a tidy home desk',
      cover: { eyebrow: 'Career', title: ['The job search tip ', '[nobody gives you.]'], text: 'Why one post a week beats fifty applications.' },
      chart: { eyebrow: 'What happened', title: 'Recruiter messages, by month', unit: '', labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], values: [1, 2, 2, 3, 4, 6], note: 'Sample numbers. Yours come from you.' },
      compare: { eyebrow: 'The difference', title: 'Apply and wait, or apply and share?', left: { label: 'Apply and wait', items: ['Fifty applications', 'One resume, many readers', 'Nobody knows your work'] }, right: { label: 'Apply and share', items: ['Fewer, better applications', 'A post a week about your work', 'Recruiters see how you think'] } },
      cards: { big: '1', bigLabel: 'post a week is enough to start', items: [['star', 'Share a win', 'One thing you fixed this month.'], ['spark', 'Share a lesson', 'What you would do differently.'], ['send', 'Share a question', 'Ask people in the field you want.']] },
      end: { kind: 'cta', title: 'Start this week. Keep it small.', text: 'Follow for the next four tips.', button: 'Follow for more' },
      graphic: { line: 'One post a week beat fifty applications.', sub: 'What changed in my job search.' },
      text: ['One post a week did more for my job search than fifty applications.', 'I stopped only applying and started sharing what I know:', '→ A small win from my last project\n→ A lesson I learned the hard way\n→ A question for people in the field I want', 'Recruiters started writing to me first.', 'What would you post about this week?'],
      poll: { q: 'What helped your last job search most?', options: ['Applications', 'Referrals', 'Posting on LinkedIn', 'Recruiters'], results: [18, 39, 27, 16] }
    }
  };

  var LABELS = {
    cover: 'Photo covers with your words highlighted',
    chart: 'Charts from your numbers',
    compare: 'Side-by-side comparisons',
    cards: 'Icon cards and big numbers',
    cta: 'A clear call to action',
    quote: 'Quotes with the author'
  };

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  // A title is a list of parts; parts in [brackets] get the marker highlight, as the studio's highlight does.
  var title = function (parts) {
    return parts.map(function (p) { return /^\[.*\]$/.test(p) ? '<mark>' + esc(p.slice(1, -1)) + '</mark>' : esc(p); }).join('');
  };
  // Landscape photos are 1080 x 724; the portraits are 1080 x 1340.
  var photoH = function (name) { return /^northfield-/.test(name) ? 724 : 1340; };
  var icon = function (name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.spark) + '</svg>'; };
  var frame = function (i, n, inner, cls, opts) {
    opts = opts || {};
    return '<div class="s ' + cls + '">' + (opts.back || '') +
      '<div class="s-head" aria-hidden="true"><span class="s-avatar">' + PERSON.initials + '</span><span>' + PERSON.name + '</span></div>' +
      '<div class="s-body">' + inner + '</div>' +
      '<div class="s-foot" aria-hidden="true"><span>' + PERSON.site + '</span><span>' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + n).slice(-2) + (i < n - 1 ? ' &rarr;' : '') + '</span></div></div>';
  };

  function chartSvg(c, kind) {
    var max = Math.max.apply(null, c.values) || 1, W = 900, H = 500, n = c.values.length, top = 56, bottom = 52;
    var slot = W / n, ph = H - top - bottom;
    var x = function (i) { return slot * i + slot / 2; };
    var y = function (v) { return top + ph - (v / max) * ph; };
    var last = n - 1, out = '';
    out += '<line class="c-grid" x1="0" x2="' + W + '" y1="' + (top + ph) + '" y2="' + (top + ph) + '"/>';
    if (kind === 'bar') {
      c.values.forEach(function (v, i) {
        var bw = slot * 0.62, h = Math.max(4, (v / max) * ph);
        out += '<rect class="c-bar' + (i === last ? ' is-max' : '') + '" style="--d:' + (i * 70) + 'ms" x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + (top + ph - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="10"/>';
      });
    } else {
      var pts = c.values.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); });
      if (kind === 'area') out += '<path class="c-area" d="M' + x(0).toFixed(1) + ',' + (top + ph) + ' L' + pts.join(' L') + ' L' + x(last).toFixed(1) + ',' + (top + ph) + ' Z"/>';
      out += '<polyline class="c-line" pathLength="1" points="' + pts.join(' ') + '"/>';
      c.values.forEach(function (v, i) { out += '<circle class="c-dot' + (i === last ? ' is-max' : '') + '" style="--d:' + (i * 90) + 'ms" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === last ? 13 : 9) + '"/>'; });
    }
    c.values.forEach(function (v, i) {
      out += '<text class="c-val' + (i === last ? ' is-max' : '') + '" x="' + x(i).toFixed(1) + '" y="' + (y(v) - 18).toFixed(1) + '">' + v + esc(c.unit) + '</text>';
      out += '<text class="c-lab" x="' + x(i).toFixed(1) + '" y="' + (H - 12) + '">' + esc(c.labels[i]) + '</text>';
    });
    var summary = c.title + ': ' + c.labels.map(function (l, i) { return l + ' ' + c.values[i] + c.unit; }).join(', ') + '. Sample numbers.';
    return '<svg class="c-svg c-kind-' + kind + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(summary) + '">' + out + '</svg>';
  }

  function slides(t, state) {
    var s = [], n = 5;
    var photo = (state.img || IMG) + t.photo;
    s.push({ kind: 'cover', html: frame(0, n,
      '<p class="s-eyebrow">' + esc(t.cover.eyebrow) + '</p><p class="s-title">' + title(t.cover.title) + '</p><p class="s-text">' + esc(t.cover.text) + '</p>', 's-cover', {
        back: '<img class="s-photo" src="' + photo + '-540.webp" srcset="' + photo + '-540.webp 540w, ' + photo + '-1080.webp 1080w" sizes="(max-width: 700px) 60vw, 360px" width="1080" height="' + photoH(t.photo) + '" alt="' + esc(t.photoAlt) + '" loading="lazy" decoding="async"><div class="s-scrim" aria-hidden="true"></div>'
      }) });
    var kinds = '<div class="s-chart-kinds" role="group" aria-label="Chart kind">' + ['bar', 'line', 'area'].map(function (k) {
      return '<button type="button" data-chart="' + k + '" aria-pressed="' + (state.chart === k) + '">' + { bar: 'Bars', line: 'Line', area: 'Area' }[k] + '</button>';
    }).join('') + '</div>';
    s.push({ kind: 'chart', extra: kinds, html: frame(1, n,
      '<p class="s-eyebrow">' + esc(t.chart.eyebrow) + '</p><p class="s-heading">' + esc(t.chart.title) + '</p>' + chartSvg(t.chart, state.chart) + '<p class="s-caption">' + esc(t.chart.note) + '</p>', 's-chartslide') });
    var side = function (sd, win) {
      return '<div class="s-side' + (win ? ' is-win' : '') + '"><p class="s-side-label">' + esc(sd.label) + '</p><ul>' + sd.items.map(function (it) {
        return '<li><span class="s-mark" aria-hidden="true">' + (win ? '&#10003;' : '&#10005;') + '</span>' + esc(it) + '</li>';
      }).join('') + '</ul></div>';
    };
    s.push({ kind: 'compare', html: frame(2, n,
      '<p class="s-eyebrow">' + esc(t.compare.eyebrow) + '</p><p class="s-heading">' + esc(t.compare.title) + '</p><div class="s-compare">' + side(t.compare.left, false) + side(t.compare.right, true) + '</div>', 's-compareslide') });
    s.push({ kind: 'cards', html: frame(3, n,
      '<p class="s-stat">' + esc(t.cards.big) + '</p><p class="s-stat-label">' + esc(t.cards.bigLabel) + '</p><div class="s-cards">' + t.cards.items.map(function (c) {
        return '<div class="s-card"><span class="s-icon">' + icon(c[0]) + '</span><div><p class="s-card-title">' + esc(c[1]) + '</p><p class="s-card-text">' + esc(c[2]) + '</p></div></div>';
      }).join('') + '</div>', 's-cardslide') });
    if (t.end.kind === 'quote') {
      s.push({ kind: 'quote', html: frame(4, n, '<blockquote class="s-quote"><p>' + esc(t.end.quote) + '</p><footer>' + esc(t.end.who) + '</footer></blockquote>', 's-quoteslide') });
    } else {
      s.push({ kind: 'cta', html: frame(4, n, '<p class="s-heading s-big">' + esc(t.end.title) + '</p><p class="s-text">' + esc(t.end.text) + '</p><span class="s-cta">' + esc(t.end.button) + ' &rarr;</span>', 's-ctaslide') });
    }
    return s;
  }

  // The visitor's own thought: it becomes the cover and the closing quote. The middle slides show the layouts the
  // assistant would fill from their notes, and say so.
  function ownTopic(text) {
    var words = text.trim().replace(/\s+/g, ' ');
    if (words.length > 110) words = words.slice(0, 110).replace(/\s+\S*$/, '') + '…';
    var w = words.split(' ');
    var cut = Math.max(1, w.length - Math.min(3, Math.ceil(w.length / 3)));
    var base = TOPICS.sales;
    return {
      chip: 'Yours', own: true, photo: 'northfield-review', photoAlt: 'A consultant reviewing printed charts on a wooden table',
      cover: { eyebrow: 'Your thought', title: [w.slice(0, cut).join(' ') + ' ', '[' + w.slice(cut).join(' ') + ']'], text: 'Your words, laid into a real design.' },
      chart: { eyebrow: 'Layout: a chart', title: 'The numbers behind your point', unit: '', labels: base.chart.labels, values: [2, 3, 3, 5, 6, 8], note: 'Sample numbers. The assistant uses the ones you give it.' },
      compare: { eyebrow: 'Layout: a comparison', title: 'The usual way and your way', left: { label: 'The usual way', items: ['What most people do', 'Why it falls short', 'What it costs them'] }, right: { label: 'Your way', items: ['What you do instead', 'Why it works', 'What changes'] } },
      cards: { big: '3', bigLabel: 'ways to act on it', items: [['spark', 'Your first point', 'The assistant writes these from your notes.'], ['target', 'Your second point', 'You edit every word.'], ['check', 'Your third point', 'Nothing posts without your OK.']] },
      end: { kind: 'quote', quote: words, who: 'You' },
      graphic: { line: words, sub: 'Your words, in your brand.' },
      text: [words, 'The assistant turns this into a full post in your voice, from your notes, a link or a document.', '→ You edit every word\n→ You choose the time\n→ Nothing posts without your OK'],
      poll: { q: '“' + words + '” Do you agree?', options: ['Agree', 'Partly agree', 'Disagree', 'Never thought about it'], results: [42, 31, 12, 15] }
    };
  }

  function render(state) {
    var t = state.own ? ownTopic(state.own) : TOPICS[state.topic] || TOPICS.sales;
    var f = state.format;
    if (f === 'graphic') {
      var p = (state.img || IMG) + t.photo;
      return '<div class="bp-graphic s-frame" data-size="' + state.size + '"><div class="s s-cover s-graphic"><img class="s-photo" src="' + p + '-540.webp" srcset="' + p + '-540.webp 540w, ' + p + '-1080.webp 1080w" sizes="(max-width: 700px) 86vw, 460px" width="1080" height="' + photoH(t.photo) + '" alt="' + esc(t.photoAlt) + '" loading="lazy" decoding="async"><div class="s-scrim" aria-hidden="true"></div>' +
        '<div class="s-body"><span class="s-quote-mark" aria-hidden="true">&ldquo;</span><p class="s-title s-graphic-line">' + esc(t.graphic.line) + '</p><p class="s-text">' + esc(t.graphic.sub) + '</p></div>' +
        '<div class="s-foot" aria-hidden="true"><span>' + PERSON.site + '</span><span></span></div></div></div><p class="bp-label">One graphic, in your brand, sized for the feed</p>';
    }
    if (f === 'text') {
      return '<article class="bp-feed"><header><span class="s-avatar" aria-hidden="true">' + PERSON.initials + '</span><span><strong>' + PERSON.name + '</strong><small>Sample post · just now</small></span></header>' +
        t.text.map(function (para) { return '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>'; }).join('') +
        '<footer><span>Like</span><span>Comment</span><span>Repost</span></footer></article><p class="bp-label">A text post in your voice, with line breaks that read well</p>';
    }
    if (f === 'poll') {
      var voted = state.vote != null;
      return '<article class="bp-feed bp-poll"><header><span class="s-avatar" aria-hidden="true">' + PERSON.initials + '</span><span><strong>' + PERSON.name + '</strong><small>Sample poll</small></span></header><p class="bp-poll-q">' + esc(t.poll.q) + '</p><div class="bp-poll-options">' +
        t.poll.options.map(function (o, i) {
          var pct = t.poll.results[i];
          return '<button type="button" data-vote="' + i + '" class="' + (voted ? 'is-voted' : '') + (state.vote === i ? ' is-mine' : '') + '" style="--p:' + (voted ? pct : 0) + '%"' + (voted ? ' aria-pressed="' + (state.vote === i) + '"' : '') + '><span>' + esc(o) + (state.vote === i ? ' <em>Your choice</em>' : '') + '</span>' + (voted ? '<b>' + pct + '%</b>' : '') + '</button>';
        }).join('') + '</div>' +
        (voted ? '<p class="bp-poll-note">Sample results, not real votes. <button type="button" class="reset-vote">Vote again</button></p>' : '<p class="bp-poll-note">Sample poll. No real votes are counted.</p>') +
        '</article><p class="bp-label">A poll that starts a conversation. Pick an answer to see sample results.</p>';
    }
    var list = slides(t, state);
    if (f === 'cover') {
      // One cover slide on its own, for a page's opening (a still picture: no controls, nothing to click).
      return '<div class="s-frame" data-size="' + state.size + '">' + list[0].html.replace(/<(\/?)h3\b/g, '<$1p') + '</div>'; // no heading: it sits above the page's own h2s
    }
    return '<div class="bp-track" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Sample carousel, 5 slides">' + list.map(function (sl, i) {
      return '<div class="bp-slide" role="group" aria-roledescription="slide" aria-label="Slide ' + (i + 1) + ' of 5: ' + LABELS[sl.kind] + '" data-index="' + i + '" style="--i:' + i + '"><div class="s-frame" data-size="' + state.size + '">' + sl.html + '</div>' +
        '<p class="bp-label">' + LABELS[sl.kind] + '</p>' + (sl.extra || '') + '</div>';
    }).join('') + '</div>' +
      '<div class="bp-nav"><button type="button" class="bp-arrow" data-step="-1" aria-label="Previous slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button><div class="bp-dots">' + list.map(function (sl, i) {
        return '<button type="button" data-slide="' + i + '" aria-label="Go to slide ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
      }).join('') + '</div><button type="button" class="bp-arrow" data-step="1" aria-label="Next slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>' +
      (t.own ? '<p class="bp-own-note">Your words are on the cover and the last slide. The slides between show the layouts your assistant fills from your notes.</p>' : '');
  }

  var api = { TOPICS: TOPICS, BRANDS: BRANDS, IMG: IMG, render: render };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.BriopostSample = api;

  // ---- Browser behavior -------------------------------------------------------------------------------------------
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(demo) {
    var out = demo.querySelector('.bp-output');
    if (!out) return;
    var state = {
      topic: demo.getAttribute('data-topic') || 'sales', brand: demo.getAttribute('data-brand') || 'midnight',
      size: demo.getAttribute('data-size') || 'portrait', chart: demo.getAttribute('data-chart') || 'bar',
      format: 'carousel', own: '', vote: null, img: demo.getAttribute('data-img') || IMG
    };
    var current = 0;
    demo.classList.add('is-live');

    function track() { return out.querySelector('.bp-track'); }
    function setPressed(sel, attr, val) {
      demo.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); });
    }
    function draw(chartOnly) {
      // Charts draw themselves once they are on screen (sample.css animates .is-drawn).
      var c = out.querySelector('.c-svg');
      if (!c) return;
      if (reduce) { c.classList.add('is-drawn'); return; }
      if (chartOnly) { c.classList.remove('is-drawn'); void c.getBoundingClientRect(); requestAnimationFrame(function () { c.classList.add('is-drawn'); }); return; }
      if (!('IntersectionObserver' in root)) { c.classList.add('is-drawn'); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { c.classList.add('is-drawn'); io.disconnect(); } }); }, { threshold: 0.5 });
      io.observe(c);
    }
    function paint(keepScroll) {
      var tr = track(), x = tr ? tr.scrollLeft : 0;
      out.innerHTML = render(state);
      demo.setAttribute('data-brand', state.brand);
      demo.setAttribute('data-size', state.size);
      demo.setAttribute('data-format', state.format);
      var nt = track();
      if (nt) {
        if (keepScroll) nt.scrollLeft = x;
        nt.addEventListener('scroll', onScroll, { passive: true });
      }
      target = -1; clearTimeout(settle);
      mark(nt ? inView() : 0);
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (target < 0) mark(inView()); }); });
      draw(false);
    }
    // The dots always show the slide that is actually in view. Arrows, dots and arrow keys move one slide from the one
    // shown (several slides can be on screen at once on wide pages, so the scroll position alone cannot name "the"
    // slide: the last slides can never be centered). Swipes and scrolls update the dots from the scroll position.
    var target = -1, settle = 0;
    function slideList() { var tr = track(); return tr ? Array.prototype.slice.call(tr.querySelectorAll('.bp-slide')) : []; }
    function maxScroll(tr) { return tr.scrollWidth - tr.clientWidth; }
    function nearest() {
      var tr = track(), figs = slideList(); if (!tr || !figs.length) return 0;
      var mid = tr.scrollLeft + tr.clientWidth / 2, best = 0, bestD = 1e9;
      figs.forEach(function (f, i) { var d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
      return best;
    }
    function inView() {
      var tr = track(), figs = slideList(); if (!tr || !figs.length) return 0;
      if (tr.scrollLeft <= 1) return 0;
      if (tr.scrollLeft >= maxScroll(tr) - 1 && maxScroll(tr) > 1) return figs.length - 1;
      return nearest();
    }
    function mark(i) {
      current = i;
      out.querySelectorAll('.bp-dots button').forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      var n = slideList().length, prev = out.querySelector('.bp-arrow[data-step="-1"]'), next = out.querySelector('.bp-arrow[data-step="1"]');
      // The arrows wrap (5 to 1, 1 to 5), so they are never disabled at the ends.
      if (prev) prev.disabled = n < 2;
      if (next) next.disabled = n < 2;
    }
    function onScroll() {
      if (target >= 0) return; // our own scroll is still settling
      mark(inView());
    }
    // Where a slide sits centered; the track cannot go past its ends, so on wide pages the first and last slides
    // cannot be centered and several slides share one stop.
    function stopFor(tr, f) { return Math.max(0, Math.min(maxScroll(tr), f.offsetLeft - (tr.clientWidth - f.offsetWidth) / 2)); }
    function go(i) {
      var tr = track(), figs = slideList(); if (!tr || !figs.length) return;
      i = Math.max(0, Math.min(figs.length - 1, i));
      var want = stopFor(tr, figs[i]);
      target = i; mark(i);
      tr.scrollTo({ left: want, behavior: reduce ? 'auto' : 'smooth' });
      clearTimeout(settle);
      settle = setTimeout(function () {
        var t = track(); target = -1; if (!t) return;
        // The track stopped where the asked-for slide can be centered (or as near as it can get): keep the dot on it.
        mark(Math.abs(t.scrollLeft - want) <= 2 ? i : inView());
      }, reduce ? 50 : 900);
    }

    // On a phone the sample sits above "Shape it": after shaping, bring the new first slide back into view (only in
    // answer to the visitor's own click, and without smooth scrolling when reduced motion is on).
    // Next and Previous (arrows, and the arrow keys without wrapping) move one slide from the one shown. On wide pages
    // several slides are on screen and share a stop, so a step that would leave the track where it is goes on to the
    // next slide that moves it: every press visibly moves the slides. Where every slide shares one stop (one slide on
    // screen, as on phones and the home page), this is the plain one-slide step.
    function step(dir, wrap) {
      var tr = track(), figs = slideList(), len = figs.length; if (!tr || !len) return;
      var from = target >= 0 ? stopFor(tr, figs[target]) : tr.scrollLeft, j = current;
      for (var k = 0; k < len; k++) {
        j += dir;
        if (j < 0 || j >= len) { if (!wrap) return; j = (j + len) % len; }
        if (Math.abs(stopFor(tr, figs[j]) - from) > 2 || len < 2) { go(j); return; }
      }
      go((current + dir + len) % len);
    }

    function showFirst() {
      if (!root.matchMedia || !root.matchMedia('(max-width: 959px)').matches) return;
      var first = out.querySelector('.bp-slide') || out.firstElementChild;
      if (!first) return;
      var r = first.getBoundingClientRect();
      if (r.top >= 64 && r.bottom <= root.innerHeight) return;
      first.scrollIntoView({ block: 'start', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }

    demo.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !demo.contains(b)) return;
      if (b.hasAttribute('data-format')) {
        state.format = b.getAttribute('data-format'); state.vote = null;
        demo.querySelectorAll('[role=tab][data-format]').forEach(function (t) { var on = t === b; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
        if (b.id && out.getAttribute('role') === 'tabpanel') out.setAttribute('aria-labelledby', b.id);
        paint(false);
      } else if (b.hasAttribute('data-topic')) {
        state.topic = b.getAttribute('data-topic'); state.own = ''; state.vote = null; setPressed('[data-topic]', 'data-topic', state.topic); paint(false); current = 0;
      } else if (b.hasAttribute('data-brand')) {
        state.brand = b.getAttribute('data-brand'); setPressed('[data-brand]', 'data-brand', state.brand);
        demo.setAttribute('data-brand', state.brand);
        if (!reduce) { demo.classList.remove('is-sweeping'); void demo.offsetWidth; demo.classList.add('is-sweeping'); }
      } else if (b.hasAttribute('data-size')) {
        state.size = b.getAttribute('data-size'); setPressed('[data-size]', 'data-size', state.size); paint(true);
      } else if (b.hasAttribute('data-chart')) {
        state.chart = b.getAttribute('data-chart'); paint(true); draw(true);
      } else if (b.hasAttribute('data-step')) {
        step(Number(b.getAttribute('data-step')), true);
      } else if (b.hasAttribute('data-slide')) {
        go(Number(b.getAttribute('data-slide')));
      } else if (b.hasAttribute('data-vote')) {
        state.vote = Number(b.getAttribute('data-vote')); paint(false);
      } else if (b.classList.contains('reset-vote')) {
        state.vote = null; paint(false);
      } else if (b.classList.contains('shape-btn')) {
        var ta = demo.querySelector('textarea');
        var v = ta && ta.value.trim();
        if (!v) { ta && ta.focus(); return; }
        state.own = v; state.vote = null; setPressed('[data-topic]', 'data-topic', '__none'); paint(false); current = 0;
        showFirst();
      }
    });
    // Arrow keys on the format tabs (WAI tabs pattern).
    demo.addEventListener('keydown', function (e) {
      var t = e.target.closest('[role=tab][data-format]'); if (!t) return;
      var tabs = Array.prototype.slice.call(demo.querySelectorAll('[role=tab][data-format]')), i = tabs.indexOf(t);
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (n < 0 && e.key !== 'ArrowLeft') return;
      e.preventDefault(); n = (n + tabs.length) % tabs.length; tabs[n].focus(); tabs[n].click();
    });
    // Arrow keys, Home and End on the focused track move one slide from the one shown.
    demo.addEventListener('keydown', function (e) {
      var t = track(); if (!t || e.target !== t) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1, false); return; }
      var n = -1;
      if (e.key === 'Home') n = 0; else if (e.key === 'End') n = slideList().length - 1;
      else return;
      e.preventDefault(); go(Math.max(0, n));
    });
    var ta = demo.querySelector('textarea'), count = demo.querySelector('.thought-count');
    if (ta && count) { var upd = function () { count.textContent = ta.value.length + ' / ' + ta.maxLength; }; ta.addEventListener('input', upd); upd(); }
    var tr0 = track(); if (tr0) tr0.addEventListener('scroll', onScroll, { passive: true });
    mark(tr0 ? inView() : 0);
    setTimeout(function () { if (target < 0) mark(inView()); }, 0);
    draw(false);
  }

  function init() { document.querySelectorAll('.bp-demo').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : this);
