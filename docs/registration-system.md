# Four Dogs Event Registration and Rewards

## Release status and safety gate

This implementation must **not** be enabled to the public until both persistent PostgreSQL storage and a verified transactional email provider are configured and tested. The existing public site has neither a registration database connection nor a verified mail provider. Its existing Netlify Email Integration environment values (`NETLIFY_EMAILS_DIRECTORY`, `NETLIFY_EMAILS_SECRET`) do **not** establish a working provider, sender identity, or email API key.

All customer registration, owner, and host APIs fail closed with HTTP 503 unless the full setup is present and `FDE_REGISTRATION_ENABLED=true`. Calendar “Register Free” links are also gated and remain hidden until activation.

No new Netlify Database is provisioned. **Do not install `@netlify/database` or add `netlify/database/migrations` in this repository** while the account is at its database limit. The app uses a plain `postgres` driver and an explicitly supplied URL for an existing database with its own `fde_registration` schema.

Do not casually copy a live application's database URL from another Netlify site. Reuse requires owner approval, a database permissions review, and isolation of this schema. Prefer a dedicated user with privileges limited to `fde_registration`.

## Setup requirements (Netlify environment, not GitHub)

Set all of these at the **existing** 4dogsentertainment Netlify project with Functions runtime scope, preferably secret flags:

- `FDE_REGISTRATION_DATABASE_URL`: tested TLS PostgreSQL connection URL with access to `fde_registration`. No new database provisioning.
- `FDE_SESSION_SECRET`: at least 32 unpredictable characters generated securely. The HMAC secret also protects email duplicate keys.
- `FDE_OWNER_PASSWORD_HASH`: scrypt salted password hash, **not the owner's plaintext password**. Generate using the local helper.
- `FDE_EMAIL_PROVIDER`: `resend` or `postmark`.
- `FDE_EMAIL_FROM`: provider-verified sender address, e.g. the brand mailbox on a verified domain.
- `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` matching the provider.
- `FDE_REGISTRATION_ENABLED`: `true` **only after** production persistence, mail delivery, auth, browser flows and concurrent redemption pass.

Do not save any of these secrets in frontend JavaScript, `netlify.toml`, source code, or GitHub Actions artifacts. Avoid printing database URLs in logs.

## Initialize isolated tables

After confirming the existing database is approved for reuse, run:

```bash
npm ci
FDE_REGISTRATION_DATABASE_URL='<existing secure URL>' npm run setup-registration-db
```

This runs only the reviewed `db/registration-schema.sql` file. It creates the separate `fde_registration` schema with registrations, policy overrides, staff access, assignments, check-ins, audit trail, and anti-abuse counters. The script does not provision any Netlify service.

Create the owner's password hash locally:

```bash
FDE_INITIAL_OWNER_PASSWORD='<long unique password>' node --import tsx scripts/generate-registration-owner-hash.ts
```

Store the hash in `FDE_OWNER_PASSWORD_HASH` and keep the password in a password manager. Avoid terminal history when possible. When staff login is enabled, use `owner` as the owner username. Owners can create individual host credentials in the dashboard. Do not reuse the Decap CMS editor OAuth, which is a separate, previously unconfigured service.

## Customer workflow

1. Open any eligible, future, confirmed, free public event. Select **Register Free**, or open `/register/`.
2. Choose the correct event if it was not preselected. Enter name, email, group size, and optional team name. One registration per event/email and per group.
3. Server-side validation uses the central event records and trusted server/database time. It rejects past, private, draft, ticketed, cancelled, postponed, and closed events.
4. A cryptographically random 12-character confirmation code is persisted alongside registration and its original reward eligibility. The server attempts to deliver the branded HTML and plain-text confirmation.
5. The confirmation page displays event, venue, exact current event date/time, actual registration timestamp in Eastern time, group size, and code. It is private, no-index, no-referrer, and uncached. A failed email is explicitly shown as delayed while preserving the registration for owner resend. Do not interpret this fallback as proof email delivery works.
6. A registration does **not** reserve a restaurant table, guarantee seating or guarantee a raffle prize.

## Rewards

- Eligible Wednesday **Trivia or Music Bingo** at Charter 803 defaults to one complimentary appetizer **per registered group**, with registration closing at **4:00 PM Wednesday Eastern**. Registrations at or after 4:00 PM can never qualify for this appetizer even if an owner extends registration.
- Other eligible free public events default to one extra raffle ticket per registered group.
- Owners may disable registration, disable rewards, or set an event-specific registration/reward deadline. Owners may also select an allowed reward type. No venue-wide global promotion is hardcoded into stored records.
- Reward type is determined and saved at the moment of registration. Later date changes do not retroactively give late registrants an appetizer.
- Hosts verify the live code, mark the group checked in **once**, and issue the physical coupon or raffle ticket. Charter's server accepts **only** the physical appetizer coupon and uses no account or software.

## Staff and owner workflow

- Host login: `/staff/`. Assigned events and party counts: `/staff/check-in/`. Only the owner can assign a host to events.
- Search by code or name. **Find group** verifies against a protected server route. **Check in and issue reward** inserts a unique registration check-in row in one PostgreSQL transaction. Concurrent requests to check in the same code yield one winner and one rejection.
- Host sees registered name, expected group size, code and reward, not customer email. The check-in screen defaults to the registered size but lets the host enter how many people are actually present; owner reports use the checked-in actual count.
- Owner dashboard: `/staff/owner/`. View event totals, party counts, check-in and reward status. Export private CSV. Configure individual event policies. Create staff credentials and assign events. Resend confirmations. Correct an accidental check-in with a required reason and append-only audit row.
- A correction deletes the active check-in in the same transaction that records the correction. A later valid event-day check-in may be issued again. This is a supervised exception, not guest-controlled.

## Security and data handling

- Check-ins are protected by PostgreSQL `PRIMARY KEY (registration_id)` and `INSERT ... ON CONFLICT DO NOTHING`; no in-browser check-in state is authoritative.
- Duplicate registrations are rejected through PostgreSQL `UNIQUE(event_id,email_key)`.
- Only TLS connections to an approved PostgreSQL database should be used.
- Passwords use scrypt salted hashes. Sessions are HMAC-signed, HttpOnly, Secure, SameSite=Strict, eight-hour cookies.
- Staff session checks validate host account is still active and assigned to the selected event. Owner actions are restricted by server-side role checks.
- Mutating requests require a matching same-origin header. Private API responses are never cached, listed, or indexed.
- Basic request limits are enforced with hashed-IP and hashed-email records in PostgreSQL. Consider adding a managed bot protection service before very high traffic.
- Do not create a marketing mailing list from this registration process. Use email only for event confirmations and direct operational communications.
- **Retention:** A data retention/deletion schedule must be agreed before the system goes live. The initial code does not automatically delete historical registrations.

## Test approach

The GitHub Actions pipeline uses a separate temporary PostgreSQL service, not the production Four Dogs database, to test:

1. Database initialization, storage and lookup in a new Node process.
2. Duplicate registration collision protection.
3. Two simultaneous check-in attempts, exactly one winner.
4. Logged owner correction and a permitted replacement check-in.
5. Venue/event-type-specific rewards and 4:00 PM Eastern cutoff.
6. Customer registration validation, signed staff sessions, output escaping and email message content.
7. Existing Astro build, SSR, booking form, event listings and SEO.
8. Responsive browser tests for the preview and existing routes.

**This does not establish production email delivery or durability in a specific Netlify database.** Before production activation, perform a real test registration at an eligible future event with a controlled test email; verify recipient inbox, mobile host login and code; deliberately attempt simultaneous double check-in; redeploy and re-read registration; test cutoff exactly at 4:00 PM Eastern with a server-controlled test clock in staging; and confirm no paid-event "Register Free" buttons.

## Known release blockers as of Nov 20, 2026

The live Netlify site exposes no `NETLIFY_DB_URL`, `DATABASE_URL` or `FDE_REGISTRATION_DATABASE_URL`, no `RESEND_API_KEY`, `POSTMARK_SERVER_TOKEN`, or provider-verified sender, and no working event-host login configuration. Another Four Dogs Netlify project has an existing database, but its schema/permissions and approval for shared use must be reviewed, not assumed.

**Keep the pull request unmerged** and do not set the enable flag until storage and mail infrastructure are genuinely connected and all deployment tests pass. Customer privacy is more important than prematurely showing a registration form.
