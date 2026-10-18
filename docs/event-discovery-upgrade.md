# Event discovery implementation status

Prepared October 17, 2026, America/New_York. Implemented on `event-discovery-upgrade-2026-10-17`. Production deployment and hosted acceptance checks are pending. No production release or external calendar submission is claimed.

## Baseline and recovery

Production website: https://4dogsentertainment.com
Existing platform: Astro 5.18.2, static output, Netlify hosting and Netlify Forms, GitHub-backed TypeScript event and venue arrays. No separate event database or CMS was found in the source.

Production commit: `1795bfd0a9b7f28d148a5065359557b53cf3c2a2`
Production deploy: `6acf6e6b2863452a7ab52b47`
Remote recovery branch: `backup/event-discovery-2026-10-17`

The original source, assets, and event facts remain in Git history. A bad published change can be fixed by reverting the implementation commit and letting the existing successful-build deployment process run. No database migration or destructive content deletion is required.

## Confirmed problems

- Upcoming-event filtering returned every scheduled record unless a caller supplied a date, exposing expired July through October events in initial HTML.
- Status labels were duplicated as hidden browser-only text, leaving future events associated with past/archive wording in crawled output.
- The murder mystery's venue record and primary venue identity were Charter 803. The correct event venue identity is Black Sheep Bourbon Society, at the shared Charter Oak Road address.
- WesCo records still used 6:30 PM despite the venue-approved move to 7 PM effective October 20.
- Event JSON-LD omitted time-zone offsets and known end times, and could attach generic recurring Eventbrite offers without a verified date or price.
- Calendar pages lacked server-side city, venue, category, date, and verified-price filters.
- Aura's four confirmed trial dates were missing.
- The public source had no nontechnical event editor, bounded recurrence rules, or external listing revision tracking.
- External murder-mystery copies contain inconsistent time-zone labeling and require organizer review.

## Implemented

One authoritative public content graph now lives in `src/data/events/*.json`, `src/data/series/*.json`, and `src/data/venues.json`. Shared validation, recurrence generation, status handling, filtering, schema, and distribution exports live in `src/lib/event-system.ts`. Old duplicate event arrays were removed after migration.

Date-sensitive homepage, calendar, event, venue, city, activity, feed, and sitemap routes render on request using the Astro Netlify adapter. Service pages, booking form, testimonials, photography, and other existing features remain static. The shared color tokens now use the explicitly requested navy #0C0F26, cyan #29C4DC, and cream #F2F0E8; typography and layout structure are retained. Response caching is disabled for date-sensitive routes so expired events do not persist until a rebuild.

The calendar defaults to 30 days and supports normal HTML GET filters. Every eligible occurrence has a canonical page. Original URLs are retained except the misleading murder-mystery URL, which has explicit 301 redirects to a venue-correct canonical URL.

The murder-mystery venue identity, title, 7:30 PM start, $25 admission, first-drink inclusion, and 21+ photo-ID requirement are corrected. Its calendar placeholder end time is deliberately omitted. WesCo's October 20 start is 7 PM. Its October 27 theme conflict is placed into review instead of silently resolved. Aura's recurring series stops on November 12.

JSON-LD uses explicit EDT/EST offsets, verified location and organizer data, known end times, status/previous-date handling, and verified prices only. The sitemap includes stable public occurrences and excludes private, draft, and unresolved-review records. Googlebot and OAI-SearchBot are explicitly allowed; existing public-site protections are preserved. The admin route alone has the narrower third-party access needed for editor authentication.

The editor configuration supports event facts, venue changes, status changes, photographs, admission, registration, recurrence bounds, exceptions, and external listing tracking. Its GitHub OAuth connection and publish flow have not been authenticated or tested. Host assignments remain in the existing private staffing calendar because the source repository is public.

## Verification

Automated behavior tests, Astro checks, static-output QA, and request-based rendering QA are part of the build. See the generated completion report for final counts. These checks cover schedule ordering, expiry at known end time, overnight events, DST gaps and repeated hours, private/draft suppression, bounded recurrences, exceptions, filters, metadata, JSON-LD, links, sitemap, and preserved booking markup.

Pending: hosted preview, phone/browser and keyboard testing, editor login and image-upload round trip, a preview booking-form submission, hosted ticket-link checks, Google Rich Results Test, Schema.org validator, Search Console access, and production deployment. Browser QA could not be performed with the available supported website workflow. The available Netlify connector exposes project/deploy inspection but no callable deployment operation. GitHub branch and pull-request preparation are available.

## Fact review queue

- WesCo October 27: website says Movies, Music & Monsters; staffing calendar says Strange But True Trivia. Keep under review until confirmed.
- Existing November/December themes: tentative planning and generic staffing recurrences do not establish final themes or the venue agreement end. Nine existing future records remain under review.
- Aura October 29, November 5, and November 12: dates and 7:30–9:30 PM are confirmed; theme proposals conflict. The public series uses the confirmed Music Bingo format until the final themes are selected.
- WesCo Thursday karaoke: recent correspondence proposes a change, but does not establish a final date, time, and replacement agreement. No Thursday occurrence was invented and Tuesday was not automatically canceled.
- Additional DJ/community bookings in the staffing calendar need confirmation of public admission and permission to advertise before importing. Private weddings and confidential client details were not copied.

## External distribution and weekly operation

The next-30-days export command generates submission-ready packages and an update tracker. No external platform listing was submitted, no account created, and no subscription purchased. Use `docs/event-distribution.md` for priorities and source links. Use `docs/event-admin-guide.md` for adding, reviewing, publishing, canceling, and updating events.

Weekly: confirm the next two weeks; edit public records and exceptions once; review the build and mobile preview; publish; then synchronize outside listings using the recorded website revision. Extend a recurring agreement only after the venue confirms its next dates.
