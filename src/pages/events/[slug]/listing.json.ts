import type { APIRoute } from 'astro';
import { events } from '../../../data/events';
import { venueById } from '../../../data/venues';
import { listingPackage } from '../../../lib/event-system';
export const prerender=false;
export const GET: APIRoute=({params})=>{
 const event=events.find(e=>e.slug===params.slug);
 return event?Response.json(listingPackage(event,venueById(event.venueId))):new Response('Not found',{status:404});
};
