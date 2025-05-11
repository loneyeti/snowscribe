import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const paragraphVariants = cva("leading-7 [&:not(:first-child)]:mt-6", {
  variants: {
    variant: {
      default: "",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold", // Example, can be adjusted
      small: "text-sm font-medium leading-none", // Example
      muted: "text-sm text-muted-foreground", // Example
    },
    // Add other variants like size, weight if needed
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof paragraphVariants> {}

const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <p
        className={cn(paragraphVariants({ variant }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </p>
    );
  }
);
Paragraph.displayName = "Paragraph";

export { Paragraph, paragraphVariants };
