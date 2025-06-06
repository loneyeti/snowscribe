"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { SettingsItemList } from "@/components/settings/SettingsItemList";
import { IconButton } from "@/components/ui/IconButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/AlertDialog";
import { toast } from "sonner";
import {
  Cpu,
  Database,
  FileText,
  Pencil,
  Settings2,
  Trash2,
} from "lucide-react";
import { type AIModel, type AIVendor, type AIPrompt } from "@/lib/types";
import { type ToolModelWithAIModel } from "@/lib/schemas/toolModel.schema";
import { getAIModels, deleteAIModel } from "@/lib/data/aiModels";
import { getAIVendors, deleteAIVendor } from "@/lib/data/aiVendors";
import { getAIPrompts, deleteAIPrompt } from "@/lib/data/aiPrompts";
import { getToolModelsWithAIModel } from "@/lib/data/toolModels";
import { EditToolModelModal } from "@/components/settings/EditToolModelModal";
import { CreateAIModelModal } from "@/components/settings/CreateAIModelModal";
import { EditAIModelModal } from "@/components/settings/EditAIModelModal";
import { CreateAIVendorModal } from "@/components/settings/CreateAIVendorModal";
import { EditAIVendorModal } from "@/components/settings/EditAIVendorModal";
import { CreateAIPromptModal } from "@/components/settings/CreateAIPromptModal";
import { EditAIPromptModal } from "@/components/settings/EditAIPromptModal";

type SettingsCategory = "AI" | null;
type AISubCategory =
  | "AI Models"
  | "AI Vendors"
  | "AI Prompts"
  | "Tool Models"
  | null;

export function SiteSettingsClient() {
  const [selectedCategory, setSelectedCategory] =
    useState<SettingsCategory>("AI");
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<AISubCategory>(null);

  // Models
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [isLoadingAIModels, setIsLoadingAIModels] = useState(false);
  const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState(false);
  const [editingAIModel, setEditingAIModel] = useState<AIModel | null>(null);
  const [isDeleteModelDialogOpen, setIsDeleteModelDialogOpen] = useState(false);
  const [deletingAIModelId, setDeletingAIModelId] = useState<string | null>(
    null
  );

  // Vendors
  const [aiVendors, setAIVendors] = useState<AIVendor[]>([]);
  const [isLoadingAIVendors, setIsLoadingAIVendors] = useState(false);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [editingAIVendor, setEditingAIVendor] = useState<AIVendor | null>(null);
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] =
    useState(false);
  const [deletingAIVendorId, setDeletingAIVendorId] = useState<string | null>(
    null
  );

  // Prompts
  const [aiPrompts, setAIPrompts] = useState<AIPrompt[]>([]);
  const [isLoadingAIPrompts, setIsLoadingAIPrompts] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  const [isEditPromptModalOpen, setIsEditPromptModalOpen] = useState(false);
  const [editingAIPrompt, setEditingAIPrompt] = useState<AIPrompt | null>(null);
  const [isDeletePromptDialogOpen, setIsDeletePromptDialogOpen] =
    useState(false);
  const [deletingAIPromptId, setDeletingAIPromptId] = useState<string | null>(
    null
  );

  // Tool Models
  const [toolModels, setToolModels] = useState<ToolModelWithAIModel[]>([]);
  const [isLoadingToolModels, setIsLoadingToolModels] = useState(false);
  const [selectedToolModelForEdit, setSelectedToolModelForEdit] =
    useState<ToolModelWithAIModel | null>(null);
  const [isEditToolModelModalOpen, setIsEditToolModelModalOpen] =
    useState(false);

  // Fetch functions
  const fetchAIModels = useCallback(async () => {
    setIsLoadingAIModels(true);
    try {
      setAIModels(await getAIModels());
    } catch {
      toast.error("Failed to load AI Models.");
    } finally {
      setIsLoadingAIModels(false);
    }
  }, []);

  const fetchAIVendors = useCallback(async () => {
    setIsLoadingAIVendors(true);
    try {
      setAIVendors(await getAIVendors());
    } catch {
      toast.error("Failed to load AI Vendors.");
    } finally {
      setIsLoadingAIVendors(false);
    }
  }, []);

  const fetchAIPrompts = useCallback(async () => {
    setIsLoadingAIPrompts(true);
    try {
      setAIPrompts(await getAIPrompts());
    } catch {
      toast.error("Failed to load AI Prompts.");
    } finally {
      setIsLoadingAIPrompts(false);
    }
  }, []);

  const fetchToolModels = useCallback(async () => {
    setIsLoadingToolModels(true);
    try {
      setToolModels(await getToolModelsWithAIModel());
    } catch {
      toast.error("Failed to load Tool Models.");
    } finally {
      setIsLoadingToolModels(false);
    }
  }, []);

  // Load on category/subcategory change
  useEffect(() => {
    // Fetch vendors if AI category is selected - common dependency
    if (selectedCategory === "AI") {
      fetchAIVendors();
    }

    // Fetch data based on sub-category
    if (selectedSubCategory === "AI Models") {
      fetchAIModels();
    } else if (selectedSubCategory === "AI Vendors") {
      // fetchAIVendors(); // This is likely already handled by selectedCategory === "AI"
    } else if (selectedSubCategory === "AI Prompts") {
      fetchAIPrompts();
    } else if (selectedSubCategory === "Tool Models") {
      fetchToolModels();
      fetchAIModels(); // Ensure AI Models are fetched for the EditToolModelModal dropdown
    }
  }, [
    selectedCategory,
    selectedSubCategory,
    fetchAIModels,
    fetchAIVendors,
    fetchAIPrompts,
    fetchToolModels,
  ]);

  // Model Handlers
  const handleModelCreated = (m: AIModel) => {
    setAIModels((prev) =>
      [...prev, m].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsCreateModelModalOpen(false);
  };
  const handleEditModel = (m: AIModel) => {
    setEditingAIModel(m);
    setIsEditModelModalOpen(true);
  };
  const handleModelUpdated = (m: AIModel) => {
    setAIModels((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    setIsEditModelModalOpen(false);
    setEditingAIModel(null);
  };
  const handleDeleteModelClick = (id: string) => {
    setDeletingAIModelId(id);
    setIsDeleteModelDialogOpen(true);
  };
  const handleConfirmDeleteModel = async () => {
    if (!deletingAIModelId) return;
    try {
      await deleteAIModel(deletingAIModelId);
      setAIModels((prev) => prev.filter((x) => x.id !== deletingAIModelId));
      toast.success("AI Model deleted.");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setIsDeleteModelDialogOpen(false);
      setDeletingAIModelId(null);
    }
  };

  // Vendor Handlers
  const handleVendorCreated = (v: AIVendor) => {
    setAIVendors((prev) =>
      [...prev, v].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsCreateVendorModalOpen(false);
  };
  const handleEditVendor = (v: AIVendor) => {
    setEditingAIVendor(v);
    setIsEditVendorModalOpen(true);
  };
  const handleVendorUpdated = (v: AIVendor) => {
    setAIVendors((prev) => prev.map((x) => (x.id === v.id ? v : x)));
    setIsEditVendorModalOpen(false);
    setEditingAIVendor(null);
  };
  const handleDeleteVendorClick = (id: string) => {
    setDeletingAIVendorId(id);
    setIsDeleteVendorDialogOpen(true);
  };
  const handleConfirmDeleteVendor = async () => {
    if (!deletingAIVendorId) return;
    try {
      await deleteAIVendor(deletingAIVendorId);
      setAIVendors((prev) => prev.filter((x) => x.id !== deletingAIVendorId));
      toast.success("AI Vendor deleted.");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setIsDeleteVendorDialogOpen(false);
      setDeletingAIVendorId(null);
    }
  };

  // Tool Model Handlers
  const handleEditToolModel = (tm: ToolModelWithAIModel) => {
    setSelectedToolModelForEdit(tm);
    setIsEditToolModelModalOpen(true);
  };

  const handleToolModelUpdated = (updatedTm: ToolModelWithAIModel) => {
    setToolModels((prev) =>
      prev.map((tm) => (tm.id === updatedTm.id ? updatedTm : tm))
    );
    // No need to close modal here, EditToolModelModal handles its own closure
  };

  // Prompt Handlers
  const handlePromptCreated = (p: AIPrompt) => {
    setAIPrompts((prev) =>
      [...prev, p].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsCreatePromptModalOpen(false);
  };
  const handleEditPrompt = (p: AIPrompt) => {
    setEditingAIPrompt(p);
    setIsEditPromptModalOpen(true);
  };
  const handlePromptUpdated = (p: AIPrompt) => {
    setAIPrompts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setIsEditPromptModalOpen(false);
    setEditingAIPrompt(null);
  };
  const handleDeletePromptClick = (id: string) => {
    setDeletingAIPromptId(id);
    setIsDeletePromptDialogOpen(true);
  };
  const handleConfirmDeletePrompt = async () => {
    if (!deletingAIPromptId) return;
    try {
      await deleteAIPrompt(deletingAIPromptId);
      setAIPrompts((prev) => prev.filter((x) => x.id !== deletingAIPromptId));
      toast.success("AI Prompt deleted.");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setIsDeletePromptDialogOpen(false);
      setDeletingAIPromptId(null);
    }
  };

  // Renderers
  const renderAIModelItem = (m: AIModel) => {
    const v = aiVendors.find((x) => x.id === m.vendor_id);
    return (
      <ListItem
        key={m.id}
        title={m.name}
        secondaryText={`Vendor: ${v?.name || "Unknown"} | API: ${m.api_name}`}
        actions={
          <div className="flex space-x-1">
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEditModel(m);
              }}
            />
            <IconButton
              icon={Trash2}
              size="sm"
              variant="ghost"
              className="text-destructive"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteModelClick(m.id);
              }}
            />
          </div>
        }
      />
    );
  };
  const renderAIVendorItem = (v: AIVendor) => (
    <ListItem
      key={v.id}
      title={v.name}
      secondaryText={
        v.api_key_env_var ? `Key Env: ${v.api_key_env_var}` : "No key env"
      }
      actions={
        <div className="flex space-x-1">
          <IconButton
            icon={Pencil}
            size="sm"
            variant="ghost"
            aria-label="Edit"
            onClick={(e) => {
              e.stopPropagation();
              handleEditVendor(v);
            }}
          />
          <IconButton
            icon={Trash2}
            size="sm"
            variant="ghost"
            className="text-destructive"
            aria-label="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteVendorClick(v.id);
            }}
          />
        </div>
      }
    />
  );
  const renderToolModelItem = (tm: ToolModelWithAIModel) => (
    <ListItem
      key={tm.id}
      title={tm.name}
      secondaryText={
        tm.ai_models
          ? `Uses AI Model: ${tm.ai_models.name} (${
              tm.ai_models.ai_vendors?.name || "Unknown Vendor"
            })`
          : "AI Model not set or found"
      }
      actions={
        <div className="flex space-x-1">
          <IconButton
            icon={Pencil}
            size="sm"
            variant="ghost"
            aria-label="Edit Tool Model"
            onClick={(e) => {
              e.stopPropagation();
              handleEditToolModel(tm);
            }}
          />
        </div>
      }
      onClick={() => handleEditToolModel(tm)}
    />
  );

  const renderAIPromptItem = (p: AIPrompt) => {
    let scope = "User Global";
    if (p.project_id) scope = "Project-specific";
    else if (!p.user_id) scope = "System Global";
    return (
      <ListItem
        key={p.id}
        title={p.name}
        secondaryText={`Category: ${p.category || "N/A"} | Scope: ${scope}`}
        actions={
          <div className="flex space-x-1">
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEditPrompt(p);
              }}
            />
            <IconButton
              icon={Trash2}
              size="sm"
              variant="ghost"
              className="text-destructive"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePromptClick(p.id);
              }}
            />
          </div>
        }
      />
    );
  };

  const router = useRouter();

  const middleColumn = (
    <>
      <ContextualHeader
        title="Settings Categories"
        onBack={() => router.push("/")}
      />
      <ListContainer>
        <ListItem
          title="AI"
          icon={Cpu}
          onClick={() => setSelectedCategory("AI")}
          isSelected={selectedCategory === "AI"}
        />
        {selectedCategory === "AI" && (
          <div className="pl-4 border-l ml-4 border-border">
            <ListItem
              title="AI Models"
              icon={Database}
              onClick={() => setSelectedSubCategory("AI Models")}
              isSelected={selectedSubCategory === "AI Models"}
              secondaryText="Manage models"
            />
            <ListItem
              title="AI Vendors"
              icon={Database}
              onClick={() => setSelectedSubCategory("AI Vendors")}
              isSelected={selectedSubCategory === "AI Vendors"}
              secondaryText="Configure vendors"
            />
            <ListItem
              title="AI Prompts"
              icon={FileText}
              onClick={() => setSelectedSubCategory("AI Prompts")}
              isSelected={selectedSubCategory === "AI Prompts"}
              secondaryText="Define prompts"
            />
            <ListItem
              title="Tool Models"
              icon={Settings2}
              onClick={() => setSelectedSubCategory("Tool Models")}
              isSelected={selectedSubCategory === "Tool Models"}
              secondaryText="Configure tool models"
            />
          </div>
        )}
      </ListContainer>
    </>
  );

  const mainDetail = (
    <>
      {selectedSubCategory === "AI Models" && (
        <SettingsItemList
          title="AI Models"
          items={aiModels}
          isLoading={isLoadingAIModels}
          onAddItem={() => setIsCreateModelModalOpen(true)}
          renderItem={renderAIModelItem}
          emptyStateMessage="No models"
        />
      )}
      {selectedSubCategory === "AI Vendors" && (
        <SettingsItemList
          title="AI Vendors"
          items={aiVendors}
          isLoading={isLoadingAIVendors}
          onAddItem={() => setIsCreateVendorModalOpen(true)}
          renderItem={renderAIVendorItem}
          emptyStateMessage="No vendors"
        />
      )}
      {selectedSubCategory === "AI Prompts" && (
        <SettingsItemList
          title="AI Prompts"
          items={aiPrompts}
          isLoading={isLoadingAIPrompts}
          onAddItem={() => setIsCreatePromptModalOpen(true)}
          renderItem={renderAIPromptItem}
          emptyStateMessage="No prompts"
        />
      )}
      {selectedSubCategory === "Tool Models" && (
        <SettingsItemList
          title="Tool Models"
          items={toolModels}
          isLoading={isLoadingToolModels}
          onAddItem={() => {}} // Empty function since we don't want to allow adding tool models
          renderItem={renderToolModelItem}
          emptyStateMessage="No tool models found. These are typically configured in the system."
        />
      )}
      {!selectedSubCategory && (
        <div className="p-8 flex items-center justify-center h-full text-muted-foreground">
          Select a setting sub-category to view details.
        </div>
      )}
    </>
  );

  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumn}
        mainDetailColumn={mainDetail}
      />

      {/* Model Modals & Dialog */}
      <CreateAIModelModal
        isOpen={isCreateModelModalOpen}
        onClose={() => setIsCreateModelModalOpen(false)}
        onModelCreated={handleModelCreated}
        vendors={aiVendors}
      />
      <EditAIModelModal
        isOpen={isEditModelModalOpen}
        onClose={() => {
          setIsEditModelModalOpen(false);
          setEditingAIModel(null);
        }}
        onModelUpdated={handleModelUpdated}
        vendors={aiVendors}
        initialData={editingAIModel}
      />
      <AlertDialog
        open={isDeleteModelDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteModelDialogOpen(open);
          if (!open) setDeletingAIModelId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>Delete AI Model?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteModel}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vendor Modals & Dialog */}
      <CreateAIVendorModal
        isOpen={isCreateVendorModalOpen}
        onClose={() => setIsCreateVendorModalOpen(false)}
        onVendorCreated={handleVendorCreated}
      />
      <EditAIVendorModal
        isOpen={isEditVendorModalOpen}
        onClose={() => {
          setIsEditVendorModalOpen(false);
          setEditingAIVendor(null);
        }}
        onVendorUpdated={handleVendorUpdated}
        initialData={editingAIVendor}
      />
      <AlertDialog
        open={isDeleteVendorDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteVendorDialogOpen(open);
          if (!open) setDeletingAIVendorId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>Delete AI Vendor?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteVendor}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tool Model Modal */}
      {selectedToolModelForEdit && (
        <EditToolModelModal
          isOpen={isEditToolModelModalOpen}
          onClose={() => {
            setIsEditToolModelModalOpen(false);
            setSelectedToolModelForEdit(null);
          }}
          onToolModelUpdated={handleToolModelUpdated}
          toolModel={selectedToolModelForEdit}
          aiModels={aiModels}
        />
      )}

      {/* Prompt Modals & Dialog */}
      <CreateAIPromptModal
        isOpen={isCreatePromptModalOpen}
        onClose={() => setIsCreatePromptModalOpen(false)}
        onPromptCreated={handlePromptCreated}
      />
      <EditAIPromptModal
        isOpen={isEditPromptModalOpen}
        onClose={() => {
          setIsEditPromptModalOpen(false);
          setEditingAIPrompt(null);
        }}
        onPromptUpdated={handlePromptUpdated}
        initialData={editingAIPrompt}
      />
      <AlertDialog
        open={isDeletePromptDialogOpen}
        onOpenChange={(open) => {
          setIsDeletePromptDialogOpen(open);
          if (!open) setDeletingAIPromptId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>Delete AI Prompt?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePrompt}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
