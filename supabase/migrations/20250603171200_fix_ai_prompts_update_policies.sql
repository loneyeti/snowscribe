-- Add missing UPDATE policies for ai_prompts table

-- Allow authenticated users to update global prompts
CREATE POLICY "Allow authenticated users to update global prompts"
ON ai_prompts
FOR UPDATE
TO authenticated
USING (project_id IS NULL AND user_id IS NULL)
WITH CHECK (project_id IS NULL AND user_id IS NULL);

-- Allow users to update prompts for their projects
CREATE POLICY "Allow users to update prompts for their projects"
ON ai_prompts
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = ai_prompts.project_id AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = ai_prompts.project_id AND p.user_id = auth.uid()
    )
);
