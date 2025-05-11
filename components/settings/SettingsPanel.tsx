"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
// Assuming Button, Input, Switch, Select components will be available
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// Define a basic structure for settings data
// This should be expanded based on actual application settings
interface SettingsData {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  aiProvider: string;
  // Add more settings groups and individual settings as needed
}

interface SettingsPanelProps {
  initialSettings?: SettingsData;
  onSave: (settings: SettingsData) => void | Promise<void>;
  className?: string;
}

export function SettingsPanel({
  initialSettings,
  onSave,
  className,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsData>(
    initialSettings || {
      theme: "system",
      notifications: {
        email: true,
        inApp: true,
      },
      aiProvider: "default",
    }
  );

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = useCallback(
    (field: keyof SettingsData, value: string | boolean) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNestedChange = useCallback(
    (group: keyof SettingsData, field: string, value: string | boolean) => {
      setSettings((prev) => ({
        ...prev,
        [group]: {
          ...(prev[group] as object),
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSave(settings);
      // Optionally, show a success message (e.g., using a toast notification)
    },
    [settings, onSave]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-8 p-6 bg-card text-card-foreground rounded-lg shadow-md",
        className
      )}
    >
      {/* Theme Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-foreground">
          Appearance
        </h3>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-medium text-muted-foreground"
            >
              Theme
            </label>
            {/* Replace with Select component */}
            <select
              id="theme"
              name="theme"
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-input rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-foreground">
          Notifications
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="emailNotifications"
              className="text-sm font-medium text-muted-foreground"
            >
              Email Notifications
            </label>
            {/* Replace with Switch component */}
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.notifications.email}
              onChange={(e) =>
                handleNestedChange("notifications", "email", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="inAppNotifications"
              className="text-sm font-medium text-muted-foreground"
            >
              In-App Notifications
            </label>
            {/* Replace with Switch component */}
            <input
              type="checkbox"
              id="inAppNotifications"
              checked={settings.notifications.inApp}
              onChange={(e) =>
                handleNestedChange("notifications", "inApp", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* AI Provider Settings (Example) */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-foreground">
          AI Configuration
        </h3>
        <div>
          <label
            htmlFor="aiProvider"
            className="block text-sm font-medium text-muted-foreground"
          >
            AI Model Provider
          </label>
          <input // Replace with your Input component or a Select
            type="text"
            id="aiProvider"
            name="aiProvider"
            value={settings.aiProvider}
            onChange={(e) => handleChange("aiProvider", e.target.value)}
            className="mt-1 block w-full rounded-md border-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
            placeholder="e.g., OpenAI, Anthropic, Local Model"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button // Replace with your Button component
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}
