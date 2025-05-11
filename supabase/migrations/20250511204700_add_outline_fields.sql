-- Add one_page_synopsis to projects table
ALTER TABLE public.projects
ADD COLUMN one_page_synopsis TEXT NULL;

-- Add outline_description to scenes table
ALTER TABLE public.scenes
ADD COLUMN outline_description TEXT NULL;

-- Add pov_character_id to scenes table
ALTER TABLE public.scenes
ADD COLUMN pov_character_id UUID NULL,
ADD CONSTRAINT scenes_pov_character_id_fkey FOREIGN KEY (pov_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;
