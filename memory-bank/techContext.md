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

## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "snowgander": "^1.0.0",
    "sonner": "^1.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss": "^3.3.0",
    "tailwindcss-animate": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Internal Packages

- **snowgander**: Vendor-agnostic AI API connectivity package that provides:
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
