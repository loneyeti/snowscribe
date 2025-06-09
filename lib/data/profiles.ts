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

// Removed updateCreditUsage function - now handled directly via RPC call in AISMessageHandler
