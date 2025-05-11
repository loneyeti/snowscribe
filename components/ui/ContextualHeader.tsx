import React from "react";

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
    <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
      <div>
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-md text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {navControls && <div>{navControls}</div>}
    </div>
  );
}
