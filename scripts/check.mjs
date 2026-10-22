import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd();
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
for(const file of files(root)){
  if(/\.(html|css|js)$/.test(file)){
    const text=readFileSync(file,'utf8');
    if(/C:[\\/]+Users[\\/]|127\.0\.0\.1|localhost/i.test(text))throw new Error('Private/local text found in '+file);
    const refs=file.endsWith('.html')?[...text.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]):file.endsWith('.css')?[...text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]):[];
    for(const ref of refs){if(/^(?:https?:|data:|#)/.test(ref)||ref==='/')continue;if(!existsSync(resolve(dirname(file),ref)))throw new Error('Missing asset: '+ref+' in '+file);}
    if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  }
}
if(existsSync('index.html')&&!readFileSync('index.html','utf8').includes('Your next post'))throw new Error('Unexpected homepage');
console.log('Website checks passed.');
