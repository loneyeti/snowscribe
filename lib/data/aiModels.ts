"use server";

import type { AIModel } from "@/lib/types";
import type { AIModelFormData } from "@/lib/schemas/aiModel.schema";
import { getCookieHeader } from "./dataUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function getAIModels(vendorId?: string): Promise<AIModel[]> {
  const cookieHeader = await getCookieHeader();
  let url = `${API_BASE_URL}/api/ai/models`;
  if (vendorId) {
    url += `?vendor_id=${vendorId}`;
  }
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI models and parse error response" }));
    console.error("Error fetching AI models:", errorData);
    throw new Error(errorData.error || "Failed to fetch AI models");
  }
  return response.json();
}

export async function getAIModelById(modelId: string): Promise<AIModel | null> {
  if (!modelId) return null;
  console.log(`About to fetch model from the API using this modelID: ` + modelId)
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/models/${modelId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI model and parse error response" }));
    console.error(`Error fetching AI model ${modelId}:`, errorData);
    throw new Error(errorData.error || `Failed to fetch AI model ${modelId}`);
  }
  return response.json();
}

export async function createAIModel(modelData: AIModelFormData): Promise<AIModel> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/models`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(modelData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create AI model and parse error response" }));
    console.error("Error creating AI model:", errorData);
    throw new Error(errorData.error || "Failed to create AI model");
  }
  return response.json();
}

export async function updateAIModel(
  modelId: string,
  modelData: Partial<AIModelFormData>
): Promise<AIModel> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/models/${modelId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(modelData),
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ error: "Failed to update AI model and parse error response" }));
    console.error(`Error updating AI model ${modelId}:`, errorData);
    throw new Error(errorData.error || `Failed to update AI model ${modelId}`);
  }
  return response.json();
}

export async function deleteAIModel(modelId: string): Promise<{ message: string }> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/models/${modelId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete AI model and parse error response" }));
    console.error(`Error deleting AI model ${modelId}:`, errorData);
    throw new Error(errorData.error || `Failed to delete AI model ${modelId}`);
  }
  return response.json();
}
