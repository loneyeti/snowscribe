// This is a server-side only module
'use server';

import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { Chapter } from '../types';

export async function getChapter(
  projectId: string,
  chapterId: string,
  userId: string
): Promise<Chapter | null> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('*, word_count') // Include word_count column
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Error fetching chapter ${chapterId}:`, error);
    throw new Error('Failed to fetch chapter');
  }
  return chapter;
}

export async function getChapterWithScenesById(
  projectId: string,
  chapterId: string,
  userId: string
): Promise<Chapter | null> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  // First, get the chapter itself
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*, word_count')
    .eq('id', chapterId)
    .single();

  if (chapterError) {
    console.error(`Error fetching single chapter ${chapterId}:`, chapterError);
    if (chapterError.code === 'PGRST116') return null; // Not found is okay
    throw new Error('Failed to fetch chapter.');
  }
  if (!chapter) return null;

  // Then, get all its scenes
  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
    .eq('chapter_id', chapter.id)
    .order('order', { ascending: true });
    
  if (scenesError) {
    console.error(`Error fetching scenes for chapter ${chapterId}:`, scenesError);
    throw new Error('Failed to fetch scenes for the chapter.');
  }

  // Combine them and return
  return {
    ...chapter,
    scenes: scenes || []
  };
}

interface CreateChapterData {
  title: string;
  order?: number;
  project_id: string;
}

export async function createChapter(
  projectId: string,
  userId: string,
  chapterData: CreateChapterData
): Promise<Chapter> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  let order = chapterData.order;
  if (order === undefined) {
    const { data: maxOrderChapter, error } = await supabase
      .from('chapters')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching max order for chapters in project ${projectId}:`, error);
      order = 0;
    } else {
      order = maxOrderChapter ? maxOrderChapter.order + 1 : 0;
    }
  }

  const { data: newChapter, error } = await supabase
    .from('chapters')
    .insert({
      project_id: projectId,
      title: chapterData.title,
      order
    })
    .select('*, word_count') // Include word_count column
    .single();

  if (error) {
    console.error(`Error creating chapter for project ${projectId}:`, error);
    throw new Error('Failed to create chapter');
  }

  return newChapter;
}

export async function updateChapter(
  projectId: string,
  chapterId: string,
  userId: string,
  chapterData: { title?: string; order?: number }
): Promise<Chapter> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data: updatedChapter, error } = await supabase
    .from('chapters')
    .update({
      ...chapterData,
      updated_at: new Date().toISOString()
    })
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .select('*, word_count') // Include word_count column
    .single();

  if (error) {
    console.error(`Error updating chapter ${chapterId}:`, error);
    throw new Error('Failed to update chapter');
  }
  return updatedChapter;
}

export async function deleteChapter(
  projectId: string,
  chapterId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('project_id', projectId);

  if (error) {
    console.error(`Error deleting chapter ${chapterId}:`, error);
    throw new Error('Failed to delete chapter');
  }
}

export async function getChaptersWithScenes(
  projectId: string, 
  userId: string
): Promise<Chapter[]> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  // First get chapters with word_count
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*, word_count') // Include word_count column
    .eq('project_id', projectId)
    .order('order', { ascending: true });
  
  if (chaptersError) throw chaptersError;
  if (!chapters) return [];

  // Then get scenes for each chapter
  const chaptersWithScenes = await Promise.all(chapters.map(async (chapter) => {
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
      .eq('chapter_id', chapter.id)
      .order('order', { ascending: true });
    
    if (scenesError) throw scenesError;
    
    return {
      ...chapter,
      scenes: scenes || []
    };
  }));

  return chaptersWithScenes;
}

// Keep existing getChapters function if it exists
export async function getChapters(projectId: string, userId: string): Promise<Chapter[]> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('*, word_count') // Include word_count column
    .eq('project_id', projectId)
    .order('order', { ascending: true });

  if (error) throw error;
  return chapters || [];
}

export async function reorderChapters(
  projectId: string,
  userId: string,
  chapters: { id: string; order: number }[]
): Promise<void> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  // Create an array of update promises
  const updates = chapters.map(chapter =>
    supabase
      .from('chapters')
      .update({ order: chapter.order, updated_at: new Date().toISOString() })
      .eq('id', chapter.id)
      .eq('project_id', projectId)
  );

  // Execute all promises concurrently
  const results = await Promise.all(updates);

  // Check for any errors in the results
  const firstError = results.find(res => res.error);
  if (firstError && firstError.error) {
    console.error('Error reordering chapters:', firstError.error);
    throw new Error('Failed to update chapter order.');
  }
}
