CREATE TABLE IF NOT EXISTS ai_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    api_key_env_var TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE ai_vendors ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON ai_vendors
FOR SELECT
TO authenticated
USING (true);

-- Allow insert, update, delete for service_role only (admin operations)
CREATE POLICY "Allow all access for service_role"
ON ai_vendors
FOR ALL
TO service_role
USING (true);

-- Trigger to update "updated_at" timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_vendors_updated_at
BEFORE UPDATE ON ai_vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
