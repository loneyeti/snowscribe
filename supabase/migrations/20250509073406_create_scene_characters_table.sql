-- Create scene_characters table (Junction Table)
CREATE TABLE public.scene_characters (
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scene_id, character_id)
);

-- Enable Row Level Security
ALTER TABLE public.scene_characters ENABLE ROW LEVEL SECURITY;

-- Policies for scene_characters
-- Users can view character links for scenes in their projects.
CREATE POLICY "Users can view scene-character links for their projects"
  ON public.scene_characters FOR SELECT
  USING (
    EXISTS ( -- Check user owns the project of the scene
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_characters.scene_id AND p.user_id = auth.uid()
    )
    AND
    EXISTS ( -- Check user owns the project of the character
      SELECT 1
      FROM public.characters c
      JOIN public.projects p_char ON c.project_id = p_char.id
      WHERE c.id = scene_characters.character_id AND p_char.user_id = auth.uid()
    )
  );

-- Users can insert (link) characters to scenes in their projects.
-- This implies both the scene and character belong to one of the user's projects.
CREATE POLICY "Users can link characters to their scenes"
  ON public.scene_characters FOR INSERT
  WITH CHECK (
    EXISTS ( -- Check user owns the project of the scene
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_characters.scene_id AND p.user_id = auth.uid()
    )
    AND
    EXISTS ( -- Check user owns the project of the character AND character's project matches scene's project
      SELECT 1
      FROM public.characters c
      JOIN public.projects p_char ON c.project_id = p_char.id
      JOIN public.scenes s_link ON s_link.id = scene_characters.scene_id
      JOIN public.chapters ch_link ON s_link.chapter_id = ch_link.id
      WHERE c.id = scene_characters.character_id 
        AND p_char.user_id = auth.uid()
        AND c.project_id = ch_link.project_id -- Ensure character and scene are in the SAME project
    )
  );

-- Users can delete (unlink) characters from scenes in their projects.
CREATE POLICY "Users can unlink characters from their scenes"
  ON public.scene_characters FOR DELETE
  USING (
    EXISTS ( -- Check user owns the project of the scene
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      JOIN public.projects p ON ch.project_id = p.id
      WHERE s.id = scene_characters.scene_id AND p.user_id = auth.uid()
    )
    -- No need to check character ownership again for delete, scene ownership is sufficient
  );

-- Grant permissions on the scene_characters table
GRANT ALL ON TABLE public.scene_characters TO supabase_admin;
GRANT SELECT, INSERT, DELETE ON TABLE public.scene_characters TO authenticated;
