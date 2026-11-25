# Four Dogs website review | November 24, 2026

Baseline: Netlify production commit `2176f5d`. The deployed calendar was inspected directly. Local Chromium rendered the matching production build across 43 page/view examples at 320, 390, 768 and 1440 CSS pixels. These include every service, all eight venue pages and examples of dynamic route families. All 172 returned HTTP 200 with one main heading and no page-width overflow at default text size.

| Priority | Evidence and affected journey | Proposed change and risk |
| --- | --- | --- |
| High | At 390px with a 200% root font, horizontal overflow measured 141px on the calendar, 174px on booking and 36px on home. At standard text size these pages fit. | Allow grid tracks, long headings, actions and fields to wrap or contract. Retest enlarged text and ordinary widths. Presentation risk only. |
| High | Hovering the selected week shortcut yielded white text on cream (#f2f0e8). | Give the active shortcut an explicit hover treatment and verify computed contrast. Low risk. |
| High | After invalid submission, typing an incomplete email removed its aria-invalid state while native validation still rejected it. | Keep the error state in sync through corrections and conditional fields. Preserve native validation and accepted-submission routing. |
| Medium | Guests must expand More filters before choosing Today. The first Top Dawg listing repeats its venue, start time and date in prose. The shared calendar row measured 386px tall on a 390px phone. The details action is indented again by a nested grid rule. | Promote the existing Eastern date shortcut and shorten ordinary listings. Preserve admission notes, updates and linked detail pages. Test real long and ticketed examples. |
| Medium | Empty venue listings always say 30 days, including callers requesting 60. | Display the actual search window. No changes to scheduling or expiration. |
| Medium | An attendee reaching event details finds the SMS and rewards actions only in the footer. | Offer the existing SMS dialog and rewards link at a relevant point after attendance instructions. Preserve consent and voluntary enrollment. |
| Medium | The homepage serves the full 555,479-byte Boze’s group photo in a thumbnail despite smaller gallery variants. A production GET for the existing 480px WebP returned 24,956 bytes. | Use the existing responsive sources on the homepage, retaining the approved master fallback. Verify selected resource and canvas dimensions. |
| Review before change | The site loads the SlickText tag in Base, but the live calendar response policy excludes its script origin. No public email enrollment destination was identified in the website source. | Confirm provider requirements and the official newsletter opt-in URL. A policy change or new enrollment integration requires separate review. |
| Optional | Brand colors, Georgia headings, consistent content width, responsive hero photography, venue evidence and service-specific inquiries already support the intended journeys. | Retain them. Consolidate shared control corners where a rule is touched. |

Baseline tests passed for end-time cutoff, missing end times, overnight dates, DST, archives, schema, links, static form registration and active venue proof. No critical defect was established in the audited journeys. The existing editorial, Studio, authentication, ticketing, financial and production settings are outside the implementation diff.

## Review results

The development branch implements the first seven findings. The original homepage hero, brand identity, partner proof and booking service model remain in use. No change to prices, event records, provider configuration or production workflows was needed.

| Measure | Production baseline | Review build |
| --- | ---: | ---: |
| Actions to filter to today from the calendar | 2 | 1 |
| First event row on a 390px phone | 386px | 288px |
| First event row at 1440px | 221px | 172px |
| Horizontal overflow, 390px phone with 200% text, home / calendar / booking | 36 / 141 / 174px | 0 / 0 / 0px |
| Selected date shortcut text on hover | 1.14:1 | 18.89:1 |
| Horizontal overflow inside text club dialog at 320px with 200% text | 66px | 0px |
| Boze’s homepage group thumbnail, first-party image response at phone density 1 | 555,479 bytes | 24,956 bytes (95.5% smaller) |

The image measurement compares the original JPEG file with the existing 480px CDN response. The local browser selected that URL for a 171px tile and decoded its verified bytes. This is a single-image saving. Sitewide Core Web Vitals and changes in conversion need field data after an approved release.

### Before and after

Same November 24 catalog, same local production-build renderer, viewport and scroll position. These captures use Chromium and reduced motion. They exclude provider-injected hosting badges.

| View | Before | After |
| --- | --- | --- |
| Phone calendar | [Before, 390px](website-ux-2026-11-24/before-calendar-390.webp) | [After, 390px](website-ux-2026-11-24/after-calendar-390.webp) |
| Phone listings | [Before, 390px](website-ux-2026-11-24/before-listings-390.webp) | [After, 390px](website-ux-2026-11-24/after-listings-390.webp) |
| Desktop calendar | [Before, 1440px](website-ux-2026-11-24/before-calendar-1440.webp) | [After, 1440px](website-ux-2026-11-24/after-calendar-1440.webp) |
| Desktop listings | [Before, 1440px](website-ux-2026-11-24/before-listings-1440.webp) | [After, 1440px](website-ux-2026-11-24/after-listings-1440.webp) |

### Functional and accessibility checks

- **Production baseline.** The repository’s read-only HTTP audit passed 2,371 checks across 212 sitemap URLs, including 137 event schemas. Netlify reports Forms enabled on the production website.
- **Build.** The locked production build passed all 52 automated tests, Astro checking (zero errors, zero warnings, two existing deprecation hints), static QA on 38 pages and SSR QA on 181 routes. SSR QA rendered 190 requests, including 137 event schemas. The package has no separate lint command. Git whitespace validation passed.
- **Browser coverage.** All 43 representative URLs/views at 320, 390, 768 and 1440px returned HTTP 200, with one main heading and zero horizontal page overflow. At 390px all 43 also passed the 200% root-text-size check. Automated WCAG A/AA scans of 11 key pages at two widths reported zero violations before and after. This covers the tested initial states. Manual interaction checks found the hover and form errors the scans missed. The repository’s separate seven-width browser suite also passed keyboard menu interactions, original photography, booking preselection, event SEO, reduced motion and the no-JavaScript fallback.
- **Attending.** Today uses the server’s Eastern date, retains the selected venue, and links to results. Long titles, paid ticket terms, reschedules, archived listings, and the two Thanksgiving Eve events at different venues were exercised. Verified ends expire on the next server request at the exact end. Previously loaded tabs require refresh to reflect new time or editorial changes. For records without an end time, the established last-day behavior is explicit. No default duration was introduced.
- **Retention.** Active event pages now offer rewards and the existing on-request SMS dialog. Keyboard focus traps and returns to the opener. The phone number, consent wording, opt-out and native message links are intact. Tested small-screen dialog scrolling and the 44px close button. No signup or reward check-in was submitted.
- **Booking and venue proof.** Venue and corporate entry links preselect the matching service. Required phone and email errors remain associated until corrected. A simulated failure preserved values, and retry produced exactly one simulated acceptance with the expected Netlify form name and no hidden venue fields. Existing proof includes the Charter 803 owner quote, venue-specific photos and confirmed program examples. Internal attendance goals were never used as results.
- **Protected systems.** Source inspection and regression tests covered Decap editor configuration, publication/recurrence data, feeds, distribution output, Studio photo catalog, booking registration, ticket URLs, SMS handoff, analytics hooks, canonicals, redirects and indexing. No authenticated editor save, live payment, email, SMS, private booking or database write was performed. Local QA used retrieved first-party image variants for Netlify’s hosted image endpoint.

### Release decision and open items

Ready for owner review on the development branch. Production deployment requires separate approval. Real-device Safari, VoiceOver/TalkBack, production delivery notifications, provider-side acceptance and real-user LCP, INP and CLS remain unverified. The local regression and browser checks cover the changed paths.

1. Confirm the official newsletter opt-in destination before linking it. The website has no verified public email enrollment URL, and a search of available Jotform signup titles found no newsletter match.
2. Review SlickText tag requirements with the provider. The live calendar’s policy excludes its external script. Manual SMS composer links are a separate, tested path. No changes to production policy, vendor scripts or consent were made.
3. After an approved release, compare existing event-detail, directions, ticket and accepted-booking actions over comparable event weeks. Use confirmed provider enrollments and actual attendance separately. Clicks alone do not establish enrollment or attendance.

### Files changed

- `src/components/EventCard.astro`, `src/components/EventList.astro` for shared listing order, notices and accurate empty-state dates
- `src/pages/events/index.astro`, `src/pages/events/[slug].astro` for Today and player follow-up
- `src/pages/index.astro` for responsive homepage photography
- `src/components/BookingForm.astro`, `src/components/PackPopup.astro`, `src/styles/global.css` for validation, text resizing, control styling and interaction states
- `scripts/qa-event-journey.py` for a reusable local-only regression check
- `DESIGN.md` for the reusable Website UI/UX Quality Standard
- This report and its eight screenshot files in the adjacent evidence directory
