import {bookingServices, publicHost} from '../lib/booking-metrics';
declare global { interface Window { dataLayer?: Record<string,unknown>[]; } }

const params = new URLSearchParams(location.search);
const form = document.querySelector<HTMLFormElement>('form[name="booking"]');
const select = form?.querySelector<HTMLSelectElement>('[name="service"]');
const production = publicHost(location.hostname);
const campaignKeys = ['source','medium','campaign','term','content'] as const;
const cleanTag = (value: string | null) =>
  value && /^[a-z0-9][a-z0-9 _.:-]{0,79}$/i.test(value) && !/\d{7}/.test(value) ? value : '';
function firstTouch() {
  const ref = document.referrer ? new URL(document.referrer) : undefined;
  const hostname = ref && ref.origin !== location.origin ? ref.hostname : '';
  const medium = cleanTag(params.get('utm_medium')).toLowerCase();
  const paid = ['gclid','msclkid'].some(key => params.has(key)) ||
    ['paid','paid_social','cpc','ppc','display','paid_search'].includes(medium);
  const organic = medium === 'organic' || /(^|\.)(google\.com|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(hostname);
  const tagged = campaignKeys.some(key => params.has('utm_' + key));
  const channel = paid ? 'paid' : medium === 'organic' ? 'organic search' : tagged ? 'campaign' :
    organic ? 'organic search' : hostname ? 'referral' : 'direct or unknown';
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const entry: Record<string,string> = {'entry-channel':channel,'entry-page':canonical ? new URL(canonical.href).pathname : location.pathname,'entry-referrer':hostname};
  for (const key of campaignKeys) entry['utm-'+key] = cleanTag(params.get('utm_'+key));
  return entry;
}
let entry = firstTouch();
let test = !production || params.get('fde_test') === '1';
try {
  const saved = sessionStorage.getItem('fourdogs-entry-v2');
  if (saved) entry = JSON.parse(saved);
  else sessionStorage.setItem('fourdogs-entry-v2', JSON.stringify(entry));
  if (test) sessionStorage.setItem('fourdogs-test','1');
  test ||= sessionStorage.getItem('fourdogs-test') === '1';
} catch { /* Native form still works when storage is unavailable. */ }
function field(name:string) {
  const input = form?.elements.namedItem(name);
  return input instanceof HTMLInputElement ? input : undefined;
}
for (const [name,value] of Object.entries(entry)) {
  const input=field(name);
  if (input) input.value=value;
}
const inquiry = field('inquiry-id');
if (inquiry) inquiry.value=window.crypto.randomUUID?.() || '';
const testField = field('test-inquiry');
if (testField) testField.value=test?'yes':'no';

const knownService = (value?:string|null) => value && bookingServices.includes(value) ? value : 'unspecified';
function record(action:string, destination:string, service = 'unspecified', id?:string) {
  if (test) return;
  const detail = {event:'four_dogs_action',action,destination,service,channel:entry['entry-channel']};
  window.dispatchEvent(new CustomEvent('fourdogs:action',{detail}));
  if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  if (id) {
    const body=JSON.stringify({id,action,service,channel:detail.channel});
    void fetch('/api/booking-metrics', {method:'POST',body,headers:{'Content-Type':'application/json'},
      credentials:'omit',referrerPolicy:'no-referrer',keepalive:true}).catch(()=>{});
  }
}
document.addEventListener('click',event=>{
  const anchor=(event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null);
  if (!anchor || anchor.getAttribute('href')?.startsWith('#')) return;
  const url=new URL(anchor.href,location.href);
  if (url.origin===location.origin && url.pathname==='/booking/') {
    record('booking_form_open','/booking/',knownService(url.searchParams.get('service')),window.crypto.randomUUID?.());
    if (anchor.dataset.eventAction==='venue_partnership_cta') record('venue_partnership_cta','/booking/','Venue Entertainment');
  } else if (anchor.dataset.eventAction) record(anchor.dataset.eventAction,url.origin===location.origin?url.pathname:url.hostname);
  else if (url.origin===location.origin && url.pathname.startsWith('/events/') && !['/events/','/events/feed.json'].includes(url.pathname) && !url.pathname.includes('/category/')) record('event_details',url.pathname);
  else if (anchor.closest('.event-detail-hero') && url.origin!==location.origin) record('attendance_action',url.hostname);
});
if (form) record('booking_page_view','/booking/',knownService(select?.value));
form?.addEventListener('submit',()=>record(select?.value==='Venue Entertainment'?'venue_partnership_inquiry_attempt':'booking_submission_attempt','/booking/',knownService(select?.value)));
let accepted = false;
form?.addEventListener('input', () => {
  if (!accepted || !inquiry) return;
  inquiry.value = window.crypto.randomUUID?.() || '';
  accepted = false;
});
window.addEventListener('fourdogs:booking-accepted',()=>{
  if (!form || test || !inquiry || accepted) return;
  accepted = true;
  const id=inquiry.value;
  try {
    const key='fourdogs-accepted-'+id;
    if (id && sessionStorage.getItem(key)) return;
    if (id) sessionStorage.setItem(key,'1');
  } catch { /* The in-memory flag also deduplicates when storage is blocked. */ }
  record('booking_submission_accepted','/booking/',knownService(select?.value),id);
});
