# Active Context

## Current Work Focus

### Outline Creator Implementation Status (2025-05-29)

- **Completed**:
  - JSON structure definition and interfaces
  - System prompt engineering for outline generation
  - Backend logic for AI interaction and parsing
  - Entity creation from parsed outline
  - UI integration in OutlineSection
- **Pending Items**:
  - Additional testing with various synopses
  - User feedback collection
  - Potential prompt refinement based on testing

## Current Work Focus

_(Updated: 2025-05-26 (AI-Generated Update))_

**World Notes Feature Revamp (Markdown Viewer & Edit Toggle):**

- The World Notes section now defaults to a static, Markdown-rendered view of each note, with an "Edit" button to switch to the familiar editor.
- State management for view/edit mode is handled in `useWorldNotesData`, with new state and handlers (`isEditingSelectedNote`, `enableEditMode`, `disableEditMode`).
- The new `WorldNoteViewer` component displays note content using Markdown, with clear UI separation from the editor.
- The main WorldNotesSection conditionally renders either the viewer or the editor based on the current mode, ensuring seamless transitions and correct state resets on note selection or deletion.
- The editor now includes a "Cancel" button and improved save/cancel flow, ensuring edits are only applied when explicitly saved.
- All flows (view, edit, create, delete, edge cases) have been tested for correctness, UX clarity, and error handling.
- This pattern of toggling between static Markdown view and edit mode may be extended to other note-like features for improved UX consistency.

**Major Project Dashboard Refactor Complete (Phases 0–8):**

- The monolithic `ProjectDashboardClient.tsx` has been fully refactored into a modular, maintainable architecture:

  - Each dashboard section (Manuscript, Outline, Characters, World Notes) is now a self-contained component in `components/dashboard/sections/`, responsible for its own UI and state.
  - Each section uses a dedicated custom data hook in `hooks/dashboard/` (e.g., `useManuscriptData`, `useCharactersData`, etc.) for all data fetching, state, and handlers.
  - Shared project-wide data (e.g., all characters, all scene tags) is now managed by a new `ProjectDataContext` (`contexts/ProjectDataContext.tsx`), which provides context and hooks for section components.
  - All state, effects, and handlers related to section data have been removed from `ProjectDashboardClient.tsx`, which now simply renders the section components and provides the context.
  - All modals and detail panels are now managed within their respective section components, ensuring encapsulation and reducing cross-section coupling.
  - The new structure enables easier testing, maintenance, and future feature development.

- **Cleanup and Bugfixes (Phases 7 & 8):**

  - TypeScript errors (e.g., missing exports for `UpdateSceneValues`) have been resolved.
  - Unused variables and imports have been removed across all affected files.
  - All `useEffect` and `useCallback` dependency arrays have been audited and corrected.
  - Import paths have been verified and fixed.
  - The infinite character query loop in OutlineSection has been fixed by tracking fetch attempts per project.
  - The project word count in `AppHeader` now updates in real time after scene edits via `router.refresh()`.
  - The optional character image field is now correctly handled as nullable/optional in `CreateCharacterModal`.
  - All known dashboard-related bugs from the previous progress log have been addressed.

- **Testing and Review:**
  - All dashboard sections have been tested for CRUD, navigation, and data consistency.
  - Drag-and-drop scene reordering, AI-assisted outline/synopsis generation, and all modal flows have been verified.
  - The new architecture has been reviewed for prop consistency, hook usage, and modularity.

**The scene tag system has been overhauled to a two-tiered model: each scene now has a primary category (ENUM) and can be assigned multiple global tags (managed via a join table). Ongoing work includes refining tag management UI, API separation, and thorough testing of the new system.**

## Recent Changes

- **World Notes Feature Revamp (2025-05-26):**

  - Added `isEditingSelectedNote` state and edit mode handlers to `useWorldNotesData` for managing view/edit state.
  - Created `WorldNoteViewer` component for static, Markdown-rendered note display with an "Edit" button.
  - Updated `components/world-notes/index.ts` to export the new viewer.
  - Modified `WorldNotesSection` to conditionally render the viewer or editor based on edit state, with correct keying and state reset logic.
  - Enhanced `WorldNoteEditor` to support a "Cancel" button and ensure save/cancel flows correctly switch modes and reset form state.
  - Verified all flows: viewing, editing, creating, deleting notes, and edge cases (empty content/category, rapid switching, unsaved edits).
  - Ensured clear separation of view and edit UI, robust state management, and user-friendly error handling.
  - Pattern established for toggling between Markdown view and edit mode for note-like features.

- **Major Project Dashboard Refactor (2025-05-26):**

  - Decomposed `ProjectDashboardClient.tsx` into modular section components: `ManuscriptSection`, `OutlineSection`, `CharactersSection`, and `WorldNotesSection`, each in `components/dashboard/sections/`.
  - Each section now manages its own state and data via a dedicated custom hook in `hooks/dashboard/` (e.g., `useManuscriptData`, `useCharactersData`, etc.).
  - Introduced `ProjectDataContext` (`contexts/ProjectDataContext.tsx`) to provide shared project-wide data (e.g., all characters, all scene tags) to all sections.
  - Removed all monolithic state, effects, and handlers from `ProjectDashboardClient.tsx`, which now simply renders the section components and provides context.
  - All modals and detail panels are now managed within their respective section components.
  - Performed comprehensive cleanup: removed unused variables/imports, fixed all TypeScript errors, audited all `useEffect`/`useCallback` dependencies, and verified all import paths.
  - Fixed key bugs: infinite character query loop in OutlineSection, real-time word count update in `AppHeader`, and optional character image handling in `CreateCharacterModal`.
  - All dashboard sections and flows have been tested for CRUD, navigation, and data consistency.

- **Two-Tiered Scene Tag System Overhaul (2025-05-25):**

  - Added `primary_category` ENUM and column to the `scenes` table via migration.
  - Seeded predefined global scene tags in `supabase/seed.sql`.
  - Updated backend types (`PrimarySceneCategory`), Zod schemas, and data layer to support `primary_category` and global tags.
  - Modified API routes for scene creation and update to handle `primary_category` and decoupled tag management from direct scene updates (tags now managed via join table).
  - Enhanced UI components (`CreateSceneModal`, `ChapterSceneOutlineList`, etc.) to support primary category selection and display, and improved tag selection UX.
  - Addressed issues with tag_ids not being a direct column and ensured correct handling in data and API layers.
  - Ongoing: Finalizing dedicated tag management routes/components and comprehensive testing.

<!-- (rest of file unchanged) -->
