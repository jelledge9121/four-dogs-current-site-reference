import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { configured, postFromSameOrigin, privateHeaders, readSession } from './registration-auth';
import { inTransaction, registrationByCode } from './registration-db';
import type { Event } from './event-system';
import { venueById } from '../data/venues';
import { defaultReward, eligibleEvent } from './registration-core';
import { Temporal } from '@js-temporal/polyfill';

const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:privateHeaders()});
const sign=(value:string)=>createHmac('sha256',process.env.FDE_SESSION_SECRET!).update('fde-voucher:'+value).digest('base64url');
export function voucherHandler(allEvents: Event[]): APIRoute {
const liveEvent=(id:string)=>allEvents.find(e=>e.id===id && e.visibility==='public' && e.publicationStatus==='published' && ['scheduled','rescheduled'].includes(e.status) && defaultReward(e,venueById(e.venueId))==='appetizer');
return async({request})=>{
 if(!configured()||!postFromSameOrigin(request))return reply({error:'Unavailable'},403);
 try{
 const {action,code,token,size}=await request.json();
 if(action==='redeem'){
  const staff=readSession(request);
  if(!staff)return reply({error:'Sign in to scan.'},401);
  const parts=String(token).split('.');
  const [id,expires,signature]=parts;
  const expected=sign(id+'.'+expires);
  if(parts.length!==3 || !/^[0-9a-f-]{36}$/.test(id)||!/^\d{13}$/.test(expires)||!signature||Buffer.byteLength(signature)!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return reply({error:'Invalid voucher.'},400);
  return await inTransaction(async run=>{
   const [row]=await run<any>('SELECT * FROM fde_registration.registrations WHERE id=$1 FOR UPDATE',[id]);
   const event=row&&liveEvent(row.event_id);
   if(!event || event.date!==Temporal.Now.zonedDateTimeISO('America/New_York').toPlainDate().toString())return reply({error:'Invalid event date.'},409);
   if(staff.role!=='owner' && !(await run('SELECT 1 FROM fde_registration.assignments a JOIN fde_registration.staff s ON s.id=a.staff_id WHERE a.event_id=$1 AND a.staff_id=$2 AND s.active FOR SHARE',[event.id,staff.staffId])).length)return reply({error:'No scanner access for this event.'},403);
   if(row.redeemed_at)return reply({error:'Already redeemed.'},409);
   const changed=await run("UPDATE fde_registration.registrations SET redeemed_at=clock_timestamp() WHERE id=$1 AND cancelled_at IS NULL AND reward_kind='appetizer' AND voucher_expires>clock_timestamp() AND to_timestamp($2::double precision/1000)>clock_timestamp() RETURNING id",[id,expires]);
   if(!changed.length)return reply({error:'Expired or invalid voucher.'},409);
   await run("INSERT INTO fde_registration.audit(id,registration_id,event_id,actor_id,action) VALUES($1,$2,$3,$4,'redeemed')",[randomUUID(),id,event.id,staff.staffId]);
   return reply({ok:true});
  });
 }
 if(!/^FDE-[A-HJ-NP-Z2-9]{12}$/.test(String(code)))return reply({error:'Invalid link.'},404);
 const row=await registrationByCode(code);
 if(!row||row.cancelled_at)return reply({error:'Registration is unavailable.'},409);
 if(action==='token'){
  if(!liveEvent(row.event_id)||row.reward_kind!=='appetizer'||row.redeemed_at||!row.voucher_expires||+new Date(row.voucher_expires)<=Date.now())return reply({error:'Expired, invalid, or already redeemed.'},409);
  const payload=row.id+'.'+Math.min(Date.now()+20000,+new Date(row.voucher_expires));
  return reply({token:payload+'.'+sign(payload)});
 }
 const event=allEvents.find(e=>e.id===row.event_id);
 if(!event||!eligibleEvent(event,venueById(event.venueId))||!['resize','cancel'].includes(action))return reply({error:'Changes are closed.'},409);
 if(action==='resize'&&(!Number.isInteger(size)||size<1||size>50))return reply({error:'Enter 1 to 50 people.'},400);
 return await inTransaction(async run=>{
  const changed=await run('UPDATE fde_registration.registrations SET '+(action==='resize'?'group_size=$2':'cancelled_at=NOW()')+' WHERE id=$1 AND cancelled_at IS NULL AND redeemed_at IS NULL RETURNING id',action==='resize'?[row.id,size]:[row.id]);
  if(!changed.length)return reply({error:'Changes are closed.'},409);
  await run('INSERT INTO fde_registration.audit(id,registration_id,event_id,actor_id,action,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),row.id,event.id,'customer',action,action==='resize'?String(size):null]);
  return reply({ok:true});
 });
 }catch{return reply({error:'Unable to process this request.'},400)}
};
}
