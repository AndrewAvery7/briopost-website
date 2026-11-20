// Runs assets/analytics.js and assets/waitlist.js in an isolated Node VM with a fake page and checks that private
// query fields never reach Google Analytics, and that the beta tester invite code leaves the address bar.
// Run by scripts/check.mjs; exits 1 on a failure. Nothing here makes a network request.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
// While the Measurement ID is empty the file does nothing; test it as if one were set.
const analytics = readFileSync(join(root, 'assets', 'analytics.js'), 'utf8').replace('const GA_MEASUREMENT_ID = "";', 'const GA_MEASUREMENT_ID = "G-TEST1234";');
const waitlist = readFileSync(join(root, 'assets', 'waitlist.js'), 'utf8');
const INVITE = 'qa-invite-placeholder-123';
const TOKEN = 'qa-token-placeholder-456';
const EMAIL = 'someone@example.com';
const problems = [];
const expect = (ok, what) => { if (!ok) problems.push(what); };

function runAnalytics(page, referrer = '') {
  const appended = [];
  const window = { addEventListener() {}, removeEventListener() {}, requestIdleCallback: fn => fn() };
  const document = {
    referrer,
    readyState: 'complete',
    createElement: () => ({}),
    head: { appendChild: s => appended.push(s.src) },
    addEventListener() {},
    body: { hasAttribute: () => false },
  };
  const ctx = vm.createContext({ URL, URLSearchParams, location: new URL(page), document, window, navigator: {} });
  vm.runInContext(analytics, ctx, { timeout: 1500, filename: 'analytics.js' });
  return { dataLayer: (window.dataLayer || []).map(a => Array.from(a)), appended };
}
function addresses(dataLayer) {
  const out = [];
  for (const entry of dataLayer) {
    const obj = entry[0] === 'set' ? entry[1] : entry[0] === 'config' ? entry[2] : null;
    if (obj) out.push({ command: entry[0], page_location: obj.page_location, page_referrer: obj.page_referrer });
  }
  return out;
}

// 1. A beta tester link with an invite, a token, an email and an unknown field.
{
  const page = 'https://briopost.com/?ref=beta-testers&invite=' + INVITE + '&token=' + TOKEN + '&email=' + encodeURIComponent(EMAIL) + '&foo=bar#waitlist';
  const ref = 'https://briopost.com/how-to-make-a-linkedin-carousel/?invite=' + INVITE + '&utm_source=x';
  const { dataLayer, appended } = runAnalytics(page, ref);
  const all = JSON.stringify(dataLayer);
  const list = addresses(dataLayer);
  expect(appended.length === 1, 'tracker script not added');
  expect(list.some(a => a.command === 'set') && list.some(a => a.command === 'config'), 'page_location must be set with both gtag set and config');
  for (const a of list) {
    expect(typeof a.page_location === 'string' && a.page_location, a.command + ': page_location is not set explicitly');
    const u = new URL(a.page_location);
    for (const k of ['invite', 'token', 'email', 'foo']) expect(!u.searchParams.has(k), a.command + ': page_location keeps ' + k);
    expect(!u.hash, a.command + ': page_location keeps the #fragment');
    expect(u.searchParams.get('ref') === 'beta-testers', a.command + ': page_location lost ref');
    expect(u.searchParams.get('utm_source') === 'beta-testers' && u.searchParams.get('utm_medium') === 'referral', a.command + ': ?ref= is not counted as the source');
    expect(a.page_referrer && !new URL(a.page_referrer).searchParams.has('invite'), a.command + ': page_referrer missing or keeps invite');
  }
  for (const secret of [INVITE, TOKEN, EMAIL, encodeURIComponent(EMAIL), 'invite', 'token']) expect(!all.includes(secret), 'Google Analytics data contains ' + secret);
}

// 2. Campaign links keep every approved attribution field.
{
  const fields = { utm_source: 'news', utm_medium: 'email', utm_campaign: 'launch', utm_term: 'carousel', utm_content: 'top', utm_id: '7', gclid: 'g1', gbraid: 'g2', wbraid: 'g3', ref: 'friend' };
  const page = 'https://briopost.com/linkedin-carousel-maker/?' + new URLSearchParams(fields) + '&invite=' + INVITE + '&token=' + TOKEN;
  const { dataLayer } = runAnalytics(page);
  for (const a of addresses(dataLayer)) {
    const u = new URL(a.page_location);
    for (const [k, v] of Object.entries(fields)) expect(u.searchParams.get(k) === v, a.command + ': lost ' + k);
    expect(!u.searchParams.has('invite') && !u.searchParams.has('token'), a.command + ': private field kept with utm tags');
    expect(a.page_referrer === undefined, a.command + ': page_referrer set without a referrer');
  }
  expect(!JSON.stringify(dataLayer).includes(INVITE), 'invite leaks with utm tags');
}

// 3. waitlist.js takes the invite out of the address bar, keeps it for a refresh, and only on a tester link.
function runWaitlist(page, storage) {
  const replaced = [];
  const loc = new URL(page);
  const history = { state: null, replaceState(_s, _t, url) { replaced.push(url); const n = new URL(url, loc.href); loc.search = n.search; loc.hash = n.hash; } };
  const sessionStorage = { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: k => { delete storage[k]; } };
  const document = { getElementById: () => null, querySelector: () => null, dispatchEvent() {} };
  const fetch = () => { throw new Error('waitlist.js must not call the network without a form'); };
  const ctx = vm.createContext({ URL, URLSearchParams, location: loc, document, window: { history }, history, sessionStorage, fetch, setTimeout, clearTimeout });
  vm.runInContext(waitlist, ctx, { timeout: 1500, filename: 'waitlist.js' });
  return { replaced, href: loc.href };
}
{
  const storage = {};
  const first = runWaitlist('https://briopost.com/?ref=beta-testers&invite=' + INVITE + '#waitlist', storage);
  expect(first.replaced.length === 1 && !first.href.includes(INVITE), 'waitlist.js leaves the invite in the address bar');
  expect(first.href === 'https://briopost.com/?ref=beta-testers#waitlist', 'waitlist.js changed more than the invite: ' + first.href);
  expect(storage['bp-invite'] === INVITE, 'waitlist.js did not keep the invite for a refresh');
  const again = runWaitlist(first.href, storage);
  expect(again.replaced.length === 0, 'waitlist.js rewrote an address without an invite');
}

if (problems.length) {
  console.error('Analytics privacy test failed:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Analytics privacy test passed (invite, token, email and unknown fields never reach Google Analytics).');
