"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { IconButton } from "./IconButton"; // Import IconButton

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hideCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = "md",
  className,
  hideCloseButton = false,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scroll
      document.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4",
        "transition-all duration-300 ease-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose} // Close on overlay click
    >
      <div
        className={cn(
          "bg-card text-card-foreground rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden border border-border/50",
          "dark:bg-dark-card dark:text-dark-card-foreground dark:border-dark-border/50",
          "transform transition-all duration-300 ease-out",
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-border/50 dark:border-dark-border/50">
            {title && (
              <h3 className="text-xl font-semibold text-foreground dark:text-dark-foreground">
                {title}
              </h3>
            )}
            {!hideCloseButton && (
              <IconButton
                icon={X}
                aria-label="Close modal"
                onClick={onClose}
                variant="ghost"
                size="sm" // Using sm size for a slightly less prominent close button in modal header
                className="text-muted-foreground hover:text-foreground" // Ensure consistent coloring
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">{children}</div>

        {/* Footer */}
        {footerContent && (
          <div className="flex items-center justify-end p-6 bg-muted/30 border-t border-border/50 dark:bg-dark-muted/30 dark:border-dark-border/50">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
