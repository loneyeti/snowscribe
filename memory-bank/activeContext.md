# Active Context

## Current Work Focus

_(Updated: 2025-05-10)_

The primary focus has been on completing the manuscript editor integration within the project dashboard.

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

## Next Steps

The following are the prioritized next steps:

1.  **Manuscript Editor Integration**:

    - [x] Integrate the user-provided `components/editors/ManuscriptEditor.tsx` into the scene view within the project dashboard.
    - [x] Connect the editor to scene data API endpoints (fetch and save scene content for `selectedScene`).
    - [x] Ensure word count tracking display is functional and updates in real-time based on editor content.

2.  **Project Dashboard & Navigation**:

    - [ ] Fully implement navigation between different sections of a project (Manuscript, Outline, Characters, etc.) using `AppShell` and `PrimarySidebar` within `app/(dashboard)/layout.tsx`. The `handleSectionChange` function in `ProjectDashboardClient.tsx` needs to be connected to the sidebar.

3.  **Authentication UI Refinements**:

    - [ ] Refine error handling and user feedback for all auth flows (login, signup, password reset) using `sonner` for toasts.

4.  **API for Relationships**:

    - [ ] Implement API endpoints for managing Scene Tags (applying/removing tags to scenes).
    - [ ] Implement API endpoints for Scene Characters (linking/unlinking characters to scenes).

5.  **Core UI Components**:
    - Continue refinement and expansion of the UI component library as new features are developed.
    - Improve display of chapter/scene metadata (e.g., scene counts, word counts) in lists.

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
