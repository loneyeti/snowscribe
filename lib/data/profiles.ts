"use server";

import { getErrorMessage } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { getCookieHeader } from "./dataUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function getClientProfile(): Promise<Pick<Profile, 'id' | 'is_site_admin'> | null> {
  const apiUrl = `${API_BASE_URL}/api/profiles`;
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    if (!response.ok) {
      console.error(`Error fetching profile: ${response.status} ${response.statusText}`);
      return null;
    }

    const profileData = await response.json();
    return profileData;
  } catch (error) {
    console.error('Error fetching profile:', getErrorMessage(error));
    return null;
  }
}

export async function updateCreditUsage(
  userId: string,
  creditsToAdd: number
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }
  if (creditsToAdd <= 0) {
    return { success: true };
  }

  const apiUrl = `${API_BASE_URL}/api/profiles`;
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
      body: JSON.stringify({ userId, creditsToAdd }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update credit usage');
    }

    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to update credit usage for user ${userId}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}
