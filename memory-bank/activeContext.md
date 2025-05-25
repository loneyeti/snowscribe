# Active Context

## Current Work Focus

_(Updated: YYYY-MM-DD (AI-Generated Update))_

The core data models for AI Configurations (Vendors, Models, Prompts, Tool-to-Model Mappings) and the refactored Outline feature are implemented. User interface for managing AI Models within settings is functional. Integration of `snowgander` for AI chat/tool execution is underway, with `AISidePanel` and `AIToolButton` providing the UI. The Outline feature UI is partially implemented with synopsis editing and scene list capabilities.

The immediate next steps involve:
1.  Completing the UI for the Outlining feature (detailed scene editing, potentially chapter-level outlining).
2.  Expanding the AI Settings UI to manage AI Vendors and Prompts.
3.  Implementing specific AI tools using the `AISidePanel` and `AIToolButton` pattern, leveraging the `tool_model` and `ai_prompts` configurations.
4.  Refining authentication UI/UX and general error handling.

## Recent Changes

- **AI Configuration Implementation (Data & Basic UI):**
  - Created database tables (`ai_vendors`, `ai_models`, `ai_prompts`, `tool_model`) with Supabase migrations.
  - Defined corresponding TypeScript types and Zod schemas.
  - Implemented API Route Handlers for CRUD operations on AI Vendors, Models, and Prompts.
  - Implemented Data Access Layer functions in `lib/data/` for these AI entities.
  - Developed UI in `SiteSettingsClient.tsx` for managing AI Models (list, create, edit, delete).
  - Added `tool_model` table and API to map tool names to specific AI models.
- **`snowgander` Integration & AI Tool UI:**
  - Integrated `snowgander` for AI interactions via `lib/data/chat.ts`.
  - Developed `AISidePanel` and `AIToolButton` components for triggering AI tools and displaying responses.
  - Implemented `MarkdownComponent` for rendering AI responses.
- **Outline Feature Refactor & Partial UI Implementation:**
  - Refactored Outline data model: removed `outline_items` table, added fields (`one_page_synopsis`, `outline_description`, `pov_character_id`) to `projects` and `scenes` tables.
  - Implemented `ProjectSynopsisEditor.tsx` for editing project log_line and one_page_synopsis.
  - Implemented `ChapterSceneOutlineList.tsx` to display scenes within chapters for outline view.
  - Implemented `ManageSceneCharactersModal.tsx` and `ManageSceneTagsModal.tsx` for linking characters and tags to scenes within the outline.
  - Added API routes for managing scene-character and scene-tag relationships.
- **Core Application Enhancements:**
  - Established `memory-bank` structure, project brief, system architecture, tech stack docs.
  - Implemented initial Supabase database schema and Auth SSR (`client.ts`, `server.ts`, `middleware.ts`).
  - Developed API Route Handlers and Zod Schemas for core entities (Projects, Chapters, Scenes, Characters, World Notes), including authentication and validation.
  - Implemented a basic authentication flow (login, signup, logout, password reset, update password) and homepage.
  - Created UI components for Manuscript (chapter/scene listing, creation, `ManuscriptEditor` with auto-save, word count), Characters (`CharacterList`, `CreateCharacterModal`, `CharacterCardEditor`), and World Building Notes (`WorldNoteList`, `CreateWorldNoteModal`, `WorldNoteEditor`).
  - Refactored Project Dashboard navigation using `AppShell` and `PrimarySidebar`.
  - Aligned Character Editor with schema and resolved data type mismatches.
  - Refactored Data Access Layer (`lib/data`) to call internal APIs, ensuring cookie forwarding for authenticated server-side requests.
  - Centralized project ownership verification using a guard in `lib/supabase/guards.ts`.
  - Addressed Next.js 15 asynchronous API requirements (`await params`, `await cookies()`).

## Next Steps

The following are the prioritized next steps:

1.  **Complete Outline Feature UI**:
    - [ ] Enhance `ChapterSceneOutlineList.tsx` to allow full editing of scene outline details (description, POV, etc.) directly or via improved modals.
    - [ ] Consider UI for reordering scenes/chapters within the outline view.
    - [ ] Ensure seamless data synchronization between manuscript and outline views.

2.  **Expand AI Service Integration & Features**:
    - [ ] Develop UI in `SiteSettingsClient.tsx` for managing AI Vendors and AI Prompts.
    - [ ] Implement specific AI tools (e.g., Snowflake Outliner, Character Enhancer) using the `AISidePanel`, `AIToolButton`, and `tool_model` pattern.
    - [ ] Develop system prompts for each AI feature and store them in the `ai_prompts` table.
    - [ ] Implement token tracking and usage limits (future consideration for business model).

3.  **Authentication & User Profile Refinements**:
    - [ ] Refine error handling and user feedback for all auth flows using `sonner` for toasts consistently.
    - [ ] Implement a user profile page where users can manage their account details (e.g., update profile info, change password).

4.  **Core UI Components & Manuscript Refinements**:
    - [ ] Continue refinement and expansion of the UI component library.
    - [ ] Improve display of chapter/scene metadata (e.g., scene counts, word counts) in lists.
    - [ ] Consider adding more advanced features to `ManuscriptEditor` (e.g., basic formatting toolbar).

5.  **Testing and Polish**:
    - [ ] Add unit and integration tests for critical components and API routes.
    - [ ] Conduct thorough UI/UX testing and polish.

## Active Decisions and Considerations

- **Typography Selection**: `Inter` and `Cactus_Classical_Serif` have been chosen and integrated. Ongoing assessment for optimal readability and aesthetics.
- **AI Integration Strategy**: The pattern of using `tool_model` to link named tools to specific AI models (via `snowgander`) and presenting them in `AISidePanel` seems to be the chosen direction. System prompts will be key.
- **Editor Experience**: `ManuscriptEditor` provides basic text editing with auto-save and word count. Further enhancements (formatting, collaboration features) are future considerations.

## Important Patterns and Preferences

- **Server Components by Default**: Use React Server Components for all non-interactive UI.
- **Strong TypeScript**: Use explicit typing for all functions, components, and data structures.
- **Component-Driven Development**: Build from small, reusable components up to larger features.
- **Accessibility First**: Build with accessibility in mind from the beginning.
- **API Route Handlers**: Use Next.js Route Handlers for backend logic, secured by middleware and RLS.
- **Zod for Validation**: Enforce data integrity through Zod schemas at the API boundary.
- **Sonner for Notifications**: Utilize `sonner` for user-facing toast notifications.
- **Client-side data fetching within feature components**: Components like `ProjectDashboardClient` fetch their own data using functions from `lib/data/*` which in turn call internal API routes.
- **Asynchronous Dynamic APIs (Next.js 15+):** Ensure `params` and `cookies()` are `await`ed in server-side code.
- **Project Ownership Guard**: Utilize the `verifyProjectOwnership` guard in `lib/supabase/guards.ts`.
- **Internal API Cookie Forwarding**: Explicitly forward cookies for server-to-server API calls.

## Learnings and Project Insights

- The Supabase Auth SSR pattern, with explicit cookie handling, provides robust authentication.
- AI integration requires a flexible data model for vendors, models, and prompts, which has now been established. The `tool_model` mapping is key for abstracting specific model choices for named tools.
- Simplifying the Outline data model by integrating fields directly into `projects` and `scenes` enhances data consistency and aligns better with a unified manuscript/outline vision.
- Centralized data access (`lib/data`) and authorization (`lib/supabase/guards`) improve code maintainability and security.