import type { APIRoute } from 'astro';
import { randomBytes,randomUUID } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import { events,allEvents } from '../../data/events';
import { venueById } from '../../data/venues';
import { eligibleEvent, eventDateLabel, secretHash, verifySecret, safeCSV, defaultReward } from '../../lib/registration-core';
import { configured, postFromSameOrigin, readSession, sessionCookie, setSessionCookie, clearSessionCookie,
  verifyOwnerPassword, privateHeaders, OWNER_ID, type StaffSession } from '../../lib/registration-auth';
import { query,inTransaction,recordRateHit,ipIdentifier,registrationByCode,registrationsForEvent,registrationTotals,
  claimCheckin,correctCheckin,activeHost,isAssigned,assignedEvents,recentAudit,sendStatus, type RegistrationRow
} from '../../lib/registration-db';
import { deliverConfirmation,buildConfirmationEmail } from '../../lib/registration-email';

export const prerender=false;
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),
  {status,headers:{...privateHeaders(),'Content-Type':'application/json; charset=utf-8',...headers}});
const eventFor=(id:string)=>allEvents.find(e=>e.id===id && e.visibility==='public' && e.publicationStatus==='published');
const validFreeEvent=(id:string)=>{const event=eventFor(id);return event&&event.admission.verified&&event.admission.kind==='free'&&!event.ticketed?event:null};
async function getAuthorized(req:Request):Promise<StaffSession|null> {
  const session=readSession(req);
  if(!session)return null;
  if(session.role==='host'&&!await activeHost(session.staffId))return null;
  return session;
}
async function access(staff:StaffSession,eventId:string) {
  return !!validFreeEvent(eventId) && (staff.role==='owner'||await isAssigned(staff.staffId,eventId));
}
async function jsonBody(request:Request):Promise<Record<string,any>> {
  const contentType=request.headers.get('content-type')||'';
  if(!contentType.startsWith('application/json')) throw new Error('Invalid request type.');
  const text=await request.text();
  if(text.length>8000) throw new Error('Request is too large.');
  const value=JSON.parse(text);
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid request.');
  return value as Record<string,any>;
}
function parseEasternCutoff(value:unknown):Date|null {
 if(value===null||value==='')return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Enter a valid Eastern date and time.');
 try {
  const zdt=Temporal.PlainDateTime.from(value).toZonedDateTime('America/New_York');
  return new Date(zdt.epochMilliseconds);
 }catch {throw new Error('Invalid Eastern registration deadline.')}
}
function nowEasternDate():string {
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function sanitizedRow(r:RegistrationRow,owner:boolean){
 return {id:r.id,name:r.name,groupSize:r.group_size,teamName:r.team_name,
  ...(owner?{email:r.email,emailStatus:r.email_status}:{}),
  code:r.code,reward:r.reward_kind,registeredAt:r.created_at,
  checkedInAt:r.checked_in_at||null,rewardIssued:!!r.reward_issued};
}
export const GET:APIRoute=async({request})=>{
 if(!configured())return json({error:'Staff access has not been configured.'},503);
 const staff=await getAuthorized(request);
 if(!staff)return json({error:'Sign in to continue.'},401);
 const url=new URL(request.url);
 const mode=url.searchParams.get('mode')||'events';
 try {
  if(mode==='session')return json({staffId:staff.staffId,role:staff.role});
  if(mode==='events'){
   const assigned=staff.role==='owner'?null:new Set((await assignedEvents(staff.staffId)).map(a=>a.event_id));
   const policies=await query('SELECT * FROM fde_registration.event_policies');
   const policyById=new Map(policies.map((p:any)=>[p.event_id,p]));
   const counts=await query('SELECT r.event_id,COUNT(*)::integer AS groups,COALESCE(SUM(r.group_size),0)::integer AS expected,COUNT(c.registration_id)::integer AS checked_groups,COALESCE(SUM(CASE WHEN c.registration_id IS NOT NULL THEN r.group_size ELSE 0 END),0)::integer AS checked_people,COUNT(c.registration_id) FILTER (WHERE c.reward_issued)::integer AS rewards FROM fde_registration.registrations r LEFT JOIN fde_registration.checkins c ON c.registration_id=r.id GROUP BY r.event_id');
   const countById=new Map(counts.map((p:any)=>[p.event_id,p]));
   const matches=events.filter(e=>validFreeEvent(e.id) && (!assigned||assigned.has(e.id)))
    .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,260);
   return json({role:staff.role,events:matches.map(e=>{
    const venue=venueById(e.venueId),policy=policyById.get(e.id)||null,totals=countById.get(e.id)||{};
    return {id:e.id,title:e.title,date:e.date,dateLabel:eventDateLabel(e),startTime:e.startTime,
      venueId:venue.id,venue:venue.name,city:venue.city,status:e.status,
      reward:policy?.reward_kind||defaultReward(e,venue),enabled:policy?.enabled??true,
      rewardEnabled:policy?.reward_enabled??true,
      registrationCloses:policy?.registration_closes_at||null,
      rewardCloses:policy?.reward_closes_at||null,
      registeredGroups:totals.groups||0,expectedPeople:totals.expected||0,
      checkedInGroups:totals.checked_groups||0,checkedInPeople:totals.checked_people||0,
      issuedRewards:totals.rewards||0};
   })});
  }
  if(mode==='hosts'){
   if(staff.role!=='owner')return json({error:'Owner access is required.'},403);
   const hosts=await query('SELECT id,name,active,created_at FROM fde_registration.staff ORDER BY created_at DESC');
   const assignments=await query('SELECT staff_id,event_id FROM fde_registration.assignments');
   return json({hosts,assignments});
  }
  const eventId=url.searchParams.get('eventId')||'';
  if(mode==='csv'){
   if(staff.role!=='owner')return json({error:'Owner access is required.'},403);
   const venueId=url.searchParams.get('venueId')||'';
   const all=eventId ? await registrationsForEvent(eventId)
     : await query<RegistrationRow>('SELECT r.*,c.checked_in_at,c.checked_in_by,c.reward_issued FROM fde_registration.registrations r LEFT JOIN fde_registration.checkins c ON c.registration_id=r.id ORDER BY r.created_at DESC LIMIT 20000');
   const header=['Event ID','Event','Venue','Event date','Code','Name','Email','Group size','Team','Registered (UTC)','Reward','Checked in (UTC)','Reward issued'];
   const lines=[header.map(safeCSV).join(',')];
   for(const r of all){
    const e=eventFor(r.event_id);if(!e)continue;
    if(venueId&&e.venueId!==venueId)continue;
    lines.push([r.event_id,e.title,venueById(e.venueId).name,e.date,r.code,r.name,r.email,r.group_size,r.team_name||'',r.created_at,r.reward_kind,r.checked_in_at||'',r.reward_issued?'Yes':'No'].map(safeCSV).join(','));
   }
   return new Response(lines.join('\r\n')+'\r\n',{headers:{...privateHeaders(),'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="four-dogs-registrations.csv"'}});
  }
  if(!await access(staff,eventId))return json({error:'You are not assigned to this event.'},403);
  if(mode==='registrations'){
   const rows=await registrationsForEvent(eventId);
   return json({eventId,registrations:rows.map(r=>sanitizedRow(r,staff.role==='owner')),totals:registrationTotals(rows)});
  }
  if(mode==='verify'){
   const code=(url.searchParams.get('code')||'').trim().toUpperCase();
   if(!/^FDE-[A-HJ-NP-Z2-9]{12}$/.test(code))return json({error:'Enter the complete confirmation code.'},400);
   const r=await registrationByCode(code);
   if(!r||r.event_id!==eventId)return json({error:'Code not found for this event.'},404);
   return json({registration:sanitizedRow(r,staff.role==='owner')});
  }
  if(mode==='audit'){
   if(staff.role!=='owner')return json({error:'Owner access is required.'},403);
   return json({activity:await recentAudit(eventId)});
  }
  return json({error:'Unknown request.'},404);
 }catch(e){console.error('Staff data unavailable',String(e));return json({error:'Staff data is temporarily unavailable.'},503)}
};
export const POST:APIRoute=async({request,clientAddress})=>{
 if(!configured())return json({error:'Staff access has not been configured.'},503);
 if(!postFromSameOrigin(request))return json({error:'Request origin was not verified.'},403);
 let data:Record<string,any>;
 try{data=await jsonBody(request)}catch{return json({error:'Check the requested action.'},400)}
 const action=data.action;
 const ip=clientAddress||'unknown';
 try{
  if(action==='login'){
   const username=typeof data.username==='string'?data.username.trim():'';
   const password=typeof data.password==='string'?data.password:'';
   const secret=process.env.FDE_SESSION_SECRET!;
   await inTransaction(run=>recordRateHit(run,ipIdentifier(ip,secret,'staff-login'),6,15));
   let role:'owner'|'host'|null=null,staffId='';
   if(username.toLowerCase()==='owner'){
     if(verifyOwnerPassword(password)){role='owner';staffId=OWNER_ID}
   }else if(/^[a-zA-Z0-9-]{4,64}$/.test(username)){
     const rows=await query<{id:string,password_hash:string}>('SELECT id,password_hash FROM fde_registration.staff WHERE id=$1 AND active=TRUE',[username]);
     if(rows[0]&&verifySecret(password,rows[0].password_hash)){role='host';staffId=rows[0].id}
   }
   if(!role)return json({error:'Invalid login. Please check your credentials.'},401);
   return json({ok:true,role},200,{'Set-Cookie':setSessionCookie(sessionCookie(staffId,role))});
  }
  if(action==='logout')return json({ok:true},200,{'Set-Cookie':clearSessionCookie()});
  const staff=await getAuthorized(request);
  if(!staff)return json({error:'Sign in to continue.'},401);
  const eventId=typeof data.eventId==='string'?data.eventId:'';
  if(action==='checkin'){
   if(!await access(staff,eventId))return json({error:'You are not assigned to this event.'},403);
   const e=validFreeEvent(eventId)!;
   if(e.status==='cancelled'||e.status==='postponed')return json({error:'The event is canceled or postponed.'},409);
   if(e.date!==nowEasternDate())return json({error:'Check-in is available on the event date only.'},409);
   const code=typeof data.code==='string'?data.code.trim().toUpperCase():'';
   if(!/^FDE-[A-HJ-NP-Z2-9]{12}$/.test(code))return json({error:'Enter the complete confirmation code.'},400);
   try{return json({ok:true,checkin:await claimCheckin(code,eventId,staff.staffId)})}
   catch(err){return json({error:(err as Error).message},409)}
  }
  if(staff.role!=='owner')return json({error:'Owner access is required.'},403);
  if(action==='correct'){
   if(!validFreeEvent(eventId))return json({error:'Unknown event.'},404);
   const id=typeof data.registrationId==='string'?data.registrationId:'';
   const reason=typeof data.reason==='string'?data.reason.trim():'';
   if(reason.length<5||reason.length>280)return json({error:'Enter a reason for the correction (5 to 280 characters).'},400);
   try{await correctCheckin(id,eventId,staff.staffId,reason);return json({ok:true})}catch(e){return json({error:(e as Error).message},409)}
  }
  if(action==='policy'){
   const event=validFreeEvent(eventId);
   if(!event)return json({error:'Choose an eligible public event.'},400);
   const venue=venueById(event.venueId);
   const rewardKind=data.rewardKind;
   if(!['appetizer','raffle','none'].includes(rewardKind))return json({error:'Choose a reward type.'},400);
   if(rewardKind==='appetizer' && defaultReward(event,venue)!=='appetizer')return json({error:'Appetizer coupons are restricted to eligible Charter Wednesday Trivia and Music Bingo.'},400);
   if(typeof data.enabled!=='boolean'||typeof data.rewardEnabled!=='boolean')return json({error:'Invalid promotion settings.'},400);
   const closes=parseEasternCutoff(data.registrationCloses||null);
   const rewardCloses=parseEasternCutoff(data.rewardCloses||null);
   if(closes&&closes.getTime()>new Date(Date.now()+365*86400000).getTime())return json({error:'Deadline is too far in the future.'},400);
   await query('INSERT INTO fde_registration.event_policies (event_id,enabled,reward_kind,reward_enabled,registration_closes_at,reward_closes_at,updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_id) DO UPDATE SET enabled=EXCLUDED.enabled,reward_kind=EXCLUDED.reward_kind,reward_enabled=EXCLUDED.reward_enabled,registration_closes_at=EXCLUDED.registration_closes_at,reward_closes_at=EXCLUDED.reward_closes_at,updated_by=EXCLUDED.updated_by,updated_at=NOW()',
     [eventId,data.enabled,rewardKind,data.rewardEnabled,closes,rewardCloses,staff.staffId]);
   await query('INSERT INTO fde_registration.audit (id,event_id,actor_id,action) VALUES ($1,$2,$3,$4)',[randomUUID(),eventId,staff.staffId,'policy_changed']);
   return json({ok:true});
  }
  if(action==='create-host'){
   const name=typeof data.name==='string'?data.name.trim():'';
   if(name.length<2||name.length>100)return json({error:'Enter the host’s name.'},400);
   const id='host-'+randomBytes(5).toString('hex');
   const temporaryPassword=randomBytes(18).toString('base64url');
   await query('INSERT INTO fde_registration.staff (id,name,password_hash) VALUES ($1,$2,$3)',[id,name,secretHash(temporaryPassword)]);
   await query('INSERT INTO fde_registration.audit (id,actor_id,action,reason) VALUES ($1,$2,$3,$4)',
    [randomUUID(),staff.staffId,'host_created',id]);
   return json({ok:true,username:id,temporaryPassword});
  }
  if(action==='assign'){
   const hostId=typeof data.hostId==='string'?data.hostId:'';
   if(!validFreeEvent(eventId))return json({error:'Unknown event.'},400);
   if(typeof data.assigned!=='boolean')return json({error:'Invalid assignment.'},400);
   const host=await activeHost(hostId);
   if(!host)return json({error:'Unknown active host.'},400);
   if(data.assigned)await query('INSERT INTO fde_registration.assignments(staff_id,event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[hostId,eventId]);
   else await query('DELETE FROM fde_registration.assignments WHERE staff_id=$1 AND event_id=$2',[hostId,eventId]);
   await query('INSERT INTO fde_registration.audit(id,event_id,actor_id,action,reason) VALUES($1,$2,$3,$4,$5)',[randomUUID(),eventId,staff.staffId,'assignment_changed',hostId+(data.assigned?' assigned':' removed')]);
   return json({ok:true});
  }
  if(action==='resend'){
   const code=typeof data.code==='string'?data.code.trim().toUpperCase():'';
   const reg=await registrationByCode(code);
   if(!reg)return json({error:'Registration not found.'},404);
   const e=eventFor(reg.event_id);
   if(!e)return json({error:'Event not found.'},404);
   try{
    await deliverConfirmation(reg.email,buildConfirmationEmail(reg,e,venueById(e.venueId)));
    await sendStatus(reg.id,true);
    await query('INSERT INTO fde_registration.audit(id,event_id,registration_id,actor_id,action) VALUES($1,$2,$3,$4,$5)',[randomUUID(),e.id,reg.id,staff.staffId,'confirmation_resent']);
    return json({ok:true});
   }catch(err){await sendStatus(reg.id,false);return json({error:'The email provider could not deliver this confirmation.'},502)}
  }
  return json({error:'Unknown action.'},404);
 }catch(e){console.error('Staff request failed',String(e));return json({error:'The request could not be completed.'},503)}
};
