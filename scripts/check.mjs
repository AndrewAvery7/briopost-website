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
      // The privacy policy allows exactly one outside request: the Cloudflare Web Analytics beacon (no cookies).
      // Every other outside stylesheet, script, font or frame fails the check.
      if(!/[\\/]scripts[\\/]/.test(file)&&!text.includes('static.cloudflareinsights.com/beacon.min.js'))fail('Cloudflare Web Analytics beacon missing in '+file);
      for(const m of text.matchAll(/<(?:script|link|iframe|img)\b[^>]*?(?:src|href)="(https?:[^"]+)"/g)){
        const tag=m[0];
        if(/rel="canonical"/.test(tag))continue;
        if(m[1]==='https://static.cloudflareinsights.com/beacon.min.js')continue;
        fail('Third-party request '+m[1]+' in '+file);
      }
    }else if(file.endsWith('.css')){
      refs=[...text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]);
      if(/@import|fonts\.googleapis|fonts\.gstatic/.test(text))fail('Outside font or stylesheet in '+file);
    }
    for(const ref of refs){if(/^(?:https?:|data:|mailto:|#)/.test(ref)||ref==='/')continue;if(!existsSync(resolve(dirname(file),ref.split('?')[0])))fail('Missing asset: '+ref+' in '+file);}
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

console.log('Website checks passed.');
