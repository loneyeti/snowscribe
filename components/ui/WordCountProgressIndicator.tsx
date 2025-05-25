"use client";

import React from "react";

interface WordCountProgressIndicatorProps {
  currentWords: number;
  targetWords: number;
}

export function WordCountProgressIndicator({
  currentWords,
  targetWords,
}: WordCountProgressIndicatorProps) {
  const progressPercentage =
    targetWords > 0 ? Math.min((currentWords / targetWords) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
          {currentWords.toLocaleString()} words
        </span>
        <span className="text-sm font-medium text-muted-foreground dark:text-dark-muted-foreground">
          {Math.floor(progressPercentage)}%
        </span>
      </div>
      <div className="w-full bg-muted dark:bg-dark-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
      <div className="text-xs text-muted-foreground dark:text-dark-muted-foreground text-right mt-1">
        Target: {targetWords.toLocaleString()}
      </div>
    </div>
  );
}
