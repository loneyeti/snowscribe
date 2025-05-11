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
          "flex items-center p-3 rounded-md cursor-pointer transition-colors",
          "hover:bg-muted/50", // Subtle hover effect
          isSelected
            ? "bg-primary/10 text-primary-foreground relative" // Selected state with accent
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
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
        <div className="flex-grow">
          <div
            className={cn(
              "font-medium text-sm",
              isSelected ? "text-primary" : "text-foreground"
            )}
          >
            {title}
          </div>
          {secondaryText && (
            <div
              className={cn(
                "text-xs",
                isSelected ? "text-primary/80" : "text-muted-foreground"
              )}
            >
              {secondaryText}
            </div>
          )}
        </div>
      </Comp>
    );
  }
);

ListItem.displayName = "ListItem";

export { ListItem };
export type { ListItemProps };
