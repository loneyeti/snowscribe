# Technical Context

## Technology Stack

Snowscribe is built with a modern frontend-focused stack:

| Technology       | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| **Next.js 15+**  | React framework with server components         |
| **TypeScript**   | Static typing for JavaScript                   |
| **Tailwind CSS** | Utility-first CSS framework                    |
| **Supabase**     | Backend as a Service (auth, database, storage) |
| **Fly.io**       | Application hosting                            |
| **Docker**       | Containerization                               |
| **Zod**          | Form validation                                |
| **snowgander**   | In-house package for AI API connectivity       |
| **sonner**       | Toast notifications                            |

## Shared Types Definition

A central file `lib/types/index.ts` defines shared TypeScript interfaces for data structures used throughout the application, derived from Supabase table schemas and UI requirements. This ensures type consistency between the frontend and backend.

The content of `lib/types/index.ts` includes interfaces such as `Project`, `Genre`, `Profile`, `Chapter`, `Scene`, `SceneTag`, `SceneAppliedTag`, `Character`, `SceneCharacter`, `WorldBuildingNote`, `OutlineItem`, and `AIInteraction`.

## `lib/schemas` Directory Pattern

The `lib/schemas/` directory houses Zod schema definitions for the application's core data entities.

- **Pattern**: Each primary data entity (e.g., `Project`, `Chapter`, `Scene`) has its own dedicated schema file (e.g., `lib/schemas/project.schema.ts`, `lib/schemas/chapter.schema.ts`).
- **Purpose**:
  - **API Input Validation**: These schemas are primarily used in API Route Handlers to validate incoming request bodies, ensuring data integrity before database operations.
  - **Type Inference**: Zod schemas allow for easy inference of TypeScript types (e.g., `z.infer<typeof projectSchema>`). These inferred types can be used for form values, function parameters, and other client-side or server-side logic, ensuring consistency with the validation rules.
  - **Centralized Validation Logic**: Consolidates validation rules in one place, making them easier to manage and update.

## `lib/data` Directory Pattern

The `lib/data/` directory contains server-side functions responsible for data fetching and manipulation, acting as a dedicated data access layer.

- **Pattern**: Files within this directory (e.g., `lib/data/projects.ts`, `lib/data/chapters.ts`) export asynchronous functions that interact directly with the Supabase client to perform CRUD operations or complex queries.
- **Purpose**:
  - **Centralized Data Access**: Abstracts the direct Supabase calls, providing a clear and reusable API for accessing data.
  - **Reusability**: These functions can be imported and used by React Server Components for server-side data fetching, as well as by API Route Handlers to fulfill client requests.
  - **Separation of Concerns**: Keeps data fetching logic separate from UI components and API route handling logic, improving code organization and maintainability.
  - **Server-Side Logic**: Ensures that direct database interactions are handled securely on the server.

## Development Setup

### Required Tools

- Node.js 20+
- npm/pnpm
- Git
- Docker (for local development and production builds)
- Supabase CLI (for local development)

### Environment Variables

```
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Services (via snowgander)
AI_API_KEY=your-openai-api-key
AI_PROVIDER=openai
```

## Technical Constraints

### Supabase Auth SSR

Snowscribe must use the latest Supabase Auth SSR pattern with specific implementation requirements:

1. Use `@supabase/ssr` package (not the deprecated `auth-helpers-nextjs`)
2. Implement cookie handling with `getAll()` and `setAll()` methods (never use individual `get`/`set`/`remove` methods)
3. Create separate browser and server clients
4. Configure proper middleware for session refresh

### Mobile Responsiveness

- All UI components must be fully responsive
- Complex layouts must adapt gracefully to smaller screen sizes
- Touch-friendly interactions for mobile users

### Accessibility Requirements

- Comply with WCAG 2.1 AA standards
- Properly structured semantic HTML
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios

## Dependencies and Tooling

This section details the project's key dependencies and development tools, as defined in `package.json`.

### Core Dependencies (`dependencies`)

| Package                         | Version    | Purpose                                                                    |
| ------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `@radix-ui/react-dropdown-menu` | `^2.1.14`  | Unstyled, accessible dropdown menu primitive for UI components.            |
| `@radix-ui/react-separator`     | `^1.1.6`   | Unstyled, accessible separator primitive for UI components.                |
| `@radix-ui/react-slot`          | `^1.2.2`   | Utility to compose component props, often used with `asChild`.             |
| `@radix-ui/react-tooltip`       | `^1.2.6`   | Unstyled, accessible tooltip primitive for UI components.                  |
| `@supabase/ssr`                 | `^0.6.1`   | Supabase helpers for Server-Side Rendering in Next.js ( crucial for auth). |
| `@supabase/supabase-js`         | `^2.49.4`  | Official Supabase JavaScript client library.                               |
| `class-variance-authority`      | `^0.7.1`   | Library for creating type-safe, variant-driven UI components (CVA).        |
| `clsx`                          | `^2.1.1`   | Utility for constructing `className` strings conditionally.                |
| `lucide-react`                  | `^0.509.0` | Library of simply beautiful open-source icons.                             |
| `next`                          | `15.3.2`   | The React framework for production (App Router, SSR, etc.).                |
| `react`                         | `^19.0.0`  | JavaScript library for building user interfaces.                           |
| `react-dom`                     | `^19.0.0`  | Serves as the entry point to the DOM and server renderers for React.       |
| `snowgander`                    | `^0.0.36`  | In-house package for vendor-agnostic AI API connectivity.                  |
| `sonner`                        | `^2.0.3`   | An opinionated toast component for React.                                  |
| `tailwind-merge`                | `^2.6.0`   | Utility to merge Tailwind CSS classes without style conflicts.             |
| `zod`                           | `^3.24.4`  | TypeScript-first schema declaration and validation library.                |

### Development Dependencies (`devDependencies`)

| Package                | Version  | Purpose                                                 |
| ---------------------- | -------- | ------------------------------------------------------- |
| `@eslint/eslintrc`     | `^3`     | ESLint configuration utilities.                         |
| `@tailwindcss/postcss` | `^4`     | PostCSS plugin for Tailwind CSS.                        |
| `@types/node`          | `^20`    | TypeScript definitions for Node.js.                     |
| `@types/react`         | `^19`    | TypeScript definitions for React.                       |
| `@types/react-dom`     | `^19`    | TypeScript definitions for React DOM.                   |
| `eslint`               | `^9`     | Pluggable linting utility for JavaScript and JSX.       |
| `eslint-config-next`   | `15.3.2` | ESLint configuration for Next.js projects.              |
| `tailwindcss`          | `^4`     | A utility-first CSS framework for rapid UI development. |
| `typescript`           | `^5`     | Superset of JavaScript that adds static types.          |

### Internal Packages

- **snowgander (`^0.0.36`)**: As listed in dependencies, this is our in-house package for vendor-agnostic AI API connectivity. It provides:
  - Unified API for multiple AI providers
  - Token usage tracking
  - Rate limiting
  - System prompt management
  - Context window optimization

## Tool Usage Patterns

### Supabase Usage

```typescript
// Browser client (for client components)
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client (for server components and API routes)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

### Tailwind CSS with CVA

```typescript
// Button.tsx
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Server Component Data Fetching

```typescript
// app/projects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    // Handle error state
  }

  return (
    <div>
      <h1>{project.title}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

### Zod Validation

```typescript
import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  genre: z.string().min(1, "Genre is required"),
  targetWordCount: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
```

### Server-Side Internal API Calls

When data-fetching functions residing on the server (e.g., in `lib/data/*` which are often called by Server Components) need to call internal API routes (e.g., in `app/api/*`), it's crucial to ensure proper authentication context is passed.

**Pattern**:
Next.js's built-in `fetch` on the server-side does not reliably or automatically forward cookies from the original incoming request to these internal API calls. To ensure the internal API route can authenticate the user via middleware:

1. Import `cookies` from `next/headers` in the server-side data-fetching function.
2. Retrieve all cookies: `const cookieStore = await cookies();`
3. Format them into a `Cookie` header string: `const cookieHeader = cookieStore.getAll().map(cookie => \`\${cookie.name}=\${cookie.value}\`).join('; ');`
4. Explicitly include this `cookieHeader` in the `headers` option of the `fetch` call:
   ```typescript
   const response = await fetch(apiUrl, {
     method: "GET", // or other methods
     headers: {
       "Content-Type": "application/json",
       ...(cookieHeader && { Cookie: cookieHeader }), // Important: pass the cookies
     },
   });
   ```

**Rationale**:
This explicit forwarding of cookies ensures that the middleware protecting the internal API route receives the necessary authentication tokens to validate the user's session, preventing erroneous unauthenticated errors or redirects for these server-to-server requests. This was identified as a fix for issues where internal API calls were being redirected to login despite the calling Server Component having a valid user session.
