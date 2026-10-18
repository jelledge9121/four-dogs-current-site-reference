import fs from 'node:fs';
import path from 'node:path';
import { expandCatalog, selectEvents, listingPackage, addDays, localToday, type Catalog } from '../src/lib/event-system.ts';
import type { Venue } from '../src/data/venues.ts';
const load=(dir:string)=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`${dir}/${f}`,'utf8')));
const venues=JSON.parse(fs.readFileSync('src/data/venues.json','utf8')).venues as Venue[];
const catalog={events:load('src/data/events'),series:load('src/data/series')} as Catalog;
const events=expandCatalog(catalog,venues);
const output=path.resolve(process.argv[2] || 'artifacts/event-listing-packages');
fs.mkdirSync(output,{recursive:true});
const selected=selectEvents(events,venues,{from:localToday(),to:addDays(localToday(),30)});
const packages=selected.map(e=>listingPackage(e,venues.find(v=>v.id===e.venueId)!));
fs.writeFileSync(path.join(output,'event-listings.json'),JSON.stringify({generatedAt:new Date().toISOString(),note:'Prepared for review, not submitted. Website URLs become authoritative when this branch is deployed.',events:packages},null,2)+'\n');
for(const e of packages){
 fs.writeFileSync(path.join(output,`${e.eventId}.md`),`# ${e.title}\n\n${e.description}\n\nEvent status: ${e.displayStatus} (${e.eventStatus})\nDate: ${e.date}\nStart: ${e.start}\nEnd: ${e.end}\nTime zone: ${e.timeZone}\nVenue: ${e.venue}\nAddress: ${e.address}\nAdmission: ${e.admission}\nParticipation: ${e.instructions}\nEvent URL: ${e.url}\nCategory: ${e.category}\nImage: ${e.image}\nLast updated: ${e.lastUpdated}\n\nStatus: Prepared for review. Not submitted.\n`);
}
const tracker=events.filter(e=>e.externalListings?.length).map(e=>({eventId:e.id,title:e.title,lastUpdated:e.lastUpdated,listings:e.externalListings?.map(l=>({...l,needsUpdate:l.status!=='current'||l.syncedRevision!==e.lastUpdated}))}));
fs.writeFileSync(path.join(output,'external-listing-tracker.json'),JSON.stringify(tracker,null,2)+'\n');
fs.writeFileSync(path.join(output,'PUBLISHING-CHECKLIST.md'),`# Event distribution checklist\n\nThese packages have not been submitted. Deploy and verify the canonical website page before sharing a new URL.\n\n1. Confirm the date, local time, venue identity, address, admission, and age requirements.\n2. Start with one-time themed experiences and fundraisers. Keep ordinary weekly events in a manageable recurring listing when the platform supports exceptions.\n3. Submit the exact occurrence to the relevant community calendar. Experience Columbia requests at least seven working days for review: https://www.experiencecolumbiasc.com/columbia-sc-events/submit-an-event/\n4. Ask the venue owner to update their own Google Business Profile. Four Dogs does not control partner profiles.\n5. Update owned Facebook Events, Meetup, or Eventbrite listings using authorized platform access. Do not assume these services provide unrestricted publishing APIs.\n6. Record the external listing URL, platform, check date, and current website lastUpdated value as syncedRevision.\n7. Recheck after approval. Correct any price, venue, or time conversion errors.\n8. On a change, update the website record first, then every listing whose syncedRevision differs.\n\nUrgent: Saluda Mill Murder copies use Charter 803 as the headline venue and 6:30 PM UTC-05:00. The local start is 7:30 PM EDT (UTC-04:00), and the venue identity is Black Sheep Bourbon Society at the shared Charter Oak Road address. Claim the AllEvents listing before editing it. Do not reuse old remaining-ticket counts.\n`);
console.log(`Prepared ${packages.length} event packages and the external listing tracker in ${output}`);
