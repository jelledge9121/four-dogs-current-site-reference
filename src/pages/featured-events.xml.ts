import type { APIRoute } from 'astro';
import { upcomingEvents } from '../data/events';
import { venueById } from '../data/venues';
import { SITE_URL, startIso } from '../lib/event-system';
export const prerender=false;
const xml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const GET:APIRoute=()=>new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Four Dogs Entertainment Featured Events</title><link>${SITE_URL}/events/</link><description>Confirmed upcoming public Four Dogs events.</description>${upcomingEvents().filter(e=>e.featured).map(e=>`<item><title>${xml(e.title)}</title><link>${SITE_URL}/events/${e.slug}/</link><guid isPermaLink="true">${SITE_URL}/events/${e.slug}/</guid><description>${xml(`${e.shortDescription} ${startIso(e)}. ${venueById(e.venueId).name}. ${e.instructions}`)}</description><category>${xml(e.eventType)}</category></item>`).join('')}</channel></rss>`,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
