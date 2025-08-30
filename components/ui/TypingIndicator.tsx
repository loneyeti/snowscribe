// File: components/ui/TypingIndicator.tsx

import { cn } from "../../lib/utils";

/**
 * A component that displays a "typing" animation with three pulsing dots.
 * Used to indicate that the AI is processing a response in chat interfaces.
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-1.5 p-3", className)}>
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]" />
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]" />
      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
    </div>
  );
}
