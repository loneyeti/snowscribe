# Project Progress

_(Updated: YYYY-MM-DD (AI-Generated Update))_

## What Works

- **Project Initialization**: Next.js 15.3.2, TypeScript, Tailwind CSS.
- **Memory Bank**: Documentation structure established.
- **Database Schema**: All core tables created and migrated, including `projects`, `chapters`, `scenes`, `characters`, `world_building_notes`, `genres`, `scene_tags`, `scene_applied_tags`, `scene_characters`, `ai_vendors`, `ai_models`, `ai_prompts`, `tool_model`. Outline fields integrated into `projects` and `scenes`.
- **Supabase Auth SSR**: Client, server, middleware for authentication and session management. Password reset and update password flows functional.
- **Shared TypeScript Types**: `lib/types/index.ts` comprehensive and aligned with DB schema.
- **Zod Schemas**: Validation schemas in `lib/schemas/` for all core and AI configuration entities.
- **Data Access Layer (`lib/data`)**: Functions for CRUD operations on all major entities, calling internal APIs with cookie forwarding. Includes `chat.ts` for `snowgander` integration.
- **API Route Handlers (`app/api`)**:
  - Full CRUD for Projects, Chapters, Scenes, Characters, World Notes, AI Vendors, AI Models, AI Prompts, Tool-to-Model mappings.
  - Endpoints for managing Scene-Character and Scene-Tag relationships.
  - Endpoint for fetching Genres.
  - All routes include user authentication and project ownership verification where applicable.
- **Authentication Flow & UI**:
  - Login, Registration, Logout, Auth Code Error, Password Reset, Update Password pages and backend logic.
  - `AuthForm.tsx` component for login/signup.
  - `UserMenuButton.tsx` for user actions.
- **Homepage Functionality**:
  - `HomePageClientWrapper.tsx` displays projects for logged-in user.
  - `CreateProjectModal.tsx` for new project creation.
- **Project Dashboard (`ProjectDashboardClient.tsx` & `AppShell.tsx`)**:
  - **Navigation**: Functional sidebar (`PrimarySidebar.tsx`) and header (`AppHeader.tsx`) managed by `AppShell.tsx`.
  - **Manuscript Section**:
    - Dynamic chapter and scene listing/creation.
    - `ManuscriptEditor.tsx` for scene content editing with auto-save and word count.
  - **Characters Section**:
    - `CharacterList.tsx`, `CreateCharacterModal.tsx`.
    - `CharacterCardEditor.tsx` for viewing/editing/deleting characters, aligned with schema.
  - **World Building & Research Notes Section**:
    - `WorldNoteList.tsx`, `CreateWorldNoteModal.tsx`.
    - `WorldNoteEditor.tsx` for viewing/editing/deleting notes, with `AlertDialog` for confirmation.
  - **Outline Section**:
    - `ProjectSynopsisEditor.tsx` for project log_line and one-page_synopsis.
    - `ChapterSceneOutlineList.tsx` for viewing scene outline details.
    - `ManageSceneCharactersModal.tsx` and `ManageSceneTagsModal.tsx` for linking characters/tags to scenes.
    - `CreateSceneModal` callable from outline view.
- **AI Integration (Foundational)**:
  - `snowgander` integrated in `lib/data/chat.ts`.
  - `AISidePanel.tsx` and `AIToolButton.tsx` for triggering AI tools based on `tool_model` config.
  - `MarkdownComponent.tsx` for rendering AI responses.
- **Site Settings (`SiteSettingsClient.tsx`)**:
  - UI for managing AI Models (List, Create, Edit, Delete), including fetching AI Vendors for selection.
- **UI Components (`components/ui`)**: Extensive library including Button, Input, Modal, DropdownMenu, List components, etc.
- **Technical Foundations**:
  - Next.js 15 async API compatibility (`await params`, `await cookies()`).
  - Centralized project ownership verification (`lib/supabase/guards.ts`).
  - Cookie forwarding for internal server-side API calls.
  - Custom fonts (`Inter`, `Cactus_Classical_Serif`) integrated.

## What's Left to Build

### Core Infrastructure

- [ ] Authentication System:
  - [ ] Refined error handling and user feedback (e.g., consistent `sonner` toasts for all auth actions).
- [ ] User Profile Management:
  - [ ] UI for users to view/edit their profile information.
  - [ ] UI for changing password (distinct from password reset).

### Main Features

- [ ] Project Management (Client-Side):
  - [ ] Project editing interface (e.g., update title, genre, target word count).
  - [ ] Project deletion confirmation and functionality from homepage/dashboard.
- [ ] Outlines (Client-Side Enhancements):
  - [ ] More robust editing experience within `ChapterSceneOutlineList.tsx` (e.g., inline editing or more comprehensive modals for all scene outline fields).
  - [ ] UI for reordering scenes within chapters, and chapters within the project.
  - [ ] UI to fully demonstrate/facilitate the Snowflake method (if specific UI beyond synopsis fields is needed).
- [ ] World Building & Research Notes (Enhancements):
  - [ ] Advanced Notes organization UI (e.g., filtering/searching by category).
  - [ ] Linking notes to specific manuscript scenes or characters.
- [ ] Export Functionality:
  - [ ] Implement project export (e.g., as a manuscript format).

### AI Features

- [ ] AI Service Integration:
  - [ ] Token tracking and usage limits per user (requires backend and UI).
- [ ] Specific AI Tools Implementation:
  - [ ] **Snowflake Outliner**: Integrate AI to assist with one-sentence and one-page synopses based on user input or existing project content.
  - [ ] **Character Enhancer**: Develop prompts and UI for AI to help flesh out characters.
  - [ ] **Research Assistant**: Tool for AI-powered research within the app.
  - [ ] **Plot Assistant**: Tools for identifying plot holes, brainstorming plot points.
  - [ ] **Writing Coach**: AI feedback on writing style, prose.
  - [ ] **Editor Assistant**: AI suggestions for tightening prose (respecting "AI never writes final text" principle).
- [ ] AI Settings Expansion:
    - [ ] UI in `SiteSettingsClient.tsx` for managing AI Vendors (CRUD).
    - [ ] UI in `SiteSettingsClient.tsx` for managing AI Prompts (CRUD), potentially with categorization.

### Deployment & DevOps

- [ ] Docker Setup (Development and Production).
- [ ] CI/CD Pipeline (Testing, Build, Deployment).
- [ ] Fly.io Deployment (Configuration, Domain, SSL).

## Current Status

**Phase**: Foundational AI Integration & Outline UI Implemented -> **Focusing on Expanding Specific AI Tools & Completing Outline/Settings UI**

The project has a robust backend API, a functional authentication system, and a well-structured frontend with key dashboard sections (Manuscript, Characters, World Notes, basic Outline, AI Model Settings) implemented. `snowgander` is integrated for AI calls.

The immediate focus areas are:
1.  **Flesh out AI Tools**: Implement specific AI assistance features using the established `AISidePanel` and `AIToolButton` pattern, leveraging `tool_model` and `ai_prompts`.
2.  **Complete Outline UI**: Enhance the scene outline editing capabilities and consider chapter/scene reordering.
3.  **Complete AI Settings UI**: Add management for AI Vendors and AI Prompts.
4.  **User Profile Management**: Basic profile page.
5.  **Refine UX & Error Handling**: Improve user feedback across the application.

## Known Issues

- Client-side error handling for some data operations could be more robust with `sonner` toasts.
- Full word count aggregation for chapters/project is present in API responses but might need more prominent UI display beyond `AppHeader`.
- AI Tool specific system prompts need to be created and managed.

## Evolution of Project Decisions

| Date                          | Decision                                                                                                                                                                 | Rationale                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ... (previous entries) ...    | ...                                                                                                                                                                      | ...                                                                                                                                                                                                                                                                              |
| YYYY-MM-DD (AI Update)        | Implemented `SiteSettingsClient` for AI Model management.                                                                                                                | Provide users/admins a way to configure available AI models.                                                                                                                                                                                                                     |
| YYYY-MM-DD (AI Update)        | Added `tool_model` table and API.                                                                                                                                        | To map abstract tool names (e.g., "summarizer") to specific AI models, allowing flexibility.                                                                                                                                                                                     |
| YYYY-MM-DD (AI Update)        | Integrated `snowgander` via `lib/data/chat.ts` and UI components (`AISidePanel`, `AIToolButton`).                                                                        | To enable actual AI interactions based on configured models and prompts.                                                                                                                                                                                                         |
| YYYY-MM-DD (AI Update)        | Developed initial Outline UI (`ProjectSynopsisEditor`, `ChapterSceneOutlineList`) and modals for scene characters/tags.                                                  | To provide the user interface for the refactored outlining feature.                                                                                                                                                                                                              |
| YYYY-MM-DD (AI Update)        | Added API routes for managing Scene-Character and Scene-Tag relationships.                                                                                               | To support the linking of characters and tags to scenes, essential for detailed outlining and manuscript organization.                                                                                                                                                         |
| YYYY-MM-DD (AI Update)        | Implemented password reset and update password flows.                                                                                                                      | To provide full authentication lifecycle management.                                                                                                                                                                                                                             |