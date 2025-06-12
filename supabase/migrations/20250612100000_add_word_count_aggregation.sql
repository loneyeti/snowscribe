-- Step 1 & 2: Add word_count columns
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS word_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS word_count BIGINT NOT NULL DEFAULT 0;

-- Step 3: Create the robust trigger function
CREATE OR REPLACE FUNCTION public.update_aggregate_word_counts()
RETURNS TRIGGER AS $$
DECLARE
  old_chapter_id UUID;
  new_chapter_id UUID;
  old_project_id UUID;
  new_project_id UUID;
  word_count_change BIGINT;
BEGIN
  -- Handle INSERT: Add word count to the new chapter/project
  IF (TG_OP = 'INSERT') THEN
    new_chapter_id := NEW.chapter_id;
    word_count_change := COALESCE(NEW.word_count, 0);
    
    IF word_count_change != 0 THEN
      SELECT project_id INTO new_project_id FROM public.chapters WHERE id = new_chapter_id;
      UPDATE public.chapters SET word_count = word_count + word_count_change WHERE id = new_chapter_id;
      UPDATE public.projects SET word_count = word_count + word_count_change WHERE id = new_project_id;
    END IF;

  -- Handle DELETE: Subtract word count from the old chapter/project
  ELSIF (TG_OP = 'DELETE') THEN
    old_chapter_id := OLD.chapter_id;
    word_count_change := COALESCE(OLD.word_count, 0);

    IF word_count_change != 0 THEN
      SELECT project_id INTO old_project_id FROM public.chapters WHERE id = old_chapter_id;
      UPDATE public.chapters SET word_count = word_count - word_count_change WHERE id = old_chapter_id;
      UPDATE public.projects SET word_count = word_count - word_count_change WHERE id = old_project_id;
    END IF;

  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Case 1: The scene moved to a different chapter
    IF OLD.chapter_id IS DISTINCT FROM NEW.chapter_id THEN
      -- Get project_ids
      SELECT project_id INTO old_project_id FROM public.chapters WHERE id = OLD.chapter_id;
      SELECT project_id INTO new_project_id FROM public.chapters WHERE id = NEW.chapter_id;

      -- Decrement old chapter/project
      UPDATE public.chapters SET word_count = word_count - COALESCE(OLD.word_count, 0) WHERE id = OLD.chapter_id;
      UPDATE public.projects SET word_count = word_count - COALESCE(OLD.word_count, 0) WHERE id = old_project_id;
      
      -- Increment new chapter/project
      UPDATE public.chapters SET word_count = word_count + COALESCE(NEW.word_count, 0) WHERE id = NEW.chapter_id;
      UPDATE public.projects SET word_count = word_count + COALESCE(NEW.word_count, 0) WHERE id = new_project_id;

    -- Case 2: The scene stayed in the same chapter, but its word count may have changed
    ELSE
      word_count_change := COALESCE(NEW.word_count, 0) - COALESCE(OLD.word_count, 0);
      IF word_count_change != 0 THEN
        new_chapter_id := NEW.chapter_id;
        SELECT project_id INTO new_project_id FROM public.chapters WHERE id = new_chapter_id;
        UPDATE public.chapters SET word_count = word_count + word_count_change WHERE id = new_chapter_id;
        UPDATE public.projects SET word_count = word_count + word_count_change WHERE id = new_project_id;
      END IF;
    END IF;
  END IF;

  -- The return value is ignored for AFTER triggers, but it's good practice
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Drop the old trigger if it exists and create the new, robust one
DROP TRIGGER IF EXISTS scene_word_count_changed_trigger ON public.scenes;
CREATE TRIGGER scene_word_count_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_aggregate_word_counts();

-- Step 5: Backfill existing data
-- NOTE: Run this after the new trigger is in place.
UPDATE public.chapters c
SET word_count = (
    SELECT COALESCE(SUM(s.word_count), 0)
    FROM public.scenes s
    WHERE s.chapter_id = c.id
);

UPDATE public.projects p
SET word_count = (
    SELECT COALESCE(SUM(c.word_count), 0)
    FROM public.chapters c
    WHERE c.project_id = p.id
);