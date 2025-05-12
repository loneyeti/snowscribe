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
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
        "transition-opacity duration-300 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose} // Close on overlay click
    >
      <div
        className={cn(
          "bg-card text-card-foreground rounded-lg shadow-xl w-full flex flex-col overflow-hidden",
          "transform transition-all duration-300 ease-in-out",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          // Removed border-b
          <div className="flex items-center justify-between p-4">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
        <div className="p-4 overflow-y-auto flex-grow">{children}</div>

        {/* Footer */}
        {footerContent && (
          // Removed border-t
          <div className="flex items-center justify-end p-4 bg-muted/50 rounded-b-lg">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
