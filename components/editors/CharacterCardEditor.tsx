"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
// Assuming you'll have a Button and Input component similar to shadcn/ui
// For now, using basic HTML elements or placeholders.
// import { Button } from "@/components/ui/button"; // Placeholder
// import { Input } from "@/components/ui/input"; // Placeholder
// import { Textarea } from "@/components/ui/textarea"; // Placeholder

// Define a basic structure for character data
interface CharacterData {
  id?: string; // Optional, if editing an existing character
  name: string;
  backstory: string;
  traits: string; // Could be a comma-separated string or an array
  imageUrl?: string;
  // Add more fields as needed based on your application's requirements
}

interface CharacterCardEditorProps {
  initialData?: CharacterData;
  onSave: (data: CharacterData) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function CharacterCardEditor({
  initialData,
  onSave,
  onCancel,
  className,
}: CharacterCardEditorProps) {
  const [character, setCharacter] = useState<CharacterData>(
    initialData || {
      name: "",
      backstory: "",
      traits: "",
      imageUrl: "",
    }
  );

  useEffect(() => {
    if (initialData) {
      setCharacter(initialData);
    }
  }, [initialData]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setCharacter((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Basic image upload handling - in a real app, this would involve
      // uploading to a service (like Supabase Storage) and getting a URL.
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setCharacter((prev) => ({
            ...prev,
            imageUrl: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSave(character);
    },
    [character, onSave]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 p-6 bg-card text-card-foreground rounded-lg shadow-md",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Upload Area */}
        <div className="md:col-span-1 flex flex-col items-center">
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Character Image
          </label>
          <div className="w-48 h-48 bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
            {character.imageUrl ? (
              <img
                src={character.imageUrl}
                alt={character.name || "Character"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-sm">No Image</span>
            )}
          </div>
          <input
            type="file"
            id="imageUrl"
            name="imageUrl"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>

        {/* Text Fields Area */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-muted-foreground"
            >
              Name
            </label>
            <input // Replace with your Input component
              type="text"
              name="name"
              id="name"
              value={character.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
              placeholder="Character's full name"
            />
          </div>

          <div>
            <label
              htmlFor="traits"
              className="block text-sm font-medium text-muted-foreground"
            >
              Key Traits
            </label>
            <input // Replace with your Input component
              type="text"
              name="traits"
              id="traits"
              value={character.traits}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
              placeholder="e.g., Brave, Curious, Stubborn"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="backstory"
          className="block text-sm font-medium text-muted-foreground"
        >
          Backstory
        </label>
        <textarea // Replace with your Textarea component
          name="backstory"
          id="backstory"
          value={character.backstory}
          onChange={handleChange}
          rows={6}
          className="mt-1 block w-full rounded-md border-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          placeholder="Describe the character's history, motivations, and significant life events."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button // Replace with your Button component (variant="outline")
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted/50"
          >
            Cancel
          </button>
        )}
        <button // Replace with your Button component
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Character
        </button>
      </div>
    </form>
  );
}
