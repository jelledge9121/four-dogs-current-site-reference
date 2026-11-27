# Four Dogs public website

Start with the latest validated event-discovery and booking PR. Inspect open work and preserve the homepage’s primary Find a show action, its booking links, canonical pages, event IDs, feed revisions, venue photography and wedding media.

Maintain shared CSS variables in `src/styles/shared/four-dogs.css`. This public file is the authority for portable brand and interaction values. Product-specific colors, print, spacing and typography can extend it in the existing theme. Use a reviewed, pinned copy for consumers with separate releases. Keep customer, staff, finance and integration records out of this repository.

Run the production build and exercise the actual changed journey. For inquiry changes, run `scripts/qa-event-journey.py` against local HTTP with intercepted submissions. Check enlarged text, keyboard focus, optional details, failed delivery and retry. Obtain owner approval for production releases.
