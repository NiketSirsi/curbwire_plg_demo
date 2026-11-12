-- supabase/schema.sql

-- Share Attribution Events (card_slug is NULL for issue-level shares)
CREATE TABLE IF NOT EXISTS share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_slug TEXT,
    channel VARCHAR(20) NOT NULL, -- 'native', 'email', 'copy'
    referrer_id TEXT,             -- the sharer's own cw_uid
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View Attribution Events (card_slug is NULL for /unlock and issue views)
CREATE TABLE IF NOT EXISTS view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_slug TEXT,
    referrer_id TEXT,             -- inbound ?ref=
    source_channel VARCHAR(20),   -- inbound ?src=
    user_zip VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured Subscribers & Leads
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    source_card_slug TEXT,
    intent_type VARCHAR(30) NOT NULL, -- 'VERDICT_ALERT', 'GENERAL_BRIEF', 'MARKET_UNLOCK'
    referrer_id TEXT,                 -- inbound referrer (who brought this person)
    user_ref_id TEXT,                 -- this person's own cw_uid (so they can be referrers)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent signups: same email + zip + intent is a no-op
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unique_signup
    ON subscribers (lower(email), zip_code, intent_type);

ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers  ENABLE ROW LEVEL SECURITY;
