"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ListContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  // Add any specific props for ListContainer if needed in the future,
  // e.g., for virtualization or custom scrollbar styling.
}

const ListContainer = React.forwardRef<HTMLDivElement, ListContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full overflow-y-auto bg-background", // Removed space-y-1 and p-2
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ListContainer.displayName = "ListContainer";

export { ListContainer };
export type { ListContainerProps };
