// Tells search engines that use IndexNow (Bing, Yandex, Seznam, Naver and others) that the pages in sitemap.xml changed.
// Run by .github/workflows/indexnow.yml after a push to main. The key file (<key>.txt at the site root) is public by design.
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'briopost.com';
const keyFiles = readdirSync('.').filter(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) throw new Error('Expected exactly one IndexNow key file (<32 hex characters>.txt) at the site root, found ' + keyFiles.length);
const key = readFileSync(keyFiles[0], 'utf8').trim();
if (key + '.txt' !== keyFiles[0]) throw new Error('The IndexNow key file must contain its own name (without .txt)');

const urlList = [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (!urlList.length) throw new Error('sitemap.xml lists no pages');

const body = { host: HOST, key, keyLocation: 'https://' + HOST + '/' + key + '.txt', urlList };
if (process.argv.includes('--dry-run')) { console.log(JSON.stringify(body, null, 2)); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});
const text = await res.text().catch(() => '');
console.log('IndexNow answered ' + res.status + ' for ' + urlList.length + ' pages. ' + text.slice(0, 300));
// 200 = received, 202 = received and the key is still being checked. Anything else fails the run so it shows up.
if (res.status !== 200 && res.status !== 202) process.exit(1);
