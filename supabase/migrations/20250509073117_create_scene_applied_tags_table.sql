-- Create scene_applied_tags table (Junction Table)
CREATE TABLE public.scene_applied_tags (
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.scene_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scene_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE public.scene_applied_tags ENABLE ROW LEVEL SECURITY;

-- Policies for scene_applied_tags
-- Users can view applied tags for scenes in their projects.
CREATE POLICY "Users can view applied tags for their scenes"
  ON public.scene_applied_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_applied_tags.scene_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert (apply) tags to scenes in their projects.
-- This also implies the tag must be either global or belong to the same project.
CREATE POLICY "Users can apply tags to their scenes"
  ON public.scene_applied_tags FOR INSERT
  WITH CHECK (
    EXISTS ( -- Check user owns the project of the scene
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_applied_tags.scene_id AND p.user_id = auth.uid()
    )
    AND
    EXISTS ( -- Check the tag is valid for this scene (either global or same project)
      SELECT 1
      FROM public.scene_tags st
      JOIN public.scenes s_check ON s_check.id = scene_applied_tags.scene_id
      JOIN public.chapters ch_check ON s_check.chapter_id = ch_check.id
      WHERE st.id = scene_applied_tags.tag_id
        AND (st.project_id IS NULL OR st.project_id = ch_check.project_id)
    )
  );

-- Users can delete (unapply) tags from scenes in their projects.
CREATE POLICY "Users can unapply tags from their scenes"
  ON public.scene_applied_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_applied_tags.scene_id AND p.user_id = auth.uid()
    )
  );

-- Grant permissions on the scene_applied_tags table
GRANT ALL ON TABLE public.scene_applied_tags TO supabase_admin;
GRANT SELECT, INSERT, DELETE ON TABLE public.scene_applied_tags TO authenticated;
-- Update is not typical for a junction table like this; entries are usually inserted or deleted.
