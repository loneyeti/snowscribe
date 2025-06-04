# Project Progress

## What Works (Key Implemented Features Based on Repo)

- **Core Application Structure:**
  - Next.js App Router with Server & Client Components.
  - Modular dashboard layout (`AppShell.tsx`, `PrimarySidebar.tsx`, `AppHeader.tsx`).
  - Project-based organization.
- **Authentication:**
  - User registration, login, logout using Supabase Auth (`@supabase/ssr`).
  - Password reset and update functionality.
  - Route protection via middleware.
- **Project Management:**
  - Project creation (`CreateProjectModal.tsx`) and listing (`ProjectList.tsx`, `HomePageClientWrapper.tsx`).
  - Project editing (title, genre, target word count - `EditProjectModal.tsx`).
  - Project deletion.
- **Dashboard Sections (Modular Architecture - `components/dashboard/sections/`):**
  - **Manuscript Section:**
    - Chapter and Scene creation, listing.
    - Scene content editing (`ManuscriptEditor.tsx`).
    - Scene metadata editing (description, POV, characters, tags via `SceneMetadataPanel.tsx` and modals).
    - Drag-and-drop scene reordering (`useSceneDragDrop.ts`).
    - Contextual AI assistance via `AISidePanel.tsx`.
  - **Outline Section:**
    - Project synopsis (log line, one-page) editing (`ProjectSynopsisEditor.tsx`).
    - Chapter/Scene outline viewing and editing (`ChapterSceneOutlineList.tsx`).
    - AI-Powered Outline Creator (`OutlineCreatorModal.tsx`, `lib/ai/outlineCreator.ts`) to generate full outline from synopsis.
  - **Characters Section:**
    - Character creation, listing, and editing (`CharacterList.tsx`, `CreateCharacterModal.tsx`, `CharacterCardEditor.tsx`).
  - **World Notes Section:**
    - World note creation, listing, editing, and viewing (`WorldNoteList.tsx`, `CreateWorldNoteModal.tsx`, `WorldNoteEditor.tsx`, `WorldNoteViewer.tsx`).
    - View/Edit toggle pattern for notes.
  - **AI Section (`AISection/index.tsx`):**
    - Centralized interface for various AI tools.
    - Tool selection (`AIToolSelector.tsx`).
    - Multi-turn chat interface (`MultiTurnChatInterface.tsx`, `useAIChat.ts`).
    - Specific tool UIs (e.g., `CharacterNameGeneratorForm.tsx`).
- **AI Integration Backend:**
  - `snowgander` library for multi-vendor AI model interaction.
  - Database schema for AI configuration (`ai_vendors`, `ai_models`, `ai_prompts`, `tool_model`).
  - `AISMessageHandler.ts` for routing AI requests, formatting context, and managing prompts.
  - API routes for AI configuration management.
- **Settings Page (`SiteSettingsClient.tsx`):**
  - Management (CRUD) of AI Models, AI Vendors, and AI Prompts.
- **Data Management & Validation:**
  - Supabase PostgreSQL database with RLS policies.
  - Zod schemas for API and form validation.
  - `lib/data/` abstraction layer for API calls.
  - Two-tiered scene tagging system (primary ENUM category + join table for multiple tags).
- **UI/UX:**
  - Consistent UI components from `components/ui/`.
  - Toast notifications (`sonner`).
  - Markdown rendering for AI responses and notes.

## What's Left to Build (Based on original brief & gaps)

### Core Infrastructure

- [ ] Refined user profile management (UI for viewing/editing profile, changing password within settings).
- [ ] Full implementation of AI usage tracking and subscription-based limits.

### Main Features

- [ ] **Outlines:**
  - [ ] UI for reordering chapters within a project.
  - [ ] More direct UI support for the "Snowflake Method" beyond basic synopsis fields, if deemed necessary.
- [ ] **World Building & Research Notes:**
  - [ ] Advanced organization: filtering/searching notes.
  - [ ] Linking notes to specific manuscript scenes or characters.
- [ ] **Export Functionality:** Implement project export (e.g., manuscript formats).
- [ ] **Filtering and Reporting:** Comprehensive filtering/reporting across manuscript, characters, etc. (Marked as "future enhancement" previously).

### AI Features (Refinement & Expansion)

- [ ] **Snowflake Outliner (Iterative):** While the "Outline Creator" generates a full outline from a synopsis, the original concept of an iterative Snowflake method (AI asking questions to build up the outline step-by-step) is not yet fully realized as a distinct interactive tool.
- [ ] **Editor Assistant (Prose Tightening):** Ensure this is fully distinct and respects "AI never writes final text."
- [ ] Thorough testing and refinement of all AI tool prompts and outputs for quality and consistency.
- [ ] User feedback mechanisms for AI tool outputs.

### Deployment & DevOps

- [ ] Finalize Docker setup for development and production.
- [ ] CI/CD pipeline (testing, build, deployment).
- [ ] Fly.io deployment configuration.

## Current Focus Areas (Inferred from recent major changes/additions)

1.  **Expanding and Refining AI Tools:** Leveraging the `AISection` and `AISMessageHandler` infrastructure to enhance existing tools and potentially add new ones.
2.  **UX/UI Polish:** Continuous refinement of the user interface across all sections.
3.  **Performance Optimization:** Ensuring the application remains performant as more data and features are added.
4.  **Robust Error Handling:** Enhancing client-side and server-side error reporting and user feedback.

## Known Issues (General Considerations)

- Comprehensive end-to-end testing for all AI tool flows is ongoing.
- Client-side error handling consistency with `sonner` toasts can always be improved.
- UI polish and minor UX enhancements are continuous.

## Evolution of Project Decisions (Recent Highlights)

| Date (Conceptual)     | Decision                                                                                                          | Rationale                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Recent (Repo State)   | Implemented a dedicated **AI Section** (`AISection`) with tool selection and chat interfaces.                     | Centralizes AI functionalities, providing a more focused user experience for AI-powered tasks.                                       |
| Recent (Repo State)   | Developed **AI-Powered Outline Creator** (`lib/ai/outlineCreator.ts`) generating structured JSON from a synopsis. | Automates a significant part of the outlining process, providing a strong starting point for authors.                                |
| Recent (Repo State)   | Established `AISMessageHandler.ts` as the central orchestrator for AI tool interactions.                          | Standardizes AI requests, context formatting, and prompt/model management, simplifying the integration of new AI tools.              |
| 2025-05-26 (Old MB)   | Adopted static Markdown viewer with edit toggle for World Notes.                                                  | Improves UX clarity for note-like features (still relevant).                                                                         |
| 2025-05-26 (Old MB)   | Refactored Project Dashboard into modular sections with dedicated hooks and `ProjectDataContext`.                 | Enhances maintainability, testability, and scalability (foundational change evident in repo).                                        |
| 2025-05-25 (Old MB)   | Overhauled scene tag system to a two-tiered model (primary category ENUM + global tags via join table).           | Provides more flexible and organized scene categorization (migration `20250525233013_revamp_scene_tag_system_v2.sql` confirms this). |
| Earlier (Old MB/Repo) | Integrated `snowgander` for vendor-agnostic AI API calls.                                                         | Allows flexibility in choosing AI providers and models.                                                                              |
| Earlier (Old MB/Repo) | Implemented CRUD UI for AI Vendors, Models, and Prompts in Site Settings.                                         | Enables administrative configuration of AI capabilities.                                                                             |
