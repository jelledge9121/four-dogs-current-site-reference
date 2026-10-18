// No personal data, cookies, or new network requests. Integrates with an existing collector.
declare global { interface Window { dataLayer?: Record<string,unknown>[]; } }
const record = (action:string, destination:string) => {
  const detail = { event:'four_dogs_action', action, destination };
  window.dispatchEvent(new CustomEvent('fourdogs:action',{detail}));
  if(Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
};
document.addEventListener('click',event=>{
  const anchor=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
  if(!anchor)return;
  const url=new URL(anchor.href,location.href);
  if(url.origin===location.origin && url.pathname.startsWith('/events/') && !['/events/','/events/feed.json'].includes(url.pathname) && !url.pathname.includes('/category/'))record('event_details',url.pathname);
  else if(url.origin===location.origin && url.pathname==='/booking/')record('booking_inquiry',url.pathname);
  else if(anchor.closest('.event-detail-hero') && url.origin!==location.origin)record('attendance_action',url.hostname);
});
document.querySelector<HTMLFormElement>('form[name="booking"]')?.addEventListener('submit',()=>record('booking_submit','/thank-you/'));
export {};
