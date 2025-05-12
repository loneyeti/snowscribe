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
        "flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-150 ease-in-out", // Added duration and easing
        // Focus state updated for dark background
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-sky-400",
        isActive
          ? "bg-primary text-primary-foreground" // Active state using primary color
          : "text-gray-400 hover:bg-gray-700 hover:text-gray-100" // Inactive and hover states for dark sidebar
      )}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
