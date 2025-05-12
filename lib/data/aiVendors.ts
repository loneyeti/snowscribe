"use server";

import type { AIVendor } from "@/lib/types";
import type { AIVendorFormData } from "@/lib/schemas/aiVendor.schema";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to get cookies for server-side fetch
async function getCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((cookie: {name: string, value: string}) => `${cookie.name}=${cookie.value}`).join('; ');
  return cookieHeader;
}

export async function getAIVendors(): Promise<AIVendor[]> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/vendors`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI vendors and parse error response" }));
    console.error("Error fetching AI vendors:", errorData);
    throw new Error(errorData.error || "Failed to fetch AI vendors");
  }
  return response.json();
}

export async function getAIVendorById(vendorId: string): Promise<AIVendor | null> {
  if (!vendorId) return null;
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/vendors/${vendorId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch AI vendor and parse error response" }));
    console.error(`Error fetching AI vendor ${vendorId}:`, errorData);
    throw new Error(errorData.error || `Failed to fetch AI vendor ${vendorId}`);
  }
  return response.json();
}

export async function createAIVendor(vendorData: AIVendorFormData): Promise<AIVendor> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(vendorData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create AI vendor and parse error response" }));
    console.error("Error creating AI vendor:", errorData);
    throw new Error(errorData.error || "Failed to create AI vendor");
  }
  return response.json();
}

export async function updateAIVendor(
  vendorId: string,
  vendorData: Partial<AIVendorFormData>
): Promise<AIVendor> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/vendors/${vendorId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify(vendorData),
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ error: "Failed to update AI vendor and parse error response" }));
    console.error(`Error updating AI vendor ${vendorId}:`, errorData);
    throw new Error(errorData.error || `Failed to update AI vendor ${vendorId}`);
  }
  return response.json();
}

export async function deleteAIVendor(vendorId: string): Promise<{ message: string }> {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${API_BASE_URL}/api/ai/vendors/${vendorId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json", // Content-Type might not be strictly needed for DELETE with no body
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete AI vendor and parse error response" }));
    console.error(`Error deleting AI vendor ${vendorId}:`, errorData);
    throw new Error(errorData.error || `Failed to delete AI vendor ${vendorId}`);
  }
  return response.json();
}
