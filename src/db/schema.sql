-- Debt Tracker schema. Safe to run multiple times (IF NOT EXISTS everywhere).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- provides gen_random_uuid()

-- ── USERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── REFRESH TOKENS (one row per issued refresh token, enables rotation) ────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY,                 -- the JWT "jti"
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── FOLDERS (group contacts, e.g. "Family", "Work") ───────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

-- ── CONTACTS (people you owe / who owe you) ───────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id  UUID REFERENCES folders(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_folder ON contacts(folder_id);

-- ── DEBTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  direction   TEXT NOT NULL CHECK (direction IN ('they_owe_me', 'i_owe_them')),
  amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency    TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_contact ON debts(contact_id);

-- ── PAYMENTS (partial repayments against a debt) ──────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id    UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note       TEXT,
  paid_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_debt ON payments(debt_id);
