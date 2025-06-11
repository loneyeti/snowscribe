import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { SceneTag } from '../types';
import { z } from 'zod';

export const createSceneTagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  project_id: z.string().uuid("Valid Project ID is required."),
});

export async function getSceneTags(projectId: string, userId: string): Promise<SceneTag[]> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data: tags, error } = await supabase
    .from('scene_tags')
    .select('*')
    .or(`project_id.eq.${projectId},project_id.is.null`)
    .order('name', { ascending: true });

  if (error) throw new Error('Failed to fetch scene tags');
  return tags || [];
}

export async function createSceneTag(projectId: string, userId: string, name: string): Promise<SceneTag> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data: newTag, error } = await supabase
    .from('scene_tags')
    .insert({
      name,
      project_id: projectId,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Tag "${name}" already exists for this project.`);
    }
    throw new Error('Failed to create scene tag');
  }

  return newTag;
}
