import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expandCatalog, eventSchema, localDateTime, localToday, phase, selectEvents, validateEvents, listingPackage, type Event, type Series } from '../src/lib/event-system.ts';
import type { Venue } from '../src/data/venues.ts';
const load=(dir:string)=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`${dir}/${f}`,'utf8')));
const catalog={events:load('src/data/events'),series:load('src/data/series')};
const venues=JSON.parse(fs.readFileSync('src/data/venues.json','utf8')).venues as Venue[];
const all=expandCatalog(catalog,venues);
const now=new Date('2026-10-18T02:11:33Z');
const sample=all.find(e=>e.id==='wesco-2026-10-20')!;
const mutate=(patch:Partial<Event>)=>({...structuredClone(sample),...patch});
test('The actual migrated catalog validates with unique IDs, stable URLs, and public slots',()=>assert.deepEqual(validateEvents(all,venues),[]));
test('November public events include the Thanksgiving Eve game nights and Boze’s championship watch party',()=>{
 const november=all.filter(e=>e.date.startsWith('2026-11')&&e.publicationStatus==='published');
 assert.equal(november.length,32);
 assert.deepEqual(Object.fromEntries(['the-mill','top-dawg','wesco','charter-803','bozes','aura'].map(id=>[id,november.filter(e=>e.venueId===id).length])),{'the-mill':5,'top-dawg':4,wesco:9,'charter-803':7,bozes:5,aura:2});
 const comedy=november.find(e=>e.id==='the-mill-2026-11-02')!;
 assert.ok(comedy);
 assert.equal(comedy.title,'Comedy Night');
 assert.equal(comedy.eventType,'Comedy');
 assert.equal(comedy.startTime,'7:00 PM');
 assert.equal(comedy.endTime,'9:00 PM');
 assert.equal(comedy.slug,'are-you-smarter-than-a-barstool-the-mill-2026-11-02');
 assert.equal(eventSchema(comedy,venues.find(v=>v.id==='the-mill')!)?.startDate,'2026-11-02T19:00:00-05:00');
 assert.equal(november.find(e=>e.venueId==='wesco'&&e.date==='2026-11-03')?.title,'Harry Potter: Battle for Hogwarts');
 assert.equal(november.find(e=>e.venueId==='aura'&&e.date==='2026-11-05')?.title,'DJ Jimbo’s Master Class Music Bingo');
 for(const id of ['wesco','bozes','charter-803']){
  const event=november.find(e=>e.venueId===id&&e.date==='2026-11-25');
  assert.ok(event,`Missing Thanksgiving Eve game night for ${id}`);
  assert.equal(event.title,'Home for the Holidays: Thanksgiving Eve Game Night');
  assert.equal(event.visibility,'public');
  assert.equal(event.publicationStatus,'published');
 }
 const race=november.find(e=>e.id==='bozes-2026-11-08')!;
 assert.ok(race);
 assert.equal(race.startTime,'3:00 PM');
 assert.equal(eventSchema(race,venues.find(v=>v.id==='bozes')!)?.startDate,'2026-11-08T15:00:00-05:00');
 assert.match(november.find(e=>e.id==='wesco-2026-11-25')!.description,/may be adjusted/);

 assert.ok(!november.some(e=>e.venueId==='charter-803'&&e.date==='2026-11-26'));
 assert.ok(!november.some(e=>/wrestling/i.test(e.title)));
 assert.equal(november.find(e=>e.venueId==='top-dawg'&&e.date==='2026-11-03')?.endTime,undefined);
});
test('Upcoming listings exclude July, August, September, and expired October dates',()=>assert.ok(selectEvents(all,venues,{now}).every(e=>e.date>='2026-10-17')));
test('Chronology uses timestamps across noon, PM, and overnight events',()=>{const morning=mutate({id:'m',slug:'m',startTime:'11:00 AM'}),evening=mutate({id:'e',slug:'e',startTime:'6:00 PM',endTime:'8:00 PM'});assert.deepEqual(selectEvents([evening,morning],venues,{now}).map(e=>e.id),['m','e']);});
test('An event remains live until its scheduled end, then expires exactly at the end',()=>{assert.equal(phase(sample,new Date('2026-10-21T00:59:59Z')),'live');assert.equal(phase(sample,new Date('2026-10-21T01:00:00Z')),'completed');});
test('Unknown durations never produce an invented completed time or schema endDate',()=>{const e=mutate({endTime:undefined});assert.equal(phase(e,new Date('2026-10-21T02:00:00Z')),'live');assert.equal(phase(e,new Date('2026-10-21T04:00:00Z')),'past-date');assert.ok(!('endDate' in eventSchema(e,venues.find(v=>v.id===e.venueId)!)!));});
test('Time zone dates use New York rather than UTC or visitor location',()=>assert.equal(localToday(new Date('2026-10-18T02:11:33Z')),'2026-10-17'));
test('Fall DST switches from -04:00 to -05:00',()=>{assert.equal(localDateTime('2026-10-29','7:30 PM').offset,'-04:00');assert.equal(localDateTime('2026-11-05','7:30 PM').offset,'-05:00');});
test('Spring DST switches and rejects nonexistent local times',()=>{assert.equal(localDateTime('2027-03-13','7:00 PM').offset,'-05:00');assert.equal(localDateTime('2027-03-14','7:00 PM').offset,'-04:00');assert.throws(()=>localDateTime('2027-03-14','2:30 AM'));});
test('Ambiguous fall-back times require an explicit choice',()=>{assert.throws(()=>localDateTime('2026-11-01','1:30 AM'));assert.equal(localDateTime('2026-11-01','1:30 AM','earlier').offset,'-04:00');assert.equal(localDateTime('2026-11-01','1:30 AM','later').offset,'-05:00');});
test('Overnight events survive midnight and the fall-back transition',()=>{const e=mutate({date:'2026-10-31',startTime:'7:00 PM',endDate:'2026-11-01',endTime:'2:00 AM'});assert.equal(phase(e,new Date('2026-11-01T06:59:59Z')),'live');assert.equal(phase(e,new Date('2026-11-01T07:00:00Z')),'completed');});
test('Canceled and postponed records leave upcoming lists but preserve status and original date',()=>{for(const status of ['cancelled','postponed'] as const){const e=mutate({status});assert.equal(selectEvents([e],venues,{now}).length,0);assert.equal(selectEvents([e],venues,{now,view:'updates'}).length,1);const s=eventSchema(e,venues.find(v=>v.id===e.venueId)!)!;assert.equal(s.startDate,'2026-10-20T19:00:00-04:00');assert.match(s.eventStatus,status==='cancelled'?/EventCancelled$/:/EventPostponed$/);}});
test('Rescheduling preserves canonical URL and includes previousStartDate',()=>{const e=mutate({status:'rescheduled',date:'2026-10-23',previousStartDate:'2026-10-20T19:00:00-04:00'});const s=eventSchema(e,venues.find(v=>v.id===e.venueId)!)!;assert.match(s.url,new RegExp(sample.slug));assert.equal(s.previousStartDate,e.previousStartDate);assert.equal(s.startDate,'2026-10-23T19:00:00-04:00');});
test('Venue and city filters only return actual matching locations',()=>{assert.ok(selectEvents(all,venues,{now,city:'Cayce'}).every(e=>e.venueId==='wesco'));assert.ok(selectEvents(all,venues,{now,venue:'black-sheep'}).every(e=>e.venueId==='black-sheep'));assert.equal(selectEvents(all,venues,{now,city:'Irmo'}).length,0);});
test('Free and ticketed filters require verified pricing',()=>{assert.ok(selectEvents(all,venues,{now,price:'free'}).every(e=>e.admission.verified&&e.admission.kind==='free'));assert.ok(selectEvents(all,venues,{now,price:'paid'}).every(e=>e.admission.verified&&e.admission.kind==='paid'));});
test('Drafts, private records, and unresolved conflicts stay out of public surfaces',()=>{for(const e of [mutate({visibility:'private'}),mutate({publicationStatus:'draft'}),mutate({publicationStatus:'review'})]){assert.equal(selectEvents([e],venues,{now}).length,0);assert.equal(eventSchema(e,venues[0]),null);assert.throws(()=>listingPackage(e,venues[0]));}});
test('Recurring generation stops at the confirmed agreement and produces four Aura dates',()=>{const generated=all.filter(e=>e.seriesId==='aura-thursday-trial-2026');assert.deepEqual(generated.map(e=>e.date),['2026-10-22','2026-10-29','2026-11-05','2026-11-12']);assert.throws(()=>expandCatalog({events:[],series:[{...catalog.series[0],confirmedThrough:''}]},venues));});
test('Recurring exceptions handle skip, cancellation, venue change, and rescheduling without changing identity',()=>{const s=structuredClone(catalog.series[0]) as Series;s.excludedDates=['2026-10-29'];s.overrides=[{originalDate:'2026-10-22',changes:{status:'cancelled'}},{originalDate:'2026-11-05',changes:{venueId:'charter-803',date:'2026-11-06',status:'rescheduled',previousStartDate:'2026-11-05T19:30:00-05:00'}}];const out=expandCatalog({events:[],series:[s]},venues);assert.equal(out.length,3);assert.equal(out[0].status,'cancelled');assert.equal(out[1].date,'2026-11-06');assert.equal(out[1].venueId,'charter-803');assert.ok(out[1].slug.startsWith('2026-11-05'));});
test('Missing dates, unknown venues, false pricing, duplicates, and invalid end times fail validation',()=>{for(const patch of [{date:''},{venueId:'missing'},{endTime:'5:00 PM'},{admission:{kind:'free',verified:false}}] as Partial<Event>[]){assert.ok(validateEvents([mutate(patch)],venues).length);}assert.ok(validateEvents([sample,sample],venues).length);});
test('Murder mystery has the verified venue, $25 offer, exact local time, and no placeholder end',()=>{const e=all.find(e=>e.id==='charter-2026-10-30')!;const s=eventSchema(e,venues.find(v=>v.id===e.venueId)!)!;assert.equal(s.location.name,'Black Sheep Bourbon Society');assert.equal(s.startDate,'2026-10-30T19:30:00-04:00');assert.equal(s.offers?.price,25);assert.equal(s.organizer.name,'Four Dogs Entertainment LLC');assert.equal(s.endDate,undefined);});
test('Unknown admission generates no invented Offer, and listing exports contain no host field',()=>{const s=eventSchema(mutate({admission:{kind:'unknown'}}),venues.find(v=>v.id===sample.venueId)!)!;assert.equal(s.offers,undefined);const p=listingPackage(mutate({assignedHost:'INTERNAL ONLY'}),venues[0]);assert.ok(!JSON.stringify(p).includes('INTERNAL ONLY'));});
test('Stored content contains public copy only, with no private clients or staffing assignments',()=>{assert.ok(catalog.events.every(e=>e.visibility==='public'&&!e.assignedHost));assert.ok(catalog.series.every(s=>s.template.visibility==='public'&&!s.template.assignedHost));});
test('Unverified venue addresses and unconfirmed start times block public publication',()=>{assert.ok(validateEvents([sample],venues.map(v=>({...v,addressVerified:false}))).length);assert.ok(validateEvents([mutate({startTime:undefined,endTime:undefined})],venues).length);});
test('Duplicate or out-of-agreement recurrence overrides are rejected',()=>{const s=structuredClone(catalog.series[0]) as Series;s.overrides=[{originalDate:'2026-10-22',changes:{}},{originalDate:'2026-10-22',changes:{}}];assert.throws(()=>expandCatalog({events:[],series:[s]},venues));s.overrides=[{originalDate:'2026-11-19',changes:{}}];assert.throws(()=>expandCatalog({events:[],series:[s]},venues));});
test('External listing packages explicitly carry cancellation and rescheduling status',()=>{assert.equal(listingPackage(mutate({status:'cancelled'}),venues[0]).eventStatus,'cancelled');const p=listingPackage(mutate({status:'rescheduled',previousStartDate:'2026-10-18T19:00:00-04:00'}),venues[0]);assert.equal(p.eventStatus,'rescheduled');assert.ok(p.previousStartDate);});
test('Recording a successful external update stays current after the editor stamps its save',()=>{
 const venue=venues.find(v=>v.id===sample.venueId)!;
 const revision=listingPackage(sample,venue).listingRevision;
 const saved=mutate({lastUpdated:'2026-10-19T12:00:00Z',externalListings:[{platform:'Community calendar',status:'current',syncedRevision:revision}]});
 assert.equal(listingPackage(saved,venue).externalListings[0].needsUpdate,false);
});
test('A shared venue correction flags previously synchronized listings',()=>{
 const venue=venues.find(v=>v.id===sample.venueId)!;
 const revision=listingPackage(sample,venue).listingRevision;
 const saved=mutate({externalListings:[{platform:'Community calendar',status:'current',syncedRevision:revision}]});
 assert.equal(listingPackage(saved,{...venue,address:'A corrected verified street address'}).externalListings[0].needsUpdate,true);
});
test('Admission and status corrections flag external updates while staffing remains excluded',()=>{
 const venue=venues.find(v=>v.id===sample.venueId)!;
 const revision=listingPackage(sample,venue).listingRevision;
 assert.notEqual(listingPackage(mutate({status:'cancelled'}),venue).listingRevision,revision);
 assert.notEqual(listingPackage(mutate({admission:{kind:'paid',verified:true,price:10,currency:'USD'}}),venue).listingRevision,revision);
 assert.equal(listingPackage(mutate({assignedHost:'PRIVATE'}),venue).listingRevision,revision);
});

test('Owner-confirmed public admission is free except the $25 murder mystery',()=>{for(const e of all){if(e.eventType==='Murder Mystery'){assert.equal(e.admission.kind,'paid');assert.equal(e.admission.price,25);}else{assert.equal(e.admission.kind,'free');assert.equal(e.admission.verified,true);const schema=eventSchema(e,venues.find(v=>v.id===e.venueId)!);if(schema){assert.equal(schema.isAccessibleForFree,true);assert.equal(schema.offers?.price,0);}}}});


test('Aura four trial nights use their confirmed themes and retain stable recurrence URLs',()=>{
 const expected=[['2026-10-22','College Hits: Throughout the Years Music Bingo'],['2026-10-29','Spooky Vibes Music Bingo'],['2026-11-05','DJ Jimbo’s Master Class Music Bingo'],['2026-11-12','Screen Time Music Bingo']];
 for(const [date,title] of expected){const e=all.find(e=>e.venueId==='aura'&&e.date===date)!;assert.ok(e);assert.equal(e.title,title);assert.equal(e.eventType,'Music Bingo');assert.equal(e.slug,`${date}-aura-thursday-trial-2026`);assert.equal(e.startTime,'7:30 PM');assert.equal(e.endTime,'9:30 PM');}
 assert.equal(all.filter(e=>e.venueId==='aura'&&e.seriesId).length,4);
});
test('WesCo Spooky Music Bingo reuses the dated event ID and Harry Potter Trivia remains stable',()=>{
 const spooky=all.find(e=>e.id==='wesco-2026-10-27')!;assert.equal(spooky.slug,'spooky-music-bingo-wesco-2026-10-27');assert.equal(spooky.publicationStatus,'published');assert.equal(spooky.eventType,'Music Bingo');assert.equal(spooky.startTime,'7:00 PM');
 const harry=all.find(e=>e.id==='wesco-009')!;assert.equal(harry.slug,'food-drinks-famous-flavors-wesco-brew-bowl-2026-11-03');assert.equal(harry.title,'Harry Potter: Battle for Hogwarts');assert.equal(harry.eventType,'Trivia');assert.match(harry.description,/Hogwarts/);
});
test('Thursday WesCo Karaoke uses one recurring series and the confirmed 7 PM start time',()=>{
 const karaoke=all.filter(e=>e.seriesId==='wesco-thursday-karaoke-2026');assert.deepEqual(karaoke.map(e=>e.date),['2026-10-22','2026-10-29','2026-11-05','2026-11-12','2026-11-19','2026-11-26','2026-12-03','2026-12-10','2026-12-17']);
 assert.ok(karaoke.every(e=>e.venueId==='wesco'&&e.eventType==='Karaoke'&&e.startTime==='7:00 PM'&&!e.endTime&&e.title==='Thursday Karaoke at WesCo Brew & Bowl'));
 assert.equal(selectEvents(all,venues,{now,venue:'wesco',category:'Karaoke'}).length,9);
});
