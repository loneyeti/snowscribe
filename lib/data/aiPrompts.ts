"use server";

import type { AIPrompt } from "@/lib/types";
import type { AIPromptFormData } from "@/lib/schemas/aiPrompt.schema";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((cookie: {name: string, value: string}) => `${cookie.name}=${cookie.value}`).join('; ');
  return cookieHeader;
}

export async function getAIPrompts(
  filter?: { projectId?: string; scope?: 'global' | 'user' | 'project' }
): Promise<AIPrompt[]> {
  const cookieHeader = await getCookieHeader();
  const url = new URL(`${API_BASE_URL}/api/ai/prompts`);
  
  if (filter?.projectId) {
    url.searchParams.append('project_id', filter.projectId);
  }
  if (filter?.scope) {
     url.searchParams.append('scope', filter.scope);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI prompts and parse error response" }));
    console.error("Error fetching AI prompts:", errorData);
    throw new Error(errorData.error || "Failed to fetch AI prompts");
  }
  return response.json();
}

export async function getAIPromptById(promptId: string): Promise<AIPrompt | null> {
  if (!promptId) return null;
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/prompts/${promptId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI prompt and parse error response" }));
    console.error(`Error fetching AI prompt ${promptId}:`, errorData);
    throw new Error(errorData.error || `Failed to fetch AI prompt ${promptId}`);
  }
  return response.json();
}

export async function createAIPrompt(promptData: AIPromptFormData): Promise<AIPrompt> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(promptData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create AI prompt and parse error response" }));
    console.error("Error creating AI prompt:", errorData);
    throw new Error(errorData.error || "Failed to create AI prompt");
  }
  return response.json();
}

export async function updateAIPrompt(
  promptId: string,
  promptData: Partial<AIPromptFormData>
): Promise<AIPrompt> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/prompts/${promptId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(promptData),
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ error: "Failed to update AI prompt and parse error response" }));
    console.error(`Error updating AI prompt ${promptId}:`, errorData);
    throw new Error(errorData.error || `Failed to update AI prompt ${promptId}`);
  }
  return response.json();
}

export async function deleteAIPrompt(promptId: string): Promise<{ message: string }> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/prompts/${promptId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete AI prompt and parse error response" }));
    console.error(`Error deleting AI prompt ${promptId}:`, errorData);
    throw new Error(errorData.error || `Failed to delete AI prompt ${promptId}`);
  }
  return response.json();
}
