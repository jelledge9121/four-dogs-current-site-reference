import type { Event } from './event-system';
import type { Venue } from '../data/venues';
import type { RegistrationRow } from './registration-db';
import { easternTime,eventDateLabel,rewardMessage,safeHTML } from './registration-core';

export type EmailContent = { subject:string; html:string; text:string };
export function buildConfirmationEmail(r:RegistrationRow,event:Event,venue:Venue): EmailContent {
  const cancelled = event.status === 'cancelled' || event.status === 'postponed';
  const reward = cancelled
    ? 'This event has been canceled or postponed. No reward can be claimed. Please check the event calendar for the latest status.'
    : rewardMessage(r.reward_kind);
  const title = 'Your Four Dogs registration: ' + event.title;
  const fields = [
    ['Registered name',r.name], ['Group size',String(r.group_size)], ['Event',event.title],
    ['Venue',venue.name + ', ' + venue.city + ', ' + venue.state],
    ['Event date',eventDateLabel(event)],['Start time',(event.startTime || 'TBA')+' Eastern Time'],
    ['Registration time',easternTime(r.created_at)],['Confirmation code',r.code]
  ];
  const htmlFields=fields.map(f=>'<tr><th style="text-align:left;padding:10px 0;border-bottom:1px solid #e3e3e3;font-size:14px;color:#40506a;vertical-align:top;width:37%">'+safeHTML(f[0])+'</th><td style="text-align:left;padding:10px 0;border-bottom:1px solid #e3e3e3;font-size:15px;font-weight:600;color:#152032">'+safeHTML(f[1])+'</td></tr>').join('');
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    +'<body style="margin:0;background:#f6f5f0;font-family:Arial,Helvetica,sans-serif;color:#132034"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">'
    +'<table role="presentation" style="width:100%;max-width:580px;background:#ffffff;border-radius:10px;overflow:hidden" cellpadding="0" cellspacing="0"><tr><td style="background:#111c32;color:white;padding:23px 28px;text-align:center">'
    +'<img src="https://4dogsentertainment.com/images/logo.png" width="70" height="70" alt="Four Dogs Entertainment" style="display:block;margin:0 auto 12px">'
    +'<strong style="font-size:21px">Four Dogs Entertainment</strong><p style="margin:8px 0 0;font-size:14px">Bring your people. We’ll bring the Doggone Good Time.</p></td></tr>'
    +'<tr><td style="padding:26px 28px"><h1 style="font-size:25px;line-height:1.25;margin:0 0 12px">You’re registered!</h1>'
    +'<p style="font-size:16px;line-height:1.55;margin:0 0 18px">Keep this confirmation handy for your Four Dogs host.</p>'
    +'<div style="background:#edf7f9;padding:18px 14px;margin-bottom:18px;text-align:center"><p style="text-transform:uppercase;font-size:12px;letter-spacing:1px;margin:0 0 7px">Your confirmation code</p><div style="font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:800;letter-spacing:2px;overflow-wrap:anywhere">'+safeHTML(r.code)+'</div></div>'
    +'<table role="presentation" cellpadding="0" cellspacing="0" width="100%">'+htmlFields+'</table>'
    +'<h2 style="font-size:19px;margin:22px 0 10px">Your event reward</h2><p style="font-size:16px;line-height:1.55;white-space:pre-line">'+safeHTML(reward).replace(/\n/g,'<br>')+'</p>'
    +'<p style="font-size:13px;color:#526078;line-height:1.5">Your confirmation is not a prize or a table reservation. Your Four Dogs host must verify the live code and check in your group before issuing any physical reward. A raffle ticket does not guarantee a prize.</p>'
    +'</td></tr><tr><td style="background:#f6f5f0;padding:16px 28px;text-align:center;font-size:12px;color:#536075">Four Dogs Entertainment LLC</td></tr></table></td></tr></table></body></html>';
  const text=fields.map(([k,v])=>k+': '+v).join('\n')+'\n\n'+reward+'\n\nYour Four Dogs host must verify your code. Registration does not reserve a restaurant table. A raffle ticket does not guarantee a prize.';
  return {subject:title,html,text};
}
export function emailReady():boolean {
 const provider=process.env.FDE_EMAIL_PROVIDER;
 return !!process.env.FDE_EMAIL_FROM && ((provider==='resend' && !!process.env.RESEND_API_KEY)||(provider==='postmark' && !!process.env.POSTMARK_SERVER_TOKEN));
}
export async function deliverConfirmation(to:string,content:EmailContent):Promise<void> {
 const provider=process.env.FDE_EMAIL_PROVIDER;
 const from=process.env.FDE_EMAIL_FROM;
 if(!from || !emailReady()) throw new Error('Transactional email is not configured');
 const url=provider==='resend'?'https://api.resend.com/emails':'https://api.postmarkapp.com/email';
 const headers:Record<string,string>={'Content-Type':'application/json'};
 let body:Record<string,unknown>;
 if(provider==='resend'){
  headers.Authorization='Bearer '+process.env.RESEND_API_KEY;
  body={from,to,subject:content.subject,html:content.html,text:content.text};
 }else{
  headers['X-Postmark-Server-Token']=process.env.POSTMARK_SERVER_TOKEN!;
  body={From:from,To:to,Subject:content.subject,HtmlBody:content.html,TextBody:content.text,MessageStream:'outbound'};
 }
 const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!response.ok) throw new Error('Email provider rejected the confirmation ('+response.status+')');
}
