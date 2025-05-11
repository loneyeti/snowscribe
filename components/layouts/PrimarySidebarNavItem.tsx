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
        "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
        "hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500",
        isActive ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
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
