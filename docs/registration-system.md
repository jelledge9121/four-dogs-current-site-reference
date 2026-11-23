# Event registration and Charter 803 redemption

## Activation

Keep FDE_REGISTRATION_ENABLED unset in production until Joey approves activation. Use an isolated PostgreSQL database for preview and QA. Reusing another application's database requires separate owner approval, schema isolation and a compatibility review. Charter management must accept the redemption procedure before enabling an event promotion.

1. Back up the approved database and verify restoration in a separate test database. Use a migration credential with permission to create or alter only the fde_registration schema. Supply its connection URL as FDE_REGISTRATION_DATABASE_URL and run npm run setup-registration-db. This additive migration preserves older registrations and check-ins.
2. Use a separate runtime credential with schema USAGE and SELECT, INSERT, UPDATE and DELETE only on registration tables as required. Keep it outside source control. Review database transport encryption, provider backups, restore testing, log redaction for private confirmation URLs, and personal-data retention before activation. Delete aged rate_hits and purge expired registration data according to the owner's approved retention period.
3. Set FDE_REGISTRATION_DATABASE_URL, FDE_SESSION_SECRET (at least 32 random characters), FDE_OWNER_PASSWORD_HASH (see scripts/generate-registration-owner-hash.ts), and FDE_REGISTRATION_ENABLED=true in the approved environment only. Registration needs no mail provider.
4. Before launch test both physical phone cameras over HTTPS, download a controlled CSV in Excel and Google Sheets, and verify the hosted deployment and existing ticket and booking links.

## Guests and forecasts

Use the RSVP link on the public calendar or an event page. Guests enter their name and expected party size, optionally a team name, then bookmark their private confirmation URL. The link permits changes and cancellation. The original browser can reopen the private page from the event-specific RSVP link while its cookie remains. A public name search cannot recover a private link. Paid events retain their separate ticket requirements. A group estimate does not reserve seats.

At /staff/owner/ select dates, venue and event type to compare groups, expected attendees and average size. Choose an event for daily registration counts and audited changes. Download CSV beside an event, or use the venue and all-registration downloads for the date range. Canceled records remain labeled in exports and contribute zero to the dashboard forecast. Redemption does not establish actual party size. Historical verified check-ins remain separate.

## Voucher and scanner

Only Charter 803 Wednesday Trivia and Music Bingo dated December 2, 2026 or later qualify. In the owner settings select the event, appetizer reward, and explicit Eastern redemption deadline. Without a deadline no voucher issues. A registration must be committed before 4 PM Eastern on that event Wednesday. A later registration or subsequent increase to group size cannot qualify. Existing vouchers retain the expiration captured at issuance.

Create individual staff credentials and assign only approved event IDs. Designated Charter employees may scan after venue approval. Save /staff/check-in/ on a phone. Sign in, allow camera access, then aim at the live QR. The host can paste the current live token if the camera fails. Remove an assignment to revoke redemption access. The eight-hour signed session covers a normal event shift.

Tokens contain an opaque identifier, short expiration and server signature. The server checks assignment, event day, cancellation, captured deadline and prior use. A single transaction serializes competing claims and records the actor. A fresh screenshot can still win the first scan within the token's maximum 20-second lifetime. Owner corrections require a reason and do not extend the original deadline.

An event-specific browser identifier, keyed group fingerprint and serialized IP rate limits reduce repeat registrations. A determined guest changing browsers, network and identity can submit a second estimate. Shared devices or identical group details can also collide. Refer exceptions to the owner. Treat bookmarked confirmation links like credentials.

## Verification

Run npm run build for the website tests, Astro checks, production build and rendered-route regressions. Point FDE_REGISTRATION_DATABASE_URL at a disposable PostgreSQL database only, apply the schema, then run node --import tsx --test tests/registration-db.test.ts for persistence, concurrency and scanner authorization.

For active browser QA use an isolated enabled site on localhost over HTTPS with synthetic data. Set FDE_LOCAL_QA_URL and FDE_LOCAL_QA_OWNER_PASSWORD, install Playwright for Python and Chromium, and run python scripts/qa-registration-active.py from the repository root. It creates temporary registrations and an event policy in that disposable database. The test covers accountless registration, same-browser recovery, CSV scopes, estimate reconciliation, camera failure and optical decoding using synthetic camera frames. An eligible upcoming calendar fixture also exercises actual QR rotation. The unavailable-state smoke test remains scripts/qa-registration-browser.py.
