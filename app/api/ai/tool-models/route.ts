import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSiteAdmin } from "@/lib/supabase/guards";
import { toolModelSchema } from "@/lib/schemas/toolModel.schema";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isSiteAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Extract name query parameter
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  let query = supabase.from("tool_model").select(`
    id,
    name,
    model_id,
    created_at,
    updated_at,
    ai_models (
      id,
      name,
      api_name,
      vendor_id,
      ai_vendors ( name ) 
    )
  `);

  // Add name filter if provided
  if (name) {
    query = query.eq("name", name);
  }

  query = query.order("name", { ascending: true });

  const { data: toolModels, error } = await query;

  if (error) {
    console.error("Error fetching tool models:", error);
    return NextResponse.json(
      { error: "Failed to fetch tool models" },
      { status: 500 }
    );
  }

  return NextResponse.json(toolModels);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isSiteAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const result = toolModelSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  // Verify the referenced model exists
  const { data: model, error: modelError } = await supabase
    .from("ai_models")
    .select("id")
    .eq("id", result.data.model_id)
    .single();

  if (modelError || !model) {
    return NextResponse.json(
      { error: "Invalid model_id. Model does not exist." },
      { status: 400 }
    );
  }

  const { data: newToolModel, error } = await supabase
    .from("tool_model")
    .insert([result.data])
    .select(`
      *,
      ai_models (id, name, vendor_id, ai_vendors (id, name))
    `)
    .single();

  if (error) {
    console.error("Error creating tool model:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A tool model with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create tool model" },
      { status: 500 }
    );
  }

  return NextResponse.json(newToolModel, { status: 201 });
}
