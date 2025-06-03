import { 
  ToolModel, 
  ToolModelWithAIModel,
  UpdateToolModelValues 
} from "../schemas/toolModel.schema";
import { getCookieHeader } from "./dataUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function getToolModelById(modelId: string): Promise<ToolModel | null> {
  if (!modelId) return null;
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/tool-models/${modelId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch tool model and parse error response" }));
    console.error(`Error fetching tool model ${modelId}:`, errorData);
    throw new Error(errorData.error || `Failed to fetch tool model ${modelId}`);
  }
  return response.json();
}

export async function getToolModelByToolName(name: string): Promise<ToolModel> {
  if (!name) {
    throw new Error('Tool model name is required');
  }

  const fetchToolModel = async (toolName: string): Promise<ToolModel[] | null> => {
    const cookieHeader = await getCookieHeader();
    // Corrected query parameter to 'name' and ensure it's URL encoded
    console.log(`Tool Name to fetch: ${name}`)
    const response = await fetch(`${API_BASE_URL}/api/ai/tool-models?name=${encodeURIComponent(toolName)}`, {
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    if (response.ok) {
      console.log(`Tool model record fetched okay.`)
    }
    
    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({ error: "Failed to fetch tool model and parse error response" }));
      console.error(`Error fetching tool model '${toolName}':`, errorData.error || response.statusText);
      throw new Error(errorData.error || `Failed to fetch tool model '${toolName}'`);
    }
    const toolModelData = await response.json();
    return toolModelData as ToolModel[]; // API returns an array
  };

  // Try to get the requested tool model
  const toolModels = await fetchToolModel(name);
  if (toolModels && toolModels.length > 0) return toolModels[0];

  // If not found and not already trying the default, try the default
  if (name !== 'default') {
    console.warn(`Tool model '${name}' not found, attempting to fetch 'default' tool model.`);
    const defaultToolModels = await fetchToolModel('default');
    if (defaultToolModels && defaultToolModels.length > 0) return defaultToolModels[0];
  }

  throw new Error(`No tool model found for '${name}' and no default tool model is available.`);
}

export async function getToolModelsWithAIModel(): Promise<ToolModelWithAIModel[]> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/tool-models`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch tool models with AI models:", response.status, errorBody);
    throw new Error(`Failed to fetch tool models: ${response.statusText}`);
  }
  return response.json();
}

export async function updateToolModel(
  toolModelId: string,
  data: UpdateToolModelValues
): Promise<ToolModelWithAIModel> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/tool-models/${toolModelId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Failed to parse error response" }));
    console.error("Failed to update tool model:", response.status, errorBody);
    throw new Error(errorBody.error || `Failed to update tool model: ${response.statusText}`);
  }
  return response.json();
}
