import { expandCatalog, isPublic, selectEvents, type Catalog, type Event, type Series } from '../lib/event-system';
import { venues } from './venues';
export type { Event, EventStatus, Series } from '../lib/event-system';
const occurrences=Object.values(import.meta.glob<Event>('./events/*.json',{eager:true,import:'default'}));
const series=Object.values(import.meta.glob<Series>('./series/*.json',{eager:true,import:'default'}));
export const allEvents = expandCatalog({events:occurrences,series} as Catalog, venues);
export const events = allEvents.filter(isPublic);
export const upcomingEvents = (now: Date = new Date()) => selectEvents(events, venues, { now });
export const eventsForVenue = (id: string, now: Date = new Date()) => selectEvents(events, venues, { now, venue: id });
