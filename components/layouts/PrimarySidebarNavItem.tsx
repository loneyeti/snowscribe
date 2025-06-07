"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Assuming a utility for classnames exists, as per projectBrief

interface PrimarySidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function PrimarySidebarNavItem({
  icon,
  label,
  isActive,
  onClick,
}: PrimarySidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        isActive
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
      )}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      <div className="absolute z-50 left-full ml-3 px-2 py-1 bg-card text-card-foreground border border-border text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
        {label}
      </div>
      <span className="sr-only">{label}</span>
    </button>
  );
}
