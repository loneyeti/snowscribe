Snowscribe is a Novelwriting app. The elevator pitch is:

A novelwriting app that leverages AI throughout the process for brainstorming, outlining, editing, researching, identifying plot holes, coaching, and plot development. AI is never used for the final text, though.

The idea is that AI is such a great tool for all of दीन above, but too many current tools are based around using AI in the entire loop. My belief is that humans still need to be the ones writing while utilizing AI help them write the best novel they can.

## Basic Features

- Beautiful typography
- Clean, intuituve interface
- AI features that can be called from anywhere but also can fade into the background
- Great organization:
  - Chapters that hold scenes. Scenes hold the actual manuscript text.
  - Character cards that holds information about the characters.
  - World building/research notes that can hold information about the world of the novel itself.
  - Outlining tool to help the user outline the novel:
    - One-sentence synopsis (project's `log_line`).
    - One-page synopsis (project's `one_page_synopsis`).
    - Scene list with brief descriptions, POV character, other characters, and tags.
    - Scenes and chapters are shared between manuscript and outline views.
  - Project infomation that includes title, genre and total word count, along with a target total word count goal.
- Scenes can be tagged with what kind of scene it is.
- Scenes will also report what characters appear in them.
- Filtering and reporting capabilities (future enhancement).

## AI Features

- Snowflake Outliner
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

The main homepage (`app/page.tsx`, `HomePageClientWrapper.tsx`) displays a list of user's projects (`ProjectList.tsx`, `ProjectCard.tsx`) and allows creation of new projects via a modal (`CreateProjectModal.tsx`). It includes a header with navigation and user actions (`UserMenuButton.tsx`).

## Main App Dashboard UI/UX Detail

The main project screen (`app/(dashboard)/project/[projectId]/page.tsx` using `AppShell.tsx` and `ProjectDashboardClient.tsx`) is laid out like this:

### Top Header (`AppHeader.tsx`)

- Project name
- Genre
- Word count progress bar
- User menu

### Navigation Sidebar (`PrimarySidebar.tsx`)

- Manuscript
- Outline
- Characters
- World Building Notes
- AI Assistant
- Settings
- Export (Placeholder for now)

### Middle Column (Contextual List/Navigation within a section)

- **Manuscript**: Chapter list, drills down to Scene list.
- **Outline**: Navigation for "Synopsis" and "Scenes" views.
- **Characters**: List of characters (`CharacterList.tsx`).
- **World Building Notes**: List of notes (`WorldNoteList.tsx`).
- **AI Assistant**: (Future: List of AI tools or chat history).
- **Settings**: List of settings categories (e.g., AI Models, Vendors, Prompts).

### Main Detail Column (Editor/Content Area)

- **Manuscript**: Scene editor (`ManuscriptEditor.tsx`) for writing.
- **Outline**:
    - **Synopsis View**: `ProjectSynopsisEditor.tsx` for log_line and one-page synopsis.
    - **Scenes View**: `ChapterSceneOutlineList.tsx` displaying scenes with editable details (description, POV, characters, tags via modals).
- **Characters**: Character "card" editor (`CharacterCardEditor.tsx`).
- **World Building Notes**: Note editor (`WorldNoteEditor.tsx`).
- **AI Assistant**: `AISidePanel.tsx` providing an interface for specific AI tools (e.g., chat, tool execution with `AIToolButton`).
- **Settings**: Forms/lists for managing selected settings (e.g., `SettingsItemList.tsx` for AI Models).

## Technology Stack

- **NextJS 15.3.2** - React framework with server components
- **TypeScript** - Static typing for JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (auth, database, storage)
- **Fly.io** - Application hosting (Planned)
- **Docker** - Containerization (Planned)
- **Zod** - Form validation
- **snowgander (^0.0.36)** - Inhouse npm package for vendor agnostic AI API connectivity.
- **sonner** - Toast notifications.
- **React Hook Form** - For form management.
- **Lucide Icons** - Icon library.

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

- A large focus will be on creating strong system prompts for AI models (stored in `ai_prompts` table).
- Should give users a choice in AI models (managed via `ai_models` and `ai_vendors` tables, facilitated by `snowgander`).
- We need to be able to track AI costs internally and the ability to limit user AI usage based in on their subscription plan and their usage (Future implementation).

## Coding Principals

(As previously defined, emphasizing Server Components, TypeScript, component-driven design, Zod, `lib/data` abstraction, `lib/schema` for validation, and security best practices like `verifyProjectOwnership` guard and cookie forwarding for internal API calls.)

## Tech Stack Overview

(As previously defined)