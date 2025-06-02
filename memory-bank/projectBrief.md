Snowscribe: An AI-Assisted Novel Writing App

**Elevator Pitch:** A novel writing application that intelligently integrates AI throughout the creative process—for brainstorming, outlining, character development, research, plot analysis, editing assistance, and coaching—while ensuring the human author always writes the final text.

**Core Philosophy:** AI is a powerful tool to augment human creativity in novel writing. Snowscribe empowers authors by providing AI assistance for various tasks but firmly believes the human writer must craft the actual manuscript.

**Key User Experience Goals:**

- Beautiful, legible typography.
- Clean, intuitive, modern, and polished interface.
- Full mobile responsiveness.
- Adherence to web accessibility standards.

**Core Organizational Features:**

- **Manuscript:** Projects contain Chapters, which hold Scenes (where the manuscript text resides).
- **Characters:** Dedicated character profiles/cards for detailed character management.
- **World Building:** A section for research notes and world-building details.
- **Outlining:**
  - Project Synopsis: Log line and one-page synopsis fields.
  - Scene-Level Details: Scenes support outline descriptions, Point-of-View (POV) characters, linked characters, and tags.
  - Unified Data: Chapters and Scenes are consistent across manuscript and outline views.
- **Project Info:** Tracks title, genre, current word count, and target word count.

**Core AI-Powered Features (Planned/In-Progress):**

- **Outline Creator:** AI tool to generate a full novel outline (characters, chapters, scenes with details) from a synopsis, using structured JSON output.
- **Synopsis Helper:** AI assistance for generating/refining log lines and one-page synopses.
- **Scene Analyzer/Helper:** AI feedback on individual scenes or assistance in developing scene content (e.g., outline descriptions).
- **Character Tools:**
  - Character Enhancer: AI-driven questions to help writers flesh out character backstories, motivations, etc.
  - Character Name Generator: AI suggestions for character names.
  - Character Chat: Interact with an AI persona of a project character.
- **Research Assistant:** AI to help gather and organize research for world-building.
- **Plot Assistant:**
  - Plot Hole Analyzer: Identifies inconsistencies or gaps in plot/outline.
  - Plot Development Aid: Suggests ideas to overcome plot challenges or enhance engagement.
- **Writing Coach:** General writing feedback (prose, marketability).
- **Editor Assistant:** AI suggestions for prose tightening (not rewriting).
- **Contextual Chat:** AI chat interfaces for discussing the manuscript or outline with relevant project data as context.

**Technology Highlights:**

- Next.js (App Router, Server Components by default)
- TypeScript
- Tailwind CSS
- Supabase (Auth, PostgreSQL Database, Storage)
- `snowgander` (In-house AI vendor/model abstraction library)
- Zod (Schema validation)

**Business Model (Brief):**

- Freemium: Core non-AI features are free, with limited AI trial credits.
- Subscription Tiers: Monthly/annual plans for full AI access, with usage limits to manage costs.

**AI Principles:**

- Focus on strong, well-crafted system prompts (stored in `ai_prompts` table).
- User choice of AI models where feasible (via `ai_models`, `ai_vendors`, `tool_model` tables and `snowgander`).
- Internal tracking of AI costs and user-facing usage limits (future).
