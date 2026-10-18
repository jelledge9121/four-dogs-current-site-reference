import fs from 'node:fs';
import assert from 'node:assert/strict';
import { App } from 'astro/app';
import { localSeoPages } from '../src/data/localSeoPages.ts';
import { expandCatalog, CATEGORIES, categorySlug, phase, isPublic, selectEvents, localToday, addDays } from '../src/lib/event-system.ts';
const manifestName=fs.readdirSync('.netlify/build').find(f=>/^manifest_.*\.mjs$/.test(f));
await import('../.netlify/build/entry.mjs');
const {manifest}=await import(`../.netlify/build/${manifestName}`);
const app=new App(manifest);
const load=dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`${dir}/${f}`)));
const catalog={events:load('src/data/events'),series:load('src/data/series')};
const venues=JSON.parse(fs.readFileSync('src/data/venues.json')).venues;
const all=expandCatalog(catalog,venues);
const publicEvents=all.filter(isPublic);
const base='https://4dogsentertainment.com';
const cache=new Map();
async function request(path){
 if(cache.has(path))return cache.get(path);
 const response=await app.render(new Request(base+path),{clientAddress:'127.0.0.1',locals:{netlify:{context:{ip:'127.0.0.1'}}},prerenderedErrorPageFetch:async()=>new Response(fs.readFileSync('dist/404.html'),{status:404,headers:{'Content-Type':'text/html'}})});
 const result={status:response.status,headers:response.headers,body:await response.text()};cache.set(path,result);return result;
}
const staticRoutes=new Set();
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).forEach(e=>e.isDirectory()?walk(dir+'/'+e.name):staticRoutes.add('/'+(dir+'/'+e.name).slice(5)));
walk('dist');
const paths=['/','/events/','/admin/','/admin/distribution/','/event-sitemap.xml','/featured-events.xml','/events/feed.json',...venues.map(v=>`/venues/${v.slug}/`),...localSeoPages.map(p=>`/${p.slug}/`),...['lexington-sc','columbia-sc','west-columbia-cayce-sc','irmo-chapin-sc','fountain-inn-sc'].map(s=>`/areas/${s}/`),...all.filter(e=>e.visibility==='public'&&e.publicationStatus!=='draft').map(e=>`/events/${e.slug}/`),...CATEGORIES.map(c=>`/events/category/${categorySlug(c)}/`)];
const titles=new Map();
let eventSchemas=0;
for(const path of paths){
 const page=await request(path);assert.equal(page.status,200,`${path} status`);
 assert.equal(page.headers.get('cache-control'),'no-store',`${path} status must refresh on each request`);
 if(!page.headers.get('content-type')?.includes('text/html'))continue;
 const title=page.body.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title,`${path} title`);assert.ok(!titles.has(title),`${path} duplicate title ${title}`);titles.set(title,path);
 if(!path.startsWith('/admin/')){
  assert.ok(page.body.includes(`rel="canonical" href="${base}${path}"`),`${path} canonical`);
  assert.ok(/<meta name="description" content="[^"]+"/.test(page.body),`${path} description`);
 }
 for(const m of page.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
  const schema=JSON.parse(m[1]);
  if(schema['@type']==='Event'){
   eventSchemas++;
   for(const key of ['name','description','startDate','eventStatus','eventAttendanceMode','location','organizer','image','url'])assert.ok(schema[key],`${path} missing schema ${key}`);
   assert.match(schema.startDate,/T\d\d:\d\d:\d\d-0[45]:00$/);
   assert.ok(schema.location.address.streetAddress&&schema.location.address.addressLocality&&schema.location.address.postalCode);
   assert.equal(schema.organizer.name,'Four Dogs Entertainment LLC');
   if(schema.offers)assert.ok(schema.offers.price>=0&&schema.offers.priceCurrency&&schema.offers.url);
  }
 }
 for(const m of page.body.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
  const url=m[1].replaceAll('&amp;','&').split(/[?#]/)[0];if(!url||url.startsWith('//')||url.startsWith('/_astro/'))continue;
  if(staticRoutes.has(url)||staticRoutes.has(`${url.replace(/\/$/,'')}/index.html`))continue;
  const linked=await request(url);assert.ok(linked.status<400,`${path} broken internal link ${url}`);
 }
}
const home=await request('/');assert.ok(!home.body.includes('Marvel Trivia'),'homepage excludes expired July event');assert.ok(!home.body.includes('data-past-only'),'no duplicate hidden past status text');
const calendar=await request('/events/');assert.ok(!calendar.body.includes('Marvel Trivia'),'calendar excludes expired July event');
const futureEvent=publicEvents.find(e=>['upcoming','live'].includes(phase(e)));
if(futureEvent){const future=await request(`/events/${futureEvent.slug}/`);assert.ok(!future.body.includes('This event has passed'),'future event has no passed label');assert.ok(!future.body.includes('This event has ended'),'future event has no completed label');}
for(const [query,venue] of [['city=Cayce','wesco'],['venue=black-sheep','black-sheep']]){
 const p=await request('/events/?'+query);const ids=[...p.body.matchAll(/data-event-id="([^"]+)"/g)].map(m=>m[1]);assert.ok(ids.every(id=>all.find(e=>e.id===id)?.venueId===venue));const expected=selectEvents(all,venues,{from:localToday(),to:addDays(localToday(),30),...(query.startsWith('city=')?{city:'Cayce'}:{venue})});assert.deepEqual(ids,expected.map(e=>e.id));
}
const archive=await request('/events/?view=archive');assert.ok(archive.body.includes('Marvel Trivia'));
const noMatches=await request('/events/?city=Irmo');assert.ok(noMatches.body.includes('No matching events'));
const invalidRange=await request('/events/?from=2026-12-01&to=2026-10-01');assert.ok(invalidRange.body.includes('role="alert"'));
const free=await request('/events/?price=free');assert.ok(!free.body.includes('data-event-id="charter-2026-10-30"'));
const mystery=await request('/events/2026-10-30-saluda-mill-murder-black-sheep-bourbon-society-lexington-sc/');assert.ok(mystery.body.includes('Black Sheep Bourbon Society'));assert.ok(mystery.body.includes('2026-10-30T19:30:00-04:00'));assert.ok(mystery.body.includes('21+'));assert.ok(mystery.body.includes('photo ID'));
const review=await request('/events/movies-music-monsters-wesco-2026-10-27/');assert.ok(review.body.includes('name="robots" content="noindex,follow"'));assert.ok(!review.body.includes('"@type":"Event"'));
const sitemap=await request('/event-sitemap.xml');assert.ok(sitemap.body.includes('aura-thursday-trial-2026'));assert.ok(!sitemap.body.includes('movies-music-monsters-wesco-2026-10-27'));
const feed=JSON.parse((await request('/events/feed.json')).body);assert.ok(feed.events.every(e=>!('assignedHost' in e)));assert.ok(feed.events.every(e=>!e.title.includes('Wedding')));
const listing=JSON.parse((await request('/events/2026-10-30-saluda-mill-murder-black-sheep-bourbon-society-lexington-sc/listing.json')).body);assert.equal(listing.venue,'Black Sheep Bourbon Society');assert.equal(listing.end,'Not confirmed');assert.ok(listing.externalListings.every(l=>l.needsUpdate));
assert.equal((await request('/events/not-a-real-event/')).status,404);
const desk=await request('/admin/distribution/');assert.ok(desk.body.includes('Event listing desk'));if(publicEvents.some(e=>e.externalListings?.length)||selectEvents(all,venues,{from:localToday(),to:addDays(localToday(),30)}).length){assert.ok(desk.body.includes('Ready-to-submit event text'));assert.ok(desk.body.includes('sha256:'));}assert.ok(desk.headers.get('x-robots-tag')?.includes('noindex'));
const result={testedAt:new Date().toISOString(),dynamicRoutes:paths.length,eventSchemas,renderedRequests:cache.size,checks:'Initial HTML, chronology/archives, filters, event status, canonical URLs, schema, internal links/assets, sitemap, public feeds, conflict suppression, and 404s passed. Hosted browser and external validator results are recorded separately in the completion report.'};
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ssr-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
