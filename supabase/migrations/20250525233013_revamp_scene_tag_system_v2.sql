-- Migration: supabase/migrations/20250525233013_revamp_scene_tag_system_v2.sql

CREATE TYPE public.primary_scene_category_enum AS ENUM (
    'Action',       -- Physical conflict, chases, fights
    'Dialogue',     -- Character conversations, negotiations
    'Reflection',   -- Internal thoughts, processing events
    'Discovery',    -- Revelations, clues, learning information
    'Relationship', -- Building/destroying connections between characters
    'Transition',   -- Moving between locations/time periods
    'Worldbuilding' -- Establishing setting, culture, rules
);

ALTER TABLE public.scenes
ADD COLUMN primary_category public.primary_scene_category_enum NULL;
