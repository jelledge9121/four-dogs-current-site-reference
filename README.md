# Four Dogs Entertainment Website 2.0

A static-first Astro rebuild of the Four Dogs Entertainment website. This repository is the maintainable source; the immutable ZIP reference copies of the previous production deployment remain at the repository root; see `docs/binary-assets-required.md` for the text-only PR constraint and manual asset restoration workflow.

## Safe local preview

```bash
npm install
npm run dev
```

Open the local URL Astro prints. For the production-shaped preview, run `npm run build` and `npm run preview`. Neither command deploys or changes Netlify. **Do not run a Netlify production deploy from this repository until the prelaunch checklist is approved.**

## Content sources

- `src/data/events.ts`: dated event facts and upcoming filtering
- `src/data/venues.ts`: addresses and recurring schedules
- `src/data/services.ts`: service names, copy, URLs, and booking values
- `src/data/gallery.ts`: reusable authentic-photo metadata
- `src/data/reviews.ts`: approved reviews and editorially selected excerpts
- `src/data/site.ts`: authoritative brand and social URLs

See `docs/website-maintenance.md` for plain-English editing steps and `docs/netlify-deployment.md` for the eventual connection to the **existing** Netlify project.
