"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WordCountProgressIndicatorProps {
  currentWords: number;
  targetWords: number;
  className?: string;
}

export function WordCountProgressIndicator({
  currentWords,
  targetWords,
  className,
}: WordCountProgressIndicatorProps) {
  const progressPercentage =
    targetWords > 0 ? Math.min((currentWords / targetWords) * 100, 100) : 0;

  const isComplete = progressPercentage >= 100;
  const isNearComplete = progressPercentage >= 80;

  return (
    <div className={cn("w-full group", className)}>
      {/* Header with word count and percentage */}
      <div className="flex justify-between items-end mb-3">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-sm font-semibold tracking-wide transition-all duration-200",
              "text-slate-700 dark:text-slate-200",
              "group-hover:text-slate-900 dark:group-hover:text-slate-100"
            )}
          >
            {currentWords.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500/80 dark:text-slate-400/80 font-medium">
            words written
          </span>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "text-sm font-semibold transition-all duration-200",
              isComplete
                ? "text-emerald-600 dark:text-emerald-400"
                : isNearComplete
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-600 dark:text-slate-300"
            )}
          >
            {Math.floor(progressPercentage)}%
          </span>
          <div className="text-xs text-slate-500/80 dark:text-slate-400/80 font-medium">
            complete
          </div>
        </div>
      </div>

      {/* Progress bar container */}
      <div
        className={cn(
          "relative w-full h-3 rounded-full overflow-hidden",
          "bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-inner shadow-slate-200/40 dark:shadow-slate-900/40",
          "transition-all duration-300 ease-out",
          "group-hover:shadow-md group-hover:shadow-slate-200/60 dark:group-hover:shadow-slate-900/60"
        )}
      >
        {/* Progress fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
            isComplete
              ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
              : isNearComplete
              ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"
              : "bg-gradient-to-r from-primary via-primary/90 to-primary",
            "shadow-sm",
            progressPercentage > 0 ? "shadow-primary/20" : ""
          )}
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Animated shimmer effect */}
          {progressPercentage > 0 && (
            <div
              className={cn(
                "absolute inset-0 opacity-40",
                "bg-gradient-to-r from-transparent via-white/30 to-transparent",
                "animate-shimmer"
              )}
            />
          )}

          {/* Completion celebration effect */}
          {isComplete && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-slate-300/10 to-transparent dark:via-slate-600/10" />
        </div>
      </div>

      {/* Target information */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-slate-500/70 dark:text-slate-400/70 font-medium">
          Target: {targetWords.toLocaleString()} words
        </span>
        {progressPercentage > 0 && (
          <span className="text-xs text-slate-500/70 dark:text-slate-400/70 font-medium">
            {targetWords - currentWords > 0
              ? `${(targetWords - currentWords).toLocaleString()} remaining`
              : `${(currentWords - targetWords).toLocaleString()} over target`}
          </span>
        )}
      </div>
    </div>
  );
}
