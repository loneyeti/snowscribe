// lib/stores/settingsStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils';

// Import types
import type { AIVendor, AIModel, AIPrompt } from '../types';
import type { ToolModelWithAIModel } from '../schemas/toolModel.schema';

// Import server actions
import * as aiVendorData from '../data/aiVendors';
import * as aiModelData from '../data/aiModels';
import * as aiPromptData from '../data/aiPrompts';
import * as toolModelData from '../data/toolModels';

// Import form data types for creation/updates
import type { AIVendorFormData } from '../schemas/aiVendor.schema';
import type { AIModelFormData } from '../schemas/aiModel.schema';
import type { AIPromptFormData } from '../schemas/aiPrompt.schema';
import type { UpdateToolModelValues } from '../schemas/toolModel.schema';

export interface SettingsState {
  vendors: AIVendor[];
  models: AIModel[];
  prompts: AIPrompt[];
  toolModels: ToolModelWithAIModel[];
  isLoading: boolean;
}

export interface SettingsActions {
  initialize: (initialState: Partial<SettingsState>) => void;
  // Vendor Actions
  createVendor: (data: AIVendorFormData) => Promise<AIVendor | undefined>;
  updateVendor: (id: string, data: Partial<AIVendorFormData>) => Promise<AIVendor | undefined>;
  deleteVendor: (id: string) => Promise<void>;
  // Model Actions
  createModel: (data: AIModelFormData) => Promise<AIModel | undefined>;
  updateModel: (id: string, data: Partial<AIModelFormData>) => Promise<AIModel | undefined>;
  deleteModel: (id: string) => Promise<void>;
  // Prompt Actions
  createPrompt: (data: AIPromptFormData) => Promise<AIPrompt | undefined>;
  updatePrompt: (id: string, data: Partial<AIPromptFormData>) => Promise<AIPrompt | undefined>;
  deletePrompt: (id: string) => Promise<void>;
  // Tool Model Actions
  updateToolModel: (id: string, data: UpdateToolModelValues) => Promise<ToolModelWithAIModel | undefined>;
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  vendors: [],
  models: [],
  prompts: [],
  toolModels: [],
  isLoading: true,

  initialize: (initialState) => {
    set({ ...initialState, isLoading: false });
  },

  // Vendor Actions
  createVendor: async (data) => {
    try {
      const newVendor = await aiVendorData.createAIVendor(data);
      set((state) => ({
        vendors: [...state.vendors, newVendor].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      toast.success(`Vendor "${newVendor.name}" created successfully.`);
      return newVendor;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  updateVendor: async (id, data) => {
    try {
      const updatedVendor = await aiVendorData.updateAIVendor(id, data);
      set((state) => ({
        vendors: state.vendors.map((v) => (v.id === id ? updatedVendor : v)),
      }));
      toast.success(`Vendor "${updatedVendor.name}" updated successfully.`);
      return updatedVendor;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  deleteVendor: async (id: string) => {
    try {
      await aiVendorData.deleteAIVendor(id);
      set((state) => ({
        vendors: state.vendors.filter((v) => v.id !== id),
      }));
      toast.success("Vendor deleted successfully.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },

  // Model Actions
  createModel: async (data) => {
    try {
      const newModel = await aiModelData.createAIModel(data);
      set((state) => ({
        models: [...state.models, newModel].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      toast.success(`Model "${newModel.name}" created successfully.`);
      return newModel;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  updateModel: async (id, data) => {
    try {
      const updatedModel = await aiModelData.updateAIModel(id, data);
      set((state) => ({
        models: state.models.map((m) => (m.id === id ? updatedModel : m)),
      }));
      toast.success(`Model "${updatedModel.name}" updated successfully.`);
      return updatedModel;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  deleteModel: async (id: string) => {
    try {
      await aiModelData.deleteAIModel(id);
      set((state) => ({
        models: state.models.filter((m) => m.id !== id),
      }));
      toast.success("Model deleted successfully.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },

  // Prompt Actions
  createPrompt: async (data) => {
    try {
      const newPrompt = await aiPromptData.createAIPrompt(data);
      set((state) => ({
        prompts: [...state.prompts, newPrompt].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      toast.success(`Prompt "${newPrompt.name}" created successfully.`);
      return newPrompt;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  updatePrompt: async (id, data) => {
    try {
      const updatedPrompt = await aiPromptData.updateAIPrompt(id, data);
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === id ? updatedPrompt : p)),
      }));
      toast.success(`Prompt "${updatedPrompt.name}" updated successfully.`);
      return updatedPrompt;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
  deletePrompt: async (id: string) => {
    try {
      await aiPromptData.deleteAIPrompt(id);
      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
      }));
      toast.success("Prompt deleted successfully.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  },
    
  // Tool Model Actions
  updateToolModel: async (id: string, data: UpdateToolModelValues) => {
    try {
      const updatedToolModel = await toolModelData.updateToolModel(id, data);
      set(state => ({
        toolModels: state.toolModels.map(tm => tm.id === id ? updatedToolModel : tm)
      }));
      toast.success(`Tool model "${updatedToolModel.name}" updated.`);
      return updatedToolModel;
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }
}));
