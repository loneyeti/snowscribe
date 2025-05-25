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

  // Drag and drop props
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  dataId?: string;
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
      draggable,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnter,
      onDragLeave,
      dataId,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "div" : "div"; // Simplified for now, can be Slot later if needed

    return (
      <Comp
        ref={ref}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        data-id={dataId}
        className={cn(
          "group flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-accent hover:shadow-sm dark:hover:bg-dark-accent",
          isSelected
            ? "bg-primary/10 shadow-sm relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-l-lg"
            : "bg-transparent",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(
              "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
              isSelected
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground dark:group-hover:text-dark-foreground"
            )}
          />
        )}
        <div className="flex-grow">
          <div
            className={cn(
              "text-sm transition-all duration-200",
              isSelected
                ? "font-semibold text-primary"
                : "font-medium text-foreground group-hover:text-foreground dark:text-dark-foreground dark:group-hover:text-dark-foreground"
            )}
          >
            {title}
          </div>
          {secondaryText && (
            <div
              className={cn(
                "text-xs transition-colors duration-200",
                isSelected
                  ? "text-primary/80 dark:text-primary/70"
                  : "text-muted-foreground dark:text-dark-muted-foreground"
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
