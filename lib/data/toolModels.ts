import { ToolModel } from "../schemas/toolModel.schema";
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

export async function getToolModelByToolName(name: string): Promise<ToolModel> { // Expect a single ToolModel
  if (!name) {
    throw new Error('Tool model name is required');
  }

  const fetchToolModel = async (toolName: string): Promise<ToolModel | null> => {
    const cookieHeader = await getCookieHeader();
    // Corrected query parameter to 'name' and ensure it's URL encoded
    const response = await fetch(`${API_BASE_URL}/api/ai/tool-models?name=${encodeURIComponent(toolName)}`, {
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({ error: "Failed to fetch tool model and parse error response" }));
      console.error(`Error fetching tool model '${toolName}':`, errorData.error || response.statusText);
      throw new Error(errorData.error || `Failed to fetch tool model '${toolName}'`);
    }
    // API now returns a single object when queried by name
    const toolModelData = await response.json();
    return toolModelData as ToolModel; // Cast, assuming API returns single object
  };

  // Try to get the requested tool model
  const toolModel = await fetchToolModel(name);
  if (toolModel) return toolModel;

  // If not found and not already trying the default, try the default
  if (name !== 'default') {
    console.warn(`Tool model '${name}' not found, attempting to fetch 'default' tool model.`);
    const defaultToolModel = await fetchToolModel('default');
    if (defaultToolModel) return defaultToolModel;
  }

  throw new Error(`No tool model found for '${name}' and no default tool model is available.`);
}
