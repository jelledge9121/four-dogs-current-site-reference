# Four Dogs Entertainment Website 2.0

A static-first Astro rebuild of the Four Dogs Entertainment website. This repository is the maintainable source; the immutable ZIP reference copies of the previous production deployment remain at the repository root; see `docs/binary-assets-required.md` for the text-only PR constraint and manual asset restoration workflow.

## Safe local preview

```bash
npm install
npm run dev
```

Open the local URL Astro prints. For the production-shaped preview, run `npm run build` and `npm run preview`. Neither command deploys or changes Netlify. **Do not run a Netlify production deploy from this repository until the prelaunch checklist is approved.**

## Content sources

- `src/data/events/*.json`: authoritative dated public event facts
- `src/data/series/*.json`: bounded recurring agreements and individual exceptions
- `src/lib/event-system.ts`: time zones, statuses, validation, schema, filtering, and listing exports
- `src/data/venues.json`: verified venue identities and addresses
- `src/data/services.ts`: service names, copy, URLs, and booking values
- `src/data/gallery.ts`: reusable authentic-photo metadata
- `src/data/reviews.ts`: approved reviews and editorially selected excerpts
- `src/data/site.ts`: authoritative brand and social URLs

See `docs/website-maintenance.md` for plain-English editing steps and `docs/netlify-deployment.md` for the eventual connection to the **existing** Netlify project.

## Event discovery upgrade

The existing static-first Astro site now renders date-sensitive discovery routes on request through the Netlify adapter. Booking and service pages remain static. See `docs/event-discovery-upgrade.md` for implementation status and pending acceptance checks, `docs/event-admin-guide.md` for the editor workflow, and `docs/event-distribution.md` for external listing operations.

`npm run build` runs behavior tests, Astro checks, static QA, and actual server-rendered route QA. `npm run export-events` creates listing packages without submitting them.
