# Content model

Events, venues, services, gallery items, reviews, and company facts are typed modules under `src/data`. Pages import these modules; no page owns a second copy of a venue schedule or dated event. `upcomingEvents(today?)` includes scheduled events whose ISO date is greater than or equal to today and sorts them chronologically. Historical detail pages are still statically generated. Venue pages filter the same event array by `venueId`.

Event records support `id`, `slug`, `title`, `date`, `startTime`, optional `endTime`, `venueId`, `eventType`, `theme`, summaries, description, image, optional Facebook URL, featured, and status. Venue records support identity, address, map/website fields, descriptive image, active state, and one or more weekly schedules. Services own their display name, summary, route slug, detail copy, feature flag, and exact booking-select value.
