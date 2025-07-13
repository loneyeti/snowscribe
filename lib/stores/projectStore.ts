// lib/stores/projectStore.ts
import { create } from 'zustand';
import { type User } from '@supabase/supabase-js';
import { countWords, getErrorMessage } from '@/lib/utils';
import * as projectService from '@/lib/data/projects';
import * as outlineCreator from '@/lib/ai/outlineCreator';
import type { Project, Chapter, Scene, Character, WorldBuildingNote, SceneTag, CharacterFormValues, UpdateSceneValues, PrimarySceneCategory } from '@/lib/types';
import type { UpdateProjectValues } from '@/lib/schemas/project.schema';
import * as chapterData from '@/lib/data/chapters';
import * as sceneData from '@/lib/data/scenes';
import * as characterData from '@/lib/data/characters';
import * as worldNoteData from '@/lib/data/worldBuildingNotes';
import * as sceneTagData from '@/lib/data/sceneTags';
import { toast } from 'sonner';

export interface ProjectState {
  project: Project | null;
  user: User | null;
  chapters: Chapter[];
  characters: Character[];
  worldNotes: WorldBuildingNote[];
  sceneTags: SceneTag[];
  selectedChapter: Chapter | null;
  selectedScene: Scene | null;
  selectedCharacter: Character | null;
  selectedWorldNote: WorldBuildingNote | null;
  isEditingSelectedWorldNote: boolean;
  isLoading: {
    project: boolean;
    chapters: boolean;
    scenes: boolean;
    characters: boolean;
    worldNotes: boolean;
    sceneTags: boolean;
    saving: boolean;
    generatingOutline: boolean;
  };
}

interface ComprehensiveUpdateSceneValues {
  title?: string | null; // UI might send null, we'll clean it up
  content?: string | null;
  order?: number;
  outline_description?: string | null;
  pov_character_id?: string | null;
  primary_category?: PrimarySceneCategory | null; // Use the specific union type
  notes?: string | null;
  tag_ids?: string[];
  other_character_ids?: string[];
}

export interface ProjectActions {
  initialize: (project: Project, user: User) => void;
  fetchChapters: () => Promise<void>;
  fetchCharacters: () => Promise<void>;
  fetchWorldNotes: () => Promise<void>;
  fetchSceneTags: () => Promise<void>;
  selectChapter: (chapter: Chapter | null) => void;
  selectScene: (scene: Scene | null) => void;
  selectCharacter: (characterId: string) => Promise<void>;
  selectWorldNote: (noteId: string) => Promise<void>;
  enableWorldNoteEditMode: () => void;
  disableWorldNoteEditMode: () => void;
  createChapter: (title: string) => Promise<Chapter | undefined>;
  createScene: (chapterId: string, title: string, primaryCategory: string) => Promise<Scene | undefined>; 
  updateScene: (chapterId: string, sceneId: string, values: ComprehensiveUpdateSceneValues) => Promise<void>;
  reorderScenes: (chapterId: string, scenes: { id: string; order: number }[]) => Promise<void>;
  createCharacter: (data: CharacterFormValues) => Promise<Character | undefined>;
  updateCharacter: (characterId: string, data: Partial<CharacterFormValues>) => Promise<Character | undefined>;
  deleteCharacter: (characterId: string) => Promise<void>;
  createWorldNote: (noteData: { title: string; category?: string; content?: string }) => Promise<WorldBuildingNote | undefined>;
  updateWorldNote: (noteId: string, noteData: Partial<{ title: string; category?: string; content?: string }>) => Promise<WorldBuildingNote | undefined>;
  deleteWorldNote: (noteId: string) => Promise<void>;
  updateProjectDetails: (details: Partial<UpdateProjectValues>) => Promise<void>;
  generateAIFullOutline: () => Promise<void>;
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  project: null,
  user: null,
  chapters: [],
  characters: [],
  worldNotes: [],
  sceneTags: [],
  selectedChapter: null,
  selectedScene: null,
  selectedCharacter: null,
  selectedWorldNote: null,
  isEditingSelectedWorldNote: false,
  isLoading: {
    project: true, chapters: true, scenes: false, characters: true,
    worldNotes: true, sceneTags: true, saving: false, generatingOutline: false,
  },

  initialize: (project, user) => {
    set({ project, user, isLoading: { ...get().isLoading, project: false } });
    get().fetchChapters();
    get().fetchCharacters();
    get().fetchWorldNotes();
    get().fetchSceneTags();
  },

  fetchChapters: async () => {
    const projectId = get().project?.id;
    if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, chapters: true } }));
    try {
      const chapters = await chapterData.getChaptersWithScenes(projectId);
      set({ chapters: chapters.sort((a,b) => a.order - b.order), isLoading: { ...get().isLoading, chapters: false } });
    } catch (e) { toast.error(`Failed to load chapters: ${e instanceof Error ? e.message : String(e)}`); set(state => ({ isLoading: { ...state.isLoading, chapters: false } })); }
  },

  fetchCharacters: async () => {
    const projectId = get().project?.id;
    if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, characters: true } }));
    try {
      const characters = await characterData.getCharacters(projectId);
      set({ characters: characters.sort((a,b) => a.name.localeCompare(b.name)), isLoading: { ...get().isLoading, characters: false } });
    } catch (e) { toast.error(`Failed to load characters: ${e instanceof Error ? e.message : String(e)}`); set(state => ({ isLoading: { ...state.isLoading, characters: false } })); }
  },

  fetchWorldNotes: async () => {
    const projectId = get().project?.id;
    if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, worldNotes: true } }));
    try {
      const notes = await worldNoteData.getWorldBuildingNotes(projectId);
      set({ worldNotes: notes.sort((a,b) => a.title.localeCompare(b.title)), isLoading: { ...get().isLoading, worldNotes: false } });
    } catch (e) { toast.error(`Failed to load world notes: ${e instanceof Error ? e.message : String(e)}`); set(state => ({ isLoading: { ...state.isLoading, worldNotes: false } })); }
  },

  fetchSceneTags: async () => {
    const projectId = get().project?.id;
    if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, sceneTags: true } }));
    try {
      const tags = await sceneTagData.getSceneTags(projectId);
      set({ sceneTags: tags, isLoading: { ...get().isLoading, sceneTags: false } });
    } catch (e) { toast.error(`Failed to load scene tags: ${e instanceof Error ? e.message : String(e)}`); set(state => ({ isLoading: { ...state.isLoading, sceneTags: false } })); }
  },

  selectChapter: async (chapter) => {
    set({ selectedChapter: chapter, selectedScene: null });
  },
  
  selectScene: (scene) => set({ selectedScene: scene }),

  selectCharacter: async (characterId) => {
    const projectId = get().project?.id;
    if (!projectId) return;
    const existing = get().characters.find(c => c.id === characterId);
    if (existing?.notes) { set({ selectedCharacter: existing }); return; }
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const character = await characterData.getCharacter(projectId, characterId);
      if (character) {
        set(state => ({
          characters: state.characters.map(c => c.id === characterId ? character : c),
          selectedCharacter: character,
        }));
      }
    } catch (e) { toast.error(`Failed to load character: ${e instanceof Error ? e.message : String(e)}`); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

  selectWorldNote: async (noteId) => {
    const projectId = get().project?.id;
    if (!projectId) return;
    const existing = get().worldNotes.find(n => n.id === noteId);
    if (existing) { set({ selectedWorldNote: existing, isEditingSelectedWorldNote: false }); return; }
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const note = await worldNoteData.getWorldBuildingNote(projectId, noteId);
      if (note) {
        set(state => ({
            worldNotes: state.worldNotes.map(n => n.id === noteId ? note : n),
            selectedWorldNote: note, isEditingSelectedWorldNote: false,
        }));
      }
    } catch (e) { toast.error(`Failed to load world note: ${e instanceof Error ? e.message : String(e)}`); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

  enableWorldNoteEditMode: () => set({ isEditingSelectedWorldNote: true }),
  disableWorldNoteEditMode: () => set({ isEditingSelectedWorldNote: false }),
  
  createChapter: async (title) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const newChapter = await chapterData.createChapter(projectId, { title });
      toast.success("Chapter created!");
      await get().fetchChapters(); // Re-fetch to ensure order is correct
      return newChapter;
    } catch (e) {
      toast.error("Failed to create chapter.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  createScene: async (chapterId, title, primaryCategory) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const newScene = await sceneData.createScene(projectId, chapterId, { title, primary_category: primaryCategory });
      set({ selectedScene: newScene });
      toast.success("Scene created!");
      // Re-fetch scenes for the current chapter to update the list
      if (get().selectedChapter) {
        await get().selectChapter(get().chapters.find(c => c.id === chapterId) || null);
      }
      return newScene;
    } catch (e) {
      toast.error("Failed to create scene.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  updateScene: async (chapterId, sceneId, values) => {
    const { project } = get();
    if (!project || !chapterId) {
      toast.error("Could not save scene: Missing project or chapter context.");
      return;
    }

    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));

    try {
      const { tag_ids, other_character_ids, ...sceneCoreData } = values;
      
      // FIX 5: Type the promise array with a safer type than `any`
      const updatePromises: Promise<unknown>[] = [];

      // FIX 3: Build an object that strictly conforms to UpdateSceneValues.
      // The key is to handle fields that can't be null according to the schema.
      const cleanSceneData: UpdateSceneValues = {
        title: sceneCoreData.title ?? undefined, // Convert null to undefined
        content: sceneCoreData.content ?? undefined,
        order: sceneCoreData.order,
        outline_description: sceneCoreData.outline_description,
        pov_character_id: sceneCoreData.pov_character_id,
        primary_category: sceneCoreData.primary_category,
        notes: sceneCoreData.notes,
      };
      
      // FIX 4: Remove 'any' and make this loop type-safe to remove undefined keys
      Object.keys(cleanSceneData).forEach(key => {
        const k = key as keyof UpdateSceneValues;
        if (cleanSceneData[k] === undefined) {
          delete cleanSceneData[k];
        }
      });
      
      // Now the cleanSceneData object is guaranteed to be valid for the service function.
      if (Object.keys(cleanSceneData).length > 0) {
        updatePromises.push(
          sceneData.updateScene(project.id, chapterId, sceneId, cleanSceneData)
        );
      }

      if (other_character_ids !== undefined) {
        updatePromises.push(
          sceneData.updateSceneCharacters(project.id, sceneId, other_character_ids)
        );
      }

      if (tag_ids !== undefined) {
        updatePromises.push(
          sceneData.updateSceneTags(project.id, sceneId, tag_ids)
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        await get().fetchChapters();
        toast.success("Scene updated successfully.", { duration: 1500 });
      } else {
        toast.info("No changes to save.");
      }

    } catch (e) {
      toast.error(`Failed to save scene: ${getErrorMessage(e)}`);
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },
  
  reorderScenes: async (chapterId, scenes) => {
    const projectId = get().project?.id; if (!projectId) return;
    const originalChapters = get().chapters;
    const reorderedLocalScenes = get().chapters.find(c => c.id === chapterId)?.scenes?.map(s => ({...s, order: scenes.find(newS => newS.id === s.id)?.order ?? s.order})).sort((a,b) => a.order - b.order) || [];
    set(state => ({ chapters: state.chapters.map(c => c.id === chapterId ? { ...c, scenes: reorderedLocalScenes } : c) }));
    try {
      await sceneData.reorderScenesInChapter(projectId, chapterId, scenes);
      toast.success("Scene order saved.");
    } catch(e) { set({ chapters: originalChapters }); toast.error("Failed to save scene order."); }
  },

  createCharacter: async (data) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const newCharacter = await characterData.createCharacter(projectId, data);
      toast.success("Character created!");
      await get().fetchCharacters(); // Re-fetch all characters
      set({ selectedCharacter: get().characters.find(c => c.id === newCharacter.id) });
      return newCharacter;
    } catch(e) {
      toast.error("Failed to create character.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },
  
  updateCharacter: async (characterId, data) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const updatedCharacter = await characterData.updateCharacter(projectId, characterId, data);
      toast.success("Character updated!");
      await get().fetchCharacters(); // Re-fetch all characters
      if (get().selectedCharacter?.id === characterId) {
        set({ selectedCharacter: get().characters.find(c => c.id === characterId) });
      }
      return updatedCharacter;
    } catch(e) { toast.error("Failed to update character."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

  deleteCharacter: async (characterId) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      await characterData.deleteCharacter(projectId, characterId);
      toast.success("Character deleted.");
      if (get().selectedCharacter?.id === characterId) {
        set({ selectedCharacter: null });
      }
      await get().fetchCharacters(); // Re-fetch all characters
    } catch(e) { toast.error("Failed to delete character."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },
  
  createWorldNote: async (noteData) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const newNote = await worldNoteData.createWorldBuildingNote(projectId, noteData);
      toast.success("World note created!");
      await get().fetchWorldNotes();
      set({ selectedWorldNote: get().worldNotes.find(n => n.id === newNote.id) });
      return newNote;
    } catch(e) {
      toast.error("Failed to create world note.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  updateWorldNote: async (noteId, noteData) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const updatedNote = await worldNoteData.updateWorldBuildingNote(projectId, noteId, noteData);
      toast.success("World note updated!");
      await get().fetchWorldNotes();
      if (get().selectedWorldNote?.id === noteId) {
        set({ selectedWorldNote: get().worldNotes.find(n => n.id === noteId) });
      }
      return updatedNote;
    } catch(e) { toast.error("Failed to update world note."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

  deleteWorldNote: async (noteId) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      await worldNoteData.deleteWorldBuildingNote(projectId, noteId);
      toast.success("World note deleted.");
      if (get().selectedWorldNote?.id === noteId) {
        set({ selectedWorldNote: null });
      }
      await get().fetchWorldNotes();
    } catch(e) { toast.error("Failed to delete world note."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

// Add this action inside the create() function object
updateProjectDetails: async (details) => {
  const { project } = get();
  if (!project) return;

  set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
  try {
    const updatedProject = await projectService.updateProject(project.id, details);
    
    // Update both the main project object and the genre information
    set(state => ({
      project: { ...state.project, ...updatedProject },
      isLoading: { ...state.isLoading, saving: false }
    }));
    toast.success("Project details updated.");
  } catch (e) {
    toast.error(`Failed to update project details: ${getErrorMessage(e)}`);
    set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
  }
},

// Add this action inside the create() function object
generateAIFullOutline: async () => {
  const { project } = get();
  if (!project || !project.one_page_synopsis) {
    toast.error("A 'One Page Synopsis' is required to generate an outline.");
    return;
  }

  set(state => ({ isLoading: { ...state.isLoading, generatingOutline: true } }));
  const toastId = toast.loading("Generating full outline with AI... This may take a few minutes.");

  try {
    // Correctly call the server actions from the outlineCreator module
    const parsedData = await outlineCreator.generateAndParseOutline(project.id);
    if (parsedData) {
      toast.info("AI has generated the outline. Creating chapters, scenes, and characters...", { id: toastId });
      await outlineCreator.createEntitiesFromOutline(project.id, parsedData);
      toast.success("Full outline created successfully!", { id: toastId });
      
      // Refresh data in the store by calling the store's own fetch actions
      await get().fetchChapters();
      await get().fetchCharacters();
    } else {
      toast.error("Failed to generate or parse outline data from AI. No changes made.", { id: toastId });
    }
  } catch (e) {
    toast.error(`Outline Generation Failed: ${getErrorMessage(e)}`, { id: toastId });
  } finally {
    set(state => ({ isLoading: { ...state.isLoading, generatingOutline: false } }));
  }
},
}));
