"use client";

import React, { useState } from "react";
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
  { id: "world", label: "World Notes", icon: Globe }, // Renamed "World" to "World Notes" for clarity
  { id: "ai", label: "AI Assistant", icon: Sparkles }, // Renamed "AI Tools" to "AI Assistant"
];

// Separate config for items that might appear after the main nav group or at the bottom
const bottomNavItemConfigs: NavItemConfig[] = [
  { id: "export", label: "Export", icon: FileDown },
];

export function PrimarySidebar() {
  const [activeItem, setActiveItem] = useState<string>("manuscript"); // Default active item

  const handleNavItemClick = (itemId: string) => {
    setActiveItem(itemId);
    // Actual navigation/content switching will be handled by a parent component (ProjectDashboardClient)
    // This component will likely receive setActiveSection as a prop in the future.
  };

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
            isActive={activeItem === config.id}
            onClick={() => handleNavItemClick(config.id)}
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
            isActive={activeItem === config.id}
            onClick={() => handleNavItemClick(config.id)}
          />
        ))}
        <PrimarySidebarNavItem
          icon={<Settings size={22} aria-hidden="true" />}
          label="Settings"
          isActive={activeItem === "settings"}
          onClick={() => handleNavItemClick("settings")}
        />
      </div>
    </aside>
  );
}
