"use client";

import { useState } from "react";
import { AISidePanel } from "./AISidePanel";

// Example component that demonstrates how to use AIToolButton with AISidePanel
export function AIToolDemo() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Example tools with their prompts
  const tools = [
    {
      id: "summarize",
      name: "Summarize Text",
      description: "Get a concise summary of your text",
      prompt: "Please provide a concise summary of the following text:",
      systemPrompt: "You are a helpful assistant that provides clear and concise summaries.",
      modelId: "gpt-4" // Replace with your actual model ID
    },
    {
      id: "improve",
      name: "Improve Writing",
      description: "Enhance the clarity and flow of your writing",
      prompt: "Please improve the following text for better clarity and flow:",
      systemPrompt: "You are an expert editor that improves writing while maintaining the original meaning.",
      modelId: "gpt-4" // Replace with your actual model ID
    },
    {
      id: "generate-ideas",
      name: "Generate Ideas",
      description: "Brainstorm creative ideas based on a topic",
      prompt: "Generate 5 creative ideas about:",
      systemPrompt: "You are a creative assistant that generates original and interesting ideas.",
      modelId: "gpt-4" // Replace with your actual model ID
    }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">AI Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => {
              setActiveTool(tool.id);
              setIsPanelOpen(true);
            }}
          >
            <h3 className="font-medium">{tool.name}</h3>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
        ))}
      </div>

      {activeTool && (
        <AISidePanel
          isOpen={isPanelOpen}
          onClose={() => {
            setIsPanelOpen(false);
            setActiveTool(null);
          }}
          title={tools.find(t => t.id === activeTool)?.name || 'AI Tool'}
          componentType="tool"
          toolName={activeTool}
          defaultPrompt={tools.find(t => t.id === activeTool)?.prompt || ''}
          defaultSystemPrompt={tools.find(t => t.id === activeTool)?.systemPrompt || 'You are a helpful AI assistant.'}
        />
      )}
    </div>
  );
}
