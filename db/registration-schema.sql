-- Isolated registration tables. This script must be applied to a Postgres connection
-- chosen by the owner. It does not provision another Netlify database.
CREATE SCHEMA IF NOT EXISTS fde_registration;

CREATE TABLE IF NOT EXISTS fde_registration.staff (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fde_registration.assignments (
 staff_id TEXT NOT NULL REFERENCES fde_registration.staff(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL,
 PRIMARY KEY (staff_id, event_id)
);

CREATE TABLE IF NOT EXISTS fde_registration.event_policies (
 event_id TEXT PRIMARY KEY,
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 reward_kind TEXT NOT NULL DEFAULT 'raffle' CHECK (reward_kind IN ('appetizer','raffle','none')),
 reward_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 registration_closes_at TIMESTAMPTZ,
 reward_closes_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fde_registration.registrations (
 id TEXT PRIMARY KEY,
 event_id TEXT NOT NULL,
 code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 email_key TEXT NOT NULL,
 group_size INTEGER NOT NULL CHECK (group_size BETWEEN 1 AND 50),
 team_name TEXT,
 reward_kind TEXT NOT NULL CHECK (reward_kind IN ('appetizer','raffle','none')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending','sent','failed')),
 email_attempts INTEGER NOT NULL DEFAULT 0,
 email_sent_at TIMESTAMPTZ,
 UNIQUE(event_id,email_key)
);
CREATE INDEX IF NOT EXISTS fde_regs_by_event ON fde_registration.registrations(event_id,created_at);
CREATE INDEX IF NOT EXISTS fde_regs_by_name ON fde_registration.registrations(event_id,name);

CREATE TABLE IF NOT EXISTS fde_registration.checkins (
 registration_id TEXT PRIMARY KEY REFERENCES fde_registration.registrations(id) ON DELETE RESTRICT,
 checked_in_by TEXT NOT NULL,
 checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 reward_issued BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS fde_registration.audit (
 id TEXT PRIMARY KEY,
 registration_id TEXT,
 event_id TEXT,
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 reason TEXT,
 at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fde_audit_event_at ON fde_registration.audit(event_id,at DESC);

CREATE TABLE IF NOT EXISTS fde_registration.rate_hits (
 id TEXT PRIMARY KEY,
 identifier TEXT NOT NULL,
 at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fde_rate_identifier_at ON fde_registration.rate_hits(identifier,at DESC);
