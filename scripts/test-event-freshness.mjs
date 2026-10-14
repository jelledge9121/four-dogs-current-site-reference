import assert from 'node:assert/strict';
import fs from 'node:fs';
import { refreshEvents, default as handler } from '../netlify/edge-functions/event-freshness.js';
import { easternToday, localIsoDateTime } from '../src/lib/event-time.mjs';

assert.equal(easternToday(new Date('2026-10-15T03:59:59Z')), '2026-10-14');
assert.equal(easternToday(new Date('2026-10-15T04:00:00Z')), '2026-10-15');
assert.equal(localIsoDateTime('2026-10-30', '7:30 PM'), '2026-10-30T19:30:00-04:00');
assert.equal(localIsoDateTime('2026-11-05', '6:30 PM'), '2026-11-05T18:30:00-05:00');
assert.equal(localIsoDateTime('2026-11-05'), '2026-11-05');
const calendar = fs.readFileSync('dist/events/index.html', 'utf8');
for (const today of ['2026-10-15', '2026-10-31', '2027-01-01']) {
  const html = refreshEvents(calendar, today, '/events/');
  for (const [, date] of html.matchAll(/data-event-date="([^"]+)"/g)) assert.ok(date >= today);
  if (today === '2027-01-01') assert.ok(html.includes('No dated events are currently listed.'));
}
const home = refreshEvents(fs.readFileSync('dist/index.html', 'utf8'), '2026-10-20', '/');
assert.equal([...home.matchAll(/data-event-date="/g)].length, 6);
const slug = 'murder-mystery-black-sheep-bourbon-society-charter-803-2026-10-30';
const event = fs.readFileSync(`dist/events/${slug}/index.html`, 'utf8');
assert.ok(event.includes('Black Sheep Bourbon Society'));
const schema = [...event.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(s=>s['@type']==='Event');
assert.equal(schema.location.name, 'Black Sheep Bourbon Society');
assert.equal(schema.location.address, undefined); // Never reuse Charter's unverified address.
const archive = refreshEvents(event, '2026-10-31', `/events/${slug}/`);
assert.ok(!archive.includes('"@type":"Event"'));
assert.ok(!archive.includes('https://form.jotform.com/262725992611059'));
assert.match(archive, /<span data-past-only>This event has passed<\/span>/);
const rss = refreshEvents(fs.readFileSync('dist/featured-events.xml', 'utf8'), '2027-01-01', '/featured-events.xml');
assert.ok(!rss.includes('<item>'));
const response = await handler(new Request('https://example.com/events/'), { next: async () => new Response(calendar, { headers: { 'Content-Type': 'text/html', 'ETag': 'old', 'Content-Length': '1', 'Content-Encoding': 'gzip', 'X-Test': 'preserved' } }) });
assert.equal(response.headers.get('etag'), null);
assert.equal(response.headers.get('content-length'), null);
assert.equal(response.headers.get('content-encoding'), null);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.equal(response.headers.get('x-test'), 'preserved');
console.log('Event freshness QA passed: Eastern midnight, DST offsets, future-day listings, homepage cap, empty states, archive CTA/schema, RSS, and response headers.');
