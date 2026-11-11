import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd();
const fail=m=>{throw new Error(m)};
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='node_modules'?[]:e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
const read=f=>readFileSync(f,'utf8');

// 1. Every page, stylesheet and script: no private paths, every local reference exists, scripts parse.
for(const file of files(root)){
  if(/\.(html|css|js)$/.test(file)){
    const text=read(file);
    if(/C:[\\/]+Users[\\/]|127\.0\.0\.1|localhost/i.test(text))fail('Private/local text found in '+file);
    let refs=[];
    if(file.endsWith('.html')){
      refs=[...text.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]);
      for(const m of text.matchAll(/srcset="([^"]+)"/g))refs.push(...m[1].split(',').map(s=>s.trim().split(/\s+/)[0]).filter(Boolean));
      // Pages load exactly one outside script tag: the Cloudflare Web Analytics beacon (no cookies). Google Analytics is
      // loaded only by assets/analytics.js, and only once its Measurement ID is filled in (see README).
      // Every other outside stylesheet, script, font or frame fails the check.
      if(!/[\\/]scripts[\\/]/.test(file)&&!text.includes('static.cloudflareinsights.com/beacon.min.js'))fail('Cloudflare Web Analytics beacon missing in '+file);
      for(const m of text.matchAll(/<(?:script|link|iframe|img)\b[^>]*?(?:src|href)="(https?:[^"]+)"/g)){
        const tag=m[0];
        if(/rel="canonical"/.test(tag))continue;
        if(/rel="preconnect"/.test(tag)&&m[1]==='https://app.briopost.com')continue; // the waitlist API the page already calls
        if(m[1]==='https://static.cloudflareinsights.com/beacon.min.js')continue;
        fail('Third-party request '+m[1]+' in '+file);
      }
    }else if(file.endsWith('.css')){
      refs=[...text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]);
      if(/@import|fonts\.googleapis|fonts\.gstatic/.test(text))fail('Outside font or stylesheet in '+file);
    }
    for(const ref of refs){if(/^(?:https?:|data:|mailto:|#)/.test(ref)||ref==='/')continue;const target=ref.startsWith('/')?join(root,ref.split('?')[0]):resolve(dirname(file),ref.split('?')[0]);if(!existsSync(target))fail('Missing asset: '+ref+' in '+file);}
    if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  }
}

// 2. Home page.
const home=read('index.html');
if(!home.includes('id="hero-title"'))fail('Unexpected homepage: hero headline missing');
for(const id of ['how','faq','maker','waitlist','wl-form','wl-name','wl-email','wl-role','wl-website','wl-msg','hw-form','hw-fields','hw-name','hw-email','hw-website','hw-msg','hw-done','hw-done-title','hw-done-text'])if(!home.includes('id="'+id+'"'))fail('Home page is missing #'+id);
if((home.match(/data-api="https:\/\/app\.briopost\.com\/api\/waitlist"/g)||[]).length!==2)fail('Both waitlist forms (hero and #waitlist) must point at https://app.briopost.com/api/waitlist');
// AI assistants: llms.txt exists and the home page announces it; FAQ answers are in the structured data.
if(!existsSync('llms.txt'))fail('Missing llms.txt');
if(!home.includes('href="llms.txt"'))fail('Home page must link llms.txt');
if(!home.includes('"FAQPage"'))fail('Home page is missing FAQPage structured data');
if(!/property="og:image" content="https:\/\/briopost\.com\/assets\/[^"]+"/.test(home))fail('Open Graph image tag missing');
if(/colours|authoris/i.test(home))fail('Use U.S. spelling on the home page');

// 3. The studio and template sections show real screenshots.
for(const id of ['studio','templates']){
  const at=home.indexOf('id="'+id+'"');
  const section=at<0?'':home.slice(at,home.indexOf('</section>',at));
  if(!section.includes('<img '))fail('#'+id+' has no screenshots');
  if(/<section[^>]*id="(?:studio|templates)"[^>]*\shidden/.test(home))fail('#'+id+' is still hidden');
}

// 4. Waitlist pages: present, not indexed, pointed at the live API.
for(const p of ['waitlist/confirm/index.html','waitlist/unsubscribe/index.html']){
  if(!existsSync(p))fail('Missing '+p);
  const t=read(p);
  if(!/<meta name="robots" content="noindex/.test(t))fail(p+' must be noindex');
  if(!t.includes('data-api="https://app.briopost.com/api/waitlist"'))fail(p+' must point at https://app.briopost.com/api/waitlist');
}

// 5. robots.txt and sitemap.xml.
if(!existsSync('robots.txt')||!/Disallow: \/waitlist\//.test(read('robots.txt'))||!/Sitemap: https:\/\/briopost\.com\/sitemap\.xml/.test(read('robots.txt')))fail('robots.txt must disallow /waitlist/ and name the sitemap');
if(!existsSync('sitemap.xml'))fail('Missing sitemap.xml');
const locs=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(!locs.length)fail('sitemap.xml lists no pages');
for(const loc of locs){
  const m=loc.match(/^https:\/\/briopost\.com\/(.*)$/);
  if(!m)fail('Sitemap URL must be absolute https://briopost.com: '+loc);
  if(!existsSync(join(m[1],'index.html')))fail('Sitemap URL has no page: '+loc);
}

// 6. Search engines, link previews and Google Analytics, on every page.
// The four legal pages are generated by docs/legal/build_legal.py in the app repo. Until its template emits the
// analytics line, lang="en-US", the Open Graph / Twitter tags and BreadcrumbList, those gaps are warnings for these
// pages only (listed at the end); everything else about them is checked like any other page.
const GENERATED=new Set(['privacy/index.html','terms/index.html','email-policy/index.html','contact/index.html']);
const warnings=[];
const ANALYTICS_TAG='<script src="/assets/analytics.js" defer></script>';
const SITE='https://briopost.com/';
const rel=f=>f.slice(root.length+1).split('\\').join('/');
const pages=files(root).filter(f=>f.endsWith('.html')&&!/[\\/]scripts[\\/]/.test(f)).map(f=>({file:rel(f),text:read(f)}));
const sitemap=read('sitemap.xml');
const sitemapUrls=new Set(locs);
const meta=(t,attr,name)=>{const m=t.match(new RegExp('<meta\\s+'+attr+'="'+name.replace(/[.:]/g,'\\$&')+'"\\s+content="([^"]*)"'));return m?m[1].trim():'';};
const seenTitles=new Map(),seenDescs=new Map();
if(!existsSync('404.html'))fail('Missing 404.html (GitHub Pages shows it for missing addresses)');
for(const {file,text} of pages){
  const gen=GENERATED.has(file);
  const pending=what=>{if(gen)warnings.push(file+': '+what+' (waiting for the legal-page generator)');else fail(file+': '+what);};
  const noindex=/noindex/i.test(meta(text,'name','robots'));
  const url=SITE+file.replace(/index\.html$/,'');
  // Every page, indexed or not.
  if(!text.includes(ANALYTICS_TAG))pending('missing '+ANALYTICS_TAG);
  if(!/<html lang="en-US">/.test(text))pending('needs <html lang="en-US">');
  if((text.match(/<h1[\s>]/g)||[]).length!==1)fail(file+' must have exactly one <h1>');
  let last=0;
  for(const m of text.matchAll(/<h([1-6])[\s>]/g)){const lvl=+m[1];if(last&&lvl>last+1)fail(file+': heading <h'+lvl+'> skips a level after <h'+last+'>');last=lvl;}
  for(const m of text.matchAll(/<img\b[^>]*>/g)){
    if(!/\salt="/.test(m[0]))fail(file+': image without alt text: '+m[0].slice(0,80));
    if(!/\swidth="\d+"/.test(m[0])||!/\sheight="\d+"/.test(m[0]))fail(file+': image without width and height: '+m[0].slice(0,80));
  }
  if(!meta(text,'name','theme-color'))fail(file+' is missing theme-color');
  for(const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
    try{JSON.parse(m[1]);}catch(e){fail(file+': structured data (JSON-LD) does not parse: '+e.message);}
  }
  if(/\bAndrew\b|\bAvery\b/.test(text))fail(file+': public pages never name the owner; the maker is VocariAI');
  if(/\b(?:colour|authoris|organis|centre|catalogue|licence|behaviour|favourite)/i.test(text))fail(file+': use U.S. spelling');
  if(noindex){
    if(sitemapUrls.has(url))fail(file+' is noindex but listed in sitemap.xml');
    continue;
  }
  if(file==='404.html')fail('404.html must be noindex');
  // Indexed pages.
  const title=((text.match(/<title>([^<]*)<\/title>/)||[])[1]||'').trim();
  const desc=meta(text,'name','description');
  if(!title)fail(file+' has no <title>');
  if(!desc)fail(file+' has no meta description');
  if(seenTitles.has(title))fail(file+' repeats the title of '+seenTitles.get(title));
  if(seenDescs.has(desc))fail(file+' repeats the description of '+seenDescs.get(desc));
  seenTitles.set(title,file);seenDescs.set(desc,file);
  const canonical=(text.match(/<link rel="canonical" href="([^"]+)">/)||[])[1];
  if(canonical!==url)fail(file+': canonical must be '+url+' (found '+canonical+')');
  if(!sitemapUrls.has(url))fail(file+' is indexable but missing from sitemap.xml ('+url+')');
  for(const p of ['og:type','og:title','og:description','og:url','og:image'])if(!meta(text,'property',p))pending('missing '+p);
  const ogUrl=meta(text,'property','og:url');
  if(ogUrl&&ogUrl!==url)fail(file+': og:url must be '+url);
  if(!meta(text,'name','twitter:card'))pending('missing twitter:card');
  if(file!=='index.html'&&!text.includes('"BreadcrumbList"'))pending('missing BreadcrumbList structured data');
}
// sitemap.xml: each page has a valid <lastmod>, not older than the page's own "Last updated" date.
for(const m of sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]*)<\/lastmod>)?\s*<\/url>/g)){
  const loc=m[1],lastmod=m[2]||'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(lastmod))fail('sitemap.xml: '+loc+' needs <lastmod>YYYY-MM-DD</lastmod>');
  const updated=read(join(loc.slice(SITE.length),'index.html')).match(/Last updated ([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if(updated){
    const iso=new Date(updated[1]+' 12:00 UTC').toISOString().slice(0,10);
    if(lastmod<iso)fail('sitemap.xml: lastmod for '+loc+' ('+lastmod+') is older than the page ("Last updated" '+iso+')');
  }
}
// Google Analytics: one file, an empty or well-formed Measurement ID, and no other script loads Google.
const analytics=read('assets/analytics.js');
const gaId=(analytics.match(/const GA_MEASUREMENT_ID = "([^"]*)";/)||[])[1];
if(gaId===undefined)fail('assets/analytics.js must keep the line: const GA_MEASUREMENT_ID = "";');
if(gaId&&!/^G-[A-Z0-9]{4,20}$/.test(gaId))fail('GA_MEASUREMENT_ID must be empty or look like G-XXXXXXXXXX (found '+gaId+')');
for(const f of files(root).filter(f=>f.endsWith('.js')&&!f.endsWith('analytics.js')))if(/googletagmanager|google-analytics/.test(read(f)))fail('Only assets/analytics.js may load Google Analytics: '+rel(f));
// Web app manifest and IndexNow key.
let manifest;
try{manifest=JSON.parse(read('site.webmanifest'));}catch(e){fail('site.webmanifest is missing or does not parse: '+e.message);}
for(const icon of manifest.icons||[])if(!existsSync(join(root,icon.src)))fail('site.webmanifest icon missing: '+icon.src);
const keyFiles=readdirSync(root).filter(f=>/^[0-9a-f]{32}\.txt$/.test(f));
if(keyFiles.length!==1||read(keyFiles[0]).trim()+'.txt'!==keyFiles[0])fail('Expected one IndexNow key file <key>.txt at the site root, containing its own key');

if(warnings.length){
  console.log('Warnings (not failures):');
  for(const w of warnings)console.log('  - '+w);
}
console.log('Website checks passed.');
