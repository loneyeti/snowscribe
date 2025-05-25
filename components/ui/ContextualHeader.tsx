import React from "react";
import { cn } from "@/lib/utils";

interface ContextualHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  navControls?: React.ReactNode;
}

export function ContextualHeader({
  title,
  subtitle,
  navControls,
  className,
  ...props
}: ContextualHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 pb-6 border-b border-border/50 dark:border-dark-border/50",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-2 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base text-muted-foreground dark:text-dark-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {navControls && <div>{navControls}</div>}
      </div>
    </div>
  );
}
