"use client";

import React from "react";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
import { ListContainer } from "@/components/ui/ListContainer";
import { PlusCircle } from "lucide-react";

// Constrain T to ensure it has an 'id' property of type string (UUIDs are strings)
interface SettingsItemListProps<T extends { id: string }> {
  title: string;
  items: T[];
  isLoading: boolean;
  onAddItem: () => void;
  renderItem: (item: T) => React.ReactNode; // Function to render each list item
  emptyStateMessage?: string;
}

// Apply the constraint directly to the function's generic parameter
export function SettingsItemList<T extends { id: string }>({
  title,
  items,
  isLoading,
  onAddItem,
  renderItem,
  emptyStateMessage = "No items found.",
}: SettingsItemListProps<T>) {
  return (
    <div className="flex flex-col h-full">
      <ContextualHeader
        title={title}
        navControls={
          <IconButton
            icon={PlusCircle}
            aria-label={`Add New ${title}`}
            onClick={onAddItem}
          />
        }
      />
      <ListContainer className="flex-grow overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading items...</p>
        ) : items.length > 0 ? (
          // Remove unused 'index'
          items.map((item) => (
            // Now we can safely access item.id because of the generic constraint
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {emptyStateMessage}
          </p>
        )}
      </ListContainer>
    </div>
  );
}
