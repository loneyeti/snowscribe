-- Add genre_id column to projects table
ALTER TABLE public.projects
ADD COLUMN genre_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.projects
ADD CONSTRAINT fk_genre
FOREIGN KEY (genre_id)
REFERENCES public.genres(id)
ON DELETE SET NULL; -- Or ON DELETE RESTRICT, depending on desired behavior

-- Make the old genre column nullable if it isn't already,
-- as we will phase it out.
-- If it was already nullable, this command might not be strictly necessary
-- but is included for completeness.
ALTER TABLE public.projects
ALTER COLUMN genre DROP NOT NULL;

-- Note: Existing data in the 'genre' text column will need to be migrated
-- to the 'genre_id' column separately if desired.
-- This migration focuses on the schema change for new entries.
-- We might also want to add an index on genre_id later for performance.
