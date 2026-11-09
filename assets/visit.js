/* Briopost visit counter: one anonymous count per page view, sent to Briopost's own server.
   Sends only the page path, the referring site's host name and an optional ?ref= tag.
   No cookies, no storage, no identifiers. Counts only on the live site. */
(function () {
  try {
    var host = location.hostname;
    if (host !== 'briopost.com' && host !== 'www.briopost.com') return;
    var ref = '';
    try {
      if (document.referrer) {
        var h = new URL(document.referrer).hostname;
        if (h && h !== host) ref = h;
      }
    } catch (e) { /* ignore a bad referrer */ }
    var source = (new URLSearchParams(location.search).get('ref') || '').replace(/[^\w.-]/g, '').slice(0, 60);
    var body = JSON.stringify({ path: location.pathname.slice(0, 120), ref: ref.slice(0, 100), source: source });
    var url = 'https://app.briopost.com/api/waitlist/visit';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else if (window.fetch) {
      fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'cors', headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    }
  } catch (e) { /* counting must never break the page */ }
})();
