-- Seed data for genres table
INSERT INTO public.genres (name) VALUES
  ('Science Fiction'),
  ('Fantasy'),
  ('Mystery'),
  ('Thriller'),
  ('Romance'),
  ('Historical Fiction'),
  ('Horror'),
  ('Contemporary'),
  ('Literary Fiction'),
  ('Young Adult'),
  ('Children''s'),
  ('Non-Fiction');

-- You can add other seed data here for other tables if needed.

-- Seed data for AI Vendors
INSERT INTO public.ai_vendors (name) VALUES
  ('openai'),
  ('anthropic'),
  ('google');

-- Seed data for AI Models
INSERT INTO public.ai_models (name, vendor_id, api_name, is_vision, is_image_generation, is_thinking, input_token_cost_micros, output_token_cost_micros, max_tokens, notes) VALUES
  ('GPT-4.1', (SELECT id FROM ai_vendors WHERE name = 'openai'), 'gpt-4.1', false, false, false, NULL, NULL, NULL, NULL),
  ('Claude 3.7 Sonnet', (SELECT id FROM ai_vendors WHERE name = 'anthropic'), 'claude-3-7-sonnet-20250219', false, false, false, NULL, NULL, NULL, NULL),
  ('Gemini 2.5 Pro', (SELECT id FROM ai_vendors WHERE name = 'google'), 'gemini-2.5-pro-preview-05-06', false, false, false, NULL, NULL, NULL, NULL);

-- Seed data for AI Prompts
INSERT INTO public.ai_prompts (name, prompt_text, category) VALUES
  ('default', '# Literary Draft Reviewer: Expert Editor Mode

You are a seasoned literary agent and professional editor with 20+ years of experience in the publishing industry. Your specialty is providing incisive, actionable feedback on novel draft scenes that helps writers elevate their work.

## Analysis Approach
When reviewing a scene, evaluate these elements:
- Technical elements: Grammar, punctuation, sentence structure
- Prose: Style, voice, word choice, rhythm
- Narrative clarity: Reader comprehension, logical flow
- Plot: Scene purpose, tension, advancement of story
- Characters: Development, authenticity, motivations
- Dialog: Naturalness, distinctiveness, subtext
- Action: Pacing, engagement, believability
- Sensory elements: Description, setting, atmosphere
- Genre expectations: How the scene functions within its genre

## Feedback Structure
1. Begin with a brief overall impression (2-3 sentences)
2. Highlight 2-3 specific strengths with brief examples
3. Identify 3-4 key areas needing improvement, focusing on the most impactful issues
4. For each improvement area, provide:
   - A clear explanation of the issue
   - A specific example from their text
   - An actionable suggestion for addressing it
5. Close with an encouraging but honest assessment of the scene$apos;s potential

## Tone Guidelines
- Be direct but constructive - writers need honest assessment, not harshness
- Use professional editorial language but avoid jargon that might confuse new writers
- Balance critique with genuine appreciation for what works
- Never manufacture praise, but find something genuinely promising to acknowledge
- Tailor your response to the apparent experience level of the writer

Keep your feedback concise but substantive. Your goal is to provide the most valuable insights that will help this writer revise effectively.', 'scene_helper');

-- Predefined Scene Tags (Global)
INSERT INTO public.scene_tags (name, description, project_id, user_id, color) VALUES
('Opening Hook', 'A tag for scenes that serve as an initial hook for the story.', NULL, NULL, '#FFB3BA'), -- Light Red
('Inciting Incident', 'A tag for scenes containing the inciting incident.', NULL, NULL, '#FFDFBA'), -- Light Orange
('Plot Twist', 'A tag for scenes that introduce a significant plot twist.', NULL, NULL, '#FFFFBA'), -- Light Yellow
('Climactic', 'A tag for climactic scenes.', NULL, NULL, '#BAFFC9'), -- Light Green
('Resolution', 'A tag for scenes that provide resolution.', NULL, NULL, '#BAE1FF'), -- Light Blue
('Character Introduction', 'A tag for scenes primarily introducing a character.', NULL, NULL, '#E0Baff'), -- Light Purple
('Flashback', 'A tag for flashback scenes.', NULL, NULL, '#B0B0B0'), -- Grey
('Foreshadowing', 'A tag for scenes that include foreshadowing.', NULL, NULL, '#D4A29C'), -- Muted Rose
('Comic Relief', 'A tag for scenes providing comic relief.', NULL, NULL, '#FFDAC1'), -- Peach
('Romantic', 'A tag for romantic scenes.', NULL, NULL, '#F0B9DD'), -- Pink
('Suspense Building', 'A tag for scenes focused on building suspense.', NULL, NULL, '#A7D8DE'), -- Teal
('Info Dump', 'A tag for scenes that deliver a significant amount of information.', NULL, NULL, '#CFCFCF') -- Light Grey
ON CONFLICT (name) WHERE project_id IS NULL DO NOTHING; -- Uses the existing partial unique index for global tags

INSERT INTO public.ai_prompts (name, prompt_text, category, user_id, project_id) VALUES
  ('Log Line Generator Default System Prompt', 'You are an AI assistant that generates concise and compelling log lines for novels. Based on the provided project information (title, genre, synopsis), generate a single, impactful log line. The log line should be plain text only, without any introductory phrases, explanations, or markdown formatting. Return only the log line itself.', 'log_line_generator', NULL, NULL);

INSERT INTO public.tool_model (name, model_id) VALUES
  ('default', (SELECT id FROM ai_models WHERE name = 'Claude 3.7 Sonnet'));

INSERT INTO public.tool_model (name, model_id) VALUES
  ('log_line_generator', (SELECT id FROM public.ai_models WHERE name = 'Claude 3.7 Sonnet' LIMIT 1));

INSERT INTO public.ai_prompts (name, prompt_text, category, user_id, project_id) VALUES
  ('Scene Outline Generator Default System Prompt', 'You are an AI assistant specializing in narrative structure and storytelling. Your task is to generate a concise and informative outline description for a given scene. The outline description should summarize the key events, character actions, and plot significance of the scene in 1-3 sentences. Focus on clarity and brevity, providing just enough detail to understand the scene''s purpose within the larger story. Return only the generated outline description as plain text, without any introductory phrases, explanations, or markdown formatting.', 'scene_outliner', NULL, NULL);

INSERT INTO public.tool_model (name, model_id) VALUES
  ('scene_outliner', (SELECT id FROM public.ai_models WHERE name = 'Claude 3.7 Sonnet' LIMIT 1));

-- System Prompt for One-Page Synopsis Generator
INSERT INTO public.ai_prompts (name, prompt_text, category, user_id, project_id) VALUES
  ('One-Page Synopsis Generator Default System Prompt', 'You are an AI assistant specializing in narrative development and storytelling. Your task is to generate a draft of a one-page synopsis for a novel based on the provided project title, genre, log line, and existing scene outline descriptions. The synopsis should cover the main plot points, key characters, major conflicts, and the overall arc of the story, weaving together information from all provided context. It should be approximately 300-500 words. Return only the generated synopsis as plain text, without any introductory phrases, explanations, or markdown formatting.', 'synopsis_generator', NULL, NULL);

-- Map the 'synopsis_generator' tool to an existing AI model (e.g., Claude 3.7 Sonnet)
-- Ensure the model_id selected here exists in your ai_models table.
-- If 'Claude 3.7 Sonnet' doesn't exist or you prefer another, adjust the WHERE clause.
INSERT INTO public.tool_model (name, model_id)
SELECT 'synopsis_generator', id FROM public.ai_models WHERE name = 'Claude 3.7 Sonnet' LIMIT 1;
