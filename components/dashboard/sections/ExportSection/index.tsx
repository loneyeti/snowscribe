"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import { FileDown, Loader2 } from "lucide-react";

interface ExportSectionProps {
  project: {
    id: string;
    title: string;
  };
  isActive: boolean;
}

export function ExportSection({ project, isActive }: ExportSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    const toastId = toast.loading(
      "Generating your manuscript export. This may take a moment..."
    );

    try {
      const response = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "An unknown error occurred during export." }));
        throw new Error(errorData.error);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/ /g, "_")}_Manuscript.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Manuscript exported successfully!", { id: toastId });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export manuscript.",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <Heading level={2} className="mb-4">
        Export Your Manuscript
      </Heading>
      <Paragraph className="mb-8 text-muted-foreground">
        Generate a `.docx` file of your novel formatted to industry standards.
        This includes a title page, proper margins, font, spacing, and chapter
        formatting.
      </Paragraph>

      <div className="mt-6">
        <Button size="lg" onClick={handleExport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-5 w-5" />
              Export as Manuscript (.docx)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
