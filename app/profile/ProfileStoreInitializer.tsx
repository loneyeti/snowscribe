// app/profile/ProfileStoreInitializer.tsx
"use client";
import { useRef } from "react";
import { useProfileStore, type ProfileState } from "@/lib/stores/profileStore";

interface ProfileStoreInitializerProps {
  initialProfile: ProfileState["profile"];
}

function ProfileStoreInitializer({
  initialProfile,
}: ProfileStoreInitializerProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useProfileStore.getState().initialize(initialProfile);
    initialized.current = true;
  }
  return null;
}

export default ProfileStoreInitializer;
