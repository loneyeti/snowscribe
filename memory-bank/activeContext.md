# Active Context

## Current Work Focus

Snowscribe is currently in the initial setup phase. The project has been created with Next.js 15+, TypeScript, and Tailwind CSS as its foundation. The focus is on establishing the core architecture, component structure, and UI/UX principles that will guide the development.

## Recent Changes

- Created the memory bank structure with all core documentation files
- Established project goals and requirements in the project brief
- Defined the system architecture and component structure
- Documented the technical stack and development environment
- **Implemented initial Supabase database schema**:
  - Created migration files for all core tables: `profiles`, `projects`, `chapters`, `scenes`, `scene_tags`, `scene_applied_tags`, `characters`, `scene_characters`, `world_building_notes`, `outline_items`, and `ai_interactions`.
  - Successfully applied all migrations to the local Supabase instance.
  - Included RLS policies, triggers for `updated_at`, and a function for `word_count` on scenes.

## Next Steps

1. **Authentication Setup**:

   - Implement Supabase Auth SSR following the required pattern (as defined in `.clinerules` and `techContext.md`).
   - Create middleware for session management and route protection.
   - Build login, signup, and password reset pages/components.

2. **Core UI Components**:

   - Develop reusable UI component library with CVA (e.g., Button, Input, Card).
   - Create typography components with a focus on beautiful text rendering.
   - Design and implement the main application layout structure (DashboardLayout, ProjectLayout).

3. **Project Creation Flow**:

   - Design and implement the project creation form.
   - Define project metadata and initial structure.
   - Set up project listing view on the main dashboard.

4. **Manuscript Editor**:
   - Research and select a suitable text editor library (e.g., TipTap, Lexical).
   - Implement basic text editing functionality within the `SceneEditor` component.
   - Integrate word count tracking (already handled by DB trigger, but UI display needed).

## Active Decisions and Considerations

### Typography Selection

Typography is critical for Snowscribe. We need to select fonts that are:

- Beautiful and professional
- Highly readable for long writing sessions
- Available for web use (consider Google Fonts or Adobe Fonts)
- Performant (limited number of weights to reduce load times)

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

## Learnings and Project Insights

- The Supabase Auth SSR pattern is critical to implement correctly, avoiding deprecated methods.
- Typography selection will have a major impact on the overall user experience.
- AI integration needs careful boundaries to ensure it assists rather than replaces the writer.
- Mobile responsiveness requires thoughtful design decisions for the manuscript editor.
- Supabase migrations are straightforward for table creation but require careful handling of constraints and RLS policies. Partial unique indexes are a good way to handle conditional uniqueness (e.g., global tags).
- The `handle_updated_at` trigger function is reusable across multiple tables.
- The `update_scene_word_count` trigger function automates word count for scenes.
