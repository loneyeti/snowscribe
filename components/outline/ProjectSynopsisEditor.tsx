"use client";

import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { chat } from "@/lib/data/chat";
import { getToolModelByToolName } from "@/lib/data/toolModels";
import { getSystemPromptByCategory } from "@/lib/data/aiPrompts";
import type { TextBlock, ChatResponse } from "snowgander";

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

  const handleGenerateLogLine = async () => {
    // 1. Synopsis Check
    if (!onePageSynopsis || onePageSynopsis.trim() === "") {
      toast.error(
        "Log Line is generated with the Synopsis field, so that needs to be filled out first."
      );
      return;
    }

    setIsGeneratingLogLine(true);
    try {
      // 2. Fetch Tool Model configuration (to get model_id)
      const toolName = "log_line_generator"; // This should match the category in ai_prompts
      const toolModelConfig = await getToolModelByToolName(toolName);

      if (!toolModelConfig || !toolModelConfig.model_id) {
        console.error(
          `AI model configuration for '${toolName}' not found or model_id is missing. Full config:`,
          toolModelConfig
        );
        throw new Error(
          `AI model configuration for '${toolName}' not found or incomplete.`
        );
      }
      const modelId = toolModelConfig.model_id;

      // 3. Fetch System Prompt
      const systemPromptText = await getSystemPromptByCategory(toolName);
      if (!systemPromptText) {
        console.error(`System prompt for '${toolName}' not found.`);
        // You could use a hardcoded fallback, but the DB should be the source of truth.
        throw new Error(
          `System prompt for '${toolName}' not found. Please ensure it's configured in the database.`
        );
      }

      // 4. Construct User Prompt for the AI
      // Ensure all parts of the prompt are strings and handle potential null/undefined values.
      const titlePart = project.title
        ? `Project Title: ${project.title}\n`
        : "";
      const genrePart = project.genre_id
        ? `Genre ID: ${project.genre_id}\n`
        : ""; // Genre name would be better if available
      const synopsisPart = `Synopsis:\n${onePageSynopsis}\n\n`;
      const instructionPart = `Return only the log line itself, as plain text, without any additional formatting or conversational text.`;

      const userPrompt =
        `Based on the following project information, please generate a single, impactful log line.\n\n` +
        titlePart +
        genrePart +
        synopsisPart +
        instructionPart;

      // 5. Make AI Query
      // The 'messages' array is empty for a one-shot request like this.
      const aiResponse: ChatResponse = await chat(
        modelId,
        [],
        userPrompt,
        systemPromptText
      );

      // 6. Process Response and Update Log Line Field
      if (aiResponse && aiResponse.content && aiResponse.content.length > 0) {
        const firstTextBlock = aiResponse.content.find(
          (block) => block.type === "text"
        ) as TextBlock | undefined;

        if (firstTextBlock && typeof firstTextBlock.text === "string") {
          let generatedLogLine = firstTextBlock.text.trim();

          // Basic cleanup: remove common AI prefixes/suffixes if the system prompt isn't perfectly respected.
          generatedLogLine = generatedLogLine.replace(/^logline:/i, "").trim();
          generatedLogLine = generatedLogLine.replace(/^log line:/i, "").trim();
          generatedLogLine = generatedLogLine
            .replace(/^here's a log line:/i, "")
            .trim();
          generatedLogLine = generatedLogLine
            .replace(/^here is your log line:/i, "")
            .trim();
          generatedLogLine = generatedLogLine.replace(/^"|"$/g, "").trim(); // Remove surrounding quotes

          setLogLine(generatedLogLine); // Update state, which updates Textarea
          toast.success("Log line generated!");
        } else {
          let errorMessage =
            "AI response was empty or not in the expected text format.";
          const errorBlock = aiResponse.content.find(
            (block) => block.type === "error"
          );
          if (
            errorBlock &&
            "publicMessage" in errorBlock &&
            typeof errorBlock.publicMessage === "string"
          ) {
            errorMessage = errorBlock.publicMessage;
          }
          console.error("AI response error or unexpected format:", aiResponse);
          throw new Error(errorMessage);
        }
      } else {
        console.error(
          "AI returned an empty or invalid response structure:",
          aiResponse
        );
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Error generating log line:", error);
      const displayMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate log line. Please try again.";
      toast.error(displayMessage);
    } finally {
      setIsGeneratingLogLine(false);
    }
  };

  const handleGenerateSynopsis = async () => {
    if (
      !project.title &&
      !projectGenreName &&
      !logLine.trim() &&
      (!sceneOutlineDescriptions || sceneOutlineDescriptions.trim() === "")
    ) {
      toast.error(
        "Synopsis generation requires at least a project title, genre, log line, or existing scene descriptions to provide context."
      );
      return;
    }

    setIsGeneratingSynopsis(true);
    try {
      const toolName = "synopsis_generator"; // Matches category in ai_prompts and name in tool_model from seed.sql
      const toolModelConfig = await getToolModelByToolName(toolName);

      if (!toolModelConfig || !toolModelConfig.model_id) {
        console.error(
          `AI model configuration for '${toolName}' not found or model_id is missing. Full config:`,
          toolModelConfig
        );
        throw new Error(
          `AI model configuration for '${toolName}' not found or incomplete.`
        );
      }
      const modelId = toolModelConfig.model_id;

      const systemPromptText = await getSystemPromptByCategory(toolName);
      if (!systemPromptText) {
        console.error(`System prompt for '${toolName}' not found.`);
        throw new Error(
          `System prompt for '${toolName}' not found. Please ensure it's configured in the database.`
        );
      }

      const titlePart = project.title
        ? `Project Title: ${project.title}\n`
        : "";
      const genreInfo = projectGenreName ? `Genre: ${projectGenreName}\n` : "";
      const logLinePart = logLine.trim() ? `Log Line: ${logLine.trim()}\n` : "";

      const sceneDescriptionsContext =
        sceneOutlineDescriptions && sceneOutlineDescriptions.trim() !== ""
          ? `\n${sceneOutlineDescriptions.trim()}\n\n`
          : "";

      const instructionPart = `Generate a one-page synopsis (approximately 300-500 words) based on ALL the information provided (title, genre, log line, and existing scene descriptions). The synopsis should cover the main plot points, key characters, major conflicts, and the overall arc of the story, weaving together information from all provided context. Return only the synopsis itself as plain text, without any introductory phrases, explanations, or markdown formatting.`;

      let userPrompt = `Based on the following project information, please generate a draft for a one-page synopsis.\n\n`;
      if (titlePart) userPrompt += titlePart;
      if (genreInfo) userPrompt += genreInfo;
      if (logLinePart) userPrompt += logLinePart;

      if ((titlePart || genreInfo || logLinePart) && sceneDescriptionsContext) {
        userPrompt += "\n---\n"; // Separator
      }

      if (sceneDescriptionsContext) userPrompt += sceneDescriptionsContext;
      else if (titlePart || genreInfo || logLinePart) userPrompt += "\n";

      userPrompt += instructionPart;

      console.log(
        "[ProjectSynopsisEditor] Constructed User Prompt for Synopsis:",
        userPrompt
      );

      const aiResponse: ChatResponse = await chat(
        modelId,
        [],
        userPrompt,
        systemPromptText
      );

      if (aiResponse && aiResponse.content && aiResponse.content.length > 0) {
        const firstTextBlock = aiResponse.content.find(
          (block) => block.type === "text"
        ) as TextBlock | undefined;

        if (firstTextBlock && typeof firstTextBlock.text === "string") {
          const generatedSynopsis = firstTextBlock.text.trim();
          setOnePageSynopsis(generatedSynopsis);
          toast.success("One-page synopsis generated!");
        } else {
          let errorMessage =
            "AI response was empty or not in the expected text format.";
          const errorBlock = aiResponse.content.find(
            (block) => block.type === "error"
          );
          if (
            errorBlock &&
            "publicMessage" in errorBlock &&
            typeof errorBlock.publicMessage === "string"
          ) {
            errorMessage = errorBlock.publicMessage;
          }
          console.error("AI response error or unexpected format:", aiResponse);
          throw new Error(errorMessage);
        }
      } else {
        console.error(
          "AI returned an empty or invalid response structure:",
          aiResponse
        );
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Error generating one-page synopsis:", error);
      const displayMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate synopsis. Please try again.";
      toast.error(displayMessage);
    } finally {
      setIsGeneratingSynopsis(false);
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
          disabled={isGeneratingLogLine || isSaving} // Optionally disable while generating
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
