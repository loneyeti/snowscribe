CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    category TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_ai_prompt_scope_name UNIQUE (
        COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
        name
    )
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

-- Allow users to read prompts associated with projects they own/collaborate on (assuming a project ownership check)
-- This policy is a bit more complex if we introduce collaboration. For now, let's assume project_id implies ownership via other checks.
-- A simpler version: Allow users to read prompts linked to their projects if user_id on prompt matches auth.uid() OR if prompt is project-specific and user has access to project.
-- For now, let's focus on user-owned prompts and project-specific prompts created by the user.
-- System/Global prompts (project_id IS NULL AND user_id IS NULL) should be readable by all authenticated users.

CREATE POLICY "Allow authenticated users to read global prompts"
ON ai_prompts
FOR SELECT
TO authenticated
USING (project_id IS NULL AND user_id IS NULL);

-- Allow users to read prompts linked to projects they are part of.
-- This requires joining with projects table or having a helper function.
-- For simplicity now, if a prompt is project-specific, the user must be the creator to see it via the "manage their own prompts" policy.
-- A more advanced policy would check project membership.
-- Let's add a policy that allows users to read prompts for projects they own.
-- This assumes that `projects` table has RLS ensuring user can only access their own projects.
CREATE POLICY "Allow users to read prompts for their projects"
ON ai_prompts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = ai_prompts.project_id AND p.user_id = auth.uid()
    )
);


-- Allow service_role to do anything
CREATE POLICY "Allow all access for service_role"
ON ai_prompts
FOR ALL
TO service_role
USING (true);


-- Trigger to update "updated_at" timestamp
CREATE TRIGGER trigger_ai_prompts_updated_at
BEFORE UPDATE ON ai_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
