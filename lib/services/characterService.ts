// lib/services/characterService.ts
import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import { type Character, type CharacterFormValues } from '../types';
import { 
  createCharacterSchema, 
  updateCharacterSchema 
} from '../schemas/character.schema';

export async function getCharacters(projectId: string, userId: string): Promise<Character[]> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching characters for project ${projectId}:`, error);
    throw new Error("Failed to fetch characters.");
  }
  return data || [];
}

export async function getCharacter(projectId: string, characterId: string, userId: string): Promise<Character | null> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .eq('project_id', projectId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found is not an error
    console.error(`Error fetching character ${characterId}:`, error);
    throw new Error('Failed to fetch character details.');
  }
  return data;
}

export async function createCharacter(projectId: string, userId: string, characterData: CharacterFormValues): Promise<Character> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);

  const dataToInsert = { ...characterData, project_id: projectId };
  const validatedData = createCharacterSchema.parse(dataToInsert);

  const { data: newCharacter, error } = await supabase
    .from('characters')
    .insert(validatedData)
    .select()
    .single();
    
  if (error) {
    console.error(`Error creating character for project ${projectId}:`, error);
    throw new Error("Failed to create character.");
  }
  return newCharacter;
}

export async function updateCharacter(
  projectId: string, 
  characterId: string, 
  userId: string, 
  characterData: Partial<CharacterFormValues>
): Promise<Character> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);
  
  const dataToUpdate = {
    ...characterData,
    image_url: characterData.image_url === null ? '' : characterData.image_url
  };
  const validatedData = updateCharacterSchema.parse(dataToUpdate);
  
  const { data: updatedCharacter, error } = await supabase
    .from('characters')
    .update(validatedData)
    .eq('id', characterId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating character ${characterId}:`, error);
    throw new Error("Failed to update character.");
  }
  return updatedCharacter;
}

export async function deleteCharacter(projectId: string, characterId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) throw new Error(ownership.error.message);
  
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('project_id', projectId);

  if (error) {
    console.error(`Error deleting character ${characterId}:`, error);
    throw new Error("Failed to delete character.");
  }
}
