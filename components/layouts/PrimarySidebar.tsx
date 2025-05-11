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
    <aside className="w-16 bg-slate-800 text-slate-100 flex flex-col items-center py-4 space-y-2">
      {/* Logo or App Icon placeholder */}
      <div className="p-2 mb-2">
        {" "}
        {/* Adjusted margin */}
        <span className="text-3xl cursor-pointer" title="Snowscribe Home">
          ❄️
        </span>
      </div>

      <nav className="flex-grow flex flex-col items-center space-y-1 w-full px-2">
        {navItemConfigs.map((config) => (
          <PrimarySidebarNavItem
            key={config.id}
            icon={<config.icon size={22} aria-hidden="true" />}
            label={config.label}
            isActive={activeSection === config.id}
            onClick={() => onSectionChange(config.id)}
          />
        ))}
      </nav>

      {/* Bottom icons: Export and Settings */}
      <div className="flex flex-col items-center space-y-1 w-full px-2 pb-1">
        {bottomNavItemConfigs.map((config) => (
          <PrimarySidebarNavItem
            key={config.id}
            icon={<config.icon size={22} aria-hidden="true" />}
            label={config.label}
            isActive={activeSection === config.id} // Use activeSection for isActive
            onClick={() => onSectionChange(config.id)} // Call onSectionChange
          />
        ))}
        <PrimarySidebarNavItem
          icon={<Settings size={22} aria-hidden="true" />}
          label="Settings"
          isActive={activeSection === "settings"} // Use activeSection for isActive
          onClick={() => onSectionChange("settings")} // Call onSectionChange
        />
      </div>
    </aside>
  );
}
