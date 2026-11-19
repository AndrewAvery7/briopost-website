/* Free LinkedIn carousel size checker (/free-tools/linkedin-carousel-size-checker/). The visitor picks a PNG, JPG or
   WebP picture or a PDF; this browser reads it on the visitor's device and nothing is uploaded. Pictures are measured
   with createImageBitmap (or an <img> as a fallback). PDFs are read by a small plain-JS reader: it follows the page
   tree from the catalog (/Root -> /Pages -> /Kids) to count pages and read each page's /MediaBox and /Rotate, and it
   opens compressed object streams with the browser's own DecompressionStream. No libraries, no network.
   Tells the analytics file what happened through a page event (briopost:tool); never the file or its name. */
(function () {
  'use strict';
  var root = document.getElementById('checker');
  if (!root) return;
  var input = document.getElementById('sc-file');
  var drop = document.getElementById('sc-drop');
  var out = document.getElementById('sc-result');
  var MAX_BYTES = 100 * 1024 * 1024;
  var lastPreview = null; // the local blob: address of the picture shown, released when the next file is picked

  var SIZES = [
    { key: 'portrait', name: 'portrait', ratioName: '4:5', w: 1080, h: 1350, kind: 'carousel' },
    { key: 'square', name: 'square', ratioName: '1:1', w: 1080, h: 1080, kind: 'carousel' },
    { key: 'story', name: 'story', ratioName: '9:16', w: 1080, h: 1920, kind: 'carousel' },
    { key: 'wide', name: 'wide graphic', ratioName: '16:9', w: 1920, h: 1080, kind: 'graphic' },
    { key: 'banner', name: 'profile banner', ratioName: '4:1', w: 1584, h: 396, kind: 'graphic' }
  ];

  function tell(detail) {
    detail.tool = 'size_checker';
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: detail })); } catch (e) { /* never break the tool */ }
  }
  var fmt = function (n) { return Math.round(n * 100) / 100 === Math.round(n) ? String(Math.round(n)) : (Math.round(n * 100) / 100).toString(); };
  var num = function (n) { return Math.round(n).toLocaleString('en-US'); };
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratioText(w, h) {
    var W = Math.round(w), H = Math.round(h);
    if (W === w && H === h && W > 0 && H > 0) {
      var g = gcd(W, H), a = W / g, b = H / g;
      if (a <= 32 && b <= 32) return a + ':' + b;
    }
    return (w / h).toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + ':1';
  }
  function compare(w, h) {
    var r = w / h, best = null, bestD = Infinity;
    SIZES.forEach(function (s) {
      var d = Math.abs(Math.log(r / (s.w / s.h)));
      if (d < bestD) { bestD = d; best = s; }
    });
    return { size: best, same: bestD < 0.01 };
  }
  function cropTo(w, h, s) {
    var t = s.w / s.h;
    return w / h > t ? [Math.round(h * t), h] : [w, Math.round(w / t)];
  }
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  // ---- Showing results --------------------------------------------------------------------------------------------
  function showError(title, text, reason) {
    out.innerHTML = '';
    out.setAttribute('data-state', 'error');
    var h = el('h2', 'sc-title', title); h.tabIndex = -1;
    out.appendChild(h);
    out.appendChild(el('p', null, text));
    h.focus();
    tell({ action: 'error', reason: reason });
  }

  function verdict(w, h, isPdf, isImageExact) {
    var c = compare(w, h), s = c.size, carousels = SIZES.filter(function (x) { return x.kind === 'carousel'; });
    var unit = isPdf ? '' : ' pixels';
    var lines = [], state = 'warn', match = 'none';
    if (c.same && s.kind === 'carousel') {
      match = s.key;
      if (isImageExact) {
        state = 'ok';
        lines.push('This matches the ' + s.name + ' ' + s.ratioName + ' carousel size Briopost makes, ' + s.w + '\u00a0\u00d7\u00a0' + s.h + ' pixels, exactly.');
      } else if (isPdf) {
        state = 'ok';
        lines.push('The page has the same ' + s.ratioName + ' shape as the ' + s.name + ' carousels Briopost makes (' + s.w + '\u00a0\u00d7\u00a0' + s.h + ' pixels).');
        lines.push('PDF pages are measured in points, not pixels, so the shape is what to compare.');
      } else {
        state = 'ok';
        lines.push('Same ' + s.ratioName + ' shape as the ' + s.name + ' carousels Briopost makes, at a different size.');
        lines.push(w < s.w
          ? 'It is ' + num(w) + ' pixels wide. Briopost exports this shape at ' + s.w + '\u00a0\u00d7\u00a0' + s.h + '. Smaller pictures can look soft on large screens, so use a bigger copy if you have one.'
          : 'It is larger than the ' + s.w + '\u00a0\u00d7\u00a0' + s.h + ' Briopost exports, which is fine: the shape is right.');
      }
    } else if (c.same) {
      match = s.key;
      lines.push('This is the shape of a ' + s.name + ' (' + s.ratioName + '). Briopost makes graphics at ' + s.w + '\u00a0\u00d7\u00a0' + s.h + ', but its carousels are portrait 4:5, square 1:1 or story 9:16.');
      var near = compareTo(w, h, carousels);
      var cr = cropTo(w, h, near);
      lines.push('For a carousel, the closest is ' + near.name + ' ' + near.ratioName + '. Cropping to ' + num(cr[0]) + '\u00a0\u00d7\u00a0' + num(cr[1]) + unit + ' gives that shape.');
    } else {
      var n2 = compareTo(w, h, carousels);
      var c2 = cropTo(w, h, n2);
      lines.push('This does not match the carousel sizes Briopost makes: portrait 4:5 (1080\u00a0\u00d7\u00a01350), square 1:1 (1080\u00a0\u00d7\u00a01080) or story 9:16 (1080\u00a0\u00d7\u00a01920).');
      lines.push('The closest is ' + n2.name + ' ' + n2.ratioName + '. ' + (isPdf
        ? 'Export the pages again at that shape, or crop them to ' + fmt(c2[0]) + '\u00a0\u00d7\u00a0' + fmt(c2[1]) + ' points.'
        : 'Crop it to ' + num(c2[0]) + '\u00a0\u00d7\u00a0' + num(c2[1]) + ' pixels, or resize it to ' + n2.w + '\u00a0\u00d7\u00a0' + n2.h + ', to get that shape.'));
    }
    return { lines: lines, state: state, match: match };
  }
  function compareTo(w, h, list) {
    var r = w / h, best = list[0], bestD = Infinity;
    list.forEach(function (s) { var d = Math.abs(Math.log(r / (s.w / s.h))); if (d < bestD) { bestD = d; best = s; } });
    return best;
  }

  function showResult(o) {
    out.innerHTML = '';
    var v = verdict(o.w, o.h, o.isPdf, !o.isPdf && SIZES.some(function (s) { return s.kind === 'carousel' && s.w === o.w && s.h === o.h; }));
    out.setAttribute('data-state', v.state);
    var h = el('h2', 'sc-title', v.state === 'ok' ? 'This fits.' : 'This needs a change.'); h.tabIndex = -1;
    out.appendChild(h);
    var dl = el('dl', 'sc-facts');
    var add = function (k, val) { var d = el('div'); d.appendChild(el('dt', null, k)); d.appendChild(el('dd', null, val)); dl.appendChild(d); };
    add('File', o.kindLabel);
    if (o.isPdf) {
      add('Pages', num(o.pages));
      add(o.pages > 1 ? 'First page' : 'Page size', fmt(o.w) + '\u00a0\u00d7\u00a0' + fmt(o.h) + ' points');
    } else {
      add('Size', num(o.w) + '\u00a0\u00d7\u00a0' + num(o.h) + ' pixels');
    }
    add('Shape', ratioText(o.w, o.h) + (o.w > o.h ? ' (wider than tall)' : o.w < o.h ? ' (taller than wide)' : ' (square)'));
    out.appendChild(dl);
    v.lines.forEach(function (t) { out.appendChild(el('p', null, t)); });
    if (o.isPdf && o.pages > 1) {
      out.appendChild(el('p', 'sc-aside', o.mixed
        ? 'Not every page is the same size. Carousels look best when every page shares one size.'
        : 'All ' + num(o.pages) + ' pages are the same size.'));
    }
    if (o.preview) {
      var fig = el('figure', 'sc-preview');
      var img = new Image();
      img.src = o.preview; img.alt = 'Preview of the picture you chose'; img.width = o.w; img.height = o.h; img.decoding = 'async';
      fig.appendChild(img);
      fig.appendChild(el('figcaption', null, 'Shown on this page only. It never leaves your device.'));
      out.appendChild(fig);
    }
    h.focus();
    tell({ action: 'checked', kind: o.isPdf ? 'pdf' : 'image', match: v.match, pages: o.isPdf ? (o.pages > 1 ? 'many' : 'one') : '(none)' });
  }

  // ---- Reading files ----------------------------------------------------------------------------------------------
  function sniff(bytes) {
    var s = String.fromCharCode.apply(null, bytes.slice(0, 16));
    if (bytes[0] === 0x89 && s.slice(1, 4) === 'PNG') return 'png';
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpg';
    if (s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP') return 'webp';
    if (s.indexOf('%PDF-') >= 0) return 'pdf';
    return '';
  }
  function measureImage(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).then(function (bmp) {
        var r = { w: bmp.width, h: bmp.height };
        if (bmp.close) bmp.close();
        return r;
      }, function () { return measureWithImg(file); });
    }
    return measureWithImg(file);
  }
  function measureWithImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  // A small PDF reader: just enough to count pages and read their sizes.
  function latin1(bytes) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return s;
  }
  function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('no-inflate'));
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Response(stream).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function streamBytes(bytes, text, objStart) {
    var at = text.indexOf('stream', objStart);
    if (at < 0) return null;
    var s = at + 6;
    if (text.charAt(s) === '\r') s++;
    if (text.charAt(s) === '\n') s++;
    var e = text.indexOf('endstream', s);
    if (e < 0) return null;
    while (e > s && (text.charAt(e - 1) === '\n' || text.charAt(e - 1) === '\r')) e--;
    return bytes.subarray(s, e);
  }
  function readPdf(bytes) {
    var text = latin1(bytes);
    var objs = {}, re = /(\d+)\s+(\d+)\s+obj\b/g, m, streams = [];
    while ((m = re.exec(text))) {
      var start = m.index + m[0].length;
      var endObj = text.indexOf('endobj', start), endDict = text.indexOf('stream', start);
      var end = endObj < 0 ? text.length : endObj;
      if (endDict >= 0 && endDict < end) end = endDict;
      var body = text.slice(start, end);
      objs[m[1]] = body;
      if (/\/Type\s*\/ObjStm\b/.test(body)) streams.push({ dict: body, at: m.index });
    }
    // Objects packed in compressed object streams (common in PDFs saved by newer tools).
    var jobs = streams.map(function (st) {
      var raw = streamBytes(bytes, text, st.at);
      if (!raw) return Promise.resolve();
      var filtered = /\/Filter\s*\/FlateDecode\b|\/Filter\s*\[\s*\/FlateDecode\s*\]/.test(st.dict);
      if (/\/Filter/.test(st.dict) && !filtered) return Promise.resolve();
      return (filtered ? inflate(raw) : Promise.resolve(raw)).then(function (data) {
        var t = latin1(data);
        var n = +((st.dict.match(/\/N\s+(\d+)/) || [])[1] || 0), first = +((st.dict.match(/\/First\s+(\d+)/) || [])[1] || 0);
        var head = t.slice(0, first).trim().split(/\s+/).map(Number);
        for (var i = 0; i < n && i * 2 + 1 < head.length; i++) {
          var num = String(head[i * 2]), off = first + head[i * 2 + 1];
          var next = i + 1 < n && i * 2 + 3 < head.length ? first + head[i * 2 + 3] : t.length;
          if (!(num in objs)) objs[num] = t.slice(off, next);
        }
      }, function () { /* unreadable stream: carry on with what we have */ });
    });
    return Promise.all(jobs).then(function () { return pageTree(text, objs); });
  }
  function ref(dict, key) {
    var m = dict.match(new RegExp('/' + key + '\\s+(\\d+)\\s+\\d+\\s+R'));
    return m ? m[1] : null;
  }
  function box(dict, objs) {
    var m = dict.match(/\/MediaBox\s*\[([^\]]*)\]/);
    var nums = m ? m[1] : null;
    if (!nums) {
      var r = ref(dict, 'MediaBox');
      var arr = r && objs[r] && objs[r].match(/\[([^\]]*)\]/);
      nums = arr ? arr[1] : null;
    }
    if (!nums) return null;
    var v = nums.trim().split(/\s+/).map(Number);
    return v.length === 4 && v.every(isFinite) ? v : null;
  }
  function pageTree(text, objs) {
    var roots = text.match(/\/Root\s+(\d+)\s+\d+\s+R/g) || [];
    var rootId = roots.length ? roots[roots.length - 1].match(/(\d+)\s+\d+\s+R/)[1] : null;
    var pages = [], seen = {};
    function walk(id, mb, rot, depth) {
      if (!id || seen[id] || depth > 64 || pages.length > 20000) return;
      seen[id] = true;
      var d = objs[id]; if (!d) return;
      var own = box(d, objs); if (own) mb = own;
      var rm = d.match(/\/Rotate\s+(-?\d+)/); if (rm) rot = +rm[1];
      var kids = d.match(/\/Kids\s*\[([^\]]*)\]/);
      if (!kids) { var kr = ref(d, 'Kids'); if (kr && objs[kr]) kids = objs[kr].match(/\[([^\]]*)\]/); }
      if (kids && !/\/Type\s*\/Page(?![A-Za-z])/.test(d)) {
        var ids = kids[1].match(/(\d+)\s+\d+\s+R/g) || [];
        ids.forEach(function (k) { walk(k.split(/\s+/)[0], mb, rot, depth + 1); });
      } else {
        pages.push({ mb: mb, rot: rot });
      }
    }
    if (rootId && objs[rootId]) walk(ref(objs[rootId], 'Pages'), null, 0, 0);
    if (!pages.length) {
      // Fallback: count page objects directly.
      Object.keys(objs).forEach(function (k) {
        if (/\/Type\s*\/Page(?![A-Za-z])/.test(objs[k])) pages.push({ mb: box(objs[k], objs), rot: +((objs[k].match(/\/Rotate\s+(-?\d+)/) || [])[1] || 0) });
      });
    }
    var sizes = pages.map(function (p) {
      if (!p.mb) return null;
      var w = Math.abs(p.mb[2] - p.mb[0]), h = Math.abs(p.mb[3] - p.mb[1]);
      return ((p.rot % 180) + 180) % 180 === 90 ? [h, w] : [w, h];
    });
    return { count: pages.length, sizes: sizes, encrypted: /\/Encrypt\s/.test(text) };
  }

  function handle(file) {
    if (!file) return;
    out.hidden = false;
    out.removeAttribute('data-state');
    out.innerHTML = '<p class="sc-wait">Reading the file on your device…</p>';
    if (file.size === 0) { showError('This file is empty.', 'It has no content to read. Pick the file again, or export it once more.', 'empty'); return; }
    if (file.size > MAX_BYTES) { showError('This file is too big for this checker.', 'It reads files up to 100 MB. Pick a smaller file, or check one page exported as a picture.', 'too_big'); return; }
    file.slice(0, 1024).arrayBuffer().then(function (headBuf) {
      var kind = sniff(new Uint8Array(headBuf));
      if (!kind) {
        var ext = (file.name.match(/\.([A-Za-z0-9]{1,6})$/) || [])[1];
        showError('This checker can’t read that kind of file.', (ext ? 'It looks like a .' + ext.toLowerCase() + ' file. ' : '') + 'Pick a PNG, JPG or WebP picture, or a PDF.', 'unsupported');
        return;
      }
      if (kind === 'pdf') {
        return file.arrayBuffer().then(function (buf) { return readPdf(new Uint8Array(buf)); }).then(function (r) {
          var first = r.sizes.filter(Boolean)[0];
          if (!r.count || !first) {
            showError('This PDF couldn’t be read.', r.encrypted
              ? 'It seems to be password-protected or encrypted. Save an unlocked copy and try again.'
              : 'Its pages are stored in a way this checker doesn’t understand. Try exporting the PDF again, or check one page saved as a picture.', 'pdf_unreadable');
            return;
          }
          var mixed = r.sizes.some(function (s) { return !s || Math.abs(s[0] - first[0]) > 0.5 || Math.abs(s[1] - first[1]) > 0.5; });
          showResult({ isPdf: true, kindLabel: 'PDF', pages: r.count, w: first[0], h: first[1], mixed: mixed });
        });
      }
      return measureImage(file).then(function (d) {
        if (!d.w || !d.h) throw new Error('image');
        var url = null;
        if (lastPreview) { try { URL.revokeObjectURL(lastPreview); } catch (e) { /* ignore */ } }
        try { url = URL.createObjectURL(file); } catch (e) { url = null; }
        lastPreview = url;
        showResult({ isPdf: false, kindLabel: kind.toUpperCase() + ' picture', w: d.w, h: d.h, preview: url });
      });
    }).catch(function () {
      showError('This file couldn’t be read.', 'It may be damaged, or your browser can’t open this kind of picture. Try saving it again as PNG or JPG.', 'unreadable');
    });
  }

  root.classList.add('is-live');
  input.addEventListener('change', function () { handle(input.files && input.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handle(f);
  });
})();
