# Product Context: Snowscribe

## Purpose & Mission

Snowscribe is a novel writing application designed to assist authors by integrating AI tools throughout the writing lifecycle—from brainstorming to final polish. It emphasizes human authorship, with AI serving as a sophisticated assistant, never the final writer.

## Core Problem Addressed

Traditional writing software lacks deep AI integration for creative support, while many AI writing tools overly automate, diminishing the author's role. Snowscribe offers a balance, providing powerful AI assistance without supplanting the human writer.

## User Experience Goals

- **Aesthetics & Readability:** Superior typography and a visually appealing interface.
- **Intuitive Design:** Clean, modern, uncluttered, and easy to navigate.
- **Accessibility:** Mobile-first responsive design and adherence to web accessibility standards.
- **Delightful Interaction:** A polished and enjoyable user experience.

## Key Implemented & In-Progress Features

### Organizational Structure

- **Project > Chapters > Scenes:** Core manuscript hierarchy is fully implemented.
- **Character Management:** Creation, viewing, and editing of Character profiles (`CharacterCardEditor.tsx`).
- **World Building Notes:** Section for creating, viewing, and editing world notes (`WorldNoteEditor.tsx`, `WorldNoteViewer.tsx`).
- **Outlining Tools:**
  - **Project Synopsis:** Editable `log_line` and `one_page_synopsis` fields (`ProjectSynopsisEditor.tsx`).
  - **Scene-Level Outlining:** Scenes have `outline_description`, `pov_character_id`, links to `other_character_ids`, and `tag_ids`. Managed via `ChapterSceneOutlineList.tsx` and modals.
  - **Two-Tiered Scene Tagging:** Scenes have a `primary_category` (ENUM) and can be linked to multiple global/project `scene_tags` via a join table.
- **Project Metadata:** Editable title, genre, target word count (`EditProjectModal.tsx`). Word count is tracked.

### AI Integration & Tools

AI features are primarily accessed via the dedicated **AI Section** (`AISection/index.tsx`) or contextually within other sections (e.g., AI buttons in `ProjectSynopsisEditor`, `AISidePanel` in Manuscript).

**Available/Integrated AI Tools (via `AISMessageHandler.ts`, `AI_TOOL_NAMES`):**

- **Outline Creator (`outline_json_generator`):** Generates a structured novel outline (characters, chapters, scenes) from a project synopsis. Outputs validated JSON. (Implemented: `lib/ai/outlineCreator.ts`, `OutlineCreatorModal.tsx`).
- **Log Line Generator (`log_line_generator`):** Assists in creating project log lines.
- **Synopsis Generator (`synopsis_generator`):** Assists in creating one-page synopses.
- **Scene Outliner/Analyzer (`scene_outliner`, `scene_analyzer`):** Generates outline descriptions for scenes or provides feedback.
- **Character Name Generator (`character_name_generator`):** Suggests character names. (UI: `CharacterNameGeneratorForm.tsx`).
- **Character Chat (`character_chat`):** Chat with an AI persona representing a character from the novel.
- **World Building Chat (`world_building_chat`):** AI assistance for research and world-building.
- **Plot Hole Checker (`plot_hole_checker`, `plot_hole_checker_manuscript`, `plot_hole_checker_outline`):** Analyzes plot for inconsistencies in outline or manuscript. (UI: `PlotHoleAnalysisDisplay.tsx`).
- **Writing Coach (`writing_coach`):** General feedback on writing.
- **Manuscript Chat (`manuscript_chat`):** Chat about the entire manuscript.
- **Outline Chat (`outline_chat`):** Chat about the project's outline.

**AI Interaction Patterns:**

- **Multi-Turn Chat:** Conversational AI tools (`MultiTurnChatInterface.tsx`, `useAIChat.ts`).
- **Single-Turn Tools/Buttons:** AI actions triggered by buttons that populate fields or provide specific analysis (`AIToolButton.tsx`).
- **Side Panel Integration:** `AISidePanel.tsx` for contextual AI assistance.
- **Dedicated AI Section:** Central hub for various AI tools (`AISection/index.tsx`, `AIToolSelector.tsx`).

**Core AI Principle:** AI assists with content generation (e.g., outlines, descriptions, ideas) but _never_ writes the final manuscript text for the user.

## Business Model

- Freemium model: Non-AI features free, limited AI credits for trial.
- Subscription Tiers: Monthly/annual plans for full AI access, with usage caps.
