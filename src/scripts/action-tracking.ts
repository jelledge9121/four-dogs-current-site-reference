// No personal data, cookies, or new network requests. Integrates with an existing collector.
declare global { interface Window { dataLayer?: Record<string,unknown>[]; } }
const record = (action:string, destination:string) => {
  const detail = { event:'four_dogs_action', action, destination };
  window.dispatchEvent(new CustomEvent('fourdogs:action',{detail}));
  if(Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
};
document.addEventListener('click',event=>{
  const anchor=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
  if(!anchor || anchor.getAttribute('href')?.startsWith('#'))return;
  const url=new URL(anchor.href,location.href);
  if(anchor.dataset.eventAction)record(anchor.dataset.eventAction,url.origin===location.origin?url.pathname:url.hostname);
  else if(url.origin===location.origin && url.pathname.startsWith('/events/') && !['/events/','/events/feed.json'].includes(url.pathname) && !url.pathname.includes('/category/'))record('event_details',url.pathname);
  else if(url.origin===location.origin && url.pathname==='/booking/')record('booking_form_open',url.pathname);
  else if(anchor.closest('.event-detail-hero') && url.origin!==location.origin)record('attendance_action',url.hostname);
});
document.querySelector<HTMLFormElement>('form[name="booking"]')?.addEventListener('submit',event=>{
  const form=event.currentTarget as HTMLFormElement;
  const service=new FormData(form).get('service');
  record(service==='Venue Entertainment'?'venue_partnership_inquiry_attempt':'booking_submission_attempt','/booking/');
});
window.addEventListener('fourdogs:booking-accepted', () => record('booking_submission_accepted','/booking/'));
// Keep attribution on the native Netlify submission so accepted requests can be
// counted by service, even when no analytics collector is configured.
try {
  const referrer = document.referrer ? new URL(document.referrer) : null;
  const key = 'fourdogs-entry-v1';
  if (!sessionStorage.getItem(key) || (referrer && referrer.origin !== location.origin)) {
    const params = new URLSearchParams(location.search);
    const medium = params.get('utm_medium')?.toLowerCase();
    const paid = params.has('gclid') || params.has('msclkid') || ['paid','cpc','ppc','paid_social'].includes(medium || '');
    const search = /(^|\.)(google\.com|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(referrer?.hostname || '');
    const channel = paid ? 'paid' : medium && medium !== 'organic' ? 'campaign' : search || medium === 'organic' ? 'organic search' : referrer && referrer.origin !== location.origin ? 'referral' : 'direct or unknown';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const page = canonical ? new URL(canonical.href).pathname : '';
    sessionStorage.setItem(key, JSON.stringify({ channel, page }));
  }
  const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
  const form = document.querySelector<HTMLFormElement>('form[name="booking"]');
  if (form) {
    for (const [name, value] of [['entry-channel', entry.channel], ['entry-page', entry.page]]) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement && typeof value === 'string') field.value = value;
    }
    record('booking_page_view', location.pathname);
  }
} catch {
  // Browsers that disable session storage can still submit the native form.
}
export {};
