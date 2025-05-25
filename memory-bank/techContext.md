# Technical Context

## Technology Stack

Snowscribe is built with a modern frontend-focused stack:

| Technology                      | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| **Next.js 15.3.2**              | React framework with server components                             |
| **React 19**                    | JavaScript library for building user interfaces                    |
| **TypeScript**                  | Static typing for JavaScript                                       |
| **Tailwind CSS 4**              | Utility-first CSS framework                                        |
| **Supabase**                    | Backend as a Service (auth, database, storage)                     |
| **Fly.io**                      | Application hosting (Planned)                                      |
| **Docker**                      | Containerization (Planned)                                         |
| **Zod**                         | Schema declaration and validation                                  |
| **snowgander (^0.0.36)**        | In-house package for vendor-agnostic AI API connectivity           |
| **sonner**                      | Toast notifications                                                |
| **React Hook Form**             | Form management and validation integration                         |
| **Lucide Icons**                | Icon library                                                       |
| **Radix UI Primitives**         | Base for accessible UI components (Dropdown, Tooltip, Separator, AlertDialog) |
| **React Markdown / Remark GFM** | For rendering Markdown content (e.g., AI responses, note editors)  |
| **React Syntax Highlighter**    | For syntax highlighting in Markdown code blocks                    |


## Shared Types Definition

A central file `lib/types/index.ts` defines shared TypeScript interfaces for data structures used throughout the application, derived from Supabase table schemas and UI requirements. This ensures type consistency between the frontend and backend.

The content of `lib/types/index.ts` includes interfaces such as `Project`, `Genre`, `Profile`, `Chapter`, `Scene`, `SceneTag`, `SceneAppliedTag`, `Character`, `SceneCharacter`, `WorldBuildingNote`, `AIInteraction`, `AIVendor`, `AIModel`, and `AIPrompt`.

## `lib/schemas` Directory Pattern

The `lib/schemas/` directory houses Zod schema definitions for the application's core data entities.

- **Pattern**: Each primary data entity (e.g., `Project`, `Chapter`, `Scene`, `Character`, `WorldBuildingNote`, `AIVendor`, `AIModel`, `AIPrompt`, `ToolModel`) has its own dedicated schema file.
- **Purpose**:
  - **API Input Validation**: Used in API Route Handlers to validate incoming request bodies.
  - **Type Inference**: Zod schemas allow for easy inference of TypeScript types.
  - **Centralized Validation Logic**: Consolidates validation rules.
  - **Form Validation**: Used with `React Hook Form` (via `@hookform/resolvers/zod`) for client-side form validation.

## `lib/data` Directory Pattern

The `lib/data/` directory contains server-side functions responsible for data fetching and manipulation, acting as a dedicated data access layer.

- **Pattern**: Files within this directory (e.g., `projects.ts`, `chapters.ts`, `aiModels.ts`) export asynchronous functions. These functions typically make `fetch` calls to internal API Route Handlers located in `app/api/`.
- **Purpose**:
  - **API Abstraction**: Abstracts the direct `fetch` calls to internal APIs, providing a cleaner interface for Server Components and other server-side logic.
  - **Reusability**: These functions are used by React Server Components and can also be used by other server-side modules if needed.
  - **Separation of Concerns**: Keeps data fetching/mutation logic separate from UI components.
  - **Server-Side Logic**: Ensures that interactions with the backend APIs are handled on the server where appropriate.
  - **Cookie Forwarding**: Implements logic to forward authentication cookies for internal API calls.

## Development Setup

### Required Tools

- Node.js 20+
- npm/pnpm/yarn
- Git
- Docker (for local development and production builds - Planned)
- Supabase CLI (for local development and migrations)

### Environment Variables (Example)

```
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key # For admin tasks, migrations

# AI Services (for snowgander, specific keys depend on vendor)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
# etc.
```

## Technical Constraints

### Supabase Auth SSR

- Uses `@supabase/ssr` package.
- Implements cookie handling with `getAll()` and `setAll()` methods.
- Separate browser (`lib/supabase/client.ts`) and server (`lib/supabase/server.ts`) clients.
- Middleware (`middleware.ts` and `lib/supabase/middleware.ts`) for session refresh and route protection.

### Mobile Responsiveness

- UI components designed with responsiveness in mind using Tailwind CSS.
- Ongoing effort to ensure usability across screen sizes.

### Accessibility Requirements

- Adherence to WCAG 2.1 AA standards is a goal.
- Use of semantic HTML and ARIA attributes where appropriate.
- Keyboard navigation and screen reader compatibility are considerations.

## Dependencies and Tooling

This section details the project's key dependencies and development tools, as defined in `package.json`.

### Core Dependencies (`dependencies`)

| Package                         | Version    | Purpose                                                                    |
| ------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `@hookform/resolvers`           | `^5.0.1`   | Zod resolver for React Hook Form.                                          |
| `@radix-ui/react-alert-dialog`  | `^1.1.13`  | Unstyled, accessible alert dialog primitive.                               |
| `@radix-ui/react-dropdown-menu` | `^2.1.14`  | Unstyled, accessible dropdown menu primitive.                              |
| `@radix-ui/react-separator`     | `^1.1.6`   | Unstyled, accessible separator primitive.                                  |
| `@radix-ui/react-slot`          | `^1.2.2`   | Utility to compose component props.                                        |
| `@radix-ui/react-tooltip`       | `^1.2.6`   | Unstyled, accessible tooltip primitive.                                    |
| `@supabase/ssr`                 | `^0.6.1`   | Supabase helpers for Server-Side Rendering in Next.js.                     |
| `@supabase/supabase-js`         | `^2.49.4`  | Official Supabase JavaScript client library.                               |
| `class-variance-authority`      | `^0.7.1`   | Library for creating type-safe, variant-driven UI components (CVA).        |
| `clsx`                          | `^2.1.1`   | Utility for constructing `className` strings conditionally.                |
| `lucide-react`                  | `^0.509.0` | Library of open-source icons.                                              |
| `next`                          | `15.3.2`   | The React framework for production.                                        |
| `react`                         | `^19.0.0`  | JavaScript library for building user interfaces.                           |
| `react-dom`                     | `^19.0.0`  | Entry point to the DOM and server renderers for React.                     |
| `react-hook-form`               | `^7.56.3`  | Performant, flexible and extensible forms with easy-to-use validation.     |
| `react-markdown`                | `^10.1.0`  | React component to render Markdown.                                        |
| `remark-gfm`                    | `^4.0.1`   | Remark plugin for GitHub Flavored Markdown.                                |
| `snowgander`                    | `^0.0.36`  | In-house package for vendor-agnostic AI API connectivity.                  |
| `sonner`                        | `^2.0.3`   | Opinionated toast component for React.                                     |
| `tailwind-merge`                | `^2.6.0`   | Utility to merge Tailwind CSS classes without style conflicts.             |
| `zod`                           | `^3.24.4`  | TypeScript-first schema declaration and validation library.                |

### Development Dependencies (`devDependencies`)

| Package                        | Version    | Purpose                                                         |
| ------------------------------ | ---------- | --------------------------------------------------------------- |
| `@eslint/eslintrc`             | `^3`       | ESLint configuration utilities.                                 |
| `@tailwindcss/forms`           | `^0.5.10`  | Tailwind CSS plugin for basic form styling.                     |
| `@tailwindcss/postcss`         | `^4`       | PostCSS plugin for Tailwind CSS.                                |
| `@tailwindcss/typography`      | `^0.5.16`  | Tailwind CSS plugin for beautiful typographic defaults.         |
| `@types/node`                  | `^20`      | TypeScript definitions for Node.js.                             |
| `@types/react`                 | `^19`      | TypeScript definitions for React.                               |
| `@types/react-dom`             | `^19`      | TypeScript definitions for React DOM.                           |
| `@types/react-syntax-highlighter`| `^15.5.13` | TypeScript definitions for react-syntax-highlighter.            |
| `eslint`                       | `^9`       | Pluggable linting utility for JavaScript and JSX.               |
| `eslint-config-next`           | `15.3.2`   | ESLint configuration for Next.js projects.                      |
| `react-syntax-highlighter`     | `^15.6.1`  | Syntax highlighting component for React, used with Markdown.    |
| `tailwindcss`                  | `^4`       | A utility-first CSS framework for rapid UI development.         |
| `typescript`                   | `^5`       | Superset of JavaScript that adds static types.                  |


### Internal Packages

- **snowgander (`^0.0.36`)**: As listed in dependencies, this is our in-house package for vendor-agnostic AI API connectivity. It provides:
  - Unified API for multiple AI providers (OpenAI, Anthropic, Google, OpenRouter currently have API key env vars).
  - Token usage tracking (planned/potential).
  - Rate limiting (planned/potential).
  - System prompt management abstraction (model configuration can include prompts).
  - Context window optimization (planned/potential).

## Tool Usage Patterns

### Supabase Usage

- Browser client (`lib/supabase/client.ts`): For client-side components.
- Server client (`lib/supabase/server.ts`): For Server Components and API Routes, using cookie store.

### Tailwind CSS with CVA

- UI components (`components/ui/*`) extensively use `class-variance-authority` for defining variants (e.g., `Button.tsx`, `Heading.tsx`).
- `cn` utility (`lib/utils.ts`) combines `clsx` and `tailwind-merge` for conditional and clean class names.

### Server Component Data Fetching

- Server Components (e.g., `app/page.tsx`, `app/(dashboard)/project/[projectId]/page.tsx`) fetch data by calling async functions from `lib/data/*`. These functions, in turn, make `fetch` requests to internal API routes.

```typescript
// Example: app/(dashboard)/project/[projectId]/page.tsx
import { getProjectById } from "@/lib/data/projects";

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId);
  // ... use project data
}
```

### Zod Validation

- Schemas in `lib/schemas/*` are used:
  - In API Route Handlers for validating request bodies.
  - With `React Hook Form` (via `@hookform/resolvers/zod`) for client-side form validation in modals (e.g., `CreateProjectModal.tsx`, `CreateAIModelModal.tsx`).

### Server-Side Internal API Calls & Cookie Forwarding

- Functions in `lib/data/*` make `fetch` requests to internal API routes (`app/api/*`).
- Authentication cookies are explicitly read using `cookies()` from `next/headers` and forwarded in the `Cookie` header of these `fetch` requests to ensure authenticated context.

### Authorization Utilities (`lib/supabase/guards.ts`)

- **`verifyProjectOwnership` Guard**: Used in project-specific API routes to check if the authenticated user owns the project before allowing operations.