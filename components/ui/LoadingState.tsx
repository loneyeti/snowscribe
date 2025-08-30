// File: components/ui/LoadingState.tsx

import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingStateProps {
  text?: string;
  className?: string;
}

/**
 * A generic loading state component with a spinner and text.
 * Used for indicating that a content area is loading, for example,
 * when waiting for an AI-generated analysis.
 */
export function LoadingState({
  text = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full p-8 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}
