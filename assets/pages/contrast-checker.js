/* Free brand color contrast checker (on /linkedin-brand-kit/). The visitor picks a text color and a background color;
   this page works out the contrast with the WCAG 2.x formula and says whether normal text (4.5 to 1) and big type
   (3 to 1) pass, the same levels Briopost's readability guard uses. When normal text fails, it offers the closest
   shade of the text color that passes. Runs only in the browser: nothing is sent or stored.
   Tells the analytics file which control was used through a page event (briopost:tool); never the colors. */
(function () {
  'use strict';
  var root = document.getElementById('contrast');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var fgPick = $('cc-fg'), fgHex = $('cc-fg-hex'), bgPick = $('cc-bg'), bgHex = $('cc-bg-hex');
  var slide = $('cc-slide'), ratioOut = $('cc-ratio'), normalOut = $('cc-normal'), largeOut = $('cc-large');
  var fix = $('cc-fix'), fixText = $('cc-fix-text'), fixUse = $('cc-fix-use'), status = $('cc-status');
  var NORMAL = 4.5, LARGE = 3;
  var colors = { fg: '#121433', bg: '#FBFAF7' };
  var suggestion = null;

  function tell(action) {
    try { document.dispatchEvent(new CustomEvent('briopost:tool', { detail: { tool: 'contrast_checker', action: action } })); } catch (e) { /* never break the tool */ }
  }
  function say(msg) { status.textContent = ''; window.setTimeout(function () { status.textContent = msg; }, 30); }

  // ---- Color math (WCAG 2.x relative luminance and contrast ratio) ------------------------------------------------
  function parseHex(s) {
    var m = String(s || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(m)) m = m.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(m)) return null;
    return '#' + m.toUpperCase();
  }
  function rgb(hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }); }
  function lum(hex) {
    var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // Shown rounded DOWN to two places, so a ratio just under a level never shows as passing.
  function show(r) { return (Math.floor(r * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' to 1'; }

  function toHsl(hex) {
    var c = rgb(hex).map(function (v) { return v / 255; });
    var max = Math.max.apply(null, c), min = Math.min.apply(null, c), l = (max + min) / 2, h = 0, s = 0, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === c[0] ? (c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0) : max === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    var r, g, b;
    if (!s) { r = g = b = l; } else { var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v * 255).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  // The closest shade of the text color (same hue and saturation) that reaches 4.5 to 1: try darker and lighter
  // shades and keep the passing one nearest the original lightness.
  function closestPassing(fg, bg) {
    var hsl = toHsl(fg), best = null;
    for (var step = 1; step <= 1000 && !best; step++) {
      [-1, 1].forEach(function (dir) {
        if (best) return;
        var l = hsl[2] + dir * step / 1000;
        if (l < 0 || l > 1) return;
        var c = fromHsl(hsl[0], hsl[1], l);
        if (ratio(c, bg) >= NORMAL) best = c;
      });
    }
    if (!best) best = ratio('#000000', bg) >= ratio('#FFFFFF', bg) ? '#000000' : '#FFFFFF';
    return ratio(best, bg) >= NORMAL ? best : null;
  }

  // ---- Showing the result -----------------------------------------------------------------------------------------
  function render() {
    var r = ratio(colors.fg, colors.bg);
    slide.style.setProperty('color', colors.fg);
    slide.style.setProperty('background-color', colors.bg);
    ratioOut.textContent = 'Contrast: ' + show(r);
    var line = function (node, label, need) {
      var ok = r >= need;
      node.className = ok ? 'is-pass' : 'is-fail';
      node.textContent = label + ': ' + (ok ? 'passes' : 'fails') + ' (needs ' + need + ' to 1)';
    };
    line(normalOut, 'Normal text', NORMAL);
    line(largeOut, 'Big type', LARGE);
    suggestion = r < NORMAL ? closestPassing(colors.fg, colors.bg) : null;
    fix.hidden = !suggestion;
    if (suggestion) fixText.textContent = 'Closest text color that passes for normal text: ' + suggestion + ' (' + show(ratio(suggestion, colors.bg)) + ').';
    root.setAttribute('data-result', r >= NORMAL ? 'pass' : r >= LARGE ? 'large-only' : 'fail');
  }
  function setColor(which, hex, from) {
    colors[which] = hex;
    var pick = which === 'fg' ? fgPick : bgPick, text = which === 'fg' ? fgHex : bgHex;
    if (from !== 'pick') pick.value = hex.toLowerCase();
    if (from !== 'text') text.value = hex;
    text.removeAttribute('aria-invalid');
    render();
  }
  function wireHex(which, text) {
    text.addEventListener('input', function () {
      var hex = parseHex(text.value);
      if (hex) setColor(which, hex, 'text');
      else if (text.value.replace(/^#/, '').length >= 6) { text.setAttribute('aria-invalid', 'true'); say('That isn’t a color code. Type six letters or digits, like #1F2A44.'); }
    });
    text.addEventListener('blur', function () {
      if (!parseHex(text.value)) { text.value = colors[which]; text.removeAttribute('aria-invalid'); }
      else text.value = parseHex(text.value);
    });
  }
  fgPick.addEventListener('input', function () { setColor('fg', parseHex(fgPick.value), 'pick'); });
  bgPick.addEventListener('input', function () { setColor('bg', parseHex(bgPick.value), 'pick'); });
  wireHex('fg', fgHex);
  wireHex('bg', bgHex);
  $('cc-swap').addEventListener('click', function () {
    var a = colors.fg; setColor('fg', colors.bg); setColor('bg', a);
    say('Colors swapped. ' + ratioOut.textContent + '.');
    tell('swap');
  });
  $('cc-example').addEventListener('click', function () {
    setColor('fg', '#FFFFFF'); setColor('bg', '#FF5B2E');
    say('Example added: white text on orange. ' + ratioOut.textContent + '.');
    tell('example');
  });
  fixUse.addEventListener('click', function () {
    if (!suggestion) return;
    setColor('fg', suggestion);
    say('Text color changed to ' + colors.fg + '. ' + ratioOut.textContent + '.');
    fgHex.focus();
    tell('suggest');
  });
  root.classList.add('is-live');
  setColor('fg', parseHex(fgHex.value) || colors.fg);
  setColor('bg', parseHex(bgHex.value) || colors.bg);
})();
