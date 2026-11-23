import postgres from 'postgres';
import { randomUUID, createHmac } from 'node:crypto';
import { emailKey, resolvePolicy, rewardFor, registrationCutoff, secureCode, type Policy, type RegistrationInput } from './registration-core';
import type { Event } from './event-system';
import type { Venue } from '../data/venues';

let client: ReturnType<typeof postgres> | null = null;
export type SQLRunner = <T = Record<string, unknown>>(query: string, params?: any[]) => Promise<T[]>;
export function getDB(): ReturnType<typeof postgres> {
  const url = (process.env.FDE_REGISTRATION_DATABASE_URL || process.env.NETLIFY_DB_URL);
  if (!url) throw new Error('Registration database is not configured');
  if (!client) client = postgres(url, { max: 4, connect_timeout: 8, idle_timeout: 15 });
  return client;
}
export const query: SQLRunner = async (text, params=[]) => Array.from(await getDB().unsafe(text, params)) as any;
export async function inTransaction<T>(callback: (run: SQLRunner) => Promise<T>): Promise<T> {
  return await getDB().begin(async transaction => {
    const run: SQLRunner = async (statement, params=[]) => Array.from(await transaction.unsafe(statement, params)) as any;
    return await callback(run);
  }) as T;
}
export function ipIdentifier(ip: string, secret: string, category: string): string {
  return createHmac('sha256',secret).update(category + '\0' + ip).digest('hex');
}
export async function recordRateHit(run: SQLRunner, identifier: string, limit: number, minutes: number): Promise<void> {
  await run('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[identifier]);
  await run('INSERT INTO fde_registration.rate_hits (id,identifier) VALUES ($1,$2)', [randomUUID(),identifier]);
  const rows = await run<{ n: number }>('SELECT COUNT(*)::integer AS n FROM fde_registration.rate_hits WHERE identifier = $1 AND at > NOW() - ($2 * INTERVAL \'1 minute\')',[identifier,minutes]);
  if ((rows[0]?.n || 0) > limit) throw new Error('Too many requests. Try again later.');
}
export type RegistrationRow = {
 cancelled_at?:Date; voucher_expires?:Date; redeemed_at?:Date; id: string; event_id: string; code: string; name: string; email: string; email_key: string;
 group_size: number; team_name: string | null; reward_kind: 'appetizer'|'raffle'|'none';
 created_at: Date; email_status: 'pending'|'sent'|'failed'; email_attempts: number; email_sent_at: Date | null;
 checked_in_at?: Date | null; checked_in_by?: string | null; actual_group_size?: number | null; reward_issued?: boolean | null;
};
export async function findPolicy(eventId: string): Promise<Partial<Policy> | null> {
  const r = await query<Policy>('SELECT * FROM fde_registration.event_policies WHERE event_id=$1',[eventId]);
  return r[0] || null;
}
export async function saveRegistration(input: RegistrationInput, event: Event, venue: Venue, ip: string, now = new Date(), device = randomUUID() as string): Promise<RegistrationRow> {
  const secret = process.env.FDE_SESSION_SECRET!;
  // Keep abuse counters even when an attempted duplicate registration is rejected.
  await inTransaction(async run => {
    await recordRateHit(run, ipIdentifier(ip,secret,'register'), 12, 15);

  });
  return await inTransaction(async run => {
    const fresh = await run<{time:Date}>('SELECT NOW() AS time');
    // Use the database clock for reward/deadline enforcement, not the browser clock.
    const at = fresh[0]?.time || now;
    const saved = await run<Policy>('SELECT * FROM fde_registration.event_policies WHERE event_id=$1',[event.id]);
    const policy = resolvePolicy(event,venue,saved[0]);
    if (!policy.enabled) throw new Error('Registration is not available for this event.');
    if (at >= registrationCutoff(event,venue,policy)) throw new Error('Registration has closed for this event.');
    const duplicateKey=ipIdentifier([event.id,ip,input.name.toLowerCase(),input.teamName?.toLowerCase()||''].join('\0'),secret,'group');
    const code = secureCode();
    const rows = await run<RegistrationRow>(
      'INSERT INTO fde_registration.registrations (id,event_id,code,name,email,email_key,group_size,team_name,reward_kind,device_key,voucher_expires,duplicate_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING RETURNING *',
      [randomUUID(),event.id,code,input.name,null,null,input.groupSize,input.teamName,rewardFor(event,venue,policy,at),emailKey(event.id,device,secret),rewardFor(event,venue,policy,at)==='appetizer'?policy.redemption_deadline:null,duplicateKey]
    );
    if (!rows.length) throw new Error('This browser is already registered for this event. Open your saved registration link.');
    await run('INSERT INTO fde_registration.audit (id,registration_id,event_id,actor_id,action,reason) VALUES ($1,$2,$3,$4,$5,$6)',
      [randomUUID(),rows[0].id,event.id,'customer','registered',String(input.groupSize)]);
    return rows[0];
  });
}
export async function registrationByCode(code:string): Promise<RegistrationRow | null> {
  const rows = await query<RegistrationRow>('SELECT r.*, c.checked_in_at, c.checked_in_by, c.actual_group_size, c.reward_issued FROM fde_registration.registrations r LEFT JOIN fde_registration.checkins c ON c.registration_id=r.id WHERE r.code=$1',[code.trim().toUpperCase()]);
  return rows[0] || null;
}
export async function existingBrowserRegistration(eventId:string,device:string){
  const key=emailKey(eventId,device,process.env.FDE_SESSION_SECRET!);
  const [row]=await query<{code:string}>('SELECT code FROM fde_registration.registrations WHERE event_id=$1 AND device_key=$2',[eventId,key]);
  return row?.code;
}
export async function registrationsForEvent(eventId:string): Promise<RegistrationRow[]> {
  return await query<RegistrationRow>('SELECT r.*, c.checked_in_at, c.checked_in_by, c.actual_group_size, c.reward_issued FROM fde_registration.registrations r LEFT JOIN fde_registration.checkins c ON c.registration_id=r.id WHERE r.event_id=$1 ORDER BY r.created_at DESC',[eventId]);
}
export function registrationTotals(rows:RegistrationRow[]) {
  const checked=rows.filter(r=>r.checked_in_at);
  const active=rows.filter(r=>!r.cancelled_at);
  return { registeredGroups: active.length, expectedPeople: active.reduce((n,r)=>n+r.group_size,0),
    checkedInGroups:checked.length, checkedInPeople:checked.reduce((n,r)=>n+(r.actual_group_size ?? r.group_size),0),
    issuedRewards:checked.filter(r=>r.reward_issued).length };
}
export async function claimCheckin(code:string,eventId:string,actorId:string, actualGroupSize?:number) {
  return await inTransaction(async run => {
    const reg = (await run<RegistrationRow>('SELECT id,event_id,reward_kind,group_size FROM fde_registration.registrations WHERE code=$1 AND event_id=$2',[code.trim().toUpperCase(),eventId]))[0];
    if (!reg) throw new Error('No registration matches this code for this event.');
    const attending = actualGroupSize ?? reg.group_size;
    if (!Number.isInteger(attending) || attending < 1 || attending > 50) throw new Error('Enter the number of people actually attending (1 to 50).');
    const results = await run('INSERT INTO fde_registration.checkins (registration_id,checked_in_by,actual_group_size,reward_issued) VALUES ($1,$2,$3,$4) ON CONFLICT (registration_id) DO NOTHING RETURNING registration_id',[reg.id,actorId,attending,reg.reward_kind !== 'none']);
    if (!results.length) throw new Error('This registration has already been checked in. Do not issue a second reward.');
    await run('INSERT INTO fde_registration.audit (id,registration_id,event_id,actor_id,action) VALUES ($1,$2,$3,$4,$5)',
      [randomUUID(),reg.id,eventId,actorId,'checked_in']);
    return { registrationId:reg.id,reward:reg.reward_kind,rewardIssued:reg.reward_kind !== 'none' };
  });
}
export async function correctCheckin(registrationId:string,eventId:string,actorId:string,reason:string) {
  return await inTransaction(async run => {
    const registration=(await run<{id:string}>('SELECT id FROM fde_registration.registrations WHERE id=$1 AND event_id=$2',[registrationId,eventId]))[0];
    if (!registration) throw new Error('Registration not found.');
    const removed=await run('DELETE FROM fde_registration.checkins WHERE registration_id=$1 RETURNING registration_id',[registrationId]);
    if (!removed.length) throw new Error('Registration was not checked in.');
    await run('INSERT INTO fde_registration.audit (id,registration_id,event_id,actor_id,action,reason) VALUES ($1,$2,$3,$4,$5,$6)',
      [randomUUID(),registrationId,eventId,actorId,'checkin_corrected',reason]);
    return true;
  });
}
export async function isAssigned(staffId:string,eventId:string) {
  const r=await query('SELECT 1 FROM fde_registration.assignments a JOIN fde_registration.staff s ON s.id=a.staff_id AND s.active=TRUE WHERE a.staff_id=$1 AND a.event_id=$2',[staffId,eventId]);
  return r.length > 0;
}
export async function activeHost(staffId:string) {
  const r=await query<{name:string}>('SELECT name FROM fde_registration.staff WHERE id=$1 AND active=TRUE',[staffId]);
  return r[0]?.name || null;
}
export async function assignedEvents(staffId:string) {
  return await query<{event_id:string}>('SELECT event_id FROM fde_registration.assignments WHERE staff_id=$1',[staffId]);
}
export async function recentAudit(eventId:string) {
  return await query('SELECT a.action,a.actor_id,a.reason,a.at,r.name,r.code FROM fde_registration.audit a LEFT JOIN fde_registration.registrations r ON r.id=a.registration_id WHERE a.event_id=$1 ORDER BY a.at DESC LIMIT 100',[eventId]);
}
