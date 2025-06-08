import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: LucideIcon;
  "aria-label": string;
  asChild?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon: Icon,
      variant,
      "aria-label": ariaLabel,
      asChild = false,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant || "ghost"}
        size="icon"
        className={cn("rounded-full", className)}
        aria-label={ariaLabel}
        asChild={asChild}
        {...props}
      >
        <Icon className="h-5 w-5" />
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
export { IconButton };
