/* Beta tester guide: the "Five things worth trying" checklist. Ticks are kept in this browser only (localStorage),
   never sent anywhere. If storage is blocked, the list still works for this visit. */
(function () {
  var list = document.getElementById('try-list');
  if (!list) return;
  var boxes = [].slice.call(list.querySelectorAll('input[type=checkbox]'));
  var out = document.getElementById('try-progress'), bar = document.getElementById('try-bar');
  var KEY = 'bp-beta-try';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  var update = function () {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    out.textContent = done === boxes.length ? 'All 5 done. Thank you. Tell us how it went.' : done + ' of ' + boxes.length + ' done';
    if (bar) bar.style.width = (done / boxes.length * 100) + '%';
  };
  boxes.forEach(function (b) {
    b.checked = !!saved[b.dataset.key];
    b.addEventListener('change', function () {
      saved[b.dataset.key] = b.checked;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked: fine for this visit */ }
      update();
    });
  });
  update();
})();
