-- supabase/migrations/20250712100000_create_full_outline_function.sql (v2)

-- This function creates a full project outline (characters, chapters, scenes, and tags)
-- from a JSONB object in a single transaction. If any part of the process fails,
-- the entire transaction is rolled back, ensuring data integrity.
-- v2: Adds robustness to handle duplicate character names from the AI's JSON output.

CREATE OR REPLACE FUNCTION public.create_full_outline(
    p_project_id UUID,
    p_user_id UUID,
    outline_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- To allow writing to tables while respecting ownership checks
AS $$
DECLARE
    -- Variables to hold data from the JSON
    chap_obj JSONB;
    scene_obj JSONB;

    -- Variables to hold newly created IDs
    new_chapter_id UUID;
    new_scene_id UUID;
    new_tag_id UUID;
    
    -- Variables for looping
    other_char_name TEXT;
    tag_name TEXT;
    pov_char_id UUID;
BEGIN
    -- =================================================================
    -- 1. SECURITY CHECK
    -- =================================================================
    IF NOT EXISTS (
        SELECT 1
        FROM public.projects
        WHERE id = p_project_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Permission denied: User % is not the owner of project %', p_user_id, p_project_id;
    END IF;

    -- =================================================================
    -- 2. CREATE TEMPORARY TABLES
    -- =================================================================
    CREATE TEMP TABLE temp_character_map (
        name TEXT PRIMARY KEY,
        id UUID NOT NULL
    ) ON COMMIT DROP;

    -- =================================================================
    -- 3. CREATE CHARACTERS (NOW ROBUST AGAINST DUPLICATES)
    -- =================================================================
    -- Use a Common Table Expression (CTE) to unpack and deduplicate characters from JSON.
    -- The AI might provide the same character twice; we only care about the unique names.
    WITH unique_characters AS (
        SELECT DISTINCT ON (j->>'name')
            j->>'name' as name,
            j->>'description' as description
        FROM jsonb_array_elements(outline_data->'characters') j
        WHERE j->>'name' IS NOT NULL AND j->>'name' <> ''
    )
    -- Insert the unique characters into the main table.
    -- NOTE: This assumes a unique constraint exists on `characters(project_id, name)`.
    -- If a character already exists for this project, `ON CONFLICT` prevents an error.
    INSERT INTO public.characters (project_id, name, description)
    SELECT p_project_id, uc.name, uc.description
    FROM unique_characters uc
    ON CONFLICT (project_id, name) DO NOTHING;

    -- Now, populate the temp map by joining the unique names from the JSON
    -- with the actual records in the database. This is safe because we select
    -- distinct names, preventing the primary key violation.
    WITH unique_character_names AS (
      SELECT DISTINCT j->>'name' as name
      FROM jsonb_array_elements(outline_data->'characters') j
      WHERE j->>'name' IS NOT NULL AND j->>'name' <> ''
    )
    INSERT INTO temp_character_map (name, id)
    SELECT ucn.name, c.id
    FROM unique_character_names ucn
    JOIN public.characters c ON ucn.name = c.name AND c.project_id = p_project_id;

    -- =================================================================
    -- 4. CREATE CHAPTERS AND SCENES (NESTED LOOP)
    -- =================================================================
    FOR chap_obj IN SELECT * FROM jsonb_array_elements(outline_data->'chapters')
    LOOP
        INSERT INTO public.chapters (project_id, title, "order")
        VALUES (p_project_id, chap_obj->>'title', (chap_obj->>'order')::int)
        RETURNING id INTO new_chapter_id;

        FOR scene_obj IN SELECT * FROM jsonb_array_elements(chap_obj->'scenes')
        LOOP
            SELECT id INTO pov_char_id FROM temp_character_map WHERE name = scene_obj->>'povCharacterName';

            INSERT INTO public.scenes (
                chapter_id, title, "order", outline_description, pov_character_id, primary_category
            )
            VALUES (
                new_chapter_id,
                scene_obj->>'title',
                (scene_obj->>'order')::int,
                scene_obj->>'description',
                pov_char_id,
                (scene_obj->>'primaryCategory')::public.primary_scene_category_enum
            )
            RETURNING id INTO new_scene_id;

            -- 5. LINK OTHER CHARACTERS TO THE SCENE
            IF jsonb_typeof(scene_obj->'otherCharacterNames') = 'array' THEN
                FOR other_char_name IN SELECT value FROM jsonb_array_elements_text(scene_obj->'otherCharacterNames')
                LOOP
                    -- Insert only if the character exists in our map.
                    INSERT INTO public.scene_characters (scene_id, character_id)
                    SELECT new_scene_id, tcm.id
                    FROM temp_character_map tcm
                    WHERE tcm.name = other_char_name;
                END LOOP;
            END IF;

            -- 6. GET OR CREATE TAGS AND LINK TO THE SCENE
            IF jsonb_typeof(scene_obj->'tagNames') = 'array' THEN
                FOR tag_name IN SELECT value FROM jsonb_array_elements_text(scene_obj->'tagNames')
                LOOP
                    SELECT st.id INTO new_tag_id
                    FROM public.scene_tags st
                    WHERE st.name = tag_name AND (st.project_id = p_project_id OR st.project_id IS NULL)
                    ORDER BY st.project_id NULLS LAST
                    LIMIT 1;

                    IF new_tag_id IS NULL THEN
                        INSERT INTO public.scene_tags (project_id, user_id, name)
                        VALUES (p_project_id, p_user_id, tag_name)
                        ON CONFLICT (project_id, name) DO UPDATE SET name = EXCLUDED.name -- handle race conditions
                        RETURNING id INTO new_tag_id;
                    END IF;

                    INSERT INTO public.scene_applied_tags (scene_id, tag_id)
                    VALUES (new_scene_id, new_tag_id)
                    ON CONFLICT (scene_id, tag_id) DO NOTHING;
                END LOOP;
            END IF;

        END LOOP;
    END LOOP;

END;
$$;