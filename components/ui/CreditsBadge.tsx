"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/Tooltip";
import { getClientCreditInfo } from "@/lib/data/profiles";
import {
  Zap,
  Infinity as InfinityIcon,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { appEvents } from "@/lib/utils/eventEmitter";

interface CreditsBadgeProps {
  className?: string;
  showRefresh?: boolean;
}

export function CreditsBadge({
  className,
  showRefresh = false,
}: CreditsBadgeProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [balance, setBalance] = React.useState<number>(0);
  const [hasUnlimited, setHasUnlimited] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await getClientCreditInfo();
      if (!info) {
        setError("Unable to load credits");
      } else {
        setBalance(info.balance);
        setHasUnlimited(info.hasUnlimited);
      }
    } catch (e) {
      setError("Unable to load credits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // 2. ADD THIS ENTIRE useEffect HOOK
  React.useEffect(() => {
    // This function will be called when the 'creditsUpdated' event is emitted
    const handleCreditsUpdate = () => {
      load();
    };

    // Subscribe to the event
    appEvents.on("creditsUpdated", handleCreditsUpdate);

    // Unsubscribe from the event when the component unmounts
    return () => {
      appEvents.off("creditsUpdated", handleCreditsUpdate);
    };
  }, [load]); // Add `load` as a dependency

  const isLow = !hasUnlimited && balance <= 5;

  const Pill = (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
        "bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm",
        "border-slate-200/60 dark:border-slate-700/60",
        "text-sm font-medium",
        isLow
          ? "text-amber-700 dark:text-amber-300 border-amber-300/60"
          : "text-slate-700 dark:text-slate-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400" />
      ) : hasUnlimited ? (
        <InfinityIcon className="h-4 w-4 text-emerald-500" />
      ) : (
        <Zap
          className={cn("h-4 w-4", isLow ? "text-amber-500" : "text-primary")}
        />
      )}
      <span className="tabular-nums">
        {isLoading
          ? "Loading..."
          : hasUnlimited
          ? "Unlimited"
          : `${Math.max(0, Math.floor(balance))}`}
      </span>
      {showRefresh && !isLoading && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Refresh credits"
          className="h-6 w-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={load}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  const tooltipText = error
    ? "We couldn't load your credits. Try refreshing."
    : hasUnlimited
    ? "Your account has unlimited credits."
    : "AI Credits Remaining";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{Pill}</TooltipTrigger>
        <TooltipContent sideOffset={8}>
          <div className="text-sm">{tooltipText}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
