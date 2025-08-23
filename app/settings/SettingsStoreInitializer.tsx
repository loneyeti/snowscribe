// app/settings/SettingsStoreInitializer.tsx
"use client";
import { useRef } from "react";
import {
  useSettingsStore,
  type SettingsState,
} from "../../lib/stores/settingsStore";

interface SettingsStoreInitializerProps {
  initialState: Partial<SettingsState>;
}

function SettingsStoreInitializer({
  initialState,
}: SettingsStoreInitializerProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useSettingsStore.getState().initialize(initialState);
    initialized.current = true;
  }
  return null;
}

export default SettingsStoreInitializer;
