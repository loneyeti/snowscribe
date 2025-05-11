# Project Progress

## What Works

- **Project Initialization**: The project has been set up with Next.js 15+, TypeScript, and Tailwind CSS.
- **Memory Bank**: Complete documentation structure is established for tracking project status and decisions.
- **Database Schema**: All core tables created and migrated.
- **Supabase Auth SSR**: Foundational client, server, and middleware files are in place, and a basic authentication flow (signup, login, logout) is functional.
- **Shared TypeScript Types**: `lib/types/index.ts` created and populated with core data interfaces. (Updated 2025-05-11: `OutlineItem` removed; `Project` and `Scene` interfaces updated with new outline-related fields).
- **Core API Endpoints (CRUD)**:
  - [x] Projects API (`app/api/projects/` and `app/api/projects/[projectId]/`)
  - [x] Chapters API (`app/api/projects/[projectId]/chapters/` and `app/api/projects/[projectId]/chapters/[chapterId]/`)
  - [x] Scenes API (`app/api/projects/[projectId]/chapters/[chapterId]/scenes/` and `app/api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]/`)
  - [x] Characters API (`app/api/projects/[projectId]/characters/` and `app/api/projects/[projectId]/characters/[characterId]/`)
  - [x] World Building Notes API (`app/api/projects/[projectId]/world-notes/` and `app/api/projects/[projectId]/world-notes/[noteId]/`)
  - [ ] Outline Items API - Removed (2025-05-11) as part of data model refactor.
- **Zod Schemas**:
  - [x] Validation schemas created for core entities (Project, Chapter, Scene, Character, WorldBuildingNote).
  - [ ] `outlineItem.schema.ts` - Removed (2025-05-11).
- **Data Access Layer (`lib/data`)**:
  - [x] Functions for Projects, Chapters, Scenes, Characters.
  - [x] Functions for World Building Notes (`lib/data/worldBuildingNotes.ts`).
- **Homepage Functionality**:
  - [x] Display existing projects for the logged-in user.
  - [x] Allow creation of new projects via a modal.
- **Project Dashboard - Manuscript Section**:
  - [x] Dynamically fetch and list chapters for a project.
  - [x] Add new chapters via `CreateChapterModal.tsx`.
  - [x] On chapter selection, dynamically fetch and list scenes for that chapter.
  - [x] Add new scenes to a chapter via `CreateSceneModal.tsx`.
  - [x] Data fetching functions in `lib/data/chapters.ts` and `lib/data/scenes.ts`.
- **Next.js 15 Asynchronous API Compatibility**:
  - [x] Updated `app/(dashboard)/project/[projectId]/page.tsx` to use `await params`.
  - [x] Updated `lib/data/projects.ts` to use `await cookies()`.
  - [x] Updated API route handlers (`app/api/projects/[projectId]/route.ts`, `app/api/projects/[projectId]/chapters/route.ts`) to use `await params`.
- **Project Dashboard - Characters Section (Initial Implementation)**:
  - [x] Dynamically fetch and list characters for a project using `CharacterList.tsx`.
  - [x] Add new characters via `CreateCharacterModal.tsx`.
  - [x] `lib/data/characters.ts` created and functional for CRUD operations.
  - [x] `CharacterCardEditor.tsx` displays selected character and allows saving.
  - [x] Delete functionality implemented in `CharacterCardEditor.tsx` with confirmation.
  - [x] `CharacterCardEditor.tsx` updated to use project's `Button`, `Input`, `Textarea` UI components.
- **Project Ownership Verification Refactor**:
  - [x] Created `lib/supabase/guards.ts` with `verifyProjectOwnership` function.
  - [x] Refactored all relevant API routes to use this guard for consistent project ownership checks.
  - [x] Removed direct ownership queries from `lib/data/characters.ts`.
- **Project Dashboard - World Building & Research Notes Section**:
  - [x] Dynamically fetch and list world notes using `WorldNoteList.tsx`.
  - [x] Add new notes via `CreateWorldNoteModal.tsx`.
  - [x] `WorldNoteEditor.tsx` displays selected note and allows saving and deleting.
  - [x] Added `@radix-ui/react-alert-dialog` and `components/ui/AlertDialog.tsx`.
- **Project Dashboard Navigation**:
  - [x] `AppShell.tsx` manages `activeSection` state.
  - [x] `PrimarySidebar.tsx` uses props from `AppShell` to handle navigation clicks and display active state.
  - [x] `ProjectDashboardClient.tsx` receives `activeSection` from `AppShell` to render the correct view.
  - [x] Navigation between sections (Manuscript, Characters, World Notes, etc.) is now functional.
- **Character Editor Data Alignment**:
  - [x] `CharacterCardEditor.tsx` updated to use fields (`description`, `notes`, `image_url`) aligned with `character.schema.ts`.
  - [x] `ProjectDashboardClient.tsx` updated to correctly pass `initialData` and handle `onSave` with the new `CharacterFormData`.
  - [x] `lib/types/index.ts` updated for `Character` type ( `notes` field to `string | null`, removed `backstory`, `motivations`) to align with schema and resolve TypeScript errors.
- **Outline Data Model Refactor (2025-05-11)**:
  - [x] Successfully refactored the data model for the outlining feature.
  - [x] Removed the `outline_items` table and its associated API routes, Zod schema, and TypeScript type.
  - [x] Added `one_page_synopsis` field to the `projects` table.
  - [x] Added `outline_description` and `pov_character_id` fields to the `scenes` table.
  - [x] Updated migration files accordingly.

## What's Left to Build

### Core Infrastructure

- [ ] Authentication System

  - [x] Supabase Auth SSR integration
  - [x] Login page
  - [x] Registration page
  - [x] Password reset flow
  - [x] Session management
  - [x] Protected routes
  - [ ] Refined error handling and user feedback (e.g., using `sonner` toasts consistently).

- [x] Database Schema and Tables (All core tables implemented)

- [x] UI Component Library (Initial suite created, ongoing refinement)

- [ ] API for Relationships
  - [ ] Scene Tags (applying/removing tags to scenes)
  - [ ] Scene Characters (linking/unlinking characters to scenes)

### Main Features

- [ ] Project Management (Client-Side)

  - [x] Project creation form
  - [x] Project listing page
  - [ ] Project editing interface
  - [ ] Project deletion confirmation

- [ ] Manuscript Editor

  - [x] `ManuscriptEditor.tsx` component provided.
  - [x] Chapter and Scene listing/navigation implemented.
  - [x] Scene creation implemented.
  - [x] Integrate `ManuscriptEditor.tsx` to display and save `selectedScene.content`.
  - [x] Word count display (dynamic based on editor content).
  - [x] Auto-save functionality for editor.

- [ ] Characters System (Client-Side)

  - [x] Character creation form (`CreateCharacterModal.tsx`)
  - [x] Character editing interface (basic via `CharacterCardEditor.tsx`, now aligned with schema fields).
  - [x] Character deletion from editor.
  - [x] Refine `CharacterCardEditor.tsx` to fully support all fields from `character.schema.ts` (e.g., `description`, `notes`). (This is now complete)
  - [x] Address data mapping discrepancies between `CharacterCardEditor`'s internal state and the main `Character` type. (This is now complete)
  - [ ] Character linking to scenes UI

- [ ] Outlines (Client-Side) - _To be implemented using the new data model (fields on `projects` and `scenes` tables)_

  - [ ] Snowflake method UI implementation (for one-sentence, one-page synopses, and scene list).
  - [ ] Outline editing interface for project synopses and scene outline details (`outline_description`, `pov_character_id`).
  - [ ] UI to demonstrate/facilitate the linking between outline view and manuscript view (shared `chapters` and `scenes` records).

- [x] World Building & Research Notes (Client-Side)
  - [x] Notes creation form (`CreateWorldNoteModal.tsx`)
  - [x] Notes organization UI (basic list view - `WorldNoteList.tsx`)
  - [x] Notes editing interface (`WorldNoteEditor.tsx`)
  - [x] Notes deletion with confirmation
  - [ ] Advanced Notes organization UI (e.g., by category, search/filter - future enhancement)
  - [ ] Notes linking to scenes UI (future enhancement)

### AI Features

- [ ] AI Service Integration

  - [ ] snowgander package implementation
  - [ ] Token tracking
  - [ ] Usage limits per user

- [ ] AI Features
  - [ ] Snowflake Outliner
  - [ ] Character Enhancer
  - [ ] Research Assistant
  - [ ] Plot Assistant
  - [ ] Writing Coach
  - [ ] Editor Assistant

### Deployment & DevOps

- [ ] Docker Setup

  - [ ] Development container
  - [ ] Production container

- [ ] CI/CD Pipeline

  - [ ] Testing workflow
  - [ ] Build workflow
  - [ ] Deployment workflow

- [ ] Fly.io Deployment
  - [ ] Environment configuration
  - [ ] Domain setup
  - [ ] SSL certificates

## Current Status

**Phase**: Outline Data Model Refactored -> **Focusing on Outline Feature UI Implementation**
_(Updated: 2025-05-11)_

The project has successfully established its foundational API layer, a basic authentication flow, and a functional homepage. The manuscript, character, and world building notes sections of the project dashboard are largely complete. Navigation between dashboard sections is working correctly. The data model for the outlining feature has been successfully refactored to simplify its structure and integrate it directly with `projects` and `scenes` tables.

The `lib/data` files have been refactored or created to ensure database interactions are routed through API endpoints. API route authorization uses a centralized `verifyProjectOwnership` guard.

The immediate focus areas are now:

1.  **Implement Outline Feature UI**: Design and build the user interface for the outlining feature based on the new data model (project synopses, scene outline descriptions, POV characters).
2.  **API for Relationships**: Implement API endpoints for managing Scene Tags and Scene Characters (these are crucial for both manuscript and outline views).
3.  **Authentication UI Refinements**: Refine error handling and user feedback for all auth flows.
4.  **Implementation of other dashboard sections**: AI Assistant.
5.  **UI/UX Refinements**: Continue improving general UI/UX, including chapter/scene metadata display.

## Known Issues

- Client-side error handling and user feedback for auth and project creation can be improved (e.g., more consistent use of `sonner` toasts).
- Scene/word counts for chapters are not yet displayed in the chapter list.
- _(The previous critical authentication issue leading to "Unexpected token '<'" and "Invalid hook call" errors when fetching project data has been resolved by ensuring cookies are explicitly forwarded on internal server-side API calls.)_
- **[Resolved]** World Notes section was not displaying due to a navigation ID mismatch between `PrimarySidebar.tsx` and `ProjectDashboardClient.tsx`.

## Evolution of Project Decisions

| Date       | Decision                                                                   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-05-09 | Established memory bank documentation                                      | To ensure clear project tracking and communication                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ...        | ... (previous entries)                                                     | ...                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2025-05-10 | Implemented dynamic chapter and scene fetching in `ProjectDashboardClient` | To make the manuscript section self-contained for its data needs and reflect real-time additions.                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2025-05-10 | Created `CreateChapterModal` and `CreateSceneModal` components             | To provide UI for adding new chapters and scenes.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2025-05-10 | Updated `ListSectionHeader` to support an `actionElement` prop             | To allow placement of action buttons (like "add") directly in section headers, matching UI mockups.                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2025-05-10 | Addressed Next.js 15 async API requirements                                | Ensured `params` and `cookies()` are `await`ed in server contexts to prevent runtime errors.                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2025-05-10 | Integrated `ManuscriptEditor` into `ProjectDashboardClient`                | Enabled scene content editing, auto-saving, and dynamic word count updates. Used `geistSans` font.                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2025-05-10 | Implemented Character CRUD UI foundation                                   | Created `CharacterList`, `CreateCharacterModal`, `CharacterCardEditor` components and `lib/data/characters.ts`. Added delete functionality to editor.                                                                                                                                                                                                                                                                                                                                               |
| 2025-05-10 | Refactored Dashboard Navigation                                            | Centralized `activeSection` state in `AppShell` to enable `PrimarySidebar` to control content displayed by `ProjectDashboardClient`.                                                                                                                                                                                                                                                                                                                                                                |
| 2025-05-10 | Aligned Character Editor with Schema                                       | Updated `CharacterCardEditor.tsx`, `ProjectDashboardClient.tsx`, and `lib/types/index.ts` (Character type) to use schema-consistent fields (`description`, `notes`, `image_url`) and resolve data type mismatches.                                                                                                                                                                                                                                                                                  |
| 2025-05-11 | Refactored `lib/data` access layer                                         | Modified `lib/data/projects.ts` and `lib/data/chapters.ts` to call API routes instead of direct Supabase access. Updated corresponding API routes to include necessary data processing. Verified `lib/data/characters.ts` and `lib/data/scenes.ts` compliance.                                                                                                                                                                                                                                      |
| 2025-05-11 | Fixed Internal API Auth by Forwarding Cookies                              | Resolved issue where server-side `fetch` calls (e.g., in `lib/data/projects.ts`) to internal API routes failed authentication. Solution involved explicitly reading cookies via `next/headers cookies()` and adding them to the `fetch` request's `Cookie` header.                                                                                                                                                                                                                                  |
| 2025-05-11 | Centralized Project Ownership Verification                                 | Created `verifyProjectOwnership` guard in `lib/supabase/guards.ts` and refactored all project-specific API routes to use it. This improves security, maintainability, and follows DRY principles for authorization logic.                                                                                                                                                                                                                                                                           |
| 2025-05-11 | Implemented World Building & Research Notes Feature                        | Added complete CRUD functionality for world notes, including Zod schemas, API routes, data access layer functions, and UI components (`WorldNoteList`, `CreateWorldNoteModal`, `WorldNoteEditor`), integrated into the project dashboard. Installed `@radix-ui/react-alert-dialog` and created `AlertDialog.tsx`.                                                                                                                                                                                   |
| 2025-05-11 | Fixed World Notes Navigation ID Mismatch                                   | Corrected the navigation ID for "World Notes" in `PrimarySidebar.tsx` from `"world"` to `"world-notes"` to match the ID expected by `ProjectDashboardClient.tsx`, resolving an issue where the section would not render.                                                                                                                                                                                                                                                                            |
| 2025-05-11 | Refactored Outline Data Model                                              | Simplified the outline feature's data model by removing the `outline_items` table and integrating its core functionalities directly into the `projects` (added `one_page_synopsis`) and `scenes` (added `outline_description`, `pov_character_id`) tables. This aligns the outline structure more closely with the manuscript structure, enhancing data consistency and simplifying future UI development. Updated migrations, TypeScript types, and removed associated Zod schemas and API routes. |
