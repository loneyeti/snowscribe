# Active Context & Recent Developments

## Key Recently Completed/Solidified Features:

1.  **AI-Powered Outline Creator:**

    - **Status:** Fully implemented and integrated.
    - **Core Logic:** `lib/ai/outlineCreator.ts` handles AI interaction (via `outline_json_generator` tool in `AISMessageHandler.ts`), JSON parsing, and creation of database entities (Characters, Chapters, Scenes with relationships, tags, POV).
    - **UI:** `OutlineCreatorModal.tsx` in the Outline section initiates the process.
    - **Output:** Generates a structured novel outline based on a user-provided project synopsis.

2.  **Comprehensive AI Section & Tooling:**

    - **Status:** Core infrastructure and several tools are implemented and functional.
    - **UI:** `components/dashboard/sections/AISection/index.tsx` serves as the main hub.
      - `AIToolSelector.tsx`: Allows users to choose from various AI tools.
      - `MultiTurnChatInterface.tsx` & `useAIChat.ts`: Power conversational AI interactions.
      - Specific tool UIs like `CharacterNameGeneratorForm.tsx` and `PlotHoleAnalysisDisplay.tsx`.
    - **Backend Logic:** `AISMessageHandler.ts` manages tool-specific context, prompts, and model selection, leveraging `snowgander`.
    - **Available Tools:** Log Line Generator, Synopsis Generator, Scene Outliner, Character Name Generator, Character Chat, World Building Chat, Plot Hole Checker (for manuscript & outline), Writing Coach, Manuscript Chat, Outline Chat.

3.  **Modular Project Dashboard Architecture:**

    - **Status:** Refactor complete and is the current standard.
    - **Structure:** `ProjectDashboardClient.tsx` is now a lean orchestrator. Core logic and state for each section (Manuscript, Outline, Characters, World Notes, AI) are encapsulated within their respective components in `components/dashboard/sections/` and managed by custom hooks in `hooks/dashboard/`.
    - **Shared Data:** `ProjectDataContext` provides global project data (characters, tags) to all sections.
    - **Impact:** Improved maintainability, testability, and easier feature development.

4.  **World Notes Feature with View/Edit Toggle:**

    - **Status:** Implemented and stable.
    - **UI/UX:** Notes default to a `WorldNoteViewer.tsx` (Markdown rendered). An "Edit" button switches to `WorldNoteEditor.tsx`.
    - **State Management:** `useWorldNotesData.ts` handles the view/edit state.

5.  **Two-Tiered Scene Tagging System:**
    - **Status:** Database schema and backend logic updated. UI integration appears functional.
    - **Schema:** `scenes.primary_category` (ENUM) for the main type, and `scene_applied_tags` join table for multiple, flexible tags from `scene_tags` table.
    - **UI:** Modals and displays in Manuscript/Outline sections reflect this system.

## Current Development Focus (Inferred):

- **Refining AI Tool Prompts & Outputs:** Continuous improvement of system prompts in `supabase/seed.sql` (or managed via Settings UI) and parsing/display of AI responses for better quality and user experience.
- **User Experience Polish:** Iterating on UI elements across the application for consistency and ease of use.
- **Completing Remaining Core Features:** Addressing items in "What's Left to Build" from `progress.md`, such as advanced note organization, export functionality, and potentially more interactive outlining tools.
- **Stability and Performance:** Ensuring the application is robust and performs well with increasing data.

## Next Immediate Steps (Likely):

- Continued testing and refinement of the new AI tools within the `AISection`.
- Addressing any remaining UI/UX gaps in the modular dashboard sections.
- Beginning work on the next high-priority features from the "What's Left to Build" list.
