"use client";

import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { updateProject } from "@/lib/data/projects";
import { Loader2, Sparkles } from "lucide-react";
import { sendMessage } from "@/lib/ai/AISMessageHandler";
import type { TextBlock } from "snowgander";

interface ProjectSynopsisEditorProps {
  project: Pick<
    Project,
    "id" | "log_line" | "one_page_synopsis" | "title" | "genre_id"
  >;
  projectGenreName?: string | null;
  sceneOutlineDescriptions?: string;
  onSynopsisUpdate: (updatedData: {
    log_line?: string | null;
    one_page_synopsis?: string | null;
  }) => void;
}

export function ProjectSynopsisEditor({
  project,
  projectGenreName,
  sceneOutlineDescriptions,
  onSynopsisUpdate,
}: ProjectSynopsisEditorProps) {
  const [logLine, setLogLine] = useState(project.log_line || "");
  const [onePageSynopsis, setOnePageSynopsis] = useState(
    project.one_page_synopsis || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLogLine, setIsGeneratingLogLine] = useState(false);
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);

  useEffect(() => {
    setLogLine(project.log_line || "");
    setOnePageSynopsis(project.one_page_synopsis || "");
  }, [project.log_line, project.one_page_synopsis]);

  const handleSaveSynopses = async () => {
    setIsSaving(true);
    try {
      const updatedProject = await updateProject(project.id, {
        log_line: logLine,
        one_page_synopsis: onePageSynopsis,
      });
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

  const handleGenerateLogLine = async () => {
    if (!onePageSynopsis || onePageSynopsis.trim() === "") {
      toast.error("A synopsis is required to generate a log line.");
      return;
    }
    setIsGeneratingLogLine(true);
    try {
      const toolName = "log_line_generator";
      const userPrompt =
        "Generate a log line based on the provided project context.";
      const contextData = {
        synopsis: onePageSynopsis,
        title: project.title,
        genreName: projectGenreName,
      };

      const aiResponse = await sendMessage(
        project.id,
        toolName,
        userPrompt,
        contextData
      );

      if (aiResponse && aiResponse.content && aiResponse.content.length > 0) {
        const firstErrorBlock = aiResponse.content.find(
          (block) => block.type === "error"
        );
        if (firstErrorBlock && "publicMessage" in firstErrorBlock) {
          throw new Error(firstErrorBlock.publicMessage as string);
        }

        const firstTextBlock = aiResponse.content.find(
          (block) => block.type === "text"
        ) as TextBlock | undefined;

        if (firstTextBlock?.text) {
          const generatedLogLine = firstTextBlock.text
            .trim()
            .replace(/^"|"$/g, "");
          setLogLine(generatedLogLine);
          toast.success("Log line generated!");
        } else {
          throw new Error("AI response did not contain any text.");
        }
      } else {
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Error generating log line:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate log line."
      );
    } finally {
      setIsGeneratingLogLine(false);
    }
  };

  const handleGenerateSynopsis = async () => {
    if (
      !project.title &&
      !projectGenreName &&
      !logLine.trim() &&
      !sceneOutlineDescriptions?.trim()
    ) {
      toast.error(
        "Synopsis generation requires project title, genre, log line, or scene descriptions."
      );
      return;
    }
    setIsGeneratingSynopsis(true);
    try {
      const toolName = "synopsis_generator";
      const userPrompt =
        "Generate a one-page synopsis based on the provided project context.";
      const contextData = {
        title: project.title,
        genreName: projectGenreName,
        logLine: logLine.trim(),
        sceneOutlineDescriptions: sceneOutlineDescriptions,
      };

      const aiResponse = await sendMessage(
        project.id,
        toolName,
        userPrompt,
        contextData
      );

      if (aiResponse && aiResponse.content && aiResponse.content.length > 0) {
        const firstErrorBlock = aiResponse.content.find(
          (block) => block.type === "error"
        );
        if (firstErrorBlock && "publicMessage" in firstErrorBlock) {
          throw new Error(firstErrorBlock.publicMessage as string);
        }

        const firstTextBlock = aiResponse.content.find(
          (block) => block.type === "text"
        ) as TextBlock | undefined;

        if (firstTextBlock?.text) {
          setOnePageSynopsis(firstTextBlock.text.trim());
          toast.success("One-page synopsis generated!");
        } else {
          throw new Error("AI response did not contain any text.");
        }
      } else {
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Error generating one-page synopsis:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate synopsis."
      );
    } finally {
      setIsGeneratingSynopsis(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
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
          disabled={isGeneratingLogLine || isSaving}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-xs text-primary hover:text-primary/90"
          onClick={handleGenerateLogLine}
          disabled={isGeneratingLogLine || isGeneratingSynopsis || isSaving}
          title="Generate Log Line with AI"
        >
          {isGeneratingLogLine ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          {isGeneratingLogLine ? "Generating..." : "Generate Log Line with AI"}
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
          disabled={isGeneratingSynopsis || isSaving}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 text-xs text-primary hover:text-primary/90"
          onClick={handleGenerateSynopsis}
          disabled={isGeneratingSynopsis || isGeneratingLogLine || isSaving}
          title="Generate One Page Synopsis with AI"
        >
          {isGeneratingSynopsis ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          {isGeneratingSynopsis ? "Generating..." : "Generate Synopsis with AI"}
        </Button>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSynopses}
          disabled={isSaving || isGeneratingLogLine || isGeneratingSynopsis}
        >
          {isSaving ? "Saving..." : "Save Synopses"}
        </Button>
      </div>
    </div>
  );
}
