import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: genres, error } = await supabase
    .from("genres")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 }
    );
  }

  return NextResponse.json(genres);
}
