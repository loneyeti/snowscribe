import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Outline Creator">
      <div className="space-y-4">
        <p>
          This tool will use your project&apos;s one-page synopsis to generate
          characters, chapters, and scenes. This process can take a few minutes.
        </p>
        {hasExistingContent && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            <strong>Warning:</strong> Your project already has chapters/scenes.
            Generating a new outline will <em>add</em> to the existing content.
            It will <em>not</em> overwrite or delete your current work. You may
            need to manually adjust or delete content afterwards.
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Generating..." : "Confirm & Generate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
