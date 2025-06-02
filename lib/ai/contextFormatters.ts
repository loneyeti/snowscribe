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
export function formatCharacterForAI(character: Character, allScenesCharacterIsIn: Scene[]): string {
  if (!character) {
    return "CHARACTER PROFILE UNAVAILABLE FOR IMPERSONATION.";
  }
  let formattedContext = `## IMPERSONATE THIS CHARACTER:\n\n### Character Profile: ${character.name}\n`;
  if (character.nickname) formattedContext += `Nickname: ${character.nickname}\n`;
  if (character.description) formattedContext += `Description: ${character.description}\n`;
  // The 'notes' field is TEXT, so we can directly include it.
  if (character.notes) formattedContext += `Detailed Notes/Backstory/Motivations:\n${character.notes}\n`;

  formattedContext += "\n### SCENE CONTEXTS (Excerpts from scenes this character appears in):\n";
  if (allScenesCharacterIsIn && allScenesCharacterIsIn.length > 0) {
    allScenesCharacterIsIn.forEach((scene, index) => {
      formattedContext += `\n--- Scene Excerpt ${index + 1} ---\n`;
      formattedContext += `Title: ${scene.title || 'Untitled Scene'}\n`;
      if (scene.outline_description) formattedContext += `Outline/Summary: ${scene.outline_description}\n`;
      
      const isPov = scene.pov_character_id === character.id;
      const povInfo = isPov ? ` (This scene is from ${character.name}'s Point of View.)` : "";
      formattedContext += `Role in Scene: ${isPov ? 'POV Character' : 'Present Character'}${povInfo}\n`;

      // Provide a snippet of scene content for context
      const sceneContentSnippet = scene.content 
        ? (scene.content.length > 750 ? scene.content.substring(0, 750) + "..." : scene.content) 
        : "No detailed content provided for this scene excerpt.";
      formattedContext += `Content Snippet:\n"""\n${sceneContentSnippet}\n"""\n`;
    });
  } else {
    formattedContext += "This character has not yet appeared in any scenes with detailed content provided in this context.\n";
  }
  formattedContext += "\nIMPORTANT: You are to respond *as* this character, using all the provided information to inform your personality, knowledge, and replies. Do not break character.\n";
  return formattedContext.trim();
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
