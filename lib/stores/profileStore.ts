// lib/stores/profileStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/utils';
import type { Profile } from '../../lib/types';
import type { UpdateProfileValues } from '../../lib/schemas/profile.schema';
import * as profileData from '../../lib/data/profiles';

export interface ProfileState {
  profile: Pick<Profile, 'id' | 'full_name' | 'pen_name'> | null;
  isSaving: boolean;
  isLoading: boolean;
}

export interface ProfileActions {
  initialize: (initialProfile: ProfileState['profile']) => void;
  updateProfile: (data: UpdateProfileValues) => Promise<void>;
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  profile: null,
  isSaving: false,
  isLoading: true,

  initialize: (initialProfile) => {
    set({ profile: initialProfile, isLoading: false });
  },

  updateProfile: async (data) => {
    const originalProfile = get().profile;
    set({
      isSaving: true,
      // Optimistic update
      profile: originalProfile ? { ...originalProfile, ...data } : null
    });

    try {
      const updatedProfile = await profileData.updateClientProfile(data);
      set({ profile: updatedProfile, isSaving: false });
      toast.success("Profile updated successfully.");
    } catch (e) {
      // Revert on error
      set({ profile: originalProfile, isSaving: false });
      toast.error(`Failed to update profile: ${getErrorMessage(e)}`);
    }
  },
}));
