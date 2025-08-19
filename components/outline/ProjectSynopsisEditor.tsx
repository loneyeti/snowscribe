"use client";

import React, { useState, useEffect } from "react";
import type { Project, Chapter } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { updateProject } from "@/lib/data/projects";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import { sendMessage } from "@/lib/ai/AISMessageHandler";
import type { TextBlock } from "snowgander";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { appEvents } from "@/lib/utils/eventEmitter";

interface ProjectSynopsisEditorProps {
  project: Pick<
    Project,
    "id" | "log_line" | "one_page_synopsis" | "title" | "genre_id"
  >;
  chapters: Chapter[]; // Add this line
  projectGenreName?: string | null;
  sceneOutlineDescriptions?: string;
  onSynopsisUpdate: (updatedData: {
    log_line?: string | null;
    one_page_synopsis?: string | null;
  }) => void;
}

export function ProjectSynopsisEditor({
  project,
  chapters, // Add this line
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

  type SynopsisSource = "outline" | "manuscript";
  const [synopsisSource, setSynopsisSource] =
    useState<SynopsisSource>("outline");

  const hasManuscriptContent = chapters.some((c) =>
    c.scenes?.some((s) => s.content && s.content.trim() !== "")
  );

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

      // ADD THIS BLOCK
      if (aiResponse.content?.[0]?.type !== "error") {
        appEvents.emit("creditsUpdated");
      }
      // END ADDED BLOCK

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
    if (synopsisSource === "outline") {
      if (
        !project.title &&
        !projectGenreName &&
        !logLine.trim() &&
        !sceneOutlineDescriptions?.trim()
      ) {
        toast.error(
          "Synopsis generation from outline requires project title, genre, log line, or scene descriptions."
        );
        return;
      }
    } else if (synopsisSource === "manuscript") {
      if (!hasManuscriptContent) {
        toast.error(
          "Your manuscript has no content to generate a synopsis from."
        );
        return;
      }
    }

    setIsGeneratingSynopsis(true);

    const toolName =
      synopsisSource === "outline"
        ? "synopsis_generator"
        : "synopsis_generator_manuscript";

    const userPrompt =
      "Generate a one-page synopsis based on the provided project context.";

    const contextData =
      synopsisSource === "outline"
        ? {
            title: project.title,
            genreName: projectGenreName,
            logLine: logLine.trim(),
            sceneOutlineDescriptions: sceneOutlineDescriptions,
          }
        : {
            title: project.title,
            genreName: projectGenreName,
            logLine: logLine.trim(),
            chapters: chapters,
          };

    try {
      const aiResponse = await sendMessage(
        project.id,
        toolName,
        userPrompt,
        contextData
      );

      // ADD THIS BLOCK
      if (aiResponse.content?.[0]?.type !== "error") {
        appEvents.emit("creditsUpdated");
      }
      // END ADDED BLOCK

      if (aiResponse?.content?.[0]?.type === "text") {
        setOnePageSynopsis((aiResponse.content[0] as TextBlock).text.trim());
        toast.success("One-page synopsis generated!");
      } else {
        const errorMsg =
          (aiResponse?.content?.[0] as { publicMessage?: string })
            ?.publicMessage || "AI returned an empty or invalid response.";
        throw new Error(errorMsg);
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
        <div className="flex items-center mt-2">
          <Button
            onClick={handleGenerateSynopsis}
            disabled={isGeneratingSynopsis || isGeneratingLogLine || isSaving}
            title="Generate One Page Synopsis with AI"
            className="rounded-r-none"
          >
            {isGeneratingSynopsis ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGeneratingSynopsis ? "Generating..." : "Generate Synopsis"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="default"
                className="px-2 rounded-l-none border-l border-primary/50"
                aria-label="Select synopsis generation source"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={synopsisSource}
                onValueChange={(value) =>
                  setSynopsisSource(value as SynopsisSource)
                }
              >
                <DropdownMenuRadioItem value="outline">
                  From Scene Outlines
                </DropdownMenuRadioItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild disabled={!hasManuscriptContent}>
                      <div
                        className={
                          !hasManuscriptContent ? "cursor-not-allowed" : ""
                        }
                      >
                        <DropdownMenuRadioItem
                          value="manuscript"
                          disabled={!hasManuscriptContent}
                        >
                          From Full Manuscript
                        </DropdownMenuRadioItem>
                      </div>
                    </TooltipTrigger>
                    {!hasManuscriptContent && (
                      <TooltipContent>
                        <p>
                          Your manuscript must contain scene content to use this
                          option.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
