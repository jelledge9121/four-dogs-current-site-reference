# Current production deployment audit

## Method and safety

All ten supplied ZIP archives remain intact at the repository root and were extracted only to `/tmp/four-dogs-reference`. They are not part of the Astro application; a binary-free PR cannot move already-tracked ZIP files without producing binary rename changes. The reconstructed export contains 716 files. No request changed the live domain, Netlify project, DNS, or production deployment. The audit inspected the exported HTML, route folders, `_redirects`, `_headers`, asset names, sitemap/robots/LLM files, and Netlify form markup.

## Technology and structure

The export mixes Next.js route payloads (`__next.*`, `_next`) with Astro bundles (`_astro`), plus generated HTML. Those are deployment artifacts and were not adopted as source. Meaningful public HTML routes included the home page, About, Booking, Events and event details, services and regional service pages, area pages, venue pages, Gallery, Guides, Rewards, Venue Calculator, Work Excuses, Join Our Team, Christmas, and Thank You.

## Navigation and conversion

The old navigation exposed numerous service/seasonal destinations. Website 2.0 uses Events, Services, For Venues, Weddings, About, and Book; the accessible Services disclosure contains individual experiences. Existing booking markup used Netlify form handling. The rebuild retains static `data-netlify="true"`, a `form-name` hidden input, honeypot, POST action, and Thank You route, while placing the full form directly on `/booking/`.

## Metadata and discovery

Generated pages generally supplied titles, descriptions, canonicals, Open Graph fields, JSON-LD, sitemap and robots support. The export also included `llms.txt`. Website 2.0 centralizes canonical construction and Organization/Event/Service schema. Old pages should be spot-checked in production before launch because generated payload text can duplicate metadata/schema.

## Public URL inventory

### Core, services, locations, and features

`/`, `/about/`, `/almost-married-trivia-experience/`, `/are-you-smarter-than-a-barstool/`, `/areas/columbia-sc/`, `/areas/irmo-chapin-sc/`, `/areas/lexington-sc/`, `/areas/west-columbia-cayce-sc/`, `/bar-restaurant-entertainment/`, `/bar-trivia-host-columbia-sc/`, `/booking/`, `/christmas/`, `/corporate-event-entertainment-columbia-sc/`, `/corporate-event-entertainment-sc-nc-ga/`, `/corporate-events/`, `/dj-services-columbia-sc/`, `/dj-services-lexington-sc/`, `/events/`, `/for-venues/`, `/four-dogs-survey-showdown/`, `/gallery/`, `/guides/`, `/hoa-community-event-entertainment-sc-nc-ga/`, `/hoa-community-events/`, `/join-our-team/`, `/music-bingo-columbia-lexington-sc/`, `/music-bingo-columbia-sc/`, `/music-bingo-lexington-sc/`, `/private-event-dj-midlands-sc/`, `/private-event-dj-sc-nc-ga/`, `/private-events/`, `/restaurant-entertainment-columbia-sc/`, `/rewards/`, `/thank-you/`, `/trivia-night-columbia-sc/`, `/trivia-night-lexington-sc/`, `/trivia-nights-columbia-lexington-sc/`, `/venue-calculator/`, `/venue-entertainment/`, `/wedding-dj-columbia-sc/`, `/wedding-dj-sc-nc-ga/`, `/work-excuses/`.

### Venues

`/venues/charter-803-trivia-music-bingo-lexington-sc/`, `/venues/top-dawg-tavern-sandhills-trivia-columbia-sc/`.

### Exported event details

`/events/90s-music-pop-culture-trivia-top-dawg-tavern-sandhills-july-21-2026/`, `/events/are-you-smarter-than-a-barstool-charter-803-august-27-2026/`, `/events/are-you-smarter-than-a-barstool-top-dawg-tavern-sandhills-july-28-2026/`, `/events/culture-on-tap-trivia-charter-803-august-6-2026/`, `/events/disney-friends-music-bingo-charter-803-july-22-2026/`, `/events/four-dogs-survey-showdown-charter-803-2026-09-10/`, `/events/four-dogs-survey-showdown-charter-803-2026-10-08/`, `/events/four-dogs-survey-showdown-charter-803-2026-11-12/`, `/events/four-dogs-survey-showdown-charter-803-august-13-2026/`, `/events/lipstick-legends-music-bingo-charter-803-july-29-2026/`, `/events/marvel-trivia-charter-803-july-16-2026/`, `/events/summer-road-trip-trivia-charter-803-july-23-2026/`, `/events/sun-sand-waves-trivia-charter-803-july-30-2026/`, `/events/work-like-a-dog-music-bingo-charter-803-august-5-2026/`.

### Guides

`/guides/are-you-smarter-than-a-barstool-game-night/`, `/guides/best-trivia-nights-lexington-sc/`, `/guides/dj-services-lexington-sc-before-booking/`, `/guides/how-to-turn-slow-tuesday-into-event-night/`, `/guides/music-bingo-for-restaurants-repeat-customers/`, `/guides/music-bingo-in-lexington-sc/`, `/guides/private-event-entertainment-midlands-sc/`, `/guides/restaurant-entertainment-columbia-sc-guide/`, `/guides/trivia-vs-music-bingo-for-restaurants/`, `/guides/wedding-dj-services-columbia-sc/`, `/guides/where-to-play-music-bingo-lexington-sc/`, `/guides/why-trivia-nights-fail/`.

## Assets and brand

The export contains the unmodified Four Dogs logo/favicons, authentic crowd, host, venue, DJ-setup, wedding/dance-floor, Christmas, gallery AVIF/WebP/JPEG variants, a social card, and an MP3 brand asset. Website 2.0 copied the logo unchanged and a curated set of authentic images. Gallery metadata is centralized. Additional image selection/compression and owner-approved alt-text verification remain prelaunch work.

## Redirects and headers

The export redirected aliases for upcoming events, booking/contact, calculator, Work Excuses, Survey Showdown, Almost Married, venue-owner terms, wedding DJ Lexington, and retired Chicanas venue/event URLs. It set nosniff, referrer, frame, permissions, and cache headers. These were preserved or expanded in `public/_redirects` and `public/_headers`.

## Social, tracking, video, reviews

Official footer links now use the supplied Facebook profile and misspelled-but-official Instagram URL. No new analytics was added; the owner must identify any required production measurement/consent configuration. Image/video asset names were found, but no remote video embed is needed in the rebuild. Conflicting or unverifiable review attribution must be owner-confirmed; therefore the typed review store is deliberately empty rather than inventing social proof.

## Functionality to retain or complete

Events, recurring schedules, venue-driven upcoming lists, booking form, gallery, local landing pages, guides, Rewards, Venue Calculator, Work Excuses, seasonal content, redirects, security headers, sitemap, robots, and AI-discovery content are meaningful. Core conversion and data-driven features are implemented. Editorial migration of every guide and rebuilding the interactive Rewards/Calculator/Work Excuses tools are explicitly held for factual/product review rather than silently discarded.

## Second-pass legacy migration

Website 2.0 now serves the Rewards handoff, an interactive-but-explicitly-non-promissory Venue Calculator, the original printable Work Excuses PDFs, Christmas/Santa Jim information and authentic holiday photography, Join Our Team role information, and all twelve exported guide routes. Seven July event routes render as historical details; seven exported current-event aliases permanently redirect to authoritative event records. Remaining regional/service variants redirect to the closest current service rather than becoming undocumented 404s.
