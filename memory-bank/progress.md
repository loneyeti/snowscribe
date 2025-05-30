# Project Progress

_(Updated: 2025-05-26 (AI-Generated Update))_

## What Works

- **World Notes Static Viewer & Edit Toggle (2025-05-26):**

  - The World Notes section now displays notes in a static, Markdown-rendered view by default, with an "Edit" button to switch to the editor.
  - View/edit state is managed in `useWorldNotesData` with new state and handlers.
  - The new `WorldNoteViewer` component provides a clean, readable Markdown display, visually distinct from the editor.
  - The main section conditionally renders the viewer or editor, ensuring seamless transitions and correct state resets on selection or deletion.
  - The editor now supports a "Cancel" button and improved save/cancel flow.
  - All flows (view, edit, create, delete, edge cases) have been tested for correctness and UX clarity.
  - This pattern may be extended to other note-like features for improved consistency.

- **Major Project Dashboard Refactor (2025-05-26):**

  - The dashboard is now fully modular: each section (Manuscript, Outline, Characters, World Notes) is implemented as a self-contained component in `components/dashboard/sections/`, using its own custom data hook in `hooks/dashboard/`.
  - Shared project-wide data (e.g., all characters, all scene tags) is managed by `ProjectDataContext`, providing context and hooks to all sections.
  - All state, effects, and handlers have been removed from `ProjectDashboardClient.tsx`, which now simply renders the section components and provides context.
  - All modals and detail panels are managed within their respective section components.
  - The new structure enables easier testing, maintenance, and future feature development.
  - Comprehensive cleanup and bugfixes: removed unused variables/imports, fixed all TypeScript errors, audited all `useEffect`/`useCallback` dependencies, and verified all import paths.
  - Fixed key bugs: infinite character query loop in OutlineSection, real-time word count update in `AppHeader`, and optional character image handling in `CreateCharacterModal`.
  - All dashboard sections and flows have been tested for CRUD, navigation, and data consistency.

<!-- (rest of file unchanged) -->

## What's Left to Build

### Core Infrastructure

- [ ] Authentication System:
  - [ ] Refined error handling and user feedback (e.g., consistent `sonner` toasts for all auth actions).
- [ ] User Profile Management:
  - [ ] UI for users to view/edit their profile information.
  - [ ] UI for changing password (distinct from password reset).

### Main Features

- [ ] Project Management (Client-Side):
  - [x] Project editing interface (e.g., update title, genre, target word count).
  - [x] Project deletion confirmation and functionality from homepage/dashboard.
- [ ] Outlines (Client-Side Enhancements):
  - [ ] More robust editing experience within `ChapterSceneOutlineList.tsx` (e.g., inline editing or more comprehensive modals for all scene outline fields).
  - [ ] UI for reordering scenes within chapters, and chapters within the project.
  - [ ] UI to fully demonstrate/facilitate the Snowflake method (if specific UI beyond synopsis fields is needed).
- [ ] World Building & Research Notes (Enhancements):
  - [x] Static Markdown viewer and edit toggle for World Notes.
  - [ ] Advanced Notes organization UI (e.g., filtering/searching by category).
  - [ ] Linking notes to specific manuscript scenes or characters.
- [ ] Export Functionality:
  - [ ] Implement project export (e.g., as a manuscript format).
- [ ] Scene Tag System:
  - [ ] Finalize dedicated tag management UI and API routes.
  - [ ] Comprehensive testing and UX refinement for the new two-tiered tag system.

### AI Features

- [ ] AI Service Integration:
  - [ ] Token tracking and usage limits per user (requires backend and UI).
- [ ] Specific AI Tools Implementation:
  - [x] **Snowflake Log Line Outliner**: Integrate AI to assist with one-sentence synopses based on user input or existing project content. (Log line generation refactored to background modality).
  - [x] **Snowflake Synopsis Outliner**: Integrate AI to assist with one-page synopses based on user input or existing project content.
  - [ ] **Snowflake Scene Outliner**: Integrate AI to assist with generating a summary of the scene based on the scene text.
  - [ ] **Character Enhancer**: Develop prompts and UI for AI to help flesh out characters.
  - [ ] **Research Assistant**: Tool for AI-powered research within the app.
  - [ ] **Plot Assistant**: Tools for identifying plot holes, brainstorming plot points.
  - [ ] **Writing Coach**: AI feedback on writing style, prose.
  - [ ] **Editor Assistant**: AI suggestions for tightening prose (respecting "AI never writes final text" principle).
- [ ] AI Settings Expansion:
  - [ ] UI in `SiteSettingsClient.tsx` for managing AI Prompts (CRUD), potentially with categorization.

### Deployment & DevOps

- [ ] Docker Setup (Development and Production).
- [ ] CI/CD Pipeline (Testing, Build, Deployment).
- [ ] Fly.io Deployment (Configuration, Domain, SSL).

## Current Status

### Outline Creator (2025-05-29)

✅ JSON structure and interfaces  
✅ System prompt configuration  
✅ Backend logic for AI interaction  
✅ Entity creation from outline  
✅ Basic UI implementation  
✅ Initial testing  
🔧 Additional testing and refinements

## Current Status

**Phase**: Foundational AI Integration & Outline UI Implemented -> **Focusing on Expanding Specific AI Tools, Completing Outline/Settings UI, Scene Tag System Overhaul, and AI Prompts Management**

The project has a robust backend API, a functional authentication system, and a well-structured frontend with key dashboard sections (Manuscript, Characters, World Notes, basic Outline, AI Model, Vendor & Prompt Settings) implemented. `snowgander` is integrated for AI calls, and the log line generation feature now operates in a background modality. The "Edit Project Details" modal has been successfully implemented, allowing users to update core project information.

The immediate focus areas are:

1.  **Flesh out AI Tools**: Implement specific AI assistance features (beyond log line generation) using the established `AISidePanel` and `AIToolButton` pattern, leveraging `tool_model` and `ai_prompts`.
2.  **Complete Outline UI**: Enhance the scene outline editing capabilities and consider chapter/scene reordering.
3.  **Complete AI Settings UI**: Add management for AI Prompts.
4.  **Scene Tag System**: Finalize and test the new two-tiered tag system (primary category + global tags), including dedicated tag management UI/API and comprehensive UX testing.
5.  **User Profile Management**: Basic profile page.
6.  **Refine UX & Error Handling**: Improve user feedback across the application.

## Known Issues

- Client-side error handling for some data operations could be more robust with `sonner` toasts.
- Full word count aggregation for chapters/project is present in API responses but might need more prominent UI display beyond `AppHeader`.
- AI Tool specific system prompts need to be created and managed.
- The UI needs a lot of refinement and polish.

### Bugs

- [Fixed 2025-05-26] When no characters exist in a project, the app kept querying characters over and over non-stop when on the outline page (OutlineSection infinite query loop). **Resolved by tracking fetch attempts per project.**
- [Fixed 2025-05-26] The total project word count did not get updated in real time, only after a refresh. **Resolved by calling `router.refresh()` after scene edits.**
- [Fixed 2025-05-26] The optional character image was incorrectly set up as required. **Resolved by handling `image_url` as nullable/optional in `CreateCharacterModal`.**

## Evolution of Project Decisions

| Date                       | Decision                                                                                                                                                                                                                                                                           | Rationale                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-05-26 (AI Update)     | Adopted a static Markdown viewer with edit toggle for World Notes, managed by explicit view/edit state in the data hook and conditional rendering in the section component.                                                                                                        | To improve UX clarity, prevent accidental edits, and provide a clean, readable display for notes. Pattern may be extended to other note features.   |
| 2025-05-26 (AI Update)     | Refactored `ProjectDashboardClient.tsx` into modular section components (`ManuscriptSection`, `OutlineSection`, `CharactersSection`, `WorldNotesSection`), each with its own data hook and encapsulated state/logic. Introduced `ProjectDataContext` for shared project-wide data. | To improve maintainability, testability, and scalability of the dashboard, reduce cross-section coupling, and enable faster feature development.    |
| ... (previous entries) ... | ...                                                                                                                                                                                                                                                                                | ...                                                                                                                                                 |
| YYYY-MM-DD (AI Update)     | Implemented `SiteSettingsClient` for AI Model management.                                                                                                                                                                                                                          | Provide users/admins a way to configure available AI models.                                                                                        |
| YYYY-MM-DD (AI Update)     | Added `tool_model` table and API.                                                                                                                                                                                                                                                  | To map abstract tool names (e.g., "summarizer") to specific AI models, allowing flexibility.                                                        |
| YYYY-MM-DD (AI Update)     | Integrated `snowgander` via `lib/data/chat.ts` and UI components (`AISidePanel`, `AIToolButton`).                                                                                                                                                                                  | To enable actual AI interactions based on configured models and prompts.                                                                            |
| YYYY-MM-DD (AI Update)     | Developed initial Outline UI (`ProjectSynopsisEditor`, `ChapterSceneOutlineList`) and modals for scene characters/tags.                                                                                                                                                            | To provide the user interface for the refactored outlining feature.                                                                                 |
| YYYY-MM-DD (AI Update)     | Added API routes for managing Scene-Character and Scene-Tag relationships.                                                                                                                                                                                                         | To support the linking of characters and tags to scenes, essential for detailed outlining and manuscript organization.                              |
| YYYY-MM-DD (AI Update)     | Implemented password reset and update password flows.                                                                                                                                                                                                                              | To provide full authentication lifecycle management.                                                                                                |
| 2025-05-24 (AI Update)     | Implemented full CRUD UI for AI Vendors in Site Settings, including modals and confirmation dialogs, matching the AI Model management pattern.                                                                                                                                     | To allow robust configuration of AI Vendors, a prerequisite for advanced AI integration and model management.                                       |
| 2025-05-24 (AI Update)     | Implemented full CRUD UI for AI Prompts in Site Settings, including modals and confirmation dialogs, matching the AI Model and Vendor pattern.                                                                                                                                     | To allow robust configuration of AI Prompts, a prerequisite for advanced AI tool and system prompt management.                                      |
| 2025-05-24 (AI Update)     | **Outline Section - Synopsis View**: Implemented display and editing of project log line and one-page synopsis using `ProjectSynopsisEditor`. Added basic display of character names/nicknames in `CharacterCardQuickViewList` with loading state.                                 | To bring the Synopsis sub-view of the Outline section to life, enabling users to manage high-level project summaries and see associated characters. |
| 2025-05-24 (AI Update)     | Implemented project deletion from the homepage.                                                                                                                                                                                                                                    | To provide users with a direct and intuitive way to manage and remove their projects from the main application entry point.                         |
| 2025-05-25 (AI Update)     | Implemented "Edit Project Details" modal.                                                                                                                                                                                                                                          | To allow users to modify core project details (title, genre, description, target word count) after project creation, enhancing project management.  |
| 2025-05-25 (AI Update)     | Implemented AI-assisted one-page synopsis generation.                                                                                                                                                                                                                              | To provide AI assistance for generating comprehensive one-page synopses, leveraging existing project context.                                       |
| 2025-05-25 (AI Update)     | Overhauled scene tag system to a two-tiered model: added `primary_category` ENUM to scenes and global tags via join table; updated backend, data layer, and UI; separated tag management from direct scene updates.                                                                | To enable more flexible, organized scene categorization and tagging, improve data integrity, and support advanced outlining and filtering.          |
