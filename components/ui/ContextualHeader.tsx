import React from "react";
import { cactusSerif } from "@/lib/fonts";

interface ContextualHeaderProps {
  title: string;
  subtitle?: string;
  navControls?: React.ReactNode; // Optional prop for navigation controls
}

export function ContextualHeader({
  title,
  subtitle,
  navControls,
}: ContextualHeaderProps) {
  return (
    // Removed border-b, pb-4. Adjusted mb, added small px.
    <div className="flex justify-between items-center mb-6 px-1">
      <div>
        <h2
          className={`text-2xl font-bold text-foreground ${cactusSerif.className} p-2`}
        >
          {title}
        </h2>
        {subtitle && (
          // Changed text-md to text-base to use defined scale
          <p className="text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {navControls && <div>{navControls}</div>}
    </div>
  );
}
