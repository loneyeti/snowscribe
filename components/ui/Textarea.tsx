import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-all duration-200",
          "placeholder:text-muted-foreground",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "hover:border-primary/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none", // Add for better control
          // Dark mode specific styles
          "dark:bg-dark-input dark:border-dark-border dark:text-dark-foreground dark:placeholder:text-dark-muted-foreground",
          "dark:focus:border-primary dark:focus:ring-primary/20 dark:hover:border-primary/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
