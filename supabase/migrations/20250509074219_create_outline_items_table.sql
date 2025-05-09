-- Create outline_items table
CREATE TABLE public.outline_items (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.outline_items(id) ON DELETE CASCADE, -- For hierarchical structure
  title TEXT,
  content TEXT NOT NULL,
  type TEXT, -- e.g., "summary", "plot_point", "scene_group", "character_arc"
  "order" INTEGER NOT NULL, -- "order" is a reserved keyword, so it needs to be quoted
  associated_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  associated_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.outline_items ENABLE ROW LEVEL SECURITY;

-- Policies for outline_items
-- Users can view outline items belonging to their projects.
CREATE POLICY "Users can view outline items for their projects"
  ON public.outline_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = outline_items.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert outline items into their own projects.
CREATE POLICY "Users can insert outline items for their projects"
  ON public.outline_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = outline_items.project_id AND p.user_id = auth.uid()
    )
    -- Additional check for associated_scene_id: if provided, it must belong to the same project.
    AND (outline_items.associated_scene_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      WHERE s.id = outline_items.associated_scene_id AND ch.project_id = outline_items.project_id
    ))
    -- Additional check for associated_character_id: if provided, it must belong to the same project.
    AND (outline_items.associated_character_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = outline_items.associated_character_id AND c.project_id = outline_items.project_id
    ))
    -- Additional check for parent_id: if provided, it must belong to the same project.
    AND (outline_items.parent_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.outline_items oi_parent
      WHERE oi_parent.id = outline_items.parent_id AND oi_parent.project_id = outline_items.project_id
    ))
  );

-- Users can update outline items belonging to their projects.
CREATE POLICY "Users can update outline items for their projects"
  ON public.outline_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = outline_items.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = outline_items.project_id AND p.user_id = auth.uid()
    )
    AND (outline_items.associated_scene_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.scenes s
      JOIN public.chapters ch ON s.chapter_id = ch.id
      WHERE s.id = outline_items.associated_scene_id AND ch.project_id = outline_items.project_id
    ))
    AND (outline_items.associated_character_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = outline_items.associated_character_id AND c.project_id = outline_items.project_id
    ))
    AND (outline_items.parent_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.outline_items oi_parent
      WHERE oi_parent.id = outline_items.parent_id AND oi_parent.project_id = outline_items.project_id
    ))
  );

-- Users can delete outline items belonging to their projects.
CREATE POLICY "Users can delete outline items for their projects"
  ON public.outline_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = outline_items.project_id AND p.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on outline_item update
CREATE TRIGGER on_outline_item_updated
  BEFORE UPDATE ON public.outline_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the outline_items table
GRANT ALL ON TABLE public.outline_items TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.outline_items TO authenticated;
