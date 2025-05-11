import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("font-semibold tracking-tight", {
  variants: {
    level: {
      1: "text-4xl lg:text-5xl scroll-m-20",
      2: "text-3xl scroll-m-20 border-b pb-2 first:mt-0",
      3: "text-2xl scroll-m-20",
      4: "text-xl scroll-m-20",
      5: "text-lg scroll-m-20",
      6: "text-base scroll-m-20",
    },
    // Add other variants like color, weight, etc. if needed later
  },
  defaultVariants: {
    level: 1,
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, children, ...props }, ref) => {
    const Tag = `h${level}` as React.ElementType;
    return (
      <Tag
        className={cn(headingVariants({ level }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Heading.displayName = "Heading";

export { Heading, headingVariants };
