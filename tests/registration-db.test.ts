import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { Temporal } from '@js-temporal/polyfill';
import type { Event } from '../src/lib/event-system';
import type { Venue } from '../src/data/venues';
import { saveRegistration,registrationByCode,registrationsForEvent,claimCheckin,correctCheckin,registrationTotals,query,getDB } from '../src/lib/registration-db';

const useDb=!!process.env.FDE_REGISTRATION_DATABASE_URL;
const t=test;
const unique='ci-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
const tomorrow=Temporal.Now.zonedDateTimeISO('America/New_York').add({days:5}).toPlainDate().toString();
const venue:Venue={id:'test',slug:'test',name:'Integration Test Venue',address:'123 Test St',city:'Test Town',state:'SC',zip:'29072',mapUrl:'https://example.com',description:'',image:'/images/hero.jpg',active:true,areaSlug:'columbia-sc',weeklySchedule:[],addressVerified:true};
const event:Event={id:unique,slug:unique,title:'Registration Integration Test',date:tomorrow,startTime:'7:00 PM',venueId:'test',
  eventType:'Trivia',theme:'',shortDescription:'Integration test',description:'Testing',image:'/images/hero.jpg',featured:false,status:'scheduled',visibility:'public',publicationStatus:'published',lastUpdated:new Date().toISOString(),instructions:'Test',admission:{kind:'free',verified:true,price:0,currency:'USD'}};
t('A real Postgres connection persists registrations, rejects duplicates, and atomically enforces one check-in', {skip:!useDb}, async()=>{
 process.env.FDE_SESSION_SECRET='database-integration-test-secret-0123456789-safe';
 const input={eventId:event.id,name:'Test Guest',email:unique+'@example.test',groupSize:4,teamName:'Test Group'};
 const registered=await saveRegistration(input,event,venue,'198.51.100.42');
 assert.match(registered.code,/^FDE-[A-HJ-NP-Z2-9]{12}$/);
 assert.equal(registered.reward_kind,'raffle');
 await assert.rejects(saveRegistration(input,event,venue,'198.51.100.42'),/already registered/);
 assert.equal((await registrationsForEvent(event.id)).length,1);
 const before=await registrationByCode(registered.code);
 assert.equal(before?.name,'Test Guest');
 const pair=await Promise.allSettled([
  claimCheckin(registered.code,event.id,'host-one',3),
  claimCheckin(registered.code,event.id,'host-two',3)
 ]);
 assert.equal(pair.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(pair.filter(x=>x.status==='rejected').length,1);
 const after=await registrationByCode(registered.code);
 assert.ok(after?.checked_in_at);
 assert.equal(after?.reward_issued,true);
 assert.deepEqual(registrationTotals(await registrationsForEvent(event.id)),{
  registeredGroups:1,expectedPeople:4,checkedInGroups:1,checkedInPeople:3,issuedRewards:1
 });
 // Persistence across processes is the requirement, not a JS in-memory map.
 const script='import {registrationByCode,getDB} from "./src/lib/registration-db.ts"; const r=await registrationByCode(process.env.TEST_CODE); if(!r)process.exit(3); console.log(r.code); await getDB().end({timeout:5});';
 const fresh=execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{
  env:{...process.env,TEST_CODE:registered.code},encoding:'utf8',timeout:20000
 }).trim();
 assert.equal(fresh,registered.code);
 await correctCheckin(registered.id,event.id,'owner','Correction for accidental tap');
 assert.equal((await registrationByCode(registered.code))?.checked_in_at,null);
 const second=await claimCheckin(registered.code,event.id,'host-one',2);
 assert.equal(second.rewardIssued,true);
 assert.equal((await registrationByCode(registered.code))?.actual_group_size,2);
 const log=await query<{action:string}>('SELECT action FROM fde_registration.audit WHERE event_id=$1 ORDER BY at',[event.id]);
 assert.deepEqual(log.map(x=>x.action),['registered','checked_in','checkin_corrected','checked_in']);
 const count=await query<{n:number}>('SELECT COUNT(*)::integer AS n FROM fde_registration.checkins WHERE registration_id=$1',[registered.id]);
 assert.equal(count[0].n,1);
 await getDB().end({timeout:5});
});
