"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { SettingsItemList } from "@/components/settings/SettingsItemList";
import { type AIModel, type AIVendor } from "@/lib/types"; // Added AIVendor
import { getAIModels } from "@/lib/data/aiModels";
import { getAIVendors } from "@/lib/data/aiVendors"; // Added getAIVendors
import { CreateAIModelModal } from "@/components/settings/CreateAIModelModal";
import { EditAIModelModal } from "@/components/settings/EditAIModelModal"; // Import Edit Modal
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"; // Import AlertDialog components
import { toast } from "sonner";
import { Cpu, Database, FileText, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { deleteAIModel } from "@/lib/data/aiModels"; // Import delete function

// TODO: Add admin role check here in the future

type SettingsCategory = "AI" | null; // Extend later with "Appearance", "Account", etc.
type AISubCategory = "AI Models" | "AI Vendors" | "AI Prompts" | null;

export function SiteSettingsClient() {
  const [selectedCategory, setSelectedCategory] =
    useState<SettingsCategory>("AI"); // Default to AI for now
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<AISubCategory>(null);

  // State for AI Models
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [isLoadingAIModels, setIsLoadingAIModels] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for AI Vendors
  const [aiVendors, setAIVendors] = useState<AIVendor[]>([]);
  const [isLoadingAIVendors, setIsLoadingAIVendors] = useState(false);

  // State for Edit AI Model Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAIModel, setEditingAIModel] = useState<AIModel | null>(null);

  // State for Delete AI Model Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAIModelId, setDeletingAIModelId] = useState<string | null>(
    null
  );

  // State for AI Vendors (add later)
  // const [aiVendors, setAIVendors] = useState<AIVendor[]>([]);
  // const [isLoadingAIVendors, setIsLoadingAIVendors] = useState(false);

  // State for AI Prompts (add later)
  // const [aiPrompts, setAIPrompts] = useState<AIPrompt[]>([]);
  // const [isLoadingAIPrompts, setIsLoadingAIPrompts] = useState(false);

  // Fetch AI Models
  const fetchAIModels = useCallback(async () => {
    setIsLoadingAIModels(true);
    try {
      const models = await getAIModels();
      setAIModels(models);
    } catch (error) {
      console.error("Failed to fetch AI models:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load AI models."
      );
    } finally {
      setIsLoadingAIModels(false);
    }
  }, []);

  // Fetch AI Vendors
  const fetchAIVendors = useCallback(async () => {
    setIsLoadingAIVendors(true);
    try {
      const fetchedVendors = await getAIVendors();
      setAIVendors(fetchedVendors);
    } catch (error) {
      console.error("Failed to fetch AI vendors:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load AI vendors."
      );
    } finally {
      setIsLoadingAIVendors(false);
    }
  }, []);

  // Fetch data when the relevant subcategory is selected or component mounts for vendors
  useEffect(() => {
    // Fetch vendors as they are needed for the "Create Model" modal
    // This could be fetched on component mount or when AI category is selected
    if (selectedCategory === "AI") {
      fetchAIVendors();
    }

    if (selectedSubCategory === "AI Models") {
      fetchAIModels();
    }
    // Add similar blocks for Vendors and Prompts later
    // else if (selectedSubCategory === "AI Vendors") { fetchAIVendors(); } // Already fetched if AI is category
    // else if (selectedSubCategory === "AI Prompts") { fetchAIPrompts(); }
  }, [selectedCategory, selectedSubCategory, fetchAIModels, fetchAIVendors]);

  const handleModelCreated = (newModel: AIModel) => {
    setAIModels((prevModels) =>
      [...prevModels, newModel].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsCreateModalOpen(false);
  };

  // Placeholder handlers for item actions
  const handleAddModel = () => {
    if (aiVendors.length === 0 && !isLoadingAIVendors) {
      toast.error("Vendors not loaded yet. Please wait or try refreshing.", {
        description: "AI Models need an associated AI Vendor.",
      });
      fetchAIVendors(); // Attempt to re-fetch if empty
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleModelUpdated = (updatedModel: AIModel) => {
    setAIModels((prevModels) =>
      prevModels.map((model) =>
        model.id === updatedModel.id ? updatedModel : model
      )
    );
    setEditingAIModel(null);
    setIsEditModalOpen(false);
  };

  const handleEditModel = (model: AIModel) => {
    setEditingAIModel(model);
    setIsEditModalOpen(true);
  };

  const handleDeleteModelClick = (modelId: string) => {
    setDeletingAIModelId(modelId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteModel = async () => {
    if (!deletingAIModelId) return;

    setIsDeleteDialogOpen(false); // Close dialog immediately
    const modelIdToDelete = deletingAIModelId; // Store ID before clearing state
    setDeletingAIModelId(null); // Clear state

    try {
      await deleteAIModel(modelIdToDelete);
      setAIModels((prevModels) =>
        prevModels.filter((model) => model.id !== modelIdToDelete)
      );
      toast.success("AI Model deleted successfully.");
    } catch (error) {
      console.error(`Failed to delete AI model ${modelIdToDelete}:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Could not delete AI model ${modelIdToDelete}.`
      );
    }
  };

  // Render function for AI Model list items
  const renderAIModelItem = (model: AIModel) => {
    const vendor = aiVendors.find((v) => v.id === model.vendor_id);
    const vendorName = vendor ? vendor.name : "Unknown Vendor";

    return (
      <ListItem
        key={model.id}
        title={model.name}
        secondaryText={`Vendor: ${vendorName} | API Name: ${model.api_name}`}
        actions={
          <div className="flex items-center space-x-1">
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              aria-label={`Edit ${model.name}`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent ListItem click
                handleEditModel(model); // Pass the full model object
              }}
            />
            <IconButton
              icon={Trash2}
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${model.name}`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent ListItem click
                handleDeleteModelClick(model.id); // Pass the model ID
              }}
            />
          </div>
        }
        // Optional: Add onClick to view details if not editing directly
        // onClick={() => handleEditModel(model)} // Or a dedicated view handler
      />
    );
  };

  const middleColumnContent = (
    <>
      <ContextualHeader title="Settings Categories" />
      <ListContainer>
        {/* Top Level Category: AI */}
        <ListItem
          title="AI"
          icon={Cpu}
          onClick={() => {
            setSelectedCategory("AI");
            // Optionally reset subcategory when changing main category
            // setSelectedSubCategory(null);
          }}
          isSelected={selectedCategory === "AI"}
        />

        {/* AI Sub-categories shown when 'AI' is selected */}
        {selectedCategory === "AI" && (
          <div className="pl-4 border-l ml-4 border-border">
            {" "}
            {/* Indentation */}
            <ListItem
              title="AI Models"
              icon={Database} // Example icon
              onClick={() => setSelectedSubCategory("AI Models")}
              isSelected={selectedSubCategory === "AI Models"}
              secondaryText="Manage available models"
            />
            <ListItem
              title="AI Vendors"
              icon={Database} // Example icon, maybe differentiate later
              onClick={() => setSelectedSubCategory("AI Vendors")}
              isSelected={selectedSubCategory === "AI Vendors"}
              secondaryText="Configure API providers"
            />
            <ListItem
              title="AI Prompts"
              icon={FileText} // Example icon
              onClick={() => setSelectedSubCategory("AI Prompts")}
              isSelected={selectedSubCategory === "AI Prompts"}
              secondaryText="Define reusable prompts"
            />
          </div>
        )}
        {/* Add other top-level categories here later (e.g., Appearance, Account) */}
      </ListContainer>
    </>
  );

  const mainDetailColumnContent = (
    <>
      {selectedSubCategory === "AI Models" && (
        <SettingsItemList
          title="AI Models"
          items={aiModels}
          isLoading={isLoadingAIModels}
          onAddItem={handleAddModel}
          renderItem={renderAIModelItem}
          emptyStateMessage="No AI models configured yet."
        />
      )}
      {/* TODO: Add rendering for AI Vendors and AI Prompts */}
      {/* {selectedSubCategory === "AI Vendors" && <SettingsItemList ... />} */}
      {/* {selectedSubCategory === "AI Prompts" && <SettingsItemList ... />} */}

      {/* Placeholder for when no subcategory is selected or it's not AI Models yet */}
      {selectedSubCategory !== "AI Models" && (
        <div className="p-8 flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            {selectedSubCategory
              ? `Content for ${selectedSubCategory} not implemented yet.`
              : "Select a setting sub-category to view details."}
          </p>
        </div>
      )}
    </>
  );

  // Add fragment <> around the SecondaryViewLayout to allow modal rendering alongside it
  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />

      {/* Render the Create AI Model Modal */}
      <CreateAIModelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onModelCreated={handleModelCreated}
        vendors={aiVendors} // Pass the fetched vendors
      />

      {/* Render the Edit AI Model Modal */}
      <EditAIModelModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAIModel(null); // Clear editing state on close
        }}
        onModelUpdated={handleModelUpdated}
        vendors={aiVendors}
        initialData={editingAIModel}
      />

      {/* Render the Delete AI Model Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen} // Use 'open' instead of 'isOpen'
        onOpenChange={(open) => {
          // Use 'onOpenChange' instead of 'onClose'
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Clear deleting state when dialog is closed
            setDeletingAIModelId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this AI Model? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteModel}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </> // Close the fragment
  );
}
