"use client";

import React from "react"; // Removed useState
import {
  BookOpen,
  Users,
  Globe,
  Sparkles,
  ListChecks, // For Outline
  FileDown, // For Export
} from "lucide-react";
import { PrimarySidebarNavItem } from "./PrimarySidebarNavItem";
import Link from "next/link";
import { UserMenuButton } from "../auth/UserMenuButton";
import { User } from "@supabase/supabase-js";

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
  { id: "export", label: "Export", icon: FileDown },
];

interface PrimarySidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  user: User;
}

export function PrimarySidebar({
  activeSection,
  onSectionChange,
  user,
}: PrimarySidebarProps) {
  // Removed internal activeItem state and handleNavItemClick

  return (
    <aside className="w-16 bg-card text-card-foreground flex flex-col items-center py-6 shadow-2xl border-r border-border">
      {/* Logo or App Icon placeholder */}
      <div className="mb-8 relative">
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Link href={"/"}>
            <img src="/snowscribe-logo-dark.png" alt="Snowscribe Logo" />
          </Link>
        </div>
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

      {/* Bottom icons: User menu */}
      <div className="flex flex-col items-center space-y-2 w-full px-2 pb-4">
        <UserMenuButton
          userName={user.email ?? undefined}
          userAvatarUrl={user.user_metadata.avatar_url}
          className="mt-4"
        />
      </div>
    </aside>
  );
}
