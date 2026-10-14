# Phase 1 technical optimization review

Status: implementation prepared on an isolated branch. Not approved for production. Do not merge without Joey's explicit approval.

## Confirmed production baseline

- Repository: `jelledge9121/four-dogs-current-site-reference`, branch `main`.
- Commit: `1795bfd0a9b7f28d148a5065359557b53cf3c2a2`.
- Netlify site: `e2e1025a-7ba7-41d0-8ed4-4d7625b81101` (`4dogsentertainment`).
- Published production deploy: `6acf6e6b2863452a7ab52b47`, October 14, 2026 at 11:59 UTC.
- Netlify's production deploy metadata links that exact commit to the specified repository and identifies Astro.
- Recent changes reviewed: testimonials, Photo Booth service, booking email routing, native audio controls. Pending gallery work is not merged or replaced by this branch.
- Unchanged baseline: `npm ci` and `npm run build` pass; 145 generated HTML pages pass existing QA.

## Implementation

### Calendar freshness

- `upcomingEvents()` now defaults to today's date in America/New_York, so generated upcoming lists exclude earlier dates even without JavaScript.
- A narrowly routed, dependency-free Netlify Edge Function removes expired cards from the static HTML at request time, caps homepage cards at six, provides an empty state, expires feed items, and turns dated detail pages into archives. It removes expired registration CTAs and Event JSON-LD. Other pages and all media remain static.
- The request-time filter addresses staleness between deployments. It deliberately uses the event's local calendar date rather than inventing an end time for events without one. Same-day events remain listed through the end of that Eastern date.
- Historical URLs continue to resolve. No existing event slug or redirect is changed. The original client-side date handling remains as a progressive enhancement for open browser tabs.
- Transformed responses are not cached and drop obsolete byte counts, content encodings, and validators. This adds an edge invocation to calendar-related requests; actual latency/Core Web Vitals must be measured on a working preview.
- This is response transformation over known Astro-generated fragments, not a general-purpose HTML parser. Automated tests protect its markup contract.

### Verified event changes

- October 20, Top Dawg: Music Bingo supporting the Hydrocephalus Association; 6:30 PM retained. Old indexed slug preserved.
- October 30: The Saluda Mill Murder, Black Sheep Bourbon Society, 7:30 PM. Existing ticket link and URL preserved. Charter's address/directions are deliberately not reused. The location has a verified name only; its physical address requires owner confirmation before address-based rich-result eligibility can be claimed.
- Aura: October 22, October 29, November 5, November 12, 7:30–9:30 PM. Added as four trial dates, not an indefinite recurring schedule. Themes respectively: College Hits: Throughout the Years; Spooky Vibes; DJ Jimbo's Master Class; Screen Time.
- Aura source: owner's October 11 email proposing all four dates/times and Ramy's acceptance in the same thread; Jim's October 11 theme email. No private fee information was published.
- Aura address: [official contact page](https://www.aurakitchenbar.com/contact), 916 Gervais Street, Columbia, SC 29201. A venue page and Columbia event-hub association use the existing components. No registration URL was invented.

### SEO and accessibility

- Event schema uses explicit Eastern UTC offsets, including the November DST change. Known end times are included; unknown times no longer become `undefined` in descriptions.
- Past event pages emit archive labels and no Event schema at build time; request-time filtering handles subsequent expiry.
- Added Twitter title/description metadata and escaped `<` in JSON-LD serialization.
- Thank-you and custom 404 pages use `noindex, follow` and are excluded from the sitemap. Public service/location/event URLs, production canonicals, robots.txt, redirects, and existing Organization/Service/LocalBusiness schema remain intact. No speculative addresses, ratings, location pages, or keyword copy added.
- Gallery filter buttons expose their selected state with `aria-pressed`. Mobile navigation supports Escape to close and restores focus to its toggle.
- Corrected a verified content-binding defect: the For Venues owner-testimonial section explicitly selects the existing Arif venue-owner review rather than the first featured community review. No testimonial was deleted.

### Resource delivery

- Existing wedding/event-detail photos gain lazy loading, async decoding, and verified intrinsic dimensions. Image bytes and visible quality are unchanged.
- Fingerprinted `/_astro/` assets receive a one-year immutable cache policy. Existing unversioned media cache rules stay intact.
- No image/video replacements, dependencies, scripts, business integrations, or stylesheet changes.

## Measurements and verification

- After changes: 150 HTML pages build and pass Astro checks and QA. Five added pages are the Aura venue and four event details. No existing generated file disappears.
- QA now also checks duplicate descriptions, one H1 per page, image alt attributes, and valid JSON-LD, in addition to existing metadata, canonical, link/asset and booking integration checks.
- Date tests cover Eastern midnight, DST offsets, simulated future dates without rebuilding, six-card homepage cap, empty states, archived CTA/schema removal, feed expiry, and response-header safety.
- All 48 baseline generated media files are byte-identical after the changes. Both existing song content and all existing gallery files are retained.
- Booking form HTML is byte-identical. Netlify's read-only Forms API confirms the existing `booking` form, all current fields, honeypot protection, 11 submissions, and a last submission on October 11. No test inquiry, registration, payment, or SMS was submitted.
- Main stylesheet SHA-256 is unchanged: `458b7ad8d2ed32ae8e0c8313d96f2f3de6dbc73760f50d13e2c221fdeae827be`.

Reproducible HTML payload comparison: baseline production-commit build versus optimized build with the exact edge transform applied for October 14, 2026. Gzip uses Node's `gzipSync` default settings. These are payload measurements, not Lighthouse scores or measured user load times.

| Page | Before HTML bytes | After HTML bytes | Before gzip bytes | After gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Home | 52,552 | 30,074 | 11,031 | 8,286 |
| Events | 39,083 | 24,146 | 7,417 | 6,029 |
| Weddings | 15,367 | 15,961 | 5,011 | 5,094 |
| Private/corporate events | 19,274 | 19,783 | 5,835 | 5,898 |
| Booking | 16,760 | 17,204 | 5,448 | 5,509 |
| Gallery | 30,054 | 30,778 | 6,555 | 6,660 |

The home/calendar HTML reduction comes from removing hidden/archive event markup. Other pages grow slightly from social/accessibility metadata. Homepage cards drop from 82 serialized cards to six delivered cards; calendar cards drop from 82 to 31, including four added Aura events.

### Testing limitations

- PageSpeed Insights API returned HTTP 429, daily quota exceeded. No before/after LCP, INP, CLS, Lighthouse or CrUX scores are available.
- The cloud browser timed out. Local Playwright could not launch because no browser executable was installed; browser downloads failed with invalid/truncated ZIP archives. Screenshot comparisons, viewport checks, keyboard interactions, popup behavior, service-preselection interactions, and video playback are therefore not verified.
- Static source and output checks do not prove live form delivery or downstream automation. No submission was authorized to trigger a real workflow.
- External link reachability, SMS device handoff, registration/payment completion, and rich-result eligibility are not claimed as tested.
- No pixel-level claim of identical appearance is made. CSS, colors, fonts, logo, layout components, and media bytes are preserved. Necessary visible differences are corrected/added event content, removal of past listings, archive labels, selected venue-owner testimonial, and removal of unverified Charter address/directions from the Saluda Mill page.

## Items requiring confirmation before production approval

1. October 19 Charter event: source still says Comedy Night at 7 PM. No verified Open Mic format, signup link, or updated description was found. Do not guess whether the existing registration form is correct.
2. Confirm Black Sheep Bourbon Society's physical address/directions. Do not assume it shares Charter's address based on a third-party event aggregator.
3. Review The Mill October 19/26 dated themes and Charter October 22/29 themes against the current business plan. Source and older planning notes differ. November WesCo themes also require current confirmation. Existing values remain pending that review.
4. SlickText: the live CSP blocks its external tag. Inspecting the public tag settings reveals a second active homepage popup with a “Want 20% Off?” minimized message. Enabling the tag could produce overlapping popups and a misleading offer. The policy, tag, and current PACK/SMS popup were preserved because this requires an owner decision and interactive validation. Do not silently enable or disable either integration.
5. Complete real desktop/mobile browser QA and measured performance testing before calling the project production-ready.

## Optional Phase 2

Review popup consolidation and approved offer language, booking-form simplification, service conversion copy, gallery discovery, and recurring-calendar editorial ownership after Phase 1. These are recommendations only. No visual redesign, navigation reorganization, copy overhaul, form shortening, or new animation was implemented.
