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
 const registered=await saveRegistration(input,event,venue,'198.51.100.42',new Date(),'test-device');
 assert.match(registered.code,/^FDE-[A-HJ-NP-Z2-9]{12}$/);
 assert.equal(registered.reward_kind,'none');
 await assert.rejects(saveRegistration(input,event,venue,'198.51.100.42',new Date(),'test-device'),/already registered/);
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
 assert.equal(after?.reward_issued,false);
 assert.deepEqual(registrationTotals(await registrationsForEvent(event.id)),{
  registeredGroups:1,expectedPeople:4,checkedInGroups:1,checkedInPeople:3,issuedRewards:0
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
 assert.equal(second.rewardIssued,false);
 assert.equal((await registrationByCode(registered.code))?.actual_group_size,2);
 const log=await query<{action:string}>('SELECT action FROM fde_registration.audit WHERE event_id=$1 ORDER BY at',[event.id]);
 assert.deepEqual(log.map(x=>x.action),['registered','checked_in','checkin_corrected','checked_in']);
 const count=await query<{n:number}>('SELECT COUNT(*)::integer AS n FROM fde_registration.checkins WHERE registration_id=$1',[registered.id]);
 assert.equal(count[0].n,1);
});

t('Live voucher checks assignment, immutable expiration, revocation and concurrent redemption in Postgres',{skip:!useDb},async()=>{
 const {voucherHandler}=await import('../src/lib/registration-voucher');
 const allEvents:Event[]=[];
 const POST=voucherHandler(allEvents);
 process.env.FDE_REGISTRATION_ENABLED='true';process.env.FDE_OWNER_PASSWORD_HASH='isolated-test-only';
 const {venueById}=await import('../src/data/venues');
 const {sessionCookie}=await import('../src/lib/registration-auth');
 const {randomUUID}=await import('node:crypto');
 const origin='https://example.test';
 const venue=venueById('charter-803');
 const date=Temporal.Now.zonedDateTimeISO('America/New_York').add({days:14});
 let day=date.toPlainDate();while(day.dayOfWeek!==3||day.toString()<'2026-12-02')day=day.add({days:1});
 const sample={...event,id:'test-'+randomUUID(),venueId:venue.id,date:day.toString()};
 allEvents.push(sample);
 const host='test-'+randomUUID();
 const deadline=new Date(Date.now()+600000);
 const call=(action:string,values:object,session?:string)=>POST({request:new Request(origin+'/api/voucher/',{method:'POST',headers:{origin,...(session?{cookie:'fde_staff_session='+session}:{})},body:JSON.stringify({action,...values})})} as any) as Promise<Response>;
 await query("INSERT INTO fde_registration.event_policies(event_id,reward_kind,redemption_deadline,updated_by) VALUES($1,'appetizer',$2,'test')",[sample.id,deadline]);
 const r=await saveRegistration({name:'Sample Party',teamName:null,eventId:sample.id,groupSize:4},sample,venue,'192.0.2.23');
 const original=Temporal.Now.zonedDateTimeISO;
 try{
 assert.equal(r.reward_kind,'appetizer');
 const token=await (await call('token',{code:r.code})).json();
 assert.ok(token.token);
 Temporal.Now.zonedDateTimeISO=()=>day.toZonedDateTime('America/New_York');
 const session=sessionCookie(host,'host');
 assert.equal((await call('redeem',token)).status,401);
 assert.equal((await call('redeem',token,session)).status,403);
 await query("INSERT INTO fde_registration.staff(id,name,password_hash) VALUES($1,'QA','disabled')",[host]);
 await query('INSERT INTO fde_registration.assignments(staff_id,event_id) VALUES($1,$2)',[host,sample.id]);
 const responses=await Promise.all([call('redeem',token,session),call('redeem',token,session)]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 await query('UPDATE fde_registration.registrations SET redeemed_at=NULL,voucher_expires=NOW() WHERE id=$1',[r.id]);
 assert.equal((await call('redeem',token,session)).status,409);
 await query('DELETE FROM fde_registration.assignments WHERE staff_id=$1',[host]);
 assert.equal((await call('redeem',token,session)).status,403);
 }finally{Temporal.Now.zonedDateTimeISO=original;allEvents.splice(allEvents.indexOf(sample),1)}
});
test.after(async()=>{if(useDb)await getDB().end({timeout:5})});
