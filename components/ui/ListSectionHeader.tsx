"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ListSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  actionElement?: React.ReactNode;
}

const ListSectionHeader = React.forwardRef<
  HTMLDivElement,
  ListSectionHeaderProps
>(({ className, icon: Icon, title, actionElement, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-3 py-2 mt-2 mb-1", // Adjusted padding and margin, added justify-between
        "text-sm font-semibold text-muted-foreground", // Styling for section header text
        className
      )}
      {...props}
    >
      <div className="flex items-center flex-grow truncate">
        {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0" />}
        <span className="truncate">{title}</span>
      </div>
      {actionElement && (
        <div className="ml-2 flex-shrink-0">{actionElement}</div>
      )}
    </div>
  );
});

ListSectionHeader.displayName = "ListSectionHeader";

export { ListSectionHeader };
export type { ListSectionHeaderProps };
