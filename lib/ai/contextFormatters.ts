// lib/ai/contextFormatters.ts
import type { Chapter, Character, Scene, SceneTag, WorldBuildingNote } from '../types';

/**
 * Formats the entire manuscript content for AI context.
 * @param chapters - Array of chapters, each potentially containing scenes.
 * @returns A string representation of the manuscript.
 * @todo Consider token limits for very large manuscripts.
 */
export function formatManuscriptForAI(chapters: Chapter[]): string {
  if (!chapters || chapters.length === 0) {
    return "No manuscript content available.";
  }
  let formattedManuscript = "## Manuscript Content\n\n";
  chapters.forEach(chapter => {
    formattedManuscript += `### Chapter: ${chapter.title || 'Untitled Chapter'} (Order: ${chapter.order})\n\n`;
    if (chapter.scenes && chapter.scenes.length > 0) {
      chapter.scenes.forEach((scene: Scene) => {
        formattedManuscript += `#### Scene: ${scene.title || 'Untitled Scene'} (Order: ${scene.order})\n`;
        formattedManuscript += `${scene.content || 'No content for this scene.'}\n\n`;
      });
    } else {
      formattedManuscript += "No scenes in this chapter.\n\n";
    }
  });
  return formattedManuscript.trim();
}

/**
 * Formats the project outline data for AI context.
 * @param outlineData - Object containing chapters, characters, and scene tags.
 * @returns A string representation of the project outline.
 * @todo Consider token limits.
 */
export function formatOutlineForAI(outlineData: { chapters: Chapter[]; characters: Character[]; sceneTags: SceneTag[] }): string {
  if (!outlineData || !outlineData.chapters || outlineData.chapters.length === 0) {
    return "No outline data available.";
  }

  let formattedOutline = "## Project Outline Context\n\n";

  outlineData.chapters.forEach(chapter => {
    formattedOutline += `### Chapter ${chapter.order + 1}: ${chapter.title || 'Untitled Chapter'}\n`;
    if (chapter.scenes && chapter.scenes.length > 0) {
      chapter.scenes.forEach(scene => {
        formattedOutline += `  #### Scene ${scene.order + 1}: ${scene.title || 'Untitled Scene'}\n`;
        formattedOutline += `    Description: ${scene.outline_description || 'N/A'}\n`;
        
        const povCharacter = outlineData.characters.find(c => c.id === scene.pov_character_id);
        formattedOutline += `    POV Character: ${povCharacter ? povCharacter.name : 'N/A'}\n`;

        const otherCharacters = (scene.other_character_ids || [])
          .map(id => outlineData.characters.find(c => c.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        formattedOutline += `    Other Characters: ${otherCharacters || 'None'}\n`;
        
        const tags = (scene.tag_ids || [])
          .map(id => outlineData.sceneTags.find(t => t.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        formattedOutline += `    Tags: ${tags || 'None'}\n`;
        formattedOutline += `    Primary Category: ${scene.primary_category || 'N/A'}\n\n`;
      });
    } else {
      formattedOutline += "  No scenes in this chapter.\n\n";
    }
  });
  
  if (outlineData.characters.length > 0) {
    formattedOutline += "\n### Characters List:\n";
    outlineData.characters.forEach(char => {
      formattedOutline += `- ${char.name}${char.description ? `: ${char.description}` : ''}\n`;
    });
  }
  
  if (outlineData.sceneTags.length > 0) {
    formattedOutline += "\n### Scene Tags List:\n";
    outlineData.sceneTags.forEach(tag => {
      formattedOutline += `- ${tag.name}${tag.description ? `: ${tag.description}` : ''}\n`;
    });
  }

  return formattedOutline.trim();
}

/**
 * Formats character data and related scenes for AI context.
 * @param character - The character object.
 * @param relatedScenes - Array of scenes the character is involved in.
 * @returns A string representation of the character's profile and involvement.
 * @todo Consider token limits.
 */
export function formatCharacterForAI(character: Character, relatedScenes: Scene[]): string {
  if (!character) {
    return "No character data available.";
  }
  let formattedCharacter = `## Character Profile: ${character.name}\n\n`;
  formattedCharacter += `Name: ${character.name}\n`;
  if (character.nickname) formattedCharacter += `Nickname: ${character.nickname}\n`;
  if (character.description) formattedCharacter += `Description: ${character.description}\n`;
  // The 'appearance' field might be part of 'description' or 'notes' based on schema.
  // Assuming character.notes is a string. If it's JSONB, this needs specific handling.
  if (character.notes) formattedCharacter += `Notes:\n${character.notes}\n`; 
  
  formattedCharacter += "\n### Appears in Scenes:\n";
  if (relatedScenes && relatedScenes.length > 0) {
    relatedScenes.forEach(scene => {
      formattedCharacter += `- **${scene.title || 'Untitled Scene'}**: ${scene.outline_description || 'Interacts in this scene.'}\n`;
    });
  } else {
    formattedCharacter += "Not currently linked to any scenes for detailed context.\n";
  }
  return formattedCharacter.trim();
}

/**
 * Formats world building notes for AI context.
 * @param notes - Array of world building notes.
 * @returns A string representation of the world building notes.
 * @todo Consider token limits.
 */
export function formatWorldBuildingForAI(notes: WorldBuildingNote[]): string {
  if (!notes || notes.length === 0) {
    return "No world building notes available.";
  }
  let formattedNotes = "## World Building Notes\n\n";
  notes.forEach(note => {
    formattedNotes += `### Note: ${note.title}\n`;
    if (note.category) formattedNotes += `Category: ${note.category}\n`;
    formattedNotes += `Content:\n${note.content || 'No content.'}\n\n`;
  });
  return formattedNotes.trim();
}

/**
 * Formats a single scene's data for AI context.
 * @param scene - The scene object.
 * @returns A string representation of the scene's details.
 * @todo Consider token limits.
 */
export function formatSceneForAI(scene: Scene): string {
  if (!scene) {
    return "No scene data available.";
  }
  let formattedScene = `## Scene Context: ${scene.title || 'Untitled Scene'}\n\n`;
  if (scene.primary_category) formattedScene += `Primary Category: ${scene.primary_category}\n`;
  if (scene.outline_description) formattedScene += `Outline Description: ${scene.outline_description}\n`;
  // Include full content for scene-specific analysis
  formattedScene += `Full Scene Content:\n${scene.content || 'No content.'}\n`;
  
  return formattedScene.trim();
}
