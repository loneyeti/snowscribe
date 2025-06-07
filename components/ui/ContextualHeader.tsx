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
        "mb-8 pb-6 border-b border-slate-200/40 dark:border-slate-700/60",
        "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-slate-300/50 after:to-transparent",
        "dark:after:via-slate-600/30",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200 p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight relative">
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 dark:from-primary/30 dark:via-primary/50 dark:to-primary/30"></span>
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm md:text-base text-slate-500/90 dark:text-slate-400/90 mt-1.5 tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        {navControls && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {navControls}
          </div>
        )}
      </div>
    </div>
  );
}
