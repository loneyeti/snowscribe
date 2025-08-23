// app/settings/SettingsClientPage.tsx
"use client";
import React, { useState } from "react";
import { useSettingsStore } from "../../lib/stores/settingsStore";
import { useShallow } from "zustand/react/shallow";
import { SettingsItemList } from "../../components/settings/SettingsItemList";
import { ListItem } from "../../components/ui/ListItem";
import { Button } from "../../components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";

// Import Modals
import { CreateAIVendorModal } from "../../components/settings/CreateAIVendorModal";
import { EditAIVendorModal } from "../../components/settings/EditAIVendorModal";
import { CreateAIModelModal } from "../../components/settings/CreateAIModelModal";
import { EditAIModelModal } from "../../components/settings/EditAIModelModal";
import { CreateAIPromptModal } from "../../components/settings/CreateAIPromptModal";
import { EditAIPromptModal } from "../../components/settings/EditAIPromptModal";
import { EditToolModelModal } from "../../components/settings/EditToolModelModal";

// Import Types
import type { AIVendor, AIModel, AIPrompt } from "../../lib/types";
import type { ToolModelWithAIModel } from "../../lib/schemas/toolModel.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/AlertDialog";
import { toast } from "sonner";

export function SettingsClientPage() {
  const { vendors, models, prompts, toolModels, isLoading } = useSettingsStore(
    useShallow((state) => ({
      vendors: state.vendors,
      models: state.models,
      prompts: state.prompts,
      toolModels: state.toolModels,
      isLoading: state.isLoading,
    }))
  );

  const { deleteVendor, deleteModel, deletePrompt } = useSettingsStore();

  // Modal states
  const [isCreateVendorModalOpen, setCreateVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<AIVendor | null>(null);

  const [isCreateModalModalOpen, setCreateModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  const [isCreatePromptModalOpen, setCreatePromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);

  const [editingToolModel, setEditingToolModel] =
    useState<ToolModelWithAIModel | null>(null);

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>

      {/* AI Vendors Section */}
      <section>
        <SettingsItemList
          title="AI Vendors"
          items={vendors}
          isLoading={isLoading}
          onAddItem={() => setCreateVendorModalOpen(true)}
          renderItem={(vendor) => (
            <ListItem
              key={vendor.id}
              title={vendor.name}
              secondaryText={
                vendor.api_key_env_var
                  ? `Key: ${vendor.api_key_env_var}`
                  : "No API Key ENV Var"
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingVendor(vendor);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the vendor &quot;
                          {vendor.name}
                          &quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteVendor(vendor.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              }
            />
          )}
        />
      </section>

      {/* AI Models Section */}
      <section>
        <SettingsItemList
          title="AI Models"
          items={models}
          isLoading={isLoading}
          onAddItem={() => setCreateModelModalOpen(true)}
          renderItem={(model) => {
            const vendorName =
              vendors.find((v) => v.id === model.vendor_id)?.name ||
              "Unknown Vendor";
            return (
              <ListItem
                key={model.id}
                title={model.name}
                secondaryText={`${vendorName} - ${model.api_name}`}
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModel(model);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the model &quot;
                            {model.name}
                            &quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteModel(model.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                }
              />
            );
          }}
        />
      </section>

      {/* AI Tool Models Section */}
      <section>
        <SettingsItemList
          title="AI Tool Models"
          items={toolModels}
          isLoading={isLoading}
          onAddItem={() =>
            toast.info("Tool models are created automatically by the system.")
          }
          renderItem={(toolModel) => (
            <ListItem
              key={toolModel.id}
              title={toolModel.name}
              secondaryText={`Using: ${toolModel.ai_models?.name || "Not set"}`}
              actions={
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingToolModel(toolModel);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              }
            />
          )}
        />
      </section>

      {/* AI Prompts Section */}
      <section>
        <SettingsItemList
          title="Global AI Prompts"
          items={prompts}
          isLoading={isLoading}
          onAddItem={() => setCreatePromptModalOpen(true)}
          renderItem={(prompt) => (
            <ListItem
              key={prompt.id}
              title={prompt.name}
              secondaryText={prompt.category || "Uncategorized"}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPrompt(prompt);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the prompt &quot;
                          {prompt.name}
                          &quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePrompt(prompt.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              }
            />
          )}
        />
      </section>

      {/* Modals */}
      <CreateAIVendorModal
        isOpen={isCreateVendorModalOpen}
        onClose={() => setCreateVendorModalOpen(false)}
      />
      <EditAIVendorModal
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
        initialData={editingVendor}
      />

      <CreateAIModelModal
        isOpen={isCreateModalModalOpen}
        onClose={() => setCreateModelModalOpen(false)}
        vendors={vendors}
      />
      <EditAIModelModal
        isOpen={!!editingModel}
        onClose={() => setEditingModel(null)}
        initialData={editingModel}
        vendors={vendors}
      />

      <CreateAIPromptModal
        isOpen={isCreatePromptModalOpen}
        onClose={() => setCreatePromptModalOpen(false)}
      />
      <EditAIPromptModal
        isOpen={!!editingPrompt}
        onClose={() => setEditingPrompt(null)}
        initialData={editingPrompt}
      />

      <EditToolModelModal
        isOpen={!!editingToolModel}
        onClose={() => setEditingToolModel(null)}
        toolModel={editingToolModel}
        aiModels={models}
      />
    </div>
  );
}
