```
├── app/                    # Next.js App Router structure
│   ├── (auth)/             # Authentication routes (grouped)
│   ├── (dashboard)/        # Dashboard routes (grouped)
│   ├── api/                # API routes
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── auth/               # Auth-specific components
│   ├── editors/            # Manuscript, Character, Note editors
│   ├── homepage/           # Components for the main landing/project list page
│   ├── layouts/            # Layout components (AppShell, Sidebars, etc.)
│   ├── manuscript/         # Chapter/Scene list and creation modals
│   ├── characters/         # Character list and creation modal
│   ├── world-notes/        # World note list and creation/edit components
│   ├── outline/            # Outline specific components
│   ├── ai/                 # AI interaction components (AISidePanel, AIToolButton, AIChatInterface)
│   └── settings/           # Settings page components
├── lib/                    # Shared utilities
│   ├── supabase/           # Supabase client, middleware, guards, database types
│   ├── utils/              # General utilities (cn, countWords, etc.)
│   ├── schemas/            # Zod schemas for validation
│   ├── data/               # Data access layer (functions calling internal APIs)
│   ├── types/              # TypeScript types and interfaces
│   └── fonts.ts            # Font configurations
├── hooks/                  # Custom React hooks (currently empty, placeholder)
├── middleware.ts           # Next.js middleware for auth session handling
└── public/                 # Static assets
```

## Key Technical Decisions

1.  **Server Components by Default**: Using React Server Components for improved performance, SEO, and reduced client-side JavaScript.
2.  **Client Components When Necessary**: Adding `"use client"` directive only for components that require interactivity, hooks, or browser APIs.
3.  **Strong Type System**: Strict TypeScript typing for all components, functions, and data structures, largely inferred from Zod schemas and Supabase types.
4.  **Component-Driven Design**: Building a library of reusable, single-responsibility UI components in `components/ui` and feature-specific components.
5.  **Supabase for Backend Services**: Using Supabase for authentication, PostgreSQL database, and potentially storage.
6.  **AI Integration via `snowgander`**: Utilizing the `snowgander` package for vendor-agnostic AI API connectivity.
7.  **API-Driven Data Layer**: Frontend components (both server and client) interact with internal Next.js API Route Handlers via functions in `lib/data/*`. These API routes then communicate with Supabase.

## Design Patterns

### Component Design Pattern

- Using the **Variant Pattern** with `class-variance-authority` (CVA) for creating flexible, variant-driven UI components (e.g., `Button.tsx`).
- Following the **Single Responsibility Principle** (SRP) for all components.
- Adopting an **Atomic Design**-inspired methodology: `components/ui` for atoms/molecules, feature-specific components for organisms.

### State Management Pattern

- **Server-First State Management**: Keeping as much state as possible on the server, fetched by Server Components or API routes.
- **Local Component State**: Using React's `useState` and `useReducer` for component-specific UI state in Client Components.
- **URL State**: Utilizing URL parameters for managing view states where appropriate (e.g., `projectId`, `activeSection` in dashboard).

### Data Fetching Pattern

- **Server Components**: Direct data fetching in Server Components by calling functions from `lib/data/*` which in turn call internal APIs.
- **Client Components**: Fetching data via functions in `lib/data/*` (which call internal APIs) typically within `useEffect` hooks or triggered by user interactions. `ProjectDashboardClient.tsx` exemplifies this for dynamic content like chapters, scenes, characters, etc.
- **API Routes**: Next.js Route Handlers in `app/api/` serve as the backend, processing requests from `lib/data/*` functions and interacting with Supabase.

### Authentication Pattern

- **Core**: Utilizes Supabase Auth with server-side session handling via `@supabase/ssr` and cookie management.
- **Route Protection**:
  - **Middleware (`middleware.ts`)**: Protects routes by validating user sessions. Unauthenticated users are redirected to `/login`.
  - **API Route Authorization**:
    - All API routes verify the authenticated user via `supabase.auth.getUser()`.
    - Project-specific routes (e.g., `/api/projects/[projectId]/...`) use the `verifyProjectOwnership` guard from `lib/supabase/guards.ts` to ensure the user owns the project before proceeding.
- **Database Level Security (RLS)**: Supabase RLS policies enforce data access rules at the database level, complementing application-level checks.

### Data Management and Validation Patterns

- **Entity-Specific Zod Schemas (`lib/schemas`)**: Each core data entity has a Zod schema for input validation at API boundaries and type inference.
- **Centralized Data Access Layer (`lib/data`)**: Server-side functions in `lib/data/*` abstract API calls, providing a consistent interface for data operations. These functions handle cookie forwarding for authenticated requests to internal APIs.
- **Project Ownership Guard (`lib/supabase/guards.ts`)**: A utility function, `verifyProjectOwnership`, centralizes project access authorization logic.

### AI Configuration Data Model

To support `snowgander` and manage AI settings:

- **`ai_vendors`**: Stores AI API providers (e.g., OpenAI, Anthropic). Key fields: `name`, `api_key_env_var`.
- **`ai_models`**: Stores configurations for specific AI models. Key fields: `vendor_id`, `name`, `api_name`, capabilities (`is_vision`, `is_image_generation`, `is_thinking`), cost/token info.
- **`ai_prompts`**: Stores reusable prompts (global, user-specific, or project-specific). Key fields: `project_id`, `user_id`, `name`, `prompt_text`, `category`. Unique constraint on `(COALESCE(project_id, <UUID_ZERO>), COALESCE(user_id, <UUID_ZERO>), name)`.
- **`tool_model`**: Maps a tool name (e.g., "scene_helper") to a specific `ai_models.id`. Key fields: `name` (unique), `model_id`.
- **RLS**: Generally, authenticated users can read AI configurations. Management (create, update, delete) is typically restricted (e.g., to admins or via specific logic if user-configurable items are introduced), though current RLS for `ai_models` and `tool_model` allows authenticated users all access, which might need refinement. Prompts have more granular user/project ownership RLS.

## Component Relationships

### Core Component Structure (Illustrative)

```mermaid
graph TD
    Layout[Root Layout: app/layout.tsx] --> HomePage[Homepage: app/page.tsx & HomePageClientWrapper]
    Layout --> LoginPage[Login Page: app/(auth)/login/page.tsx]
    Layout --> DashboardLayout[Dashboard Layout: app/(dashboard)/layout.tsx]

    DashboardLayout --> ProjectPage[Project Page: app/(dashboard)/project/[projectId]/page.tsx]
    ProjectPage --> AppShell[AppShell]
    AppShell --> PrimarySidebar[PrimarySidebar]
    AppShell --> AppHeader[AppHeader]
    AppShell --> ProjectDashboardClient[ProjectDashboardClient]

    ProjectDashboardClient --> ManuscriptView
    ManuscriptView --> CreateChapterModal
    ManuscriptView --> CreateSceneModal
    ManuscriptView --> ManuscriptEditor

    ProjectDashboardClient --> OutlineView
    OutlineView --> ProjectSynopsisEditor
    OutlineView --> ChapterSceneOutlineList
    ChapterSceneOutlineList --> ManageSceneCharactersModal
    ChapterSceneOutlineList --> ManageSceneTagsModal

    ProjectDashboardClient --> CharactersView
    CharactersView --> CharacterList
    CharactersView --> CreateCharacterModal
    CharactersView --> CharacterCardEditor

    ProjectDashboardClient --> WorldNotesView
    WorldNotesView --> WorldNoteList
    WorldNotesView --> CreateWorldNoteModal
    WorldNotesView --> WorldNoteEditor

    ProjectDashboardClient --> AISidePanelSection[AI Assistant Section (via AISidePanel)]
    AISidePanelSection --> AISidePanel
    AISidePanel --> AIToolButton
    AISidePanel --> AIChatInterface

    DashboardLayout --> SettingsPage[Settings Page: app/(dashboard)/settings/page.tsx]
    SettingsPage --> SiteSettingsClient[SiteSettingsClient]
    SiteSettingsClient --> SettingsItemList[SettingsItemList for AI Models]
    SiteSettingsClient --> CreateAIModelModal
    SiteSettingsClient --> EditAIModelModal
    SiteSettingsClient --> AlertDialog[AlertDialog for Deletion]

```

### Data Flow

```mermaid
graph TD
    Browser[User Interaction in Client Component] -->|Triggers Action| ClientComponentLogic[Client Component Logic e.g., ProjectDashboardClient]
    ClientComponentLogic -->|Calls lib/data function| LibDataFunction[lib/data/* function]
    LibDataFunction -->|fetch (with cookies)| InternalAPI[app/api/* Route Handler]
    InternalAPI -->|Verifies Auth & Ownership (Guard)| SupabaseGuard[verifyProjectOwnership]
    InternalAPI -->|Validates Input (Zod)| ZodValidation[Zod Schema]
    InternalAPI -->|Database Query (Supabase Client)| SupabaseDB[Supabase Database (PostgreSQL)]
    InternalAPI -->|AI Request (snowgander)| Snowgander[snowgander Lib -> External AI Service]

    SupabaseDB -->|Returns Data| InternalAPI
    Snowgander -->|Returns AI Response| InternalAPI
    InternalAPI -->|JSON Response| LibDataFunction
    LibDataFunction -->|Returns Data/Promise| ClientComponentLogic
    ClientComponentLogic -->|Updates UI State (useState, etc.)| Browser
    
    ServerComponent[Server Component e.g., app/page.tsx] -->|Calls lib/data function| LibDataFunction
    %% Server components can also directly call Supabase client if not using API abstraction
    %% ServerComponent -->|Direct Supabase Query| SupabaseDB
```

## Critical Implementation Paths

### Authentication Flow

1.  User navigates to a page. Middleware (`middleware.ts` using `lib/supabase/middleware.ts`) intercepts.
2.  Session is checked/refreshed using `@supabase/ssr`.
3.  If no valid session and route is protected, redirect to `/login`.
4.  Login/Signup via `AuthForm` component, which calls server actions in `app/(auth)/login/actions.ts`.
5.  Actions interact with Supabase Auth. On success, Supabase sets cookies.
6.  Callback route (`app/(auth)/auth/callback/route.ts`) handles OAuth/email confirmation, exchanges code/token for session.
7.  Logout via POST to `app/(auth)/auth/logout/route.ts`.

### Project Data Interaction (e.g., Editing a Scene)

1.  User types in `ManuscriptEditor` (Client Component within `ProjectDashboardClient`).
2.  Debounced `handleSaveSceneContent` in `ProjectDashboardClient` is triggered.
3.  `handleSaveSceneContent` calls `fetch` to the PUT endpoint: `/api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]`.
4.  The API route handler:
    a.  Verifies user authentication.
    b.  Uses `verifyProjectOwnership` guard to check project access.
    c.  Validates request body with `updateSceneSchema` (Zod).
    d.  Updates the scene in Supabase database.
    e.  Returns the updated scene data.
5.  `ProjectDashboardClient` updates its local state with the new scene data, re-rendering `ManuscriptEditor`.

### AI Tool Usage

1.  User clicks an `AIToolButton` within `AISidePanel`.
2.  `AIToolButton` calls `chat` function from `lib/data/chat.ts`, passing model ID, prompt, system prompt.
3.  `lib/data/chat.ts`:
    a.  Fetches `AIModel` and `AIVendor` details.
    b.  Creates `ModelConfig` for `snowgander`.
    c.  Gets `AIVendorAdapter` from `AIVendorFactory`.
    d.  Calls `adapter.sendChat()` with current chat context.
4.  `snowgander` handles the call to the external AI service.
5.  Response is returned to `AIToolButton`, then to `AISidePanel`, which updates its state to display the response (e.g., using `MarkdownComponent`).