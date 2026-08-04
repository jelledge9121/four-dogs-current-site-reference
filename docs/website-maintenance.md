# Website maintenance

Routine facts live in `src/data`; edit them once and run `npm run build`.

- **Add an event:** copy one object in `src/data/events.ts`, give it a unique `id` and URL-safe `slug`, use `YYYY-MM-DD`, select an existing `venueId`, complete factual copy, and set `status: 'scheduled'`.
- **Edit/time/feature an event:** change that event object’s copy, `startTime`, or `featured`. Do not edit the home, event, venue, schema, or sitemap separately.
- **Past events:** leave the object in place. `upcomingEvents()` automatically removes dates before today from upcoming lists while preserving detail pages.
- **Add a venue:** add one typed object to `src/data/venues.ts`, including a unique `id`/`slug`, verified address/map, active flag, and `weeklySchedule`. Events reference that `id`; the venue route generates automatically.
- **Update weekly schedule:** edit only `weeklySchedule` on the venue. Remember dated events still need their own exact times.
- **Add/update a service:** edit `src/data/services.ts`. Keep `slug` stable unless you also add a permanent redirect. `bookingValue` must exactly match the desired form option.
- **Add a review:** add only an owner-approved, correctly attributed record to `src/data/reviews.ts` and set `approved: true`. Never infer names or results.
- **Add gallery photos:** place an optimized authentic WebP/AVIF/JPEG in `public/images/gallery`, then add its path, useful alt text, and category to `src/data/gallery.ts`.
- **Remove gallery photos:** remove the metadata record first; delete the file only after checking that no service/home/venue page uses it.
- **Social links:** edit `src/data/site.ts`; footer, schema, and homepage references share it.
- **Homepage featured content:** event `featured` is the central flag for future feature treatments; homepage schedules and upcoming items already derive from central data. Curated gallery entries come from `src/data/gallery.ts`.

Always run `npm run build`. Check spelling, venue, date, timezone, image rights/alt text, and booking preselection before committing.
