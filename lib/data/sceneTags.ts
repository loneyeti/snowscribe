'use server';

import { createClient } from '../supabase/server';
import { getSceneTags as getSceneTagsService, createSceneTag as createSceneTagService } from '../services/sceneTagService';
import { getErrorMessage } from '../utils';

export async function getSceneTags(projectId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('User not authenticated');
    }

    return await getSceneTagsService(projectId, user.id);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createSceneTag(projectId: string, name: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('User not authenticated');
    }

    return await createSceneTagService(projectId, user.id, name);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
