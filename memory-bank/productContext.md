# Product Context

## Purpose & Mission

Snowscribe is a novelwriting application that leverages AI throughout the creative process while ensuring human authors retain full creative control and authorship. The application aims to solve the problem where current AI writing tools take over too much of the writing process, while still providing powerful AI assistance for brainstorming, outlining, editing, researching, and plot development.

## Core Problem

Many current AI writing tools are built around AI generating the final text, removing human creativity and authorship from the process. Snowscribe believes that while AI is an excellent tool for supporting the writing process, humans should remain the actual authors of their novels.

## User Experience Goals

- Beautiful typography that enhances readability and aesthetics
- Clean, intuitive, modern, and polished interface that is uncluttered
- Mobile responsiveness is absolutely required
- Accessibility compliance with modern web standards
- Delightful user experience that makes the writing process enjoyable

## Key Features

### Organization

- **Project > Chapters > Scenes Structure**: Core manuscript organization is implemented.
- **Character Cards**: Functionality for creating, viewing, and editing character information is implemented.
- **World Building/Research Notes**: Section for creating, viewing, and editing world-building notes is implemented.
- **Outlining Tools**:
    - **Synopsis**: Project-level log line and one-page synopsis fields are available, with a dedicated editor UI (`ProjectSynopsisEditor`).
    - **Scene-Level Outlining**: Scenes can have an `outline_description`, a Point-of-View (`pov_character_id`) character, links to other characters involved (`other_character_ids`), and scene tags (`tag_ids`). A dedicated UI (`ChapterSceneOutlineList`) allows viewing and managing these details.
    - **Shared Manuscript & Outline Records**: Chapters and Scenes are the same records whether viewed in the manuscript or outline section, ensuring consistency.
- **Project Information**: Title, genre, word count tracking (current vs. target) are implemented.
- **Scene Tagging & Character Tracking**: Implemented with UI modals for managing tags and characters per scene.
- **Filtering and Reporting Capabilities**: Not yet implemented.

### AI Integration

- **AI Features Accessible**: AI tools are designed to be accessible (e.g., via `AISidePanel`) but can fade into the background.
- **Specialized AI Tools**: The backend (`tool_model` table, `snowgander` integration via `lib/data/chat.ts`) and frontend (`AIToolButton`, `AISidePanel`) support the concept of specialized AI tools. Specific tools (e.g., scene helper) are being integrated.
- **AI Never Generates Final Manuscript Text**: This remains a core design principle.

## Business Model

- Freemium subscription model
- Free tier includes all non-AI features plus limited AI credits
- Monthly and annual subscriptions for full access
- Paid plans have generous but limited AI access to control costs