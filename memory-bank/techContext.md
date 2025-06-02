## Core Technology Stack

| Technology                  | Version (approx.)  | Purpose                                                           |
| --------------------------- | ------------------ | ----------------------------------------------------------------- |
| Next.js                     | 15.3.2             | React framework (App Router, Server/Client Components)            |
| React                       | 19.0.0             | UI library                                                        |
| TypeScript                  | 5.x                | Static typing                                                     |
| Tailwind CSS                | 4.1.x              | Utility-first CSS framework                                       |
| Supabase                    | (JS Client 2.49.x) | BaaS (PostgreSQL DB, Auth, Storage)                               |
| `snowgander`                | 0.0.37             | In-house AI vendor/model abstraction library                      |
| Zod                         | 3.24.x             | Schema declaration & validation                                   |
| React Hook Form             | 7.56.x             | Form management                                                   |
| Lucide Icons                | 0.509.x            | Icon library                                                      |
| Radix UI Primitives         | various            | Base for accessible UI components (Dropdown, AlertDialog, etc.)   |
| React Markdown / Remark GFM | 10.x / 4.x         | Markdown rendering                                                |
| `sonner`                    | 2.0.x              | Toast notifications                                               |
| Docker                      | -                  | Containerization (Planned for local dev consistency & production) |
| Fly.io                      | -                  | Application hosting (Planned)                                     |

## Key Directories & Their Roles

- **`lib/types/`**:
  - `index.ts`: Defines shared TypeScript interfaces for core data structures (Project, Chapter, Scene, Character, etc.), largely derived from Supabase schema (`database.types.ts`) and application needs.
  - `ai.ts`: Defines types specific to AI interactions and data structures (e.g., `AIMessage`, `ParsedOutlineData`).
  - Includes `PrimarySceneCategory` ENUM definition and related types for the two-tiered scene tagging system.
- **`lib/schemas/`**: Contains Zod schema definitions for all major data entities (e.g., `project.schema.ts`, `scene.schema.ts`, `aiModel.schema.ts`). Used for:
  - API input validation in Route Handlers.
  - Type inference throughout the application.
  - Client-side form validation with React Hook Form.
- **`lib/data/`**: Acts as the data access layer. Exports async functions that encapsulate `fetch` calls to internal API Route Handlers (`app/api/`). This abstracts data operations for both Server and Client Components and handles cookie forwarding for authentication.
- **`lib/ai/`**: Houses the core logic for AI feature integration.
  - `AISMessageHandler.ts`: Central point for processing AI tool requests, formatting context, selecting models/prompts, and calling `snowgander`.
  - `outlineCreator.ts`: Logic for the AI-powered Outline Creator feature, including AI interaction, JSON parsing, and entity creation.
  - `contextFormatters.ts`: Functions to prepare and format project-specific data (manuscript, outline, characters) as context for AI models.
  - `constants.ts`: Defines AI tool names (`AI_TOOL_NAMES`) and related constants.
- **`supabase/migrations/`**: Contains SQL migration files defining the database schema, including tables, RLS policies, enums (like `primary_scene_category_enum`), and triggers.
- **`supabase/seed.sql`**: Seeds initial data, particularly for `genres`, `ai_vendors`, `ai_models`, global `scene_tags`, `ai_prompts`, and `tool_model` mappings.

## AI Configuration & Management

- **`ai_vendors` Table:** Stores AI providers (e.g., OpenAI, Anthropic).
- **`ai_models` Table:** Configures specific AI models, linking to vendors, defining capabilities and costs.
- **`ai_prompts` Table:** Stores reusable system prompts, categorized and potentially scoped (global, user, project).
- **`tool_model` Table:** Maps functional tool names (e.g., `log_line_generator`, `outline_json_generator`) to specific `ai_models.id`. This allows flexible backend model selection for tools.
- **`AISMessageHandler.ts`:** Dynamically loads model, vendor, and prompt configurations based on the requested `toolName`.
- **Settings UI (`SiteSettingsClient.tsx`):** Provides an interface for managing AI Vendors, Models, and Prompts.

## Authentication

- Utilizes `@supabase/ssr` for server-side authentication and session management with Next.js App Router.
- Browser client: `lib/supabase/client.ts`.
- Server client: `lib/supabase/server.ts` (handles cookies for Server Components/Actions).
- Middleware (`middleware.ts` using `lib/supabase/middleware.ts`): Refreshes sessions and protects routes.
- API routes verify auth and use `verifyProjectOwnership` (`lib/supabase/guards.ts`) for project-specific resource access.

## Key Dependencies (from `package.json`)

- `@supabase/ssr`, `@supabase/supabase-js`: Supabase integration.
- `next`: Framework core.
- `react`, `react-dom`: UI library.
- `typescript`: Language.
- `tailwindcss`: Styling.
- `zod`: Validation.
- `snowgander`: AI abstraction.
- `react-hook-form`, `@hookform/resolvers`: Form handling.
- `lucide-react`: Icons.
- `radix-ui/*`: UI primitives.
- `react-markdown`, `remark-gfm`: Markdown.
- `sonner`: Notifications.
- `class-variance-authority`, `clsx`, `tailwind-merge`: Styling utilities.

## Development Setup

- Node.js 20+, npm/pnpm/yarn, Git.
- Supabase CLI for local development and schema migrations.
- Environment variables (see original `techContext.md` for examples like `NEXT_PUBLIC_SUPABASE_URL`, `OPENAI_API_KEY`, etc.).
