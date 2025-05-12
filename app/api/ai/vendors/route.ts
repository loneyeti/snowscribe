import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiVendorSchema }from "@/lib/schemas/aiVendor.schema";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: vendors, error } = await supabase
    .from("ai_vendors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching AI vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI vendors" },
      { status: 500 }
    );
  }

  return NextResponse.json(vendors);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const result = aiVendorSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  const { name, api_key_env_var } = result.data;

  const { data: newVendor, error } = await supabase
    .from("ai_vendors")
    .insert([{ name, api_key_env_var }])
    .select()
    .single();

  if (error) {
    console.error("Error creating AI vendor:", error);
    // Check for unique constraint violation (e.g., duplicate name)
    if (error.code === "23505") { // PostgreSQL unique_violation
      return NextResponse.json(
        { error: "AI vendor with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create AI vendor" },
      { status: 500 }
    );
  }

  return NextResponse.json(newVendor, { status: 201 });
}
