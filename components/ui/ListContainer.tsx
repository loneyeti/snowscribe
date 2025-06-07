"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ListContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  scrollAreaClassName?: string;
}

const ListContainer = React.forwardRef<HTMLDivElement, ListContainerProps>(
  (
    {
      className,
      children,
      emptyState,
      isLoading,
      scrollAreaClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full overflow-hidden bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm",
          "rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50",
          "hover:shadow-md transition-all duration-300",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto scroll-smooth",
            "scrollbar-thin scrollbar-thumb-slate-300/70 scrollbar-track-transparent",
            "dark:scrollbar-thumb-slate-600/70 hover:scrollbar-thumb-slate-400/80 dark:hover:scrollbar-thumb-slate-500/80",
            "scrollbar-thumb-rounded-full transition-colors duration-300",
            scrollAreaClassName
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-sm text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            </div>
          ) : emptyState && React.Children.count(children) === 0 ? (
            emptyState
          ) : (
            <div className="space-y-3 p-5">
              {React.Children.map(children, (child) => (
                <div className="animate-fade-in-up">{child}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ListContainer.displayName = "ListContainer";

export { ListContainer };
export type { ListContainerProps };
