# Search and booking checks

Use the existing Search Console Domain property, `4dogsentertainment.com`. Keep its Google verification TXT record in Netlify DNS. Do not create another property for routine checks.

## After an event update or release

1. Run `npm run build`. This validates public records, chronology, Eastern time and DST, privacy exclusions, structured data, links, and static and server-rendered pages.
2. Verify the deploy preview in a browser. Check calendar filters, the affected event and venue pages, the booking form, and narrow layouts. Do not submit real inquiries from previews.
3. After release, run `python scripts/qa-production.py https://4dogsentertainment.com artifacts/production-qa.json`. This is a read-only check of every sitemap URL plus calendar filters, crawlability, schema, canonical URLs, and indexing directives. It does not prove Google indexing, email delivery, or browser compatibility.
4. Search Console → Sitemaps: use `https://4dogsentertainment.com/sitemap-index.xml`. Check acceptance and read status. Do not repeatedly submit duplicate sitemaps.
5. Inspect a changed public event in Search Console. Check Google's selected canonical and latest crawl. Use **Test live URL** before requesting indexing for important new or corrected pages. The URL Inspection API does not submit general indexing requests.
6. Test representative pages with Google's Rich Results Test. Keep unknown end times, performers, ticket availability, and sale dates omitted instead of inventing values to remove optional warnings.

## Weekly

Reconcile the next two weeks against owner-confirmed public schedules. Keep private bookings in the private calendar. Do not extend a recurring agreement beyond its confirmed end. Resolve review flags before publication. Check ticket and directions links. Use `docs/event-admin-guide.md` for editorial steps.

Check Netlify Forms for new verified booking submissions and the owner's notification inbox. For a delivery check, submit one clearly labeled QA inquiry using an owner-controlled email, no requested event date, and a reserved test phone number. Confirm both provider storage and recipient receipt. Identify QA records when reviewing inquiry totals. Do not publish submission data or send it to analytics.

## Thirty-day review: November 17, 2026

In the same Search Console property, compare the latest complete 28 days with the previous 28 days. Record the exact date ranges and reporting delay. Export clicks, impressions, CTR, queries, and pages. Filter pages containing `/events/` and inspect the new November pages separately from older service pages. Compare relevant local queries, not only branded searches. Check Page indexing and the Events enhancement report, then inspect any new technical exclusion or invalid Event item.

Compare the same measurements with the October 18 baseline retained in the operational handoff. Separate expected redirects, canonical alternatives, private pages, and confirmation pages from pages that should be indexed. Google may retain an older crawl until it revisits a page. Sitemap acceptance and valid schema do not guarantee indexing or ranking.

Search visibility, directions clicks, ticket clicks, inquiries, and physical attendance are different measures. The existing frontend action events need an existing analytics consumer before they become collected conversion data. Do not add a tracking vendor or claim attendance or booking growth from search impressions alone.
