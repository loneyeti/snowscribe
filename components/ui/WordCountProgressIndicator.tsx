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
    <div className="w-full text-sm">
      <div className="flex justify-between mb-1">
        <span>{currentWords.toLocaleString()} words</span>
        <span>{Math.floor(progressPercentage)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-1">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Target: {targetWords.toLocaleString()}
      </div>
    </div>
  );
}
