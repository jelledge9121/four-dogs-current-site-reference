import type { APIRoute } from 'astro';
import { events } from '../../data/events';
import { venueById } from '../../data/venues';
import { listingPackage, selectEvents } from '../../lib/event-system';
import { venues } from '../../data/venues';
export const prerender=false;
export const GET: APIRoute=()=>Response.json({timeZone:'America/New_York',events:selectEvents(events,venues).map(e=>listingPackage(e,venueById(e.venueId))),updates:selectEvents(events,venues,{view:'updates'}).map(e=>listingPackage(e,venueById(e.venueId)))});
