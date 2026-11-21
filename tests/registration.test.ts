import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateTime, type Event } from '../src/lib/event-system';
import type { Venue } from '../src/data/venues';
import {
  secureCode,validateRegistration,defaultReward,defaultDeadline,eligibleEvent,
  resolvePolicy,registrationCutoff,rewardFor,rewardMessage,secretHash,verifySecret,emailKey,
  safeHTML,safeCSV,easternTime,APPETIZER_TEXT,RAFFLE_TEXT
} from '../src/lib/registration-core';
import { buildConfirmationEmail } from '../src/lib/registration-email';
import { sessionCookie,readSession,postFromSameOrigin,setSessionCookie,clearSessionCookie } from '../src/lib/registration-auth';

const venue={id:'charter-803',slug:'charter-803-trivia-music-bingo-lexington-sc',name:'Charter 803 Bar & Grill',address:'269 Charter Oak Road',city:'Lexington',state:'SC',zip:'29072',mapUrl:'https://example.test',description:'',image:'',active:true,areaSlug:'lexington-sc',weeklySchedule:[],addressVerified:true} satisfies Venue;
const event={id:'charter-wed-test',slug:'charter-wed-test',title:'Wednesday Music Bingo',date:'2026-12-09',startTime:'6:30 PM',venueId:'charter-803',
  eventType:'Music Bingo',theme:'Music Bingo',description:'Games',shortDescription:'Games',image:'/images/hero.jpg',featured:false,status:'scheduled',visibility:'public',publicationStatus:'published',lastUpdated:'2026-11-20T12:00:00Z',instructions:'Bring friends',admission:{kind:'free',verified:true,price:0,currency:'USD',note:'Free admission'},ticketed:false} as Event;
const before=new Date('2026-12-09T20:59:59.000Z');
const at=new Date('2026-12-09T21:00:00.000Z');
const after=new Date('2026-12-09T21:00:01.000Z');

test('Every confirmation code is cryptographically generated, hard to guess, and distinct',()=>{
 const generated=new Set(Array.from({length:3000},()=>secureCode()));
 assert.equal(generated.size,3000);
 assert.ok([...generated].every(code=>/^FDE-[A-HJ-NP-Z2-9]{12}$/.test(code)));
});
test('Customer registration requires only supported fields and rejects malformed input',()=>{
 const p=validateRegistration({name:'  Jane   Smith ',email:' Jane.Smith@example.COM ',groupSize:5,teamName:' Tuesday Squad ',eventId:event.id});
 assert.deepEqual(p,{name:'Jane Smith',email:'jane.smith@example.com',groupSize:5,teamName:'Tuesday Squad',eventId:event.id});
 for(const payload of [
  {name:'J',email:'valid@example.com',groupSize:2,eventId:event.id},
  {name:'Jane',email:'invalid',groupSize:2,eventId:event.id},
  {name:'Jane',email:'valid@example.com',groupSize:0,eventId:event.id},
  {name:'Jane',email:'valid@example.com',groupSize:2.3,eventId:event.id},
  {name:'Jane',email:'valid@example.com',groupSize:100,eventId:event.id},
  {name:'Jane',email:'valid@example.com',groupSize:2,eventId:'../bad'},
 ])assert.throws(()=>validateRegistration(payload));
});
test('Charter Wednesday Trivia and Music Bingo default to appetizers; other events use raffle tickets',()=>{
 assert.equal(defaultReward(event,venue),'appetizer');
 assert.equal(defaultReward({...event,eventType:'Trivia'},venue),'appetizer');
 assert.equal(defaultReward({...event,eventType:'Other Public Events'},venue),'raffle');
 assert.equal(defaultReward({...event,date:'2026-12-10'},venue),'raffle');
 assert.equal(defaultReward(event,{...venue,id:'wesco'}),'raffle');
});
test('Charter deadline is 4 PM Wednesday Eastern, not UTC or browser timezone',()=>{
 const policy=resolvePolicy(event,venue);
 assert.equal(defaultDeadline(event,venue).toISOString(),'2026-12-09T21:00:00.000Z');
 assert.equal(registrationCutoff(event,venue,policy).toISOString(),'2026-12-09T21:00:00.000Z');
 assert.equal(rewardFor(event,venue,policy,before),'appetizer');
 assert.equal(rewardFor(event,venue,policy,at),'none');
 assert.equal(rewardFor(event,venue,policy,after),'none');
 // Even if an owner extends registration, nobody becomes appetizer eligible after 4 PM.
 assert.equal(rewardFor(event,venue,{...policy,registration_closes_at:'2026-12-09T22:00:00Z'},after),'none');
});
test('Other events have a configurable registration and reward deadline',()=>{
 const e={...event,venueId:'wesco'} as Event, v={...venue,id:'wesco'};
 const p=resolvePolicy(e,v);
 assert.equal(registrationCutoff(e,v,p).toISOString(),'2026-12-09T23:30:00.000Z');
 assert.equal(rewardFor(e,v,p,new Date('2026-12-09T22:00:00Z')),'raffle');
 assert.equal(rewardFor(e,v,{...p,reward_closes_at:'2026-12-09T21:00:00Z'},new Date('2026-12-09T22:00:00Z')),'none');
 assert.equal(rewardFor(e,v,{...p,reward_enabled:false},before),'none');
 assert.equal(rewardFor(e,v,{...p,reward_kind:'none'},before),'none');
 assert.equal(registrationCutoff(e,v,{...p,registration_closes_at:'2026-12-09T20:00:00Z'}).toISOString(),'2026-12-09T20:00:00.000Z');
});
test('Past, canceled, private, and ticketed events are excluded',()=>{
 const now=new Date('2026-12-01T12:00:00Z');
 assert.equal(eligibleEvent(event,venue,now),true);
 assert.equal(eligibleEvent({...event,status:'cancelled'},venue,now),false);
 assert.equal(eligibleEvent({...event,visibility:'private'},venue,now),false);
 assert.equal(eligibleEvent({...event,publicationStatus:'draft'},venue,now),false);
 assert.equal(eligibleEvent({...event,admission:{...event.admission,kind:'paid',price:10}},venue,now),false);
 assert.equal(eligibleEvent({...event,ticketed:true},venue,now),false);
 assert.equal(eligibleEvent(event,{...venue,active:false},now),false);
 assert.equal(eligibleEvent(event,venue,new Date('2026-12-10T02:00:00Z')),false);
});
test('Professional confirmation email includes all required details and escaped values',()=>{
 const r={id:'reg-1',event_id:event.id,code:'FDE-K7M4P9X2ABCD',name:'Jane <Smith>',email:'jane@example.com',email_key:'hash',
  group_size:5,team_name:'A&B',reward_kind:'appetizer',created_at:new Date('2026-12-09T20:59:00Z'),email_status:'sent',email_attempts:1,email_sent_at:null};
 const content=buildConfirmationEmail(r,event,venue);
 for(const detail of ['Jane &lt;Smith&gt;','FDE-K7M4P9X2ABCD','Wednesday, December 9, 2026','3:59 PM','Charter 803 Bar &amp; Grill','One appetizer per registered group'])assert.ok(content.html.includes(detail),detail);
 assert.ok(content.html.includes('Your confirmation email is not an appetizer coupon'));
 assert.ok(content.text.includes('Your Four Dogs host must verify your code'));
 assert.ok(!content.html.includes('Jane <Smith>'));
 const raffle=buildConfirmationEmail({...r,reward_kind:'raffle'},{...event,venueId:'wesco'}, {...venue,id:'wesco'});
 assert.ok(raffle.text.includes('one extra raffle ticket'));
 assert.ok(!raffle.text.includes('complimentary appetizer from Charter'));
 const canceled=buildConfirmationEmail(r,{...event,status:'cancelled'},venue);
 assert.ok(canceled.text.includes('canceled or postponed'));
});
test('Password hashing, deterministic email keys, and signed staff sessions resist tampering',()=>{
 const password='Correct-Horse-Strong-Password-2026';
 const hash=secretHash(password);
 assert.ok(verifySecret(password,hash));
 assert.ok(!verifySecret('not-the-password',hash));
 assert.equal(emailKey('event-a','jane@example.com','secret-a'),emailKey('event-a','jane@example.com','secret-a'));
 assert.notEqual(emailKey('event-b','jane@example.com','secret-a'),emailKey('event-a','jane@example.com','secret-a'));
 process.env.FDE_SESSION_SECRET='unit-test-session-key-is-more-than-32-characters-long';
 const token=sessionCookie('host-abc','host',new Date('2026-11-20T20:00:00Z').valueOf());
 const request=new Request('https://4dogsentertainment.com/staff/',{headers:{cookie:'fde_staff_session='+token}});
 assert.equal(readSession(request,new Date('2026-11-20T21:00:00Z').valueOf())?.staffId,'host-abc');
 assert.equal(readSession(request,new Date('2026-11-21T08:00:00Z').valueOf()),null);
 assert.equal(readSession(new Request(request.url,{headers:{cookie:'fde_staff_session='+token+'altered'}})),null);
 assert.ok(setSessionCookie(token).includes('HttpOnly'));
 assert.ok(setSessionCookie(token).includes('SameSite=Strict'));
 assert.ok(clearSessionCookie().includes('Max-Age=0'));
 assert.equal(postFromSameOrigin(new Request('https://4dogsentertainment.com/api/staff/',{method:'POST',headers:{origin:'https://4dogsentertainment.com'}})),true);
 assert.equal(postFromSameOrigin(new Request('https://4dogsentertainment.com/api/staff/',{method:'POST',headers:{origin:'https://evil.example'}})),false);
});
test('HTML and CSV output escape hostile content',()=>{
 assert.equal(safeHTML('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(safeCSV('=SUM(1,2)'),'"\'=SUM(1,2)"');
 assert.equal(safeCSV('Hello\n"Excel"'),'"Hello ""Excel"""');
 assert.ok(easternTime('2026-11-25T21:00:00Z').includes('4:00'));
 assert.ok(APPETIZER_TEXT.includes('physical coupon'));
 assert.ok(RAFFLE_TEXT.includes('extra raffle ticket'));
});
