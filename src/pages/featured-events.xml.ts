import type { APIRoute } from 'astro';
import { events } from '../data/events';

const siteUrl = 'https://4dogsentertainment.com';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const GET: APIRoute = () => {
  const featuredEvents = events
    .filter(
      (event) =>
        event.status === 'scheduled' &&
        event.featured &&
        Boolean(event.registrationUrl),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    );

  const items = featuredEvents
    .map((event) => {
      const actionUrl = event.registrationUrl!;
      const eventPageUrl = `${siteUrl}/events/${event.slug}/`;
      const dateLabel = formatEventDate(event.date);
      const timeLabel = event.startTime ? ` at ${event.startTime}` : '';
      const ctaLabel = event.registrationLabel ?? 'Learn more';
      const description = `${event.shortDescription} ${dateLabel}${timeLabel}. ${ctaLabel}.`;

      return `    <item>
      <title>${escapeXml(`${event.title} | ${dateLabel}`)}</title>
      <link>${escapeXml(actionUrl)}</link>
      <guid isPermaLink="true">${escapeXml(eventPageUrl)}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(event.eventType)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Four Dogs Entertainment Featured Events</title>
    <link>${siteUrl}/events/</link>
    <description>Featured Four Dogs Entertainment events with direct signup and ticket links.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/featured-events.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
