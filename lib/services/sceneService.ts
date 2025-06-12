// lib/services/sceneService.ts
import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { Scene } from '../types';
import { updateSceneSchema, type UpdateSceneValues } from '../schemas/scene.schema';
import { sceneUpdateEmitter } from "@/lib/utils/eventEmitter";

async function verifyChapterBelongsToProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, chapterId: string) {
    const { data, error } = await supabase
        .from('chapters')
        .select('id')
        .eq('id', chapterId)
        .eq('project_id', projectId)
        .single();
    if (error || !data) {
        throw new Error('Chapter not found or does not belong to the project.');
    }
}

export async function getScenesByChapterId(projectId: string, chapterId: string, userId: string): Promise<Scene[]> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    await verifyChapterBelongsToProject(client, projectId, chapterId);

    const { data, error } = await client
        .from('scenes')
        .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
        .eq('chapter_id', chapterId)
        .order('order', { ascending: true, nullsFirst: false });

    if (error) {
        console.error(`Error fetching scenes for chapter ${chapterId}:`, error);
        throw new Error('Failed to fetch scenes.');
    }
    return data || [];
}

export async function updateScene(projectId: string, chapterId: string, sceneId: string, userId: string, sceneData: UpdateSceneValues): Promise<Scene> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    await verifyChapterBelongsToProject(client, projectId, chapterId);
    
    const validatedData = updateSceneSchema.parse(sceneData);
    
    const { data: updatedScene, error } = await client
        .from('scenes')
        .update(validatedData)
        .eq('id', sceneId)
        .eq('chapter_id', chapterId)
        .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
        .single();

    if (error) {
        console.error(`Error updating scene ${sceneId}:`, error);
        throw new Error("Failed to update scene.");
    }

    sceneUpdateEmitter.emit('sceneUpdated');
    return updatedScene;
}

export async function updateSceneCharacters(projectId: string, sceneId: string, userId: string, characterIds: string[]): Promise<void> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const { error: deleteError } = await client.from('scene_characters').delete().eq('scene_id', sceneId);
    if (deleteError) {
        console.error('Failed to delete existing character links:', deleteError);
        throw new Error(`Failed to update scene characters (delete step): ${deleteError.message}`);
    }

    if (characterIds.length > 0) {
        const newLinks = characterIds.map(charObj => {
            const charId = typeof charObj === 'string' ? charObj : 
                         (charObj as {character_id: string}).character_id;
            return {
                scene_id: sceneId, 
                character_id: charId,
                created_at: new Date().toISOString()
            };
        });
        const { error: insertError } = await client.from('scene_characters').insert(newLinks);
        if (insertError) {
            console.error('Failed to insert new character links:', insertError);
            throw new Error(`Failed to update scene characters: ${insertError.message}`);
        }
    }
}

export async function updateSceneTags(projectId: string, sceneId: string, userId: string, tagIds: string[]): Promise<void> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const { error: deleteError } = await client.from('scene_applied_tags').delete().eq('scene_id', sceneId);
    if (deleteError) {
        console.error('Failed to delete existing scene tags:', deleteError);
        throw new Error(`Failed to update scene tags (delete step): ${deleteError.message}`);
    }

    if (tagIds.length > 0) {
        const newLinks = tagIds.map(tagObj => {
            const tagId = typeof tagObj === 'string' ? tagObj : 
                         (tagObj as {tag_id: string}).tag_id;
            return {
                scene_id: sceneId, 
                tag_id: tagId,
                created_at: new Date().toISOString()
            };
        });
        const { error: insertError } = await client.from('scene_applied_tags').insert(newLinks);
        if (insertError) {
            console.error('Failed to insert new scene tags:', insertError);
            throw new Error(`Failed to update scene tags: ${insertError.message}`);
        }
    }
}

export async function getSceneById(
  projectId: string,
  chapterId: string,
  sceneId: string,
  userId: string
): Promise<Scene | null> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    await verifyChapterBelongsToProject(client, projectId, chapterId);

    const { data: scene, error } = await client
      .from('scenes')
      .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
      .eq('id', sceneId)
      .eq('chapter_id', chapterId)
      .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error(`Error fetching scene ${sceneId}:`, error);
        throw new Error('Failed to fetch scene');
    }
    return scene;
}

export async function deleteScene(
  projectId: string,
  chapterId: string,
  sceneId: string,
  userId: string
): Promise<void> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    await verifyChapterBelongsToProject(client, projectId, chapterId);

    const { error } = await client
      .from('scenes')
      .delete()
      .eq('id', sceneId)
      .eq('chapter_id', chapterId);

    if (error) {
        console.error(`Error deleting scene ${sceneId}:`, error);
        throw new Error('Failed to delete scene');
    }

    sceneUpdateEmitter.emit('sceneUpdated');
}

export async function reorderScenes(
  projectId: string, 
  chapterId: string, 
  userId: string,
  scenes: { id: string; order: number }[]
): Promise<void> {
  const supabase = await createClient();
  const client = await supabase;
  const ownership = await verifyProjectOwnership(client, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  await verifyChapterBelongsToProject(client, projectId, chapterId);

  // Use a transaction to update all scenes at once
  const updates = scenes.map(scene => 
    client
      .from('scenes')
      .update({ order: scene.order, updated_at: new Date().toISOString() })
      .eq('id', scene.id)
      .eq('chapter_id', chapterId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find(res => res.error);

  if (firstError && firstError.error) {
    console.error('Error reordering scenes:', firstError.error);
    throw new Error('Failed to update scene order.');
  }
}

export async function createScene(
  projectId: string,
  chapterId: string,
  userId: string,
  sceneData: { title: string; content?: string; order?: number; primary_category?: string }
): Promise<Scene> {
    const supabase = await createClient();
    const client = await supabase;
    const ownership = await verifyProjectOwnership(client, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    await verifyChapterBelongsToProject(client, projectId, chapterId);

    let order = sceneData.order;
    if (order === undefined) {
        const { data: maxOrderScene, error } = await client
            .from('scenes')
            .select('order')
            .eq('chapter_id', chapterId)
            .order('order', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching max order for scenes in chapter ${chapterId}:`, error);
            order = 0;
        } else {
            order = maxOrderScene ? maxOrderScene.order + 1 : 0;
        }
    }

    const { data: newScene, error } = await client
        .from('scenes')
        .insert({
            chapter_id: chapterId,
            title: sceneData.title,
            content: sceneData.content || '',
            order,
            primary_category: sceneData.primary_category || null
        })
        .select('*, scene_characters(character_id), scene_applied_tags(tag_id)')
        .single();

    if (error) {
        console.error(`Error creating scene for chapter ${chapterId}:`, error);
        throw new Error('Failed to create scene');
    }

    sceneUpdateEmitter.emit('sceneUpdated');
    return newScene;
}
