CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES ai_vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_name TEXT NOT NULL,
    is_vision BOOLEAN NOT NULL DEFAULT FALSE,
    is_image_generation BOOLEAN NOT NULL DEFAULT FALSE,
    is_thinking BOOLEAN NOT NULL DEFAULT FALSE,
    input_token_cost_micros BIGINT NULL,
    output_token_cost_micros BIGINT NULL,
    max_tokens INTEGER NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_vendor_api_name UNIQUE (vendor_id, api_name)
);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON ai_models
FOR ALL
TO authenticated
USING (true);

-- Allow insert, update, delete for service_role only (admin operations)
CREATE POLICY "Allow all access for service_role"
ON ai_models
FOR ALL
TO service_role
USING (true);

-- Trigger to update "updated_at" timestamp
CREATE TRIGGER trigger_ai_models_updated_at
BEFORE UPDATE ON ai_models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
