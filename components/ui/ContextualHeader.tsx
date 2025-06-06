import React from "react";
import { cn } from "@/lib/utils";

interface ContextualHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  navControls?: React.ReactNode;
  onBack?: () => void;
}

export function ContextualHeader({
  title,
  subtitle,
  navControls,
  onBack,
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
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
          )}
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
