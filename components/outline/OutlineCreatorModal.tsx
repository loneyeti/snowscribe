"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface OutlineCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  hasExistingContent: boolean;
}

export function OutlineCreatorModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  hasExistingContent,
}: OutlineCreatorModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Outline Creator"
      size="md"
      footerContent={
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Confirm & Generate Outline"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This tool will use your project&apos;s one-page synopsis to generate a
          draft of characters, chapters, and scenes for your novel. This process
          may take a few minutes.
        </p>
        {hasExistingContent && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-700 dark:text-yellow-300 text-sm">
            <strong>Warning:</strong> Your project already has some outline or
            manuscript content (e.g., chapters, scenes, or characters).
            Generating a new outline will <em>add</em> new entities. It will{" "}
            <em>not</em> overwrite or delete your current work. You may need to
            manually adjust or delete content afterwards.
          </div>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          For best results, ensure your project&apos;s &quot;One Page
          Synopsis&quot; (available in the Synopsis tab of the Outline section)
          is complete and accurately reflects your story vision.
        </p>
      </div>
    </Modal>
  );
}
