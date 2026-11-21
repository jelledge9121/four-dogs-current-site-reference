import type { APIRoute } from 'astro';
import { allEvents } from '../../data/events';
import { venueById } from '../../data/venues';
import { eligibleEvent, validateRegistration } from '../../lib/registration-core';
import { configured, postFromSameOrigin, privateHeaders } from '../../lib/registration-auth';
import { saveRegistration, sendStatus } from '../../lib/registration-db';
import { buildConfirmationEmail, deliverConfirmation } from '../../lib/registration-email';

export const prerender = false;
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {
  status, headers:{...privateHeaders(),'Content-Type':'application/json; charset=utf-8'}
});
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if(!configured()) return json({error:'Event registration is not available yet.'},503);
  if(!postFromSameOrigin(request)) return json({error:'This request could not be verified.'},403);
  const contentType=request.headers.get('content-type')||'';
  if(!contentType.startsWith('application/json')) return json({error:'Please use the registration form.'},415);
  let value: unknown;
  try {
    const text=await request.text();
    if(text.length>5000) return json({error:'Registration is too large.'},413);
    value=JSON.parse(text);
  }catch {return json({error:'Please check your registration details.'},400)}
  if(value && typeof value==='object' && (value as any).website) return json({message:'Please check your email for instructions.'},200);
  let input;
  try {input=validateRegistration(value)}catch(e){return json({error:(e as Error).message},400)}
  const event=allEvents.find(e=>e.id===input.eventId);
  const venue=event?venueById(event.venueId):undefined;
  if(!eligibleEvent(event,venue)) return json({error:'This event is unavailable for free registration.'},409);
  try {
    const registration=await saveRegistration(input,event!,venue!,clientAddress||'unknown');
    let emailSent=false;
    try {
      await deliverConfirmation(registration.email,buildConfirmationEmail(registration,event!,venue!));
      emailSent=true;
    }catch(err){
      // Do not discard a successfully committed registration if the email provider fails.
      // The owner can retry from the private dashboard.
      console.error('Confirmation delivery failed for registration',registration.id,String(err));
    }
    await sendStatus(registration.id,emailSent);
    return json({ok:true,code:registration.code,emailSent},emailSent?201:202);
  }catch(e){
    const message=(e as Error).message||'Registration is unavailable.';
    const known=/already registered|closed|not available|Too many requests/.test(message);
    console.error('Registration request did not complete:',known?message:'Internal failure');
    return json({error:known?message:'Registration could not be completed. Please try again.'},known?409:503);
  }
};
export const GET: APIRoute = async () => json({error:'Use the registration page.'},405);
