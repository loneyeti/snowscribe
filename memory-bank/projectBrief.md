Snowscribe is a Novelwriting app. The elevator pitch is:

A novelwriting app that leverages AI throughout the process for brainstorming, outlining, editing, researching, identifying plot holes, coaching, and plot development. AI is never used for the final text, though.

The idea is that AI is such a great tool for all of the above, but too many current tools are based around using AI in the entire loop. My belief is that humans still need to be the ones writing while utilizing AI help them write the best novel they can.

## Basic Features

- Beautiful typography
- Clean, intuituve interface
- AI features that can be called from anywhere but also can fade into the background
- Great organization:
  - Chapters that hold scenes. Scenes hold the actual manuscript text
  - Character cards that holds information about the characters
  - World building/research notes that can hold information about the world of the novel itself
  - Outlining tool to help the user outline the novel using the snowflake method
  - As mentioned, AI will be integrated into all parts, but there will also be a specific AI tools section to use AI tools that do not fit in other parts of the interface.
  - Project infomation that includes title, genre and total word count, along with a target total word count goal.
- Scenes can be tagged with what kind of scene it is (todo: look into the various "scene type" frameworks and pick one, or allow the user to choose between a couple, or create a new scene type framework)
- Scenes will also report what characters appear in them so a user will be able to filter to just a certain character's scenes.
- We can do filtering around scene types and characters and also reporting (ie: John Doe appears in 20 scenes that equal 20,000 words, while Jane Doe only appears in 10 scenes that equal 12,000 words).

## AI Features

- Snowflake method outline assistant.
  - Helps the user outline their novel. Goes from the initial summary of the novel and keeps asking questions until they have a full outline. Can also help refine an existing outline or take rough notes and attempt to create an outline based on those notes.
- Character enhancer
  - Helps the user refine their characters. Help them name them. Help them create backstory. It does this by asking a lot of questions to help the writer flesh out the characters themselves. For example: instead of just deciding that a character lost their parents when they were a kid, the AI asks the writer what the character's childhood was like and what their parents were like. The AI helps keep the descriptions concise but useful.
- Research assistant
  - Helps the user research different topics, talk about different ways the world can work, helps with scientific questions, and helps compile everything into a world building "bible".
- Plot assistant
  - Helps identify plot holes in either the Outline stage or the manuscript stage. Takes a critical eye to the text to ask questions about character motivations, inconsistancies, etc.
  - Tries to assist the user to get out of "plot jams" when they write themselves into a corner, offering unique ideas on how to continue the plot.
  - Helps with plot in general, giving writers ideas on how they can make the plot more engaging, emotional, raise the stakes, etc.
- Writing coach
  - Gives the user feedback on their writing in general. How is the prose? Is it marketable? What are some areas they could look to improve?
  - The coach is helpful and positive but not sycophantic. It can give the writer hard truths when it needs to.
- Editor
  - Helps writers tighten up prose, offers suggestions
  - This assistant needs to walk the fine line of helping the writer with their own writing and not just do the writing for the writer

## Homepage UI/UX Detail

The main homepage will simply be a list of projects and a way to create a new project. There should also be a way to access Profile/Account page and the ability to login, logout and sign up.

## Main App Dashboard UI/UX Detail

The main project screen will be laid out like this:

### Top Header

- Project name
- Genre
- Work count progress bar
- Other info (number of chapters/scenes and potentially other info as we think of it)

### Navigation Sidebar

- Manuscript
- Outline
- Characters
- World Building Notes
- AI Assistant
- Settings
- Export (exports as manuscript format)

### Middle Column

- Manuscript:
  - Chapters that drill down into scenes with animation
- Outline
  - (Unclear. We need to think about how outlines work more)
- Characters:
  - List of characters
- World Building Notes
  - List of notes
- AI Assistant
  - List of AI tools
- Settings
  - List of settings topics (ie: appearance, AI settings, advanced options)

### Main Detail Column

- Manuscript
  - The scene editor where the user actually types the novel
- Outline:
  - (Unclear. We need to think about how outlines work more)
- Characters
  - A character "card" which is some sort of form that organizes the character notes. Potentially with a spot for images
- World Building Notes
  - Normal text (potentially markdown as well?) that can possibly share code with the scene editor
- AI Assistant
  - A ChatGPT like chat interface for interacting with the AI tool
- Settings
  - Settings form for the selected category

## Technology Stack

- **NextJS 15+** - React framework with server components
- **TypeScript** - Static typing for JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (auth, database, storage)
- **Fly.io** - Application hosting
- **Docker** - Containerization
- **Zod** - Form validation
- **snowgander** - Inhouse npm package for vendor agnostic AI API connectivity.

## Design Principals

- Typography is king.
- Use the most modern UI/UX principals that exist.
- The app needs to look and feel polished.
- Clean interface that isn't too cluttered.
- Mobile responsiveness is absolutely required
- Should follow all modern accessibility web principles

## Business Model

The business model is mostly out of the scope of this document, but here are the basics:

- Freemium subscription model that gives all non-AI features for free and offers a small amount of AI credits for trial.
- Monthly and annual subscriptions for full access.
- Paid plans give generous AI access but will have a limit to prevent user use costs from outpacing income.

## AI Principals

- A large focus will be on creating strong system prompts for AI models
- Should give users a choice in AI models. `snowgander` makes this easy.
- We need to be able to track AI costs internally and the ability to limit user AI usage based in on their subscription plan and their usage.

## Coding Principals

## Tech Stack Overview

This document outlines the architecture, coding standards, and best practices for our SaaS application built with:

- **NextJS 15+** - React framework with server components
- **TypeScript** - Static typing for JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (auth, database, storage)
- **Fly.io** - Application hosting
- **Docker** - Containerization
- **Zod** - Form validation

## Project Structure

```
├── app/                    # Next.js App Router structure
│   ├── (auth)/             # Authentication routes (grouped)
│   ├── (dashboard)/        # Dashboard routes (grouped)
│   ├── api/                # API routes
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form-related components
│   ├── layouts/            # Layout components
│   └── [feature]/          # Feature-specific components
├── lib/                    # Shared utilities
│   ├── supabase/           # Supabase client and helpers
│   ├── utils/              # General utilities
│   └── types/              # TypeScript types and interfaces
├── hooks/                  # Custom React hooks
├── middleware.ts           # Next.js middleware
├── public/                 # Static assets
├── styles/                 # Additional styling
├── tests/                  # Test files
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── Dockerfile              # Docker configuration
```

## Coding Standards

### TypeScript Best Practices

```typescript
// DO: Use explicit typing for function parameters and return values
function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

// DON'T: Rely on type inference for complex functions
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

// DO: Create interfaces/types for component props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
}

// DO: Use type guards for runtime type checking
function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === "object" && "errorCode" in obj;
}
```

### NextJS Patterns

- **Server Components**: Use React Server Components by default for improved performance and SEO
- **Client Components**: Add `"use client"` directive only when needed (interactivity, hooks, browser APIs)
- **Route Handlers**: Implement API endpoints with Next.js route handlers in the app/api directory
- **Data Fetching**: Utilize React Server Components for data fetching where possible

```typescript
// app/users/page.tsx - Server Component
export default async function UsersPage() {
  // Server-side data fetching - no useEffect needed
  const users = await fetchUsers();

  return (
    <main>
      <h1>Users</h1>
      <UserList users={users} />
    </main>
  );
}
```

## Component Design

### Reusable Components

Create small, focused components that follow the Single Responsibility Principle:

```typescript
// components/ui/Button.tsx
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### SOLID Principles

- **S**ingle Responsibility: Each component should do one thing well
- **O**pen/Closed: Components should be open for extension, closed for modification
- **L**iskov Substitution: Parent components should work with any child component
- **I**nterface Segregation: Create specific, focused prop interfaces rather than large generic ones
- **D**ependency Inversion: Depend on abstractions rather than concrete implementations

### DRY (Don't Repeat Yourself)

Extract repeated logic into:

- Custom hooks for shared stateful logic
- Utility functions for common operations
- Higher-order components for cross-cutting concerns
- Context providers for shared state

## Code Documentation

### The Documentation Sweet Spot

```typescript
/**
 * Authenticates a user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns User session information or error
 */
export async function loginUser(
  email: string,
  password: string
): Promise<Session | AuthError> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error("Login failed:", error);
    return error as AuthError;
  }
}

// DON'T over-document what's obvious
function addTwoNumbers(a: number, b: number): number {
  // This function adds two numbers and returns the result
  return a + b; // Add a and b together
}
```

### Documentation Guidelines

- Document **why**, not **what** when the code isn't self-explanatory
- Create comprehensive JSDoc comments for public APIs and functions
- Use descriptive variable and function names that explain their purpose
- Maintain README files for major modules explaining usage and examples

## Error Handling

### Client-Side Error Handling

```typescript
// components/forms/SubmitForm.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

export function SubmitForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "An unknown error occurred");
      }

      toast.success("Form submitted successfully");
      // Reset form or redirect
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Form JSX
}
```

### Server-Side Error Handling

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

// Input validation schema
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "user", "editor"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    // Validate input
    const result = userSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    // Process valid data
    const user = result.data;
    // ... save to database

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Security Best Practices

1. **Input Validation**: Use Zod or similar for schema validation
2. **Authentication**: Implement proper session management with Supabase Auth
3. **API Protection**: Secure API routes with proper middleware authentication checks
4. **Environment Variables**: Never expose sensitive keys in client-side code
5. **CSRF Protection**: Utilize Next.js built-in CSRF protection
6. **Content Security Policy**: Configure appropriate CSP headers
7. **Rate Limiting**: Implement rate limiting for API endpoints

## Testing Strategy

```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies disabled attribute correctly", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

## Tailwind CSS Usage

```tsx
// DO: Use consistent spacing, colors and typography from theme
<div className="p-4 text-gray-800 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">Card Title</h2>
  <p className="text-gray-600">Card content goes here</p>
</div>

// DON'T: Use magic numbers or non-standard colors
<div className="p-[17px] text-[#333333] bg-white rounded-[5px]">
  <h2 className="text-[18px] font-semibold mb-[10px]">Card Title</h2>
  <p className="text-[#666666]">Card content goes here</p>
</div>

// DO: Extract common patterns to components
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 text-gray-800 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
```

## Docker & Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Conclusion

Following these guidelines will ensure our SaaS application remains maintainable, scalable, and secure. Remember that code should be written for humans to read and only incidentally for computers to execute. Prioritize clarity and simplicity over cleverness, and always consider the next developer who will work with your code.
