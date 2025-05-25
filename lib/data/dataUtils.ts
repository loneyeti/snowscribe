"use server";

import { cookies } from "next/headers";

export async function getCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((cookie: {name: string, value: string}) => `${cookie.name}=${cookie.value}`).join('; ');
  return cookieHeader;
}