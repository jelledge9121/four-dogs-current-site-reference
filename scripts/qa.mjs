import fs from 'node:fs';
import path from 'node:path';
import { localSeoPages } from '../src/data/localSeoPages.ts';
const root='dist';
if(!fs.existsSync(root))throw new Error('dist is missing; run the production build first.');
const files=[];
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).forEach(e=>e.isDirectory()?walk(path.join(dir,e.name)):files.push(path.join(dir,e.name)));
walk(root);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const routes=new Set(htmlFiles.map(f=>`/${path.relative(root,f).replace(/index\.html$/,'').replace(/\\/g,'/')}`));
const publicFiles=new Set(files.map(f=>`/${path.relative(root,f).replace(/\\/g,'/')}`));
// These routes are rendered by the adapter. The SSR suite requests each one.
for(const url of ['/','/events/','/admin/','/event-sitemap.xml','/featured-events.xml','/events/feed.json',...localSeoPages.map(p=>`/${p.slug}/`),...['lexington-sc','columbia-sc','west-columbia-cayce-sc','irmo-chapin-sc','fountain-inn-sc'].map(s=>`/areas/${s}/`),...JSON.parse(fs.readFileSync('src/data/venues.json')).venues.map(v=>`/venues/${v.slug}/`)])routes.add(url);
const data=fs.readdirSync('src/data/events').map(f=>JSON.parse(fs.readFileSync(`src/data/events/${f}`)));
for(const e of data.filter(e=>e.visibility==='public'&&e.publicationStatus!=='draft'))routes.add(`/events/${e.slug}/`);
const errors=[],titles=new Map();
for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8'),title=html.match(/<title>(.*?)<\/title>/)?.[1];
 if(!title)errors.push(`${file}: missing title`);else if(titles.has(title))errors.push(`${file}: duplicate title`);else titles.set(title,file);
 if(!/<meta name="description" content="[^"]+"/.test(html))errors.push(`${file}: missing description`);
 if(!/rel="canonical" href="https:\/\/4dogsentertainment\.com\//.test(html))errors.push(`${file}: missing production canonical`);
 if(!/<meta property="og:title"/.test(html)||!/<meta property="og:description"/.test(html))errors.push(`${file}: incomplete Open Graph metadata`);
 for(const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
  const url=match[1].split(/[?#]/)[0];if(url.startsWith('//'))continue;
  const route=url.endsWith('/')?url:`${url}/`;
  if(!routes.has(route)&&!routes.has(url)&&!publicFiles.has(url))errors.push(`${file}: broken internal reference ${url}`);
 }
}
const booking=fs.readFileSync(path.join(root,'booking','index.html'),'utf8');
for(const marker of ['name="booking"','data-netlify="true"','netlify-honeypot="bot-field"','name="form-name"','action="/thank-you/"','name="referral-source"','data-service-slug="music-bingo"','data-service-slug="almost-married-trivia-experience"'])if(!booking.includes(marker))errors.push(`booking: missing ${marker}`);
for(const asset of ['_redirects','_headers','robots.txt','llms.txt','sitemap-index.xml'])if(!publicFiles.has(`/${asset}`))errors.push(`dist: missing ${asset}`);
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log(`Static QA passed: ${htmlFiles.length} pages; metadata, links/assets, discovery files, and original Netlify booking form verified. Dynamic routes are checked separately by SSR QA.`);
