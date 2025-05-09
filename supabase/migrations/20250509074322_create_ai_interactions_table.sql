-- Create ai_interactions table
CREATE TABLE public.ai_interactions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_used TEXT NOT NULL, -- e.g., "snowflake_assistant", "plot_hole_finder"
  ai_model_used TEXT, -- e.g. "gpt-4-1106-preview"
  input_context JSONB, -- Data provided to AI, e.g., scene text
  prompt_text TEXT, -- User's specific query if applicable
  response_data JSONB, -- Structured AI response
  user_feedback TEXT, -- e.g., "helpful", "accepted", "rating_1_5"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for ai_interactions
-- Users can view their own AI interaction logs.
CREATE POLICY "Users can view their own AI interactions"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI interaction logs.
CREATE POLICY "Users can insert their own AI interactions"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS ( -- Ensure the project_id belongs to the user
      SELECT 1
      FROM public.projects p
      WHERE p.id = ai_interactions.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update their own AI interaction logs (e.g., to add feedback).
CREATE POLICY "Users can update their own AI interactions for feedback"
  ON public.ai_interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  -- Note: We might want to restrict what can be updated, e.g., only user_feedback.
  -- For now, allowing general update if they own the record.

-- Users cannot delete their AI interaction logs (generally for audit/history).
-- If deletion is needed, it should be a specific admin/system process.
-- CREATE POLICY "Users cannot delete AI interactions"
--   ON public.ai_interactions FOR DELETE
--   USING (FALSE); -- Effectively blocks delete for non-admins

-- Grant permissions on the ai_interactions table
GRANT ALL ON TABLE public.ai_interactions TO supabase_admin;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ai_interactions TO authenticated;
-- No DELETE for authenticated users by default to preserve history.
