// lib/ai/constants.ts

export const AI_TOOL_NAMES = {
  MANUSCRIPT_CHAT: 'manuscript_chat',
  OUTLINE_CHAT: 'outline_chat',
  PLOT_HOLE_CHECKER: 'plot_hole_checker', // Generic name, specific context handled by variants
  CHARACTER_CHAT: 'character_chat',
  CHARACTER_NAME_GENERATOR: 'character_name_generator',
  WORLD_BUILDING_CHAT: 'world_building_chat',
  WRITING_COACH: 'writing_coach',
  // Specific tool names for AISMessageHandler if prompts/logic differ significantly
  PLOT_HOLE_CHECKER_MANUSCRIPT: 'plot_hole_checker_manuscript',
  PLOT_HOLE_CHECKER_OUTLINE: 'plot_hole_checker_outline',
} as const;

export type AIToolName = typeof AI_TOOL_NAMES[keyof typeof AI_TOOL_NAMES];

export interface AIToolDefinition {
  id: AIToolName;
  name: string;
  description: string;
  // Add any other common properties for tool definitions if needed later
}

export const AI_PAGE_TOOLS: readonly AIToolDefinition[] = [
  { id: AI_TOOL_NAMES.MANUSCRIPT_CHAT, name: 'Manuscript Chat', description: 'Chat about your entire manuscript.' },
  { id: AI_TOOL_NAMES.OUTLINE_CHAT, name: 'Outline Chat', description: 'Discuss your project outline.' },
  { id: AI_TOOL_NAMES.PLOT_HOLE_CHECKER, name: 'Plot Hole Checker', description: 'Analyze manuscript or outline for plot holes.' },
  { id: AI_TOOL_NAMES.CHARACTER_CHAT, name: 'Character Chat', description: 'Chat with one of your characters.' },
  { id: AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR, name: 'Character Name Generator', description: 'Generate character names.' },
  { id: AI_TOOL_NAMES.WORLD_BUILDING_CHAT, name: 'World Building Chat', description: 'Discuss your world and create notes.' },
  { id: AI_TOOL_NAMES.WRITING_COACH, name: 'Writing Coach', description: 'Get writing advice without project context.' },
];
