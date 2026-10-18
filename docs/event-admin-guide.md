# Four Dogs event administrator guide

The central event source and public calendar are live at https://4dogsentertainment.com/events/ and have passed preview and production checks. The editor configuration loads, but its Netlify GitHub OAuth endpoint returns Not Found. A Netlify project administrator must complete the one-time connection below before nontechnical editing is available.

## One-time connection

The site keeps its existing Astro code and GitHub repository. The event editor is Decap CMS, an open-source interface to that repository, at https://4dogsentertainment.com/admin/. No new subscription was purchased.

A Netlify project administrator must configure GitHub OAuth for this existing project using Netlify's authentication-provider setup. This is separate from Netlify Identity and from public-site access restrictions. Give each editor their own GitHub identity and the repository access needed to edit public content. Do not share access tokens or put credentials in the source. Instructions: https://decapcms.org/docs/github-backend/ and https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/

Keep editorial workflow enabled. GitHub and Netlify successfully built the implementation pull request and Netlify created its deploy preview. After connecting OAuth, verify the complete editor flow with a draft: save, upload an authentic image, inspect its preview, and publish a confirmed public change. A successful source build alone does not verify editor authentication or permissions.

## Add or edit a public event

1. Sign in to the editor. Open **Public event occurrences** and choose an event or create one.
2. Give a new event a unique ID and URL slug. Once a URL has been shared, keep it unchanged. A developer can add a 301 redirect if a correction is necessary.
3. Enter the actual date, local start time, venue, category, theme, description, image, and participation instructions. Use times like `7:30 PM`. All occurrences use America/New_York.
4. Enter an end time only when confirmed. If an event ends after midnight, also enter the following end date. For a repeated 1 AM hour during fall DST, explicitly choose the earlier or later hour.
5. Leave admission **unknown** until checked. For free or paid events, confirm the price, select the verification checkbox, and enter the visible admission details. Never assume a venue's entertainment is free because another event there was free.
6. Use the exact ticket or registration link for that occurrence. Generic recurring Eventbrite pages are not automatically attached to themed dates.
7. Keep **Fact confirmation** as **draft** or **review** while information is missing or conflicting. Select **published** only when its public facts are confirmed. This field controls website eligibility; saving an editorial draft alone does not publish it.
8. Save a draft, review the proposed changes and generated preview, and resolve any build errors. Verify the event on a phone, then publish the reviewed entry. The successful deployment updates the homepage, calendar, city and activity lists, venue page, sitemap, feed, and event page from the same record.

## Cancel, postpone, or reschedule

- **Cancel:** change status to `cancelled`; keep the original date, venue, and URL. The event moves from upcoming listings into schedule updates. Do not delete it.
- **Postpone without a new date:** change status to `postponed`; retain the original date and venue. The page states that the new date is unconfirmed.
- **Reschedule:** change status to `rescheduled`, enter the new date/time, and record the old ISO start time with its offset in `previousStartDate`. Keep the ID and URL unchanged.
- Recheck every external listing after publishing a status change. The listing export includes the event status and previous date.

## Recurring agreements and exceptions

Open **Confirmed recurring agreements**. Enter the first and last dates the venue actually approved, weekday, repeat interval, and shared event details. A series cannot run indefinitely. The initial Aura series generates only October 22, October 29, November 5, and November 12, 2026.

For a single occurrence, add an exception using its **original occurrence date**. Change only the fields that differ: theme, description, venue, date, time, instructions, price, or status. To skip a date with no replacement, use the excluded-dates list. To retain a cancellation notice, use a cancellation exception instead of excluding the date. A changed date keeps the original occurrence's ID and URL.

## Venues and photographs

Edit a venue's identity and complete address in **Venues**. Verify its actual city and ZIP before selecting **Address verified**. Choose an authentic photograph in the event record and write an accurate description. A generic Four Dogs photograph must not be described as a photograph from a particular event or venue unless verified.

## Private clients and host assignments

This repository is public. Keep weddings, confidential client events, client contact details, and host assignments in the existing private staffing calendar. The editor blocks private-event saves; the rendering system also excludes private and draft records from event pages, feeds, sitemaps, and distribution exports. The data model supports an internal host field, but this public repository must not be used to store it.

## External listing updates

Each event has an external-listings list. Record the platform, published URL, check date, and status. Open https://4dogsentertainment.com/admin/distribution/ for ready-to-copy event text, website revisions, and a list of outside pages needing attention. After checking an external page, copy its website revision into that listing's `syncedRevision` and mark it current. The revision tracks public facts and shared venue details. Saving only a synchronization update does not falsely mark the listing stale again.

The developer command `npm run export-events` creates submission-ready text and JSON for the next 30 days. A single event's package is also available at `/events/ITS-SLUG/listing.json` after deployment.

## Weekly routine

1. Confirm the next two weeks with the venue team. Resolve flagged themes and schedule changes.
2. Update each affected event or recurring exception once. Confirm admission and entry instructions.
3. Review the preview, the mobile calendar, ticket links, and affected venue pages. Publish after checks pass.
4. Prioritize themed nights, fundraisers, and one-time experiences for outside calendars. Update owned recurring listings without creating unnecessary duplicates.
5. Check external links and record synchronization status. Request partner Google Business Profile updates through the venue owner.
6. Let date-driven status handling archive finished dates. Extend a recurring agreement only after its next dates are confirmed.
