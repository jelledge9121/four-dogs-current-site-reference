# Binary assets required after the text-only Website 2.0 pull request

## Why these files are not in this change set

Codex Create PR does not accept binary additions. The Website 2.0 Astro source deliberately retains its final asset paths, but the binary files listed below were removed from this pull-request diff. Add them manually from an extracted copy of the supplied current-site deployment archives before expecting image/PDF QA or a production build review to pass.

The original ZIP archives remain unchanged at the repository root because moving those already-tracked binaries would itself create a binary rename in this pull request. They are reference material only: Astro does not import root-level ZIP files, and no extracted `_next`, `_astro`, or generated deployment files belong in `src/` or `public/`.

## Required launch assets

| Intended destination | Filename | Original deployment path | Used by | Launch status |
|---|---|---|---|---|
| `public/` | `favicon.png` | `assets/four-dogs-favicon-32.png` | `src/layouts/Base.astro` browser favicon | Required |
| `public/images/` | `logo.png` | `assets/four-dogs-logo.png` | Global header and footer; Organization logo reference | Required |
| `public/images/` | `social-card.jpg` | `assets/four-dogs-social-card.jpg` | Default Open Graph/Twitter image in `Base.astro` | Required |
| `public/images/` | `hero.jpg` | `assets/four-dogs-entertainment-trivia-night-crowd-in-a26875db66.jpg` | Homepage hero; event, venue, service, About, and For Venues imagery | Required |
| `public/images/` | `wedding.jpg` | `assets/full-dance-floor-at-four-dogs-entertainment-p-7a8def119e.jpg` | Weddings page and wedding-service imagery | Required |
| `public/images/` | `host.jpg` | `assets/jim-kennedy-four-dogs-entertainment-host-for--117040b526.jpg` | Join Our Team page | Required for the intended page presentation |
| `public/downloads/` | `four-dogs-trivia-work-excuse-signed.pdf` | `assets/work-excuses/four-dogs-trivia-work-excuse-signed.pdf` | Trivia download on `/work-excuses/` | Required for that feature |
| `public/downloads/` | `four-dogs-music-bingo-work-excuse-signed.pdf` | `assets/work-excuses/four-dogs-music-bingo-work-excuse-signed.pdf` | Music Bingo download on `/work-excuses/` | Required for that feature |
| `public/images/christmas/` | `santa-jim-christmas-in-july-four-dogs-01.jpg` | `assets/christmas/santa-jim-christmas-in-july-four-dogs-01.jpg` | Christmas authentic-photo gallery | Required for current Christmas layout |
| `public/images/christmas/` | `santa-jim-christmas-in-july-four-dogs-02.jpg` | `assets/christmas/santa-jim-christmas-in-july-four-dogs-02.jpg` | Christmas authentic-photo gallery | Required for current Christmas layout |
| `public/images/christmas/` | `santa-jim-christmas-party-four-dogs-05.jpg` | `assets/christmas/santa-jim-christmas-party-four-dogs-05.jpg` | Christmas authentic-photo gallery | Required for current Christmas layout |
| `public/images/christmas/` | `santa-jim-holiday-party-four-dogs-03.jpg` | `assets/christmas/santa-jim-holiday-party-four-dogs-03.jpg` | Christmas authentic-photo gallery | Required for current Christmas layout |
| `public/images/gallery/` | `four-dogs-entertainment-event-photo-19.webp` | `assets/gallery/four-dogs-entertainment-event-photo-19.webp` | Central gallery data; homepage and Gallery | Required |
| `public/images/gallery/` | `four-dogs-entertainment-event-photo-29.webp` | `assets/gallery/four-dogs-entertainment-event-photo-29.webp` | Central gallery data; homepage and Gallery | Required |
| `public/images/gallery/` | `four-dogs-entertainment-event-photo-34.webp` | `assets/gallery/four-dogs-entertainment-event-photo-34.webp` | Central gallery data; homepage and Gallery | Required |
| `public/images/gallery/` | `four-dogs-entertainment-event-photo-37.webp` | `assets/gallery/four-dogs-entertainment-event-photo-37.webp` | Central gallery data; homepage and Gallery | Required |
| `public/images/gallery/` | `four-dogs-private-event-dance-floor-01-poster.webp` | `assets/gallery/four-dogs-private-event-dance-floor-01-poster.webp` | Central gallery data; homepage and Gallery | Required |
| `public/images/gallery/` | `four-dogs-private-event-dance-floor-02-poster.webp` | `assets/gallery/four-dogs-private-event-dance-floor-02-poster.webp` | Central gallery data; homepage and Gallery | Required |

## Optional retained source candidates

These authentic files were copied during development but are not referenced by the current source. They may be added manually later when expanding the centralized photo library.

| Intended destination | Filename | Original deployment path | Intended use | Launch status |
|---|---|---|---|---|
| `public/images/christmas/` | `santa-jim-holiday-party-four-dogs-04.jpg` | `assets/christmas/santa-jim-holiday-party-four-dogs-04.jpg` | Additional Christmas gallery image | Optional |
| `public/images/christmas/` | `santa-jim-west-columbia-sc-06.jpg` | `assets/christmas/santa-jim-west-columbia-sc-06.jpg` | Additional Christmas/local image | Optional |
| `public/images/gallery/` | `four-dogs-private-event-dance-floor-03-poster.webp` | `assets/gallery/four-dogs-private-event-dance-floor-03-poster.webp` | Future Private Events gallery entry | Optional |
| `public/images/gallery/` | `four-dogs-real-event-01-music-bingo-family-table.webp` | `assets/gallery/four-dogs-real-event-01-music-bingo-family-table.webp` | Future Music Bingo gallery entry | Optional |
| `public/images/gallery/` | `four-dogs-real-event-03-trivia-couple-winners.webp` | `assets/gallery/four-dogs-real-event-03-trivia-couple-winners.webp` | Future Trivia/Crowds & Winners entry | Optional |
| `public/images/gallery/` | `four-dogs-real-event-04-music-bingo-table-night.webp` | `assets/gallery/four-dogs-real-event-04-music-bingo-table-night.webp` | Future Music Bingo/Venues entry | Optional |
| `public/images/gallery/` | `four-dogs-real-event-07-music-bingo-winner-blue-koozie.webp` | `assets/gallery/four-dogs-real-event-07-music-bingo-winner-blue-koozie.webp` | Future Crowds & Winners entry | Optional |
| `public/images/gallery/` | `four-dogs-real-event-08-music-bingo-winner-wide-smile.webp` | `assets/gallery/four-dogs-real-event-08-music-bingo-winner-wide-smile.webp` | Future Crowds & Winners entry | Optional |

## Manual restoration procedure

1. Extract the root-level reference ZIP archives outside the repository working tree, for example to `/tmp/four-dogs-reference`.
2. Create the intended `public/images/gallery`, `public/images/christmas`, and `public/downloads` directories.
3. Copy each required file from the exact original deployment path above to its intended destination and filename.
4. Do not copy generated HTML, `_next`, `_astro`, framework bundles, or any other compiled deployment tree.
5. Run `npm run build` and `npm run qa`; inspect every restored image and PDF in the local preview before launch approval.
