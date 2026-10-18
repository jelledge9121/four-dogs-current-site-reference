# External event distribution

The website's canonical event page is the public source of truth. This branch prepares public JSON feeds, one-event listing packages, and a downloadable export command. It does not create accounts, submit listings, or claim partner profiles.

| Channel | Prepared support | Remaining action |
| --- | --- | --- |
| Google event discovery | JSON-LD on each eligible occurrence; event sitemap; crawlable links | Representative Rich Results and Schema.org tests passed; submit/inspect the production sitemap in Search Console with authorized access |
| Venue Google Business Profiles | Exact occurrence URL and listing text | Venue owner publishes or corrects their own listing |
| Facebook Events | Dated title, description, location, price, canonical URL, and image reference | Update Four Dogs-owned events through authorized Facebook access |
| Meetup | Same listing package | Verify organizer access and recurring-event exception support |
| Eventbrite | Same listing package | Review four inherited recurring series links before reusing them for dated events |
| Experience Columbia SC | Ready-to-submit occurrence packages | Submit qualifying events at least seven working days ahead, subject to editorial approval |
| Lexington-area calendars | Same listing package | Verify current submission rules and eligibility before submitting |
| AllEvents and syndicated calendars | Revision tracking and urgent correction notes | Claim the existing murder-mystery listing, then correct venue identity and time |

Experience Columbia submission page: https://www.experiencecolumbiasc.com/columbia-sc-events/submit-an-event/
Lexington Chamber calendar: https://lexingtonsc.org/community-events
South Carolina Midlands calendar: https://www.lakemurraycountry.com/events/

## Inherited recurring Eventbrite links

These were automatically applied to individual events by the old page template. They are now retained for review rather than treated as verified tickets for every themed occurrence.

- Charter trivia: https://www.eventbrite.com/e/trivia-at-charter-803-hosted-by-four-dogs-entertainment-tickets-1998508023296
- Top Dawg trivia: https://www.eventbrite.com/e/weekly-trivia-at-top-dawg-tavern-ne-hosted-by-four-dogs-entertainment-tickets-1998507457604
- Charter Music Bingo: https://www.eventbrite.com/e/music-bingo-at-charter-803-hosted-by-four-dogs-entertainment-tickets-1998507656198
- WesCo trivia: https://www.eventbrite.com/e/weekly-trivia-at-wesco-brew-and-bowl-hosted-by-four-dogs-entertainment-tickets-1998507141659

## Urgent murder-mystery correction

AllEvents' October 13 organizer notice and syndicated public copies identify Charter 803 as the primary venue and show 6:30 PM UTC-05:00. The confirmed local start is October 30 at 7:30 PM EDT, UTC-04:00. Use **Black Sheep Bourbon Society** as the venue identity. Its street address is shared with Charter 803 at 269 Charter Oak Road; verify entry instructions rather than sending guests to an assumed entrance. The ticket is $25 per person including the first drink, ages 21+ with valid photo ID. Do not republish stale remaining-ticket counts.

Update the website record first. After each platform correction, record the external URL, verification date, status, and matching website revision from `/admin/distribution/`. A cancellation or reschedule requires updating all previously submitted listings, even when the event no longer appears in the upcoming feed.
