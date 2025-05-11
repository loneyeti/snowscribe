import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react"; // For icon type

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: LucideIcon;
  "aria-label": string; // Ensure accessibility
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, icon: Icon, variant, "aria-label": ariaLabel, ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant || "ghost"} // Default to ghost variant for icon buttons
        size="icon"
        className={cn("rounded-full", className)} // Often icon buttons are circular
        aria-label={ariaLabel}
        {...props}
      >
        <Icon className="h-5 w-5" /> {/* Adjust size as needed */}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
