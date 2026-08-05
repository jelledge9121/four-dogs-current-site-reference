# Prelaunch checklist

## Automated

- [ ] Astro/TypeScript check and production static build (blocked locally by registry HTTP 403; must pass in an environment with dependency access)
- [ ] Generated-page QA script (runs after a successful build; source-level QA completed locally)
- [x] Event IDs/slugs/dates checked for duplicates; upcoming filtering is date-driven
- [x] Supplied August 4–November 12 schedule seeded with pre-August-11 7:00 PM exceptions retained
- [x] Venue records power recurring schedule and venue upcoming lists
- [x] Netlify form detection markup, honeypot, action, and direct booking flow included
- [x] Sitemap integration, robots, headers, redirects, and `llms.txt` included

## Human verification required before any production connection

- [ ] Review every page at mobile, tablet, and desktop sizes; keyboard-test navigation/dropdown and form
- [ ] Confirm Top Dawg Tavern’s complete street address/ZIP and official venue websites (not supplied, so not invented)
- [ ] Confirm all event themes/dates are still scheduled; cancellation/postponement state
- [ ] Submit the form on an **existing-project deploy preview**, then confirm Netlify detection, spam handling, notification recipients, success page, and privacy expectations
- [ ] Verify every redirect against production/Search Console and restore full guide/feature content before replacing valuable indexed pages
- [x] Migrated Rewards, Venue Calculator, Work Excuses, seasonal, Join Our Team, and all supplied guide routes; owner should still approve their facts before launch
- [ ] Verify testimonial attribution; central review data is intentionally empty until approved
- [ ] Approve every authentic photograph, crop, file size, rights, and alt text; generate additional responsive sizes
- [ ] Run Lighthouse/axe and real-device VoiceOver/TalkBack testing
- [ ] Validate Event/Organization/Service schema in Google Rich Results Test and inspect sitemap/canonicals on the preview URL
- [ ] Identify and approve analytics/consent configuration; no tracking was guessed
- [ ] Crawl the deploy preview including preserved/archive URLs and resolve every 404
- [ ] Confirm Facebook and the supplied official Instagram spelling/URL
- [ ] Approve launch and rollback plan for the existing Netlify project; do not create another production project

## Second-pass environment status

Dependency access was retried on August 4, 2026. The environment proxy again returned HTTP 403 for `registry.npmjs.org/@astrojs/check`, so no successful Astro build or browser-based visual QA can truthfully be reported from this workspace. `.github/workflows/build.yml` now provides a blocking Node 22 CI job that creates the lock when necessary, runs `npm ci`, runs the production build, and runs generated-output QA. Production readiness remains blocked until that workflow or another registry-enabled environment succeeds. No Netlify or production changes were made.
