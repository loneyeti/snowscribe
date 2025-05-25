-- Create tool_model table
CREATE TABLE IF NOT EXISTS tool_model (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_tool_model_name UNIQUE (name)
);

-- Enable RLS
ALTER TABLE tool_model ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON tool_model
FOR ALL
TO authenticated
USING (true);

-- Allow insert, update, delete for service_role only (admin operations)
CREATE POLICY "Allow all access for service_role"
ON tool_model
FOR ALL
TO service_role
USING (true);

-- Trigger to update "updated_at" timestamp
CREATE TRIGGER trigger_tool_model_updated_at
BEFORE UPDATE ON tool_model
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add index on the foreign key for better join performance
CREATE INDEX IF NOT EXISTS idx_tool_model_model_id ON tool_model(model_id);
