// lib/services/chapterService.ts
import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import { type Chapter } from '../types';
import type { CreateChapterValues, UpdateChapterValues } from '../schemas/chapter.schema';
import { 
  createChapterSchema,
  updateChapterSchema
} from '../schemas/chapter.schema';

export async function getChapters(projectId: string, userId: string): Promise<Chapter[]> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('"order"', { ascending: true });

  if (error) {
    console.error(`Error fetching chapters for project ${projectId}:`, error);
    throw new Error('Failed to fetch chapters');
  }
  return data || [];
}

export async function getChapter(
  projectId: string,
  chapterId: string,
  userId: string
): Promise<Chapter | null> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Error fetching chapter ${chapterId}:`, error);
    throw new Error('Failed to fetch chapter');
  }
  return data;
}

export async function createChapter(
  projectId: string,
  userId: string,
  chapterData: CreateChapterValues
): Promise<Chapter> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const validatedData = createChapterSchema.parse({
    ...chapterData,
    project_id: projectId
  });

  const { data: newChapter, error } = await supabase
    .from('chapters')
    .insert(validatedData)
    .select()
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
  chapterData: UpdateChapterValues
): Promise<Chapter> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const validatedData = updateChapterSchema.parse(chapterData);

  const { data: updatedChapter, error } = await supabase
    .from('chapters')
    .update(validatedData)
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .select()
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
