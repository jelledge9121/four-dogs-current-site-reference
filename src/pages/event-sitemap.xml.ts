import type { APIRoute } from 'astro';
import { events } from '../data/events';
import { CATEGORIES, categorySlug, SITE_URL } from '../lib/event-system';
export const prerender=false;
export const GET: APIRoute=()=>{
 const xml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
 const entries=[...events.map(e=>({url:`${SITE_URL}/events/${e.slug}/`,updated:e.lastUpdated})),...CATEGORIES.map(c=>({url:`${SITE_URL}/events/category/${categorySlug(c)}/`,updated:''}))];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(e=>`<url><loc>${xml(e.url)}</loc>${e.updated?`<lastmod>${e.updated}</lastmod>`:''}</url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
