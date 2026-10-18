import { Temporal } from '@js-temporal/polyfill';
import { createHash } from 'node:crypto';
import type { Venue } from '../data/venues';

export const TIME_ZONE = 'America/New_York';
export const SITE_URL = 'https://4dogsentertainment.com';
export const CATEGORIES = ['Trivia', 'Music Bingo', 'Karaoke', 'Survey Showdown', 'Are You Smarter Than a Barstool?', 'Comedy', 'Murder Mystery', 'Fundraisers', 'Community Events', 'Other Public Events'] as const;
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed' | 'rescheduled';
export type Event = {
  id: string; slug: string; title: string; theme: string; date: string; startTime?: string;
  endTime?: string; endDate?: string; previousStartDate?: string; dstDisambiguation?: 'earlier' | 'later';
  venueId: string; eventType: string; secondaryCategories?: string[]; shortDescription: string;
  description: string; image: string; imageAlt?: string; featured: boolean; status: EventStatus;
  visibility: 'public' | 'private'; publicationStatus: 'draft' | 'review' | 'published';
  lastUpdated: string; reviewReason?: string; instructions: string; registrationUrl?: string;
  registrationLabel?: string; ticketed?: boolean; facebookEventUrl?: string; assignedHost?: string;
  seoTitle?: string; metaDescription?: string; seriesId?: string; originalDate?: string;
  admission: { kind: 'unknown' | 'free' | 'paid'; verified?: boolean; price?: number; currency?: string; note?: string };
  externalListings?: { platform: string; url?: string; status: string; checkedAt?: string; syncedRevision?: string; notes?: string }[];
};
export type Series = {
  id: string; confirmedFrom: string; confirmedThrough: string; weekday: number; intervalWeeks: number;
  template: Omit<Event, 'id' | 'slug' | 'date'>; excludedDates?: string[];
  overrides?: { originalDate: string; changes: Partial<Event> }[];
};
export type Catalog = { events: Event[]; series: Series[] };
export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const categorySlug = slugify;
export const isPublic = (event: Event) => event.visibility === 'public' && event.publicationStatus === 'published';
export const localToday = (now = new Date()) => Temporal.Instant.fromEpochMilliseconds(now.getTime()).toZonedDateTimeISO(TIME_ZONE).toPlainDate().toString();
export const addDays = (date: string, days: number) => Temporal.PlainDate.from(date).add({ days }).toString();

export function localDateTime(date: string, time: string, disambiguation: 'earlier' | 'later' | 'reject' = 'reject') {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time);
  if (!match || +match[1] < 1 || +match[1] > 12 || +match[2] > 59) throw new Error(`Invalid time: ${time}`);
  const hour = (+match[1] % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const day = Temporal.PlainDate.from(date);
  return Temporal.ZonedDateTime.from({ timeZone: TIME_ZONE, year: day.year, month: day.month, day: day.day, hour, minute: +match[2] }, { disambiguation });
}
export const startIso = (event: Event) => event.startTime ? localDateTime(event.date, event.startTime, event.dstDisambiguation).toString({ timeZoneName: 'never' }) : event.date;
export const endIso = (event: Event) => event.endTime ? localDateTime(event.endDate || event.date, event.endTime, event.dstDisambiguation).toString({ timeZoneName: 'never' }) : undefined;
const startMs = (event: Event) => localDateTime(event.date, event.startTime || '12:00 AM', event.dstDisambiguation).epochMilliseconds;
const endMs = (event: Event) => event.endTime ? localDateTime(event.endDate || event.date, event.endTime, event.dstDisambiguation).epochMilliseconds : localDateTime(addDays(event.date, 1), '12:00 AM').epochMilliseconds;
export function phase(event: Event, now = new Date()): 'upcoming' | 'live' | 'completed' | 'past-date' | 'cancelled' | 'postponed' {
  if (event.status === 'cancelled' || event.status === 'postponed') return event.status;
  if (now.getTime() >= endMs(event)) return event.endTime ? 'completed' : 'past-date';
  return event.startTime && now.getTime() >= startMs(event) ? 'live' : 'upcoming';
}
export function statusLabel(event: Event, now = new Date()) {
  const value = phase(event, now);
  return ({ upcoming: event.status === 'rescheduled' ? 'Rescheduled' : 'Upcoming', live: event.endTime ? 'Happening now' : 'Started; end time unconfirmed', completed: 'This event has ended', 'past-date': 'Past event date', cancelled: 'Canceled', postponed: 'Postponed. New date to be announced.' })[value];
}
export function expandCatalog(catalog: Catalog, venues: Venue[]) {
  const result = [...catalog.events];
  for (const series of catalog.series) {
    if (!series.confirmedThrough || series.confirmedThrough < series.confirmedFrom || series.weekday < 1 || series.weekday > 7 || !Number.isInteger(series.intervalWeeks) || series.intervalWeeks < 1) throw new Error(`Invalid confirmed recurrence: ${series.id}`);
    const from = Temporal.PlainDate.from(series.confirmedFrom), through = Temporal.PlainDate.from(series.confirmedThrough);
    if (from.until(through).days > 366) throw new Error(`Review a shorter agreement window for ${series.id}`);
    let day = from.add({ days: (series.weekday - from.dayOfWeek + 7) % 7 });
    while (Temporal.PlainDate.compare(day, through) <= 0) {
      const date = day.toString();
      if (!series.excludedDates?.includes(date)) {
        const changes = series.overrides?.find(o => o.originalDate === date)?.changes || {};
        result.push({ ...series.template, date, ...changes, id: `${series.id}-${date}`, slug: `${date}-${series.id}`, seriesId: series.id, originalDate: date } as Event);
      }
      day = day.add({ weeks: series.intervalWeeks });
    }
    const overrideDates=new Set<string>();
    for (const override of series.overrides || []) {
      if (overrideDates.has(override.originalDate)) throw new Error(`Duplicate recurrence override: ${series.id}`);
      overrideDates.add(override.originalDate);
      if (override.originalDate < series.confirmedFrom || override.originalDate > series.confirmedThrough || localDateTime(override.originalDate,'12:00 PM').dayOfWeek !== series.weekday) throw new Error(`Override outside agreement: ${series.id}`);
    }
  }
  const errors = validateEvents(result, venues);
  if (errors.length) throw new Error(errors.join('\n'));
  return result.sort((a,b) => startMs(a) - startMs(b) || a.id.localeCompare(b.id));
}
export function validateEvents(events: Event[], venues: Venue[]) {
  const errors: string[] = [], ids = new Set<string>(), slugs = new Set<string>(), slots = new Set<string>();
  for (const e of events) {
    const fail = (message: string) => errors.push(`${e.id || '(missing ID)'}: ${message}`);
    if (!e.id || ids.has(e.id)) fail('Missing or duplicate ID'); ids.add(e.id);
    if (!e.slug || !/^[a-z0-9-]+$/.test(e.slug) || slugs.has(e.slug)) fail('Missing, invalid, or duplicate canonical slug'); slugs.add(e.slug);
    const v = venues.find(v => v.id === e.venueId);
    if (!v) fail('Unknown venue');
    if (isPublic(e) && (!v?.address || !v.city || !v.state || !/^\d{5}$/.test(v.zip) || !v.addressVerified)) fail('Full verified venue address required for publication');
    if (isPublic(e) && !e.startTime) fail('Confirmed start time required for publication');
    if (!e.visibility || !e.publicationStatus || !['public','private'].includes(e.visibility) || !['draft','review','published'].includes(e.publicationStatus)) fail('Explicit visibility and publication state required');
    if (!['scheduled','cancelled','postponed','rescheduled'].includes(e.status)) fail('Invalid event status');
    if (!CATEGORIES.includes(e.eventType as typeof CATEGORIES[number])) fail('Unknown category');
    if (!e.title || !e.description || !e.instructions || !e.image) fail('Title, description, image, and participation instructions required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) fail('Date must use YYYY-MM-DD');
    if (!Number.isFinite(Date.parse(e.lastUpdated))) fail('Last updated timestamp required');
    try { startMs(e); if (e.endTime && (!e.startTime || endMs(e) <= startMs(e))) fail('End must be after start, including overnight end date'); } catch (err) { fail(String(err)); }
    if (e.status === 'rescheduled' && (!e.previousStartDate || !Number.isFinite(Date.parse(e.previousStartDate)))) fail('Rescheduled events require the previous start date');
    if (e.admission?.kind !== 'unknown' && (!e.admission?.verified || (e.admission?.kind === 'paid' && (typeof e.admission.price !== 'number' || e.admission.price < 0 || !e.admission.currency)))) fail('Pricing must be verified and complete');
    if (e.admission?.kind === 'free' && e.admission.price && e.admission.price > 0) fail('A free event cannot have a positive admission price');
    if (!e.admission || !['unknown','free','paid'].includes(e.admission.kind)) fail('Admission must be explicit');
    for (const url of [e.registrationUrl,e.facebookEventUrl,...(e.externalListings || []).map(l=>l.url)].filter(Boolean)) if (!/^https:\/\//.test(url!)) fail('External links must use HTTPS');
    if (isPublic(e) && !['cancelled','postponed'].includes(e.status)) { const key = `${e.venueId}|${e.date}|${e.startTime || ''}`; if(slots.has(key)) fail('Conflicting public venue/date/time slot'); slots.add(key); }
  }
  return errors;
}
export type Filters = { now?: Date; city?: string; venue?: string; category?: string; from?: string; to?: string; price?: string; view?: string; limit?: number };
export function selectEvents(events: Event[], venues: Venue[], filters: Filters = {}) {
  const now = filters.now || new Date();
  return events.filter(e => {
    if (!isPublic(e)) return false;
    const state = phase(e, now), v = venues.find(v => v.id === e.venueId);
    if (filters.view === 'archive' ? !['completed','past-date'].includes(state) : filters.view === 'updates' ? !['cancelled','postponed'].includes(state) : !['upcoming','live'].includes(state)) return false;
    return (!filters.city || v?.city === filters.city) && (!filters.venue || e.venueId === filters.venue) && (!filters.category || e.eventType === filters.category || e.secondaryCategories?.includes(filters.category)) && (!filters.from || (e.endDate || e.date) >= filters.from) && (!filters.to || e.date <= filters.to) && (!filters.price || (e.admission.verified && e.admission.kind === filters.price));
  }).sort((a,b) => (startMs(a)-startMs(b)) * (filters.view === 'archive' ? -1 : 1)).slice(0, filters.limit || Infinity);
}
export function eventSchema(event: Event, venue: Venue) {
  if (!isPublic(event) || !venue.addressVerified || !event.startTime) return null;
  const url = `${SITE_URL}/events/${event.slug}/`;
  const status = { scheduled:'EventScheduled', cancelled:'EventCancelled', postponed:'EventPostponed', rescheduled:'EventRescheduled' }[event.status];
  const admission = event.admission;
  return {
    '@context': 'https://schema.org', '@type': 'Event', '@id': `${url}#event`, name: event.title, description: event.description,
    url, startDate: startIso(event), ...(endIso(event) ? {endDate:endIso(event)} : {}),
    eventStatus: `https://schema.org/${status}`, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.status === 'rescheduled' ? {previousStartDate:event.previousStartDate} : {}),
    image: [new URL(event.image,SITE_URL).href],
    location: { '@type':'Place', name:venue.name, address:{ '@type':'PostalAddress', streetAddress:venue.address, addressLocality:venue.city, addressRegion:venue.state, postalCode:venue.zip, addressCountry:'US' } },
    organizer: { '@type':'Organization', name:'Four Dogs Entertainment LLC', url:SITE_URL },
    ...(admission.verified && admission.kind !== 'unknown' ? {isAccessibleForFree: admission.kind === 'free', offers:{'@type':'Offer',url:event.registrationUrl || url,price:admission.kind === 'free' ? 0 : admission.price,priceCurrency:admission.currency || 'USD'}} : {}),
  };
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:TIME_ZONE}).format(new Date(`${date}T12:00:00Z`));
export function listingRevision(event: Event, venue: Venue) {
  // Track public facts, including shared venue changes. Saving tracking metadata
  // or a new lastUpdated timestamp must not invalidate a completed synchronization.
  const facts = {
    id:event.id, title:event.title, theme:event.theme, description:event.description,
    date:event.date, start:startIso(event), end:endIso(event) || null,
    status:event.status, previousStartDate:event.previousStartDate || null,
    venue:{id:venue.id,name:venue.name,address:venue.address,city:venue.city,state:venue.state,zip:venue.zip},
    admission:{kind:event.admission.kind,verified:!!event.admission.verified,price:event.admission.price ?? null,currency:event.admission.currency || null,note:event.admission.note || null},
    instructions:event.instructions, slug:event.slug, category:event.eventType,
    secondaryCategories:event.secondaryCategories || [], image:event.image,
    registrationUrl:event.registrationUrl || null,
  };
  return `sha256:${createHash('sha256').update(JSON.stringify(facts)).digest('hex')}`;
}
export function listingPackage(event: Event, venue: Venue) {
  if (!isPublic(event)) throw new Error('Only published public events can be distributed');
  const revision=listingRevision(event,venue);
  return { eventId:event.id, title:event.title, description:event.description, date:event.date, start:startIso(event), end:endIso(event) || 'Not confirmed', timeZone:TIME_ZONE, eventStatus:event.status, displayStatus:statusLabel(event), ...(event.previousStartDate ? {previousStartDate:event.previousStartDate} : {}), venue:venue.name, address:`${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`, admission:event.admission.verified ? event.admission.note || event.admission.kind : 'Admission has not been confirmed. Contact the venue.', instructions:event.instructions, url:`${SITE_URL}/events/${event.slug}/`, category:event.eventType, image:new URL(event.image,SITE_URL).href, lastUpdated:event.lastUpdated, listingRevision:revision, externalListings:(event.externalListings || []).map(l=>({...l,needsUpdate:l.syncedRevision !== revision || l.status !== 'current'})) };
}
