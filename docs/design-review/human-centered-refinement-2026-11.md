# Four Dogs human-centered website refinement

## Baseline
Source: `main` commit `01f0c30b417617efd18ac73efd07a1da2df3b145`, verified against the currently published Netlify deployment `6b00f3fe69a7c7ccd56e6677` before editing.

Design direction: keep existing navy/turquoise identity, logo, typography character, genuine venue photos, team profiles, approved reviews, all original media, real service descriptions, confirmed event details and all booking functionality. This is not a redesign.

## Concrete problems in reviewed source
- Homepage gallery selected the first six image records, putting an arbitrary run of adjacent source images ahead of service variety.
- Nine services used the same generic repeated alternating row and the same wedding dance-floor photo was assigned to Photo Booth and Almost Married Trivia without a service-specific visual connection.
- About opened with three broadly interchangeable statements instead of the specific namesake dogs and local hosting story.
- Venue and local pages relied on decorative cards and repeated boilerplate; most local SEO pages reused the same unrelated hero photo.
- Gallery sorted many karaoke photos consecutively rather than balancing the original event formats.
- Wedding videos and wedding photos existed, but photographic storytelling could be clearer and video tiles used unnecessary shadows.
- For the Brides overused decorative orbit, fake seal, ribbon, radial background gradient, all-caps decorative labels and unrelated visual motifs.
- Hover shimmer, entrance motion, enlarged image hover, and shadow lifts added visual effect without supporting navigation.

## Edits by page
- Home: representative selection of six authentic photo categories and more specific gallery heading. Same booking and event CTAs.
- Services: separate public games, weddings and private/corporate celebrations, the photo booth text without an unrelated image, and clean navigation for original games. Same service data and approved pricing.
- Weddings: two more authentic still photos, lighter video frames. All nine wedding video source paths remain intact.
- Venues: specific photographic caption, Charter 803 owner review context, simpler format and local partner navigation. No fabricated results.
- About: accurate namesake-dog origin, South Carolina context and preserved existing team bios and portraits.
- Gallery: keep all 53 item records with working filters, alternating categories in the initial display and reduced visual weight.
- For the Brides: remove decorative gimmicks, simplify wording and align the appearance to Four Dogs. Preserve the original JavaScript hashtag logic, all field IDs, download and favorites.
- Service detail: do not use a wedding dance-floor image to sell a photo booth or Almost Married Trivia; preserve all other details.
- Local SEO: specific real event photos by intent, simple highlights and internal links. Keep existing FAQs, schema, metadata, event dates and canonical URLs.
- Motion: remove shimmer, animated entrances and ornamental image zoom while preserving practical keyboard focus, feedback and reduced-motion support.

## Quality checks
The existing GitHub Actions workflow runs npm tests, Astro checking and build, static and SSR QA, plus responsive browser tests at seven widths. This branch adds paired before/after Playwright captures of nine routes at phone and desktop sizes, a live gallery filter test, full wedding video source count, hashtag generator check, local overflow/invalid image checks, and Impeccable and Lighthouse reporting. A failing/unavailable detector is recorded rather than quietly treated as a clean result.

No production deployment or submission of booking forms is authorized. Review the draft pull request and the Netlify Deploy Preview before merging.
