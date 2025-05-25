"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  secondaryText?: string;
  isSelected?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode; // New prop for action buttons
  asChild?: boolean; // For potential composition with other components
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      className,
      icon: Icon,
      title,
      secondaryText,
      isSelected,
      onClick,
      actions, // Destructure new prop
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "div" : "div"; // Simplified for now, can be Slot later if needed

    return (
      <Comp
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center px-4 py-3 rounded-md cursor-pointer transition-colors", // Updated padding
          "hover:bg-muted/50",
          isSelected
            ? "bg-primary/10 relative" // Removed text-primary-foreground, text color handled by inner elements
            : "bg-card text-card-foreground",
          className
        )}
        {...props}
      >
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-md" />
        )}
        {Icon && (
          <Icon
            className={cn(
              "mr-3 h-5 w-5 flex-shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground" // Icon color updates on selection
            )}
          />
        )}
        <div className="flex-grow">
          <div
            className={cn(
              "text-sm", // Base text size
              isSelected
                ? "font-semibold text-primary"
                : "font-medium text-foreground" // Updated font weight and color for selection
            )}
          >
            {title}
          </div>
          {secondaryText && (
            <div
              className={cn(
                "text-xs",
                isSelected ? "text-primary/90" : "text-muted-foreground" // Slightly more opaque for selected secondary text
              )}
            >
              {secondaryText}
            </div>
          )}
        </div>
        {/* Render actions if provided */}
        {actions && <div className="ml-auto flex-shrink-0">{actions}</div>}
      </Comp>
    );
  }
);

ListItem.displayName = "ListItem";

export { ListItem };
export type { ListItemProps };
