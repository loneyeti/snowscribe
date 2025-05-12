"use client";

import React from "react"; // Removed useState
import {
  BookOpen,
  Users,
  Globe,
  Sparkles,
  Settings,
  ListChecks, // For Outline
  FileDown, // For Export
} from "lucide-react";
import { PrimarySidebarNavItem } from "./PrimarySidebarNavItem";

// Define a type for the navigation items
interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  // href?: string; // Optional: if direct navigation is needed
}

// Updated navigation items for the project dashboard
const navItemConfigs: NavItemConfig[] = [
  { id: "manuscript", label: "Manuscript", icon: BookOpen },
  { id: "outline", label: "Outline", icon: ListChecks },
  { id: "characters", label: "Characters", icon: Users },
  { id: "world-notes", label: "World Notes", icon: Globe }, // Renamed "World" to "World Notes" for clarity, ID updated
  { id: "ai", label: "AI Assistant", icon: Sparkles }, // Renamed "AI Tools" to "AI Assistant"
];

// Separate config for items that might appear after the main nav group or at the bottom
const bottomNavItemConfigs: NavItemConfig[] = [
  { id: "export", label: "Export", icon: FileDown },
  // Settings will be handled separately as it's often a modal or different page, not a main section
];

interface PrimarySidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function PrimarySidebar({
  activeSection,
  onSectionChange,
}: PrimarySidebarProps) {
  // Removed internal activeItem state and handleNavItemClick

  return (
    <aside className="w-16 bg-gray-900 text-gray-100 flex flex-col items-center py-6 shadow-lg">
      {/* Logo or App Icon placeholder */}
      <div className="mb-6">
        {" "}
        {/* Increased margin for logo */}
        <span className="text-4xl cursor-pointer" title="Snowscribe Home">
          {" "}
          {/* Slightly larger icon */}
          ❄️
        </span>
      </div>

      <nav className="flex-grow flex flex-col items-center space-y-2 w-full px-2">
        {" "}
        {/* Increased space-y */}
        {navItemConfigs.map((config) => (
          <PrimarySidebarNavItem
            key={config.id}
            icon={<config.icon size={24} aria-hidden="true" />}
            label={config.label}
            isActive={activeSection === config.id}
            onClick={() => onSectionChange(config.id)}
          />
        ))}
      </nav>

      {/* Bottom icons: Export and Settings */}
      <div className="flex flex-col items-center space-y-2 w-full px-2 pb-4">
        {" "}
        {/* Increased space-y and pb */}
        {bottomNavItemConfigs.map((config) => (
          <PrimarySidebarNavItem
            key={config.id}
            icon={<config.icon size={24} aria-hidden="true" />}
            label={config.label}
            isActive={activeSection === config.id}
            onClick={() => onSectionChange(config.id)}
          />
        ))}
        <PrimarySidebarNavItem
          icon={<Settings size={24} aria-hidden="true" />}
          label="Settings"
          isActive={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
        />
      </div>
    </aside>
  );
}
