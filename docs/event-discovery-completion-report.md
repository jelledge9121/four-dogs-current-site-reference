# Four Dogs Entertainment: Website Upgrade Completion Report

Prepared October 17, 2026, America/New_York.

**Published and verified on the real 4dogsentertainment.com website. The public event infrastructure is live. Nontechnical editor authentication remains pending Netlify OAuth setup.**

Website: https://4dogsentertainment.com/events/
Implementation and review: https://github.com/jelledge9121/four-dogs-current-site-reference/pull/13
Production merge: `9dd9c30d91ac473adf6c067b743a06f553f8afae`
Production deployment: `6ad438635154bc12862388bf`

The repository name includes “reference.” Its original main commit exactly matched the real Netlify production deployment. The work was implemented on a separate branch, tested in a deploy preview, and merged through the existing production deployment path. The separate ChatGPT reference Site was not modified.

## Owner-confirmed admission update

Published to the real site in commit `23c8fedba355fe7b20939a45c69daad79f3b2b85`, Netlify deployment `6ad43de3a9576a7e6b8de505`. All 28 behavior tests and all 10 admission-specific preview and production checks passed. The current calendar has 16 free events and one ticketed murder mystery.

Joey confirmed that all Four Dogs public events have free admission except murder mystery events. All non-murder-mystery public occurrences and recurring templates now record verified $0 admission. Guest-facing cards, event pages, venue FAQs, filters, metadata, JSON-LD, feeds, and listing packages reflect this. The Saluda Mill Murder remains $25 including the first drink, ages 21+ with valid photo ID. Admission-confirmation notices and the technical feed link were removed from the guest calendar. Records with unresolved themes or dates remain in review.

## 1. Problems discovered

The actual live website, original source, Netlify production record, routing, event records, sitemap, robots.txt, and representative pages were inspected before changes. The existing stack was Astro 5.18.2, TypeScript event and venue arrays, GitHub, Netlify hosting, and Netlify Forms. No separate event database or content editor was found.

Confirmed issues included:

- Upcoming selection could return expired records when no reference date was supplied. July, August, September, and older October dates appeared in current discovery output.
- Initial HTML included hidden past/archive status copy on future event pages. Status depended on browser-side handling instead of one server-generated answer.
- The October 30 murder mystery used Charter 803 as its venue identity. Its actual venue is Black Sheep Bourbon Society at the shared 269 Charter Oak Road address.
- WesCo public records still used 6:30 PM after the venue approved a 7 PM start effective October 20.
- JSON-LD omitted explicit Eastern Time offsets and known end times. Generic recurring ticket links could be attached to individual themed occurrences without verification.
- Current listings lacked server-rendered city, venue, activity, date, and verified-price filters. Aura’s four confirmed trial dates were absent.
- Event copy, status, recurrence exceptions, and outside-listing updates lacked one maintainable workflow.
- Syndicated murder-mystery copies used inconsistent venue identity and time-zone labeling.

Some reported scheduling problems were conflicts rather than confirmed corrections. Those records were flagged for review instead of silently overwritten.

## 2. Changes implemented

The existing Astro site was upgraded without a full rebuild. Navigation, service pages, contact information, booking forms, authentic photography, testimonials, and existing content remain. Shared colors now use the requested navy #0C0F26, cyan #29C4DC, and cream #F2F0E8. The exact tagline is preserved: **Bring your people. We’ll bring the Doggone Good Time.**

The homepage now derives its next events from the same confirmed catalog as the calendar. Date-sensitive pages render on request rather than retaining an obsolete schedule until the next build. Those responses use no-store caching. Static service and booking pages remain static.

The calendar defaults to the next 30 days, orders events chronologically, and supports ordinary HTML filters for city, venue, category, date range, and verified free or ticketed admission. It includes empty states, more dates, historical events, and a separate cancellation/update view. Event cards show date, time, venue, city, activity, status, and a details link.

Each eligible occurrence has one canonical details page. Existing URLs are retained where reasonable. The misleading murder-mystery URL redirects permanently to:

https://4dogsentertainment.com/events/2026-10-30-saluda-mill-murder-black-sheep-bourbon-society-lexington-sc/

That page identifies Black Sheep Bourbon Society, October 30 at 7:30 PM EDT, $25 including the first drink, and ages 21+ with valid photo ID. Its unconfirmed end time is omitted. WesCo October 20 now starts at 7 PM. Aura generates only October 22, October 29, November 5, and November 12, from 7:30 to 9:30 PM.

Existing venue and city pages draw their actual events from this catalog. Separate verified Aura and Black Sheep identities are included. Pages do not attribute Cayce events to Lexington or invent dates in Irmo and Chapin.

## 3. Event system architecture

The authoritative public catalog is stored in the existing Git repository:

| Source | Purpose |
| --- | --- |
| `src/data/events/*.json` | 82 migrated dated records, including historical and review records |
| `src/data/series/*.json` | Bounded recurring agreements and dated exceptions |
| `src/data/venues.json` | Shared verified venue identities, addresses, cities, and page relationships |
| `src/lib/event-system.ts` | Validation, recurrence, status, filtering, schema, and listing packages |
| `/admin/` | Decap CMS editor configuration; OAuth connection still pending |
| `/admin/distribution/` | Working read-only listing desk with copy buttons and update status |

Four generated Aura occurrences produce 86 total dated records; 76 are eligible public records, including historical dates. Ten unresolved records remain in review and are excluded from current listings, feeds, event schema, and the public sitemap. Existing review URLs display a confirmation notice with noindex.

The model supports title/theme, description, category, explicit public/private and publication state, shared venue, dates, start/end times, verified admission, instructions, registration, images, status, SEO metadata, timestamps, and outside-listing tracking. Internal host assignments remain in the existing private staffing calendar because this repository is public. No private wedding or confidential client information was imported.

Recurring generation requires a confirmed start and final agreement date. An occurrence can override theme, date, venue, time, status, description, admission, or instructions while retaining its identity and URL. Excluded dates and cancellation notices are distinct choices.

Known end times control expiry exactly. Overnight events and daylight saving transitions use America/New_York with explicit offsets. An unknown end is never invented or labeled completed at a guessed hour; after its date, the page uses “Past event date.” Canceled and postponed events retain their page and original date. Rescheduled events preserve the canonical URL and expose the previous start.

Build validation rejects missing or duplicate IDs/slugs, invalid dates/times, unknown venues, unverified addresses, unsupported categories, incomplete verified pricing, invalid end times, and duplicate public venue/date/time slots. Private/draft records cannot enter public outputs.

## 4. Search optimization

Event JSON-LD now matches visible facts: actual venue/address, Four Dogs Entertainment LLC as organizer, explicit EDT/EST dates, known ends only, cancellation/postponement/rescheduling status, images, and verified offers only. Unknown prices, durations, reviews, ticket availability, and age suitability are not fabricated.

The event sitemap is generated from the same public catalog at `/event-sitemap.xml` and included in `/sitemap-index.xml`. `/sitemap.xml` redirects to the index. Private, draft, review, and admin routes are excluded. Stable canonicals, crawlable links, venue/city relationships, and activity pages support ordinary search discovery without requiring JavaScript or login.

Googlebot and OAI-SearchBot are allowed by robots.txt for public content. Admin paths are disallowed and noindexed. Existing public-site security headers remain. The editor alone permits the official pinned Decap script, GitHub/Netlify connections, and the runtime compilation required by its schema validator.

Public JSON and RSS feeds are available at `/events/feed.json` and `/featured-events.xml`. Individual listing JSON is available below each event URL at `listing.json`.

Search Console submission and indexing inspection were not performed because authorized Search Console access was not available. Crawlability and valid data improve eligibility; they do not guarantee rankings, Google event placement, or inclusion in ChatGPT answers.

## 5. Testing results

| Check | Result |
| --- | --- |
| Behavior regression suite | 28 tests passed |
| Astro type/template checks | 0 errors, 0 warnings; 1 existing deprecated iframe-attribute hint |
| Static page QA | 37 pages passed metadata, internal link/asset, and booking-markup checks |
| Built request-rendering QA | 129 dynamic routes, 137 rendered requests, 76 Event schemas passed |
| Ordering, expiry, live status, archives | Passed |
| Bounded recurrence, skip/change/cancel/reschedule exceptions | Passed |
| Spring DST gap, repeated fall hour, offsets, overnight expiry | Passed |
| City, venue, category, date, verified-price filtering | Passed |
| Private/draft/review suppression and host-field export protection | Passed |
| Shared venue and outside-listing revision updates | Passed; recording synchronization does not create a false alert |
| Phone-width calendar, 320 px and 390 px | Passed without horizontal overflow |
| Mobile navigation, keyboard focus, city filter interaction | Passed |
| Murder-mystery details and venue identity | Passed in hosted preview |
| Booking form UI, required fields, service-dependent holiday options | Passed; existing Netlify fields and action preserved |
| Both public Jotform ticket links | HTTP 200 |
| Listing desk and copy button | Passed in hosted preview |
| Google Rich Results Test | Two representative preview pages passed. The live murder-mystery page was crawled successfully and has one valid Event and one valid Breadcrumb eligible for rich results; optional warnings only |
| Schema.org Validator | Murder-mystery page: zero errors and zero warnings |
| Public crawler user-agent requests | HTTP 200 for Googlebot and OAI-SearchBot; not a claim of verified crawler-IP traffic |
| Production smoke checks | 66/66 passed across 30 HTTP requests; permanent redirects also verified |
| Editor login/upload/save/publish round trip | Blocked: Netlify OAuth endpoint returns Not Found |
| Booking submission delivery | Not sent; sending would notify existing production recipients |
| Search Console indexing and outside-platform updates | Pending authorized access |

Netlify intentionally noindexes deploy previews. Google detected their valid structured data but reported that those preview URLs are not indexable. Production checks confirm public pages have no accidental noindex, and Google successfully crawled the live page. Test result: https://search.google.com/test/rich-results/result?id=LrUtsBHebQSMXfPxEct_tg

The calendar uses server-rendered HTML and native forms, with no new client calendar framework. A preview calendar fetch returned approximately 26.6 KB of HTML in 3.75 seconds from this environment. These are environment-specific fetch observations, not Lighthouse or field-performance scores. Existing photography and media were preserved. No full Lighthouse or real-device network audit was available.

The original source and production deploy remain recoverable:

- Original commit: `1795bfd0a9b7f28d148a5065359557b53cf3c2a2`
- Original Netlify deploy: `6acf6e6b2863452a7ab52b47`
- Backup branch: `backup/event-discovery-2026-10-17`

Rollback can republish the original known-good Netlify deployment through an authorized administrator or revert the merged change and let the existing deployment pipeline rebuild. No database migration or destructive content deletion occurred.

## 6. External distribution

The website feeds, 17 next-30-day listing packages, per-event JSON, publishing checklist, and outside-listing tracker are prepared. `/admin/distribution/` supplies copyable event text and shows tracked pages needing attention. Its website revision depends on public event and venue facts, so a shared address correction flags affected listings automatically.

No Facebook, Meetup, Eventbrite, Experience Columbia, chamber, or syndicated listing was submitted or changed. No account or subscription was created. No partner Google Business Profile was claimed. Platform publishing APIs were not assumed to be available.

Priorities:

1. Correct existing Saluda Mill Murder copies through organizer-authorized access. Use Black Sheep Bourbon Society and 7:30 PM EDT, UTC-04:00, on October 30. AllEvents still requires a claim; other syndicated copies need review.
2. Submit important themed experiences and fundraisers to appropriate calendars. Experience Columbia requests seven working days for review; near-term events may miss that window.
3. Update Four Dogs-owned Facebook, Meetup, and Eventbrite records through their existing organizer accounts. Review inherited generic Eventbrite series before reusing them for dated occurrences.
4. Ask each venue owner to update their own Google Business Profile with the correct canonical occurrence URL.
5. Keep ordinary weekly events in manageable recurring listings when the platform supports exceptions. Record external URLs, check dates, status, and synchronized website revision.

The attached packages include exact titles, descriptions, dates, offsets, venues/addresses, admission notes, participation instructions, categories, image references, canonical URLs, and a checklist. They remain unsubmitted.

## 7. Ongoing weekly procedure

1. Confirm the next two weeks with venue partners. Resolve theme, timing, address, admission, and participation conflicts.
2. Update the public occurrence or its series exception once. Keep uncertain records in review. Extend recurring dates only after the venue approves the new agreement window.
3. Review the generated preview, mobile calendar, affected venue page, ticket link, and any status change. Publish only after checks pass.
4. Open the listing desk. Prioritize one-time events and update every previously published copy affected by a change, including canceled or past dates.
5. Record each outside URL and website revision after checking the published listing. Let date-driven handling archive finished events automatically.

The separate administrator guide explains field entry, cancellations, postponements, rescheduling, images, recurring exceptions, and the one-time editor connection. Until OAuth is connected, an authorized repository maintainer must make the same public-content changes through GitHub and the tested build/preview workflow.

## 8. Remaining work and access needed

- **Editor OAuth:** a Netlify project administrator must configure GitHub OAuth for the existing site. The editor configuration loads, but its sign-in endpoint returns Not Found. Authentication, image upload, and save/publish cannot be claimed as working until that round trip is verified.
- **Schedule confirmation:** WesCo October 27 has conflicting themes, and nine November/December theme records lack sufficient confirmation. They remain in review. Aura October 29, November 5, and November 12 use the confirmed Music Bingo format because final themes conflict. Proposed WesCo Thursday karaoke was not treated as a booked replacement without final dates and agreement.
- **Other calendar bookings:** additional DJ/community entries need confirmation of public admission and permission to advertise. Private weddings and client bookings stay private.
- **Outside listings:** organizer access and any required submission authorization are needed for actual publication and corrections. Venue owners control their own profiles.
- **Search Console:** authorized access is needed to submit/inspect the production sitemap and review indexing.
- **Delivery and performance:** a coordinated booking-delivery test, authenticated editor round trip, and broader real-device/Lighthouse checks remain available follow-up work.

Official references consulted: https://developers.google.com/search/docs/appearance/structured-data/event ; https://developers.openai.com/api/docs/bots ; https://decapcms.org/docs/github-backend/ ; https://www.experiencecolumbiasc.com/columbia-sc-events/submit-an-event/
