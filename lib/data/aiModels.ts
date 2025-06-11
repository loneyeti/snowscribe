"use server";
import type { AIModel } from '../types';
import type { AIModelFormData } from '../schemas/aiModel.schema';
import * as aiModelService from '../services/aiModelService';

export async function getAIModels(): Promise<AIModel[]> {
    return aiModelService.getAIModels();
}

export async function getAIModelById(modelId: string): Promise<AIModel | null> {
    return aiModelService.getAIModelById(modelId);
}

export async function createAIModel(modelData: AIModelFormData): Promise<AIModel> {
    return aiModelService.createAIModel(modelData);
}

export async function updateAIModel(modelId: string, modelData: Partial<AIModelFormData>): Promise<AIModel> {
    return aiModelService.updateAIModel(modelId, modelData);
}

export async function deleteAIModel(modelId: string): Promise<void> {
    await aiModelService.deleteAIModel(modelId);
}
