-- Create table without the inline unique constraint
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    category TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    -- The problematic CONSTRAINT uq_ai_prompt_scope_name has been removed from here
);

-- Add the unique index separately
-- Using "IF NOT EXISTS" for idempotency, though "supabase db reset" typically drops everything first.
-- Good practice for standalone script execution.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_prompt_scope_name_idx -- Changed name slightly to indicate it's an index
ON ai_prompts (
    COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
);

-- Enable RLS
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Policies

-- Allow users to manage (CRUD) their own prompts
CREATE POLICY "Allow users to manage their own prompts"
ON ai_prompts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read global prompts
CREATE POLICY "Allow authenticated users to read global prompts"
ON ai_prompts
FOR SELECT
TO authenticated
USING (project_id IS NULL AND user_id IS NULL);

-- Allow users to read prompts for their projects
CREATE POLICY "Allow users to read prompts for their projects"
ON ai_prompts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = ai_prompts.project_id AND p.user_id = auth.uid() -- Assuming projects.user_id exists and identifies the owner
    )
);

-- Allow service_role to do anything
CREATE POLICY "Allow all access for service_role"
ON ai_prompts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); -- Added WITH CHECK (true) for completeness, though often omitted for service_role

-- Trigger to update "updated_at" timestamp
-- Ensure the function update_updated_at_column() exists.
-- If it doesn't, you need to create it, e.g.:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = now();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

CREATE TRIGGER trigger_ai_prompts_updated_at
BEFORE UPDATE ON ai_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
