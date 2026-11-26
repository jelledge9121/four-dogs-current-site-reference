import type { APIRoute } from 'astro';
import {bookingActions, bookingServices, channels, isInquiryId, publicHost} from '../../lib/booking-metrics';
export const prerender = false;

// Only aggregate dimensions and a random event ID leave the browser.
// Form acceptance and sales reconciliation still come from Netlify Forms.
export const POST: APIRoute = async ({request, url}) => {
  const headers = {'Cache-Control':'no-store','X-Robots-Tag':'noindex'};
  const finish = (status: number) => new Response(null, {status,headers});
  if (!publicHost(url.hostname) || request.headers.get('origin') !== url.origin) return finish(403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return finish(415);
  try {
    const raw = await request.text();
    if (raw.length > 512) return finish(413);
    const {action,service,channel,id} = JSON.parse(raw);
    if (!bookingActions.includes(action) || !channels.includes(channel) || !isInquiryId(id) ||
        !(bookingServices.includes(service) || service === 'unspecified')) return finish(400);
    console.info(JSON.stringify({type:'four_dogs_booking_metric',action,service,channel,id}));
    return finish(204);
  } catch { return finish(400); }
};
