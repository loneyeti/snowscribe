// lib/data/toolModels.ts
"use server";
import { type ToolModelWithAIModel, type UpdateToolModelValues } from "../schemas/toolModel.schema";
import * as toolModelService from '../services/toolModelService';

export async function getToolModelByName(name: string): Promise<ToolModelWithAIModel> {
    if (!name) {
        throw new Error('Tool model name is required');
    }

    const toolModel = await toolModelService.getToolModelByName(name);
    if (toolModel) return toolModel;
    
    // Fallback to default if the specific tool is not found
    if (name !== 'default') {
        console.warn(`Tool model '${name}' not found, attempting to fetch 'default' tool model.`);
        const defaultToolModel = await toolModelService.getToolModelByName('default');
        if (defaultToolModel) return defaultToolModel;
    }

    throw new Error(`No tool model found for '${name}' and no default tool model is available.`);
}

export async function getToolModelsWithAIModel(): Promise<ToolModelWithAIModel[]> {
    return toolModelService.getToolModelsWithAIModel();
}

export async function updateToolModel(toolModelId: string, data: UpdateToolModelValues): Promise<ToolModelWithAIModel> {
    return toolModelService.updateToolModel(toolModelId, data);
}
