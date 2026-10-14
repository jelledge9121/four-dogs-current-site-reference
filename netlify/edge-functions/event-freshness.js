import { easternToday } from '../../src/lib/event-time.mjs';

// Astro remains static. Only these small, known HTML fragments are transformed.
// The build-time filter is also retained as a fallback and for local static QA.
export function refreshEvents(html, today, pathname) {
  let visible = 0;
  const max = pathname === '/' ? 6 : Infinity;
  html = html.replace(/<article\b[^>]*\bdata-event-date="(\d{4}-\d{2}-\d{2})"[^>]*>[\s\S]*?<\/article>/g,
    (card, date) => date < today || visible++ >= max ? '' : card);
  html = html.replace(/<div\b([^>]*\bdata-upcoming-list\b[^>]*)>([\s\S]*?)<\/div>/g,
    (grid, attrs, contents) => contents.includes('data-event-date=') ? grid : '<p>No dated events are currently listed. Check the weekly schedule and follow Four Dogs for theme announcements.</p>');
  const detailDate = html.match(/data-event-archive-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
  if (detailDate && detailDate < today) {
    html = html.replace(/<a\b[^>]*\bdata-future-only\b[^>]*>[\s\S]*?<\/a>/g, '');
    html = html.replace(/<(span|a)\b([^>]*\bdata-(past|future)-only\b[^>]*)>/g, (_, tag, attrs, state) => {
      attrs = attrs.replace(/\s+hidden(?:="[^"]*")?/g, '');
      return `<${tag}${attrs}${state === 'future' ? ' hidden' : ''}>`;
    });
    html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g, (script, json) => {
      try { return JSON.parse(json)['@type'] === 'Event' ? '' : script; } catch { return script; }
    });
  }
  return html.replace(/<item>[\s\S]*?<\/item>/g, item => {
    const date = item.match(/<fd:eventDate>(\d{4}-\d{2}-\d{2})<\/fd:eventDate>/)?.[1];
    return date && date < today ? '' : item;
  });
}

export default async (request, context) => {
  const response = await context.next();
  if (response.status !== 200 || !/text\/html|application\/rss\+xml/.test(response.headers.get('content-type') ?? '')) return response;
  const body = refreshEvents(await response.text(), easternToday(), new URL(request.url).pathname);
  const headers = new Headers(response.headers);
  // Never reuse a body validator or compressed byte count after changing HTML.
  for (const key of ['etag', 'content-length', 'content-encoding', 'last-modified']) headers.delete(key);
  headers.set('Cache-Control', 'no-store');
  return new Response(body, { status: response.status, headers });
};

export const config = {
  path: ['/', '/events', '/events/*', '/venues/*', '/areas/*', '/featured-events.xml'],
};
