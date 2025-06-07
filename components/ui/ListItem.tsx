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
  actions?: React.ReactNode;
  asChild?: boolean;
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
      actions,
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
    const Comp = asChild ? "div" : "div";

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
          "group flex items-center px-4 py-3 rounded-xl border border-transparent",
          "bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm",
          "shadow-sm hover:shadow-lg transition-all duration-300 ease-out",
          "hover:border-slate-200/70 dark:hover:border-slate-600/70",
          "transform hover:-translate-y-0.5",
          isSelected
            ? "bg-primary/10 border-primary/30 shadow-lg relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:bg-gradient-to-b before:from-primary before:to-primary/70 before:rounded-l-lg"
            : "",
          draggable
            ? "cursor-grab active:cursor-grabbing active:scale-[0.98]"
            : "cursor-pointer",
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
                : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
            )}
          />
        )}
        <div className="flex-grow min-w-0">
          <div
            className={cn(
              "text-sm font-medium transition-all duration-300 truncate",
              isSelected
                ? "text-primary font-semibold tracking-wide"
                : "text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white"
            )}
          >
            {title}
          </div>
          {secondaryText && (
            <div
              className={cn(
                "text-xs transition-colors duration-300 truncate",
                isSelected
                  ? "text-primary/80 dark:text-primary/70"
                  : "text-slate-500/90 dark:text-slate-400/90 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            >
              {secondaryText}
            </div>
          )}
        </div>
        {actions && (
          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 translate-x-1 group-hover:translate-x-0">
            {actions}
          </div>
        )}
      </Comp>
    );
  }
);

ListItem.displayName = "ListItem";

export { ListItem };
export type { ListItemProps };
