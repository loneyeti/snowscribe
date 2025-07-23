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
  initializeAll: (initialState: Partial<ProjectState>, user: User) => void;
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
  deepLinkToScene: (chapterId: string, sceneId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState & ProjectActions>()((set, get) => ({
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

  initialize: (_project, _user) => {

  },

    initializeAll: (initialState, user) => {
    set({
      ...initialState, // Spread all the pre-fetched data into the store
      user,
      isLoading: { // Set all loading states to false
        project: false,
        chapters: false,
        scenes: false,
        characters: false,
        worldNotes: false,
        sceneTags: false,
        saving: false,
        generatingOutline: false,
      },
    });
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
      set(state => ({
        // Add the new chapter to the end and re-sort by the 'order' property
        chapters: [...state.chapters, newChapter].sort((a, b) => a.order - b.order),
      }));
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
      toast.success("Scene created!");
      // Re-fetch scenes for the current chapter to update the list
      set(state => {
        // Find the chapter to update
        const chapterToUpdate = state.chapters.find(c => c.id === chapterId);
        if (!chapterToUpdate) return {}; // Safety check

        // Calculate the new word count for the chapter
        const newChapterWordCount = (chapterToUpdate.word_count || 0) + (newScene.word_count || 0);

        return {
          // Update the chapters array
          chapters: state.chapters.map(ch =>
            ch.id === chapterId
              ? {
                  ...ch,
                  word_count: newChapterWordCount, // 👈 Update word count
                  // Add the new scene to the chapter's scenes array and re-sort
                  scenes: [...(ch.scenes || []), newScene].sort((a, b) => a.order - b.order)
                }
              : ch
          ),
          // Also set the new scene as the selected one for immediate viewing
          selectedScene: newScene,
        };
      });
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

    // 1. Save the original state for potential rollback on error.
    const originalChapters = get().chapters;

    // 2. Optimistic UI: Update the local state immediately for a snappy user experience.
    set(state => {
      const newChapters = state.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            scenes: (chapter.scenes || []).map(scene =>
              scene.id === sceneId ? { ...scene, ...values } : scene
            ),
          };
        }
        return chapter;
      });
      return { chapters: newChapters };
    });

    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));

    try {
      // 3. SERVER UPDATE PREPARATION:
      const { tag_ids, other_character_ids, ...sceneCoreData } = values;

      // FIX: Sanitize the data to match the UpdateSceneValues type.
      // This converts any `null` values (which are not allowed for some fields
      // like `title`) into `undefined`, which tells Zod to ignore them.
      const dataForUpdate: UpdateSceneValues = {
        order: sceneCoreData.order,
        title: sceneCoreData.title ?? undefined, // Converts null to undefined
        content: sceneCoreData.content ?? undefined,
        outline_description: sceneCoreData.outline_description,
        pov_character_id: sceneCoreData.pov_character_id, // This field allows null, so no change needed
        primary_category: sceneCoreData.primary_category, // This field allows null
        notes: sceneCoreData.notes,
      };

      // Now, remove any keys that are strictly undefined. This cleans the object
      // so we only send the fields that actually have a value to update.
      Object.keys(dataForUpdate).forEach(key => {
        const k = key as keyof UpdateSceneValues;
        if (dataForUpdate[k] === undefined) {
          delete dataForUpdate[k];
        }
      });
      
      const updatePromises: Promise<unknown>[] = [];

      if (Object.keys(dataForUpdate).length > 0) {
        updatePromises.push(
          sceneData.updateScene(project.id, chapterId, sceneId, dataForUpdate)
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

      if (updatePromises.length === 0) {
        toast.info("No changes to save.");
        // Exit early if there's nothing to do, but make sure to turn off loading.
        set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
        return; 
      }
      
      await Promise.all(updatePromises);

      // 4. RECONCILIATION: Fetch ONLY the updated chapter to get the final, accurate state.
      const fullyUpdatedChapter = await chapterData.getChapterWithScenesById(project.id, chapterId);
      
      if (fullyUpdatedChapter) {
        set(state => ({
          chapters: state.chapters.map(c => c.id === chapterId ? fullyUpdatedChapter : c),
          // Also update the selected scene if it's the one we just edited
          selectedScene: state.selectedScene?.id === sceneId 
            ? fullyUpdatedChapter.scenes?.find(s => s.id === sceneId) || state.selectedScene 
            : state.selectedScene,
        }));
      } else {
        // Fallback if the single chapter fetch fails, which is unlikely but safe.
        // In this edge case, we'll refetch all chapters to ensure consistency.
        const allChapters = await chapterData.getChaptersWithScenes(project.id);
        set({ chapters: allChapters });
      }
      
      toast.success("Scene updated successfully.", { duration: 1500 });

    } catch (e) {
      // 5. ERROR HANDLING: If any server call fails, revert the UI to its original state.
      set({ chapters: originalChapters });
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
      set(state => ({
        characters: [...state.characters, newCharacter].sort((a,b) => a.name.localeCompare(b.name)),
        selectedCharacter: newCharacter,
      }));
      return newCharacter;
    } catch(e) {
      toast.error("Failed to create character.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },
  
  updateCharacter: async (characterId, data) => {
    const projectId = get().project?.id;
    if (!projectId) {
      toast.error("Could not update character: Project context is missing.");
      return;
    }

    // 1. Get a snapshot of the current state for potential rollback.
    const originalCharacters = get().characters;
    const originalSelectedCharacter = get().selectedCharacter;

    // 2. Optimistically update the UI.
    // This happens instantly, preventing any flicker.
    set(state => ({
      characters: state.characters.map(c =>
        c.id === characterId ? { ...c, ...data } : c
      ),
      selectedCharacter: state.selectedCharacter?.id === characterId
        ? { ...state.selectedCharacter, ...data }
        : state.selectedCharacter,
    }));

    // 3. Set loading state.
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));

    try {
      // 4. Make the API call.
      const updatedCharacter = await characterData.updateCharacter(
        projectId,
        characterId,
        data
      );

      // 5. Reconcile the store with the definitive server response.
      // This ensures our UI has the absolute latest data (e.g., updated_at timestamp).
      set(state => ({
        characters: state.characters.map(c =>
          c.id === characterId ? updatedCharacter : c
        ),
        selectedCharacter: state.selectedCharacter?.id === characterId
          ? updatedCharacter
          : state.selectedCharacter,
      }));

      toast.success("Character updated!");
      return updatedCharacter;
    } catch (e) {
      // 6. Rollback on failure.
      toast.error("Failed to update character. Reverting changes.");
      set({ characters: originalCharacters, selectedCharacter: originalSelectedCharacter });
    } finally {
      // 7. Finalize by turning off the loading state.
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  deleteCharacter: async (characterId) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      await characterData.deleteCharacter(projectId, characterId);
      toast.success("Character deleted.");
      set(state => ({
        characters: state.characters.filter(c => c.id !== characterId),
        selectedCharacter: state.selectedCharacter?.id === characterId ? null : state.selectedCharacter,
      }));
    } catch(e) { toast.error("Failed to delete character."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },
  
  createWorldNote: async (noteData) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      const newNote = await worldNoteData.createWorldBuildingNote(projectId, noteData);
      toast.success("World note created!");
      set(state => ({
        worldNotes: [...state.worldNotes, newNote].sort((a,b) => a.title.localeCompare(b.title)),
        selectedWorldNote: newNote,
      }));
      return newNote;
    } catch(e) {
      toast.error("Failed to create world note.");
    } finally {
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  updateWorldNote: async (noteId, noteData) => {
    const projectId = get().project?.id;
    if (!projectId) {
      toast.error("Could not update world note: Project context is missing.");
      return;
    }

    // 1. Get snapshot for rollback.
    const originalNotes = get().worldNotes;
    const originalSelectedNote = get().selectedWorldNote;

    // 2. Optimistic update.
    set(state => ({
      worldNotes: state.worldNotes.map(n =>
        n.id === noteId ? { ...n, ...noteData } : n
      ),
      selectedWorldNote: state.selectedWorldNote?.id === noteId
        ? { ...state.selectedWorldNote, ...noteData }
        : state.selectedWorldNote,
      isEditingSelectedWorldNote: false, // Also disable edit mode optimistically
    }));

    // 3. Set loading state.
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));

    try {
      // 4. API Call.
      const updatedNote = await worldNoteData.updateWorldBuildingNote(
        projectId,
        noteId,
        noteData
      );

      // 5. Reconcile with server response.
      set(state => ({
        worldNotes: state.worldNotes.map(n =>
          n.id === noteId ? updatedNote : n
        ),
        selectedWorldNote: state.selectedWorldNote?.id === noteId
          ? updatedNote
          : state.selectedWorldNote,
      }));

      toast.success("World note updated!");
      return updatedNote;
    } catch (e) {
      // 6. Rollback on failure.
      toast.error("Failed to update world note. Reverting changes.");
      set({ worldNotes: originalNotes, selectedWorldNote: originalSelectedNote, isEditingSelectedWorldNote: true }); // Re-enable edit mode on failure
    } finally {
      // 7. Finalize loading state.
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

  deleteWorldNote: async (noteId) => {
    const projectId = get().project?.id; if (!projectId) return;
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));
    try {
      await worldNoteData.deleteWorldBuildingNote(projectId, noteId);
      toast.success("World note deleted.");
      set(state => ({
        worldNotes: state.worldNotes.filter(n => n.id !== noteId),
        selectedWorldNote: state.selectedWorldNote?.id === noteId ? null : state.selectedWorldNote,
      }));
    } catch(e) { toast.error("Failed to delete world note."); }
    finally { set(state => ({ isLoading: { ...state.isLoading, saving: false } })); }
  },

  updateProjectDetails: async (details) => {
    const { project } = get();
    if (!project) {
      toast.error("Could not update project details: No project loaded.");
      return;
    }

    // 1. Get a snapshot of the current state for potential rollback.
    const originalProject = get().project;

    // 2. Optimistically update the UI. This happens instantly.
    set(state => ({
      project: state.project ? { ...state.project, ...details } : null,
    }));

    // 3. Set the loading state to indicate a background process.
    set(state => ({ isLoading: { ...state.isLoading, saving: true } }));

    try {
      // 4. Make the asynchronous API call.
      const updatedProject = await projectService.updateProject(project.id, details);
      
      // 5. Reconcile the store with the definitive server response on success.
      set(state => ({
        project: { ...state.project, ...updatedProject },
      }));

      toast.success("Project details updated.");
    } catch (e) {
      // 6. On failure, show an error and roll back to the original state.
      toast.error(`Failed to update project details: ${getErrorMessage(e)}`);
      set({ project: originalProject });
    } finally {
      // 7. Always turn off the loading state, regardless of success or failure.
      set(state => ({ isLoading: { ...state.isLoading, saving: false } }));
    }
  },

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

deepLinkToScene: async (chapterId, sceneId) => {
  const { project, chapters, selectChapter, selectScene, fetchChapters } = get();
  if (!project) return;

  const toastId = toast.loading("Navigating to scene...");
  try {
    // Fetch chapters if they aren't loaded
    let allChapters = chapters;
    if (allChapters.length === 0) {
      await fetchChapters();
      allChapters = get().chapters; // Get the updated chapters
    }

    const targetChapter = allChapters.find(c => c.id === chapterId);
    if (!targetChapter) throw new Error("Chapter specified in URL not found.");
    
    // selectChapter now fetches scenes implicitly
    await selectChapter(targetChapter);
    
    // Find and select the scene
    const targetScene = targetChapter.scenes?.find(s => s.id === sceneId);
    if (!targetScene) throw new Error("Scene specified in URL not found.");

    selectScene(targetScene);
    
    toast.success("Navigated to scene successfully!", { id: toastId });

  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not navigate to the specified scene.", { id: toastId });
    selectChapter(null); // Reset state on failure
    selectScene(null);
  }
},
}));
