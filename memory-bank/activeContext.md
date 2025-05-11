# Active Context

## Current Work Focus

_(Updated: 2025-05-11)_

Data model for the Outlining feature has been refactored. The next focus is implementing the UI for the Outlining feature, followed by Authentication UI Refinements and API for Relationships (Scene Tags, Scene Characters).

## Recent Changes

- Created the memory bank structure with all core documentation files
- Established project goals and requirements in the project brief
- Defined the system architecture and component structure
- Documented the technical stack and development environment
- Implemented initial Supabase database schema via migrations.
- Set up Supabase Auth SSR foundational files (`client.ts`, `server.ts`, `middleware.ts`).
- **Implemented API Route Handlers and Zod Schemas for core entities.**
- All API routes include user authentication checks and input validation using Zod.
- **Implemented a basic authentication flow.**
- **Developed a basic homepage.**
- **Defined shared TypeScript types.**
- **Created initial suite of UI components.**
- **Implemented Manuscript Section in Project Dashboard (`ProjectDashboardClient.tsx`):**
  - Chapters are dynamically fetched and displayed.
  - Users can add new chapters via `CreateChapterModal.tsx`.
  - Clicking a chapter fetches and displays its scenes.
  - Users can add new scenes via `CreateSceneModal.tsx`.
  - Data fetching functions for chapters and scenes implemented.
  - UI components like `ListSectionHeader` updated.
- **Addressed Next.js 15 Asynchronous API Errors:**
  - Updated `app/(dashboard)/project/[projectId]/page.tsx` to use `await params`.
  - Updated `lib/data/projects.ts` to use `await cookies()`.
  - Updated API route handlers (`app/api/projects/[projectId]/route.ts`, `app/api/projects/[projectId]/chapters/route.ts`) to use `await params`.
- **Integrated `ManuscriptEditor` in `ProjectDashboardClient.tsx`:**
  - Editor displays content of `selectedScene`.
  - Auto-saves scene content via `saveText` prop, calling the appropriate API.
  - Word count is calculated, displayed, and updated in real-time.
  - Uses `geistSans` font for the editor.
- **Implemented Initial Character UI in Project Dashboard (`ProjectDashboardClient.tsx` and related components):**
  - Characters are dynamically fetched and displayed using `CharacterList.tsx`.
  - Users can add new characters via `CreateCharacterModal.tsx`.
  - `lib/data/characters.ts` created for character data operations.
  - `CharacterCardEditor.tsx` updated to include delete functionality (accepts `onDelete` prop, has a delete button with confirmation) and uses project's `Button`, `Input`, `Textarea` components.
  - Resolved TypeScript error related to `onDelete` prop in `ProjectDashboardClient.tsx` by ensuring `CharacterCardEditor.tsx` accepts it.
- **Refactored Project Dashboard Navigation:**
  - `AppShell.tsx` now manages `activeSection` state and passes it and a handler to `PrimarySidebar` and its children (`ProjectDashboardClient`).
  - `PrimarySidebar.tsx` now receives `activeSection` and `onSectionChange` props to control active state and handle navigation clicks.
  - `ProjectDashboardClient.tsx` now receives `activeSection` as a prop and renders views accordingly, removing internal state management for section navigation. This resolves the issue of sidebar clicks not changing the displayed section.
- **Refined Character Editor and Data Structures:**
  - Updated `components/editors/CharacterCardEditor.tsx` to use fields (`description`, `notes`, `image_url`) aligned with `lib/schemas/character.schema.ts`. Removed outdated fields (`backstory`, `traits`).
  - Modified `app/(dashboard)/project/[projectId]/ProjectDashboardClient.tsx` to correctly pass `initialData` to the updated `CharacterCardEditor` and handle the `onSave` callback with the new `CharacterFormData` structure.
  - Updated `lib/types/index.ts` for the `Character` interface: changed `notes` from `Record<string, unknown> | null` to `string | null`, and removed `backstory` and `motivations` fields to align with the schema. This resolved critical TypeScript errors.
- **Refactored Data Access Layer (`lib/data`)**:
  - Modified `lib/data/projects.ts` (`getProjectById`) to fetch data via its corresponding API route (`/api/projects/[projectId]`). The API route was updated to include genre and word count calculations.
  - Modified `lib/data/chapters.ts` (`getChaptersByProjectId`) to fetch data via its corresponding API route (`/api/projects/[projectId]/chapters`). The API route was updated to include scene and word count calculations for each chapter.
  - Verified `lib/data/characters.ts` and `lib/data/scenes.ts` already adhere to the pattern of calling API routes.
- **Resolved Authentication Issue for Internal API Calls**:
  - Fixed an issue where server-side `fetch` calls from `lib/data/*` functions to internal API routes were failing authentication.
  - The root cause was that cookies were not being automatically forwarded by `fetch`.
  - **Solution**: Modified `lib/data/projects.ts` to explicitly read cookies using `cookies()` from `next/headers` and add them to the `Cookie` header of the `fetch` request. This ensures the internal API calls are authenticated correctly. This pattern will need to be applied to other similar data fetching functions.
- **Centralized Project Ownership Verification**:
  - Created a `verifyProjectOwnership` guard in `lib/supabase/guards.ts`.
  - Refactored all relevant API routes (`/api/projects/[projectId]/...` and its sub-routes for chapters, scenes, characters, etc.) to use this guard for consistent and DRY project ownership checks before proceeding with operations.
  - Removed direct Supabase ownership queries from `lib/data/characters.ts` as this is now handled by the API layer.
- **Implemented World Building & Research Notes Feature:**
  - Created Zod schemas for world building notes (`lib/schemas/worldBuildingNote.schema.ts`).
  - Implemented API route handlers for CRUD operations on world notes (`app/api/projects/[projectId]/world-notes/` and `app/api/projects/[projectId]/world-notes/[noteId]/`).
  - Created data access functions for world notes (`lib/data/worldBuildingNotes.ts`) that call the API routes with cookie forwarding.
  - Developed UI components: `WorldNoteList.tsx`, `CreateWorldNoteModal.tsx`, and `WorldNoteEditor.tsx` in `components/world-notes/`.
  - Integrated the World Building Notes section into `ProjectDashboardClient.tsx`, including state management, data fetching, and event handling.
  - Added `@radix-ui/react-alert-dialog` dependency and created `components/ui/AlertDialog.tsx` for delete confirmations.
- **Fixed World Notes Navigation**: Corrected a mismatch between the navigation ID used in `PrimarySidebar.tsx` (`"world"`) and the ID expected by `ProjectDashboardClient.tsx` (`"world-notes"`) for the World Building Notes section. Changed ID in `PrimarySidebar.tsx` to `"world-notes"` to ensure the correct view is rendered.
- **Refactored Outline Data Model (2025-05-11):**
  - Simplified the data model for the outlining feature to directly integrate with `projects` and `scenes` tables.
  - Removed the `outline_items` table by commenting out its creation in `supabase/migrations/20250509074219_create_outline_items_table.sql`.
  - Created a new migration (`supabase/migrations/20250511204700_add_outline_fields.sql`) to:
    - Add `one_page_synopsis TEXT NULL` to the `projects` table (for the one-page synopsis). The existing `log_line` will be used for the one-sentence synopsis.
    - Add `outline_description TEXT NULL` to the `scenes` table (for brief scene outline descriptions).
    - Add `pov_character_id UUID NULL REFERENCES characters(id) ON DELETE SET NULL` to the `scenes` table.
  - Updated `lib/types/index.ts`: removed `OutlineItem` interface, added new fields to `Project` and `Scene` interfaces.
  - Deleted `lib/schemas/outlineItem.schema.ts`.
  - Deleted API routes related to `outline-items` (`app/api/projects/[projectId]/outline-items/`).

## Next Steps

The following are the prioritized next steps:

1.  **Implement Outline Feature UI**:

    - [ ] Design and implement UI components for viewing and editing the one-sentence synopsis (`projects.log_line`) and one-page synopsis (`projects.one_page_synopsis`).
    - [ ] Design and implement UI for listing scenes within chapters in an outline view.
    - [ ] Allow editing of `scenes.outline_description` and `scenes.pov_character_id` from the outline view.
    - [ ] Ensure changes in the outline view are reflected in the manuscript view and vice-versa, leveraging the shared data model.

2.  **API for Relationships (supporting Outline & Manuscript)**:

    - [ ] Implement API endpoints for managing Scene Tags (applying/removing tags to scenes).
    - [ ] Implement API endpoints for Scene Characters (linking/unlinking characters to scenes, distinct from `pov_character_id`).

3.  **Authentication UI Refinements**:

    - [ ] Refine error handling and user feedback for all auth flows (login, signup, password reset) using `sonner` for toasts.

4.  **Core UI Components & Manuscript Refinements**:
    - Continue refinement and expansion of the UI component library.
    - Improve display of chapter/scene metadata (e.g., scene counts, word counts) in lists.
    - Ensure Manuscript Editor (`components/editors/ManuscriptEditor.tsx`) remains functional and performant.

_Previously completed/lower priority items moved or subsumed:_

- Manuscript Editor Integration (largely complete, ongoing refinements fall under Core UI)
- Project Dashboard & Navigation for Characters (complete)
- World Building & Research Notes UI (complete for core CRUD)

## Active Decisions and Considerations

### Typography Selection

Typography is critical for Snowscribe. We need to select fonts that are:

- Beautiful and professional
- Highly readable for long writing sessions
- Available for web use (consider Google Fonts or Adobe Fonts)
- Performant (limited number of weights to reduce load times)
- **Action**: Define and integrate chosen fonts. The `ManuscriptEditor` will need a proper `NextFont` object.

### AI Integration Strategy

We're currently considering how to best integrate AI features:

- Should be accessible but not intrusive
- Need to define clear boundaries for AI vs. human writing
- Must track and limit token usage for business viability
- Need to create robust system prompts for each AI feature

### Editor Experience

The manuscript editor needs careful consideration:

- Should feel similar to professional writing tools
- Must support basic formatting (italic, bold, etc.)
- Needs to track word count in real-time
- Should save automatically to prevent lost work
- Must work well on both desktop and mobile

## Important Patterns and Preferences

### UI/UX Principles

- **Typography First**: All design decisions should prioritize beautiful, readable text
- **Clean and Minimal**: Avoid clutter and unnecessary UI elements
- **Focus Mode**: Enable writers to focus on their writing without distractions
- **Progressive Disclosure**: Complex features should be accessible but not overwhelming

### Development Patterns

- **Server Components by Default**: Use React Server Components for all non-interactive UI
- **Strong TypeScript**: Use explicit typing for all functions, components, and data structures
- **Component-Driven Development**: Build from small, reusable components up to larger features
- **Accessibility First**: Build with accessibility in mind from the beginning
- **API Route Handlers**: Use Next.js Route Handlers for backend logic, secured by middleware and RLS.
- **Zod for Validation**: Enforce data integrity through Zod schemas at the API boundary.
- **Sonner for Notifications**: Utilize `sonner` for user-facing toast notifications for actions, errors, and successes.
- **Client-side data fetching within feature components**: For dynamic lists like chapters and scenes within the dashboard, components fetch their own data using functions from `lib/data/*` which in turn call internal API routes.
- **Asynchronous Dynamic APIs (Next.js 15+):** Ensure `params` and `cookies()` are `await`ed in server-side code (Server Components, Route Handlers, server-side data fetching functions).
- **Project Ownership Guard**: Utilize the `verifyProjectOwnership` guard in `lib/supabase/guards.ts` at the beginning of API route handlers for project-specific resources to ensure the user is authorized to access/modify the project. This complements RLS by providing an early, explicit check.

## Learnings and Project Insights

- The Supabase Auth SSR pattern, when implemented correctly with `@supabase/ssr` and proper cookie handling, provides a robust authentication foundation.
- Typography selection will have a major impact on the overall user experience.
- AI integration needs careful boundaries to ensure it assists rather than replaces the writer.
- Mobile responsiveness requires thoughtful design decisions for the manuscript editor.
- Supabase migrations are straightforward for table creation but require careful handling of constraints and RLS policies.
- API design for nested resources requires careful planning of route structures and parameter handling. User authorization checks at each API endpoint are crucial.
- Ensuring user ownership and authorization at each API endpoint is crucial for security.
- Creating highly generic and polymorphic components (like the attempted `Text.tsx`) can introduce significant TypeScript complexity. A simpler, more direct approach for typography components (`Heading`, `Paragraph`) was adopted for now.
- Centralizing TypeScript types in `lib/types/index.ts` improves maintainability and consistency across the application.
- The homepage now provides a functional entry point for users to see their work and start new projects.
- Careful attention to import paths and exact exported names from modules (e.g., Zod schemas) is crucial to avoid TypeScript resolution errors.
- Client-side components that manage their own data fetching (like `ProjectDashboardClient` for chapters/scenes) provide good encapsulation but require careful state management for loading, errors, and updates.
- Next.js 15 requires careful handling of dynamic APIs (`params`, `cookies()`, `headers()`) by `await`ing them in server contexts.
- **Server-Side Internal API Calls & Cookies**: When making server-side `fetch` requests from data-fetching functions (e.g., in `lib/data/*`) to internal API routes, cookies are not automatically forwarded by `fetch` as reliably as expected. It's necessary to explicitly read cookies using `cookies()` from `next/headers` and attach them to the `Cookie` header of the outgoing `fetch` request to ensure proper authentication of these internal calls.
- **Centralized Authorization Logic**: The introduction of `verifyProjectOwnership` guard promotes DRY principles and centralizes a critical aspect of authorization logic for project-related data, making API routes cleaner and more consistent.
  - **Navigation ID Consistency**: Ensured consistency in navigation item IDs between `PrimarySidebar.tsx` and `ProjectDashboardClient.tsx` to correctly render different project sections. A mismatch was causing the World Notes section to not display.
- **Outline Data Model Simplification (2025-05-11)**: Refined the outline feature requirements leading to a significant simplification of its data model. The new model ties outlining directly to existing `projects` and `scenes` tables (by adding fields like `one_page_synopsis` to projects, and `outline_description`, `pov_character_id` to scenes) instead of using a separate, more complex `outline_items` table. This enhances data consistency and aligns better with the product vision of a unified manuscript and outline structure.
