# System Patterns

## System Architecture

Snowscribe follows a modern web application architecture using Next.js 15+ with the App Router pattern:

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
└── public/                 # Static assets
```

## Key Technical Decisions

1. **Server Components by Default**: Using React Server Components for improved performance, SEO, and reduced client-side JavaScript.
2. **Client Components When Necessary**: Adding `"use client"` directive only for components that require interactivity, hooks, or browser APIs.
3. **Strong Type System**: Strict TypeScript typing for all components, functions, and data structures.
4. **Component-Driven Design**: Building a library of reusable, single-responsibility UI components.
5. **Supabase for Backend Services**: Using Supabase for authentication, database, and storage needs.
6. **AI Integration via snowgander**: Building an in-house package for vendor-agnostic AI API connectivity.

## Design Patterns

### Component Design Pattern

- Using the **Variant Pattern** with `class-variance-authority` (CVA) for creating flexible, variant-driven UI components
- Following the **Single Responsibility Principle** (SRP) for all components
- Implementing **Atomic Design** methodology: atoms, molecules, organisms, templates, and pages

### State Management Pattern

- **Server-First State Management**: Keeping as much state as possible on the server
- **Local Component State**: Using React's useState for component-specific state
- **Global Client State**: For client-only state that needs to be shared

### Data Fetching Pattern

- **Server Component Data Fetching**: Direct data fetching in Server Components without client-side fetching
- **React Query/SWR**: For client-side data fetching with caching and revalidation when needed

### Authentication Pattern

- Using Supabase Auth with server-side session handling
- Middleware-based route protection
- Role-based access control

## Component Relationships

### Core Component Structure

```mermaid
graph TD
    Layout[Root Layout] --> AuthLayout[Auth Layout]
    Layout --> DashboardLayout[Dashboard Layout]
    DashboardLayout --> ProjectLayout[Project Layout]
    ProjectLayout --> ManuscriptView[Manuscript View]
    ProjectLayout --> OutlineView[Outline View]
    ProjectLayout --> CharactersView[Characters View]
    ProjectLayout --> WorldBuildingView[World Building View]
    ProjectLayout --> AIAssistantView[AI Assistant View]

    ManuscriptView --> ChapterList[Chapter List]
    ChapterList --> SceneList[Scene List]
    SceneList --> SceneEditor[Scene Editor]

    CharactersView --> CharacterList[Character List]
    CharacterList --> CharacterEditor[Character Editor]
```

### Data Flow

```mermaid
graph TD
    Client[Client Components] -->|User Events| Actions[Action Handlers]
    Actions -->|API Calls| Server[Server Components/API Routes]
    Server -->|Database Operations| Supabase[Supabase]
    Server -->|AI Requests| AI[AI Services via snowgander]
    Server -->|Renders| ResponseHTML[HTML Response]
    ResponseHTML -->|Hydrates| Client
```

## Critical Implementation Paths

### Authentication Flow

1. User signs in via Supabase Auth
2. Session is stored in cookies
3. Middleware validates session on protected routes
4. User is redirected to login if session is invalid

### Project Creation and Management

1. User creates a new project with basic metadata
2. Project structure (chapters, scenes) is initialized in database
3. User navigates between project sections via sidebar navigation
4. All changes are persisted to Supabase in real-time

### AI Integration Points

1. AI features are accessible throughout the app but can be hidden when not in use
2. Each AI tool (Snowflake Outliner, Character Enhancer, etc.) has its own specialized system prompt
3. AI usage is tracked and limited based on subscription tier
4. User can select preferred AI model via snowgander package
