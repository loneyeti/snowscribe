"use client";

import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface ProjectSynopsisEditorProps {
  project: Pick<Project, "id" | "log_line" | "one_page_synopsis">;
  onSynopsisUpdate: (updatedData: {
    log_line?: string | null;
    one_page_synopsis?: string | null;
  }) => void; // Callback to update parent state if needed
}

export function ProjectSynopsisEditor({
  project,
  onSynopsisUpdate,
}: ProjectSynopsisEditorProps) {
  const [logLine, setLogLine] = useState(project.log_line || "");
  const [onePageSynopsis, setOnePageSynopsis] = useState(
    project.one_page_synopsis || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLogLine(project.log_line || "");
    setOnePageSynopsis(project.one_page_synopsis || "");
  }, [project.log_line, project.one_page_synopsis]);

  const handleSaveSynopses = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_line: logLine,
          one_page_synopsis: onePageSynopsis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save project synopses.");
      }

      const updatedProject = await response.json();
      toast.success("Synopses saved successfully!");
      onSynopsisUpdate({
        log_line: updatedProject.log_line,
        one_page_synopsis: updatedProject.one_page_synopsis,
      });
    } catch (error) {
      console.error("Error saving synopses:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not save synopses."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      {" "}
      {/* Reduced padding from p-4 to p-1 or p-2 if needed */}
      <div>
        <label
          htmlFor="logLine"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Log Line (One Sentence Synopsis)
        </label>
        <Textarea
          id="logLine"
          value={logLine}
          onChange={(e) => setLogLine(e.target.value)}
          placeholder="A compelling one-sentence summary of your novel."
          rows={2}
          className="max-w-xl"
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-xs text-primary hover:text-primary/90"
          // onClick={() => console.log("AI for Log Line clicked")} // Placeholder
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Generate with AI
        </Button>
      </div>
      <div>
        <label
          htmlFor="onePageSynopsis"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          One Page Synopsis
        </label>
        <Textarea
          id="onePageSynopsis"
          value={onePageSynopsis}
          onChange={(e) => setOnePageSynopsis(e.target.value)}
          placeholder="A detailed one-page summary of your novel's plot, characters, and themes."
          rows={15}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-xs text-primary hover:text-primary/90"
          // onClick={() => console.log("AI for One Page Synopsis clicked")} // Placeholder
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Generate with AI
        </Button>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveSynopses} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Synopses"}
        </Button>
      </div>
    </div>
  );
}
