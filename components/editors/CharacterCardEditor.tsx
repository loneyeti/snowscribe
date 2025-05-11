"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import { type UpdateCharacterValues } from "@/lib/schemas/character.schema";

// Use UpdateCharacterValues for the data structure, adding id
export interface CharacterFormData extends UpdateCharacterValues {
  id?: string;
  // image_url is already in UpdateCharacterValues
}

interface CharacterCardEditorProps {
  initialData?: CharacterFormData;
  onSave: (data: CharacterFormData) => void | Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void | Promise<void>;
  className?: string;
}

export function CharacterCardEditor({
  initialData,
  onSave,
  onCancel,
  onDelete,
  className,
}: CharacterCardEditorProps) {
  const [character, setCharacter] = useState<CharacterFormData>(
    initialData || {
      name: "",
      description: "",
      notes: "",
      image_url: "",
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
            image_url: reader.result as string,
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
            htmlFor="image_url"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Character Image
          </label>
          <div className="w-48 h-48 bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name || "Character"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-sm">No Image</span>
            )}
          </div>
          <input
            type="file"
            id="image_url"
            name="image_url"
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
            <Input
              type="text"
              name="name"
              id="name"
              value={character.name}
              onChange={handleChange}
              required
              placeholder="Character's full name"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-muted-foreground"
        >
          Description
        </label>
        <Textarea
          name="description"
          id="description"
          value={character.description || ""}
          onChange={handleChange}
          rows={4}
          placeholder="A brief description of the character (physical appearance, key personality aspects, etc.)."
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-muted-foreground"
        >
          Notes
        </label>
        <Textarea
          name="notes"
          id="notes"
          value={character.notes || ""}
          onChange={handleChange}
          rows={8}
          placeholder="Detailed notes about the character, including backstory, motivations, relationships, character arc, etc. This can be extensive."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this character? This action cannot be undone."
                )
              ) {
                onDelete();
              }
            }}
          >
            Delete
          </Button>
        )}
        <div className="flex-grow" /> {/* Spacer */}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save Character</Button>
      </div>
    </form>
  );
}
