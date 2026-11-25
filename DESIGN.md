---
name: Four Dogs Entertainment
description: Authentic South Carolina entertainment, with clear paths to attend or book.
colors:
  navy: "#0C0F26"
  cyan: "#29C4DC"
  cream: "#F2F0E8"
  ink: "#152033"
  white: "#FFFFFF"
  muted: "#48536A"
  rule: "#C9CED5"
  cyan-hover: "#8CE1ED"
  cyan-active: "#A3E8F0"
  control-border: "#747F8E"
---

## Overview

Preserve the established navy, cyan, cream, serif display voice, authentic photography, and Four Dogs logo. The October 17 brief authorizes typography, layout, and usability refinement.

## Colors

Cyan is an accent or background with navy text. Small text on white uses deep navy or a verified dark secondary color. Never cyan body text on white.

## Typography

Retain the established Georgia serif voice for headings and review quotations. Replace the unloaded Inter declaration with an explicit humanist sans stack. Use a restrained role scale, balanced headings, readable metadata, sentence-case controls, and 45–75 character prose.

## Layout

Maximum content width near 1180px. Hero exposes attend and book actions, followed immediately by current events. Calendar rows prioritize date, title, venue/city, activity, details. Phone filters use an explicit disclosure; GET filtering still works without JavaScript. No duplicate event data or fixed-height text containers.

## Elevation & Depth

Use surfaces and fine rules for grouping. Reserve shadows for layered controls.

## Shapes

Restrained corners and practical controls. Avoid repeated rounded cards and icon tiles.

## Components

Header retains existing destinations. EventCard stays shared across discovery surfaces. Preserve statuses, directions, tickets/reservations, alternatives, and booking integration markup. Footer retains contacts and secondary navigation.

## Do's and Don'ts

Use real photography, factual copy, visible keyboard focus, and large touch targets. Avoid generic SaaS styling, purple gradients, Inter templates, excessive uppercase, brush lettering, automatic task-obstructing popups, and decorative animations.

## Four Dogs Website UI/UX Quality Standard

Use this for public pages, calendar and checkout links, booking forms, and the player journey. Keep the existing design tokens and shared Astro components as the starting point.

| Surface | Acceptance criteria |
| --- | --- |
| Homepage | A first-time guest can reach a confirmed date from the opening section. An organizer can reach booking or weekly partnerships. Use an original photo with an accurate caption and a responsive source when one exists. |
| Event discovery | Give the event title visual priority. Keep date, local time, venue, city, admission and the next action together. Preserve operational exceptions such as a reschedule, overnight end, unconfirmed time, sold-out notice or advance/door pricing. Keep full copy and artwork on the event page. |
| Calendar and archives | Use the shared server-side catalog, request-time status and America/New_York clock. Test the exact end instant, midnight, DST, overnight events, excluded dates and overrides. Unknown end times follow the existing local-midnight rule. Keep published history, original slugs and canonical URLs. |
| Player follow-up | Place voluntary rewards and signup actions where someone is planning or attending a game. Use established destinations, consent disclosures and existing dialog behavior. A message-composer click is distinct from confirmed enrollment. |
| Venue partnerships | Show actual partner photos, approved quotes and confirmed programming. Label projections and programming aims. Publish attendance or business results only with dated evidence and approval. Route venue inquiries through the existing preselected service. |
| Booking | Keep the registered form name, enabled field names, attribution, honeypot and acceptance/error behavior. Label controls, hide and disable irrelevant inputs, associate field errors, preserve entries on failure and distinguish a received inquiry from a confirmed booking. |
| Visual system | Use the existing navy, cream, cyan, Georgia headings, body stack, spacing scale and content width. Use the shared control and panel radius tokens. Retain intentional pills, use elevation for layering, and use an existing icon or text label before adding a decorative symbol. Compare heading, metadata and action alignment on real content. |
| Accessible interaction | Meet WCAG 2.2 AA contrast on default, selected, hover and focus states, including photo overlays. Test visible keyboard focus, Escape and focus return, native validation and reduced motion. Aim for 44px standalone targets. Support 320px reflow and 200% text. Check for hidden or clipped content as well as page-width overflow. |
| Media and performance | Use approved originals, dimensions, suitable sizes and responsive sources. Keep lazy loading for below-fold images and avoid lazy loading the main hero. Measure an actual transferred resource or a repeatable production-build trace. Label field and lab measurements separately. |

### Review before release

1. Match the current production SHA. Document the affected task, evidence, expected benefit, severity and risk before editing.
2. Run the locked build and its static and SSR checks. Test public links, event metadata, forms, feeds, rewards, authentication boundaries and the affected integrations without creating production records.
3. Capture the same event, viewport, text setting and scroll position before and after. Include a small phone, typical phone, tablet, desktop, enlarged text and keyboard-only interaction. Check free and paid events, a schedule change, an empty result and a long real title.
4. Run `scripts/qa-premium-browser.py` against the local build. Run `scripts/qa-event-journey.py` for enlarged-text, date-filter, signup-dialog and mocked booking checks. Both accept `FOUR_DOGS_QA_URL`. The latter requires localhost and intercepts all submissions.
5. Record measured outcomes, untested scenarios and production approval separately. Retain pricing, service terms, historical data, redirects, provider configuration and Studio automation unless the owner authorizes a specific change.

Reference: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
