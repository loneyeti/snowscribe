import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toolModelSchema } from "@/lib/schemas/toolModel.schema";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const toolName = searchParams.get("name"); // Changed from model_id to name for tool lookup

  let queryBuilder = supabase.from("tool_model").select(`
    *,
    ai_models (id, name, vendor_id, ai_vendors (id, name))
  `);

  if (toolName) { // If toolName is provided, filter by it
    queryBuilder = queryBuilder.eq("name", toolName); 
  } else {
    // If no specific toolName, list all tool_models
    queryBuilder = queryBuilder.order("name", { ascending: true });
  }

  const { data: toolModelsData, error } = toolName
    ? await queryBuilder.single() // Apply .single() only if toolName is present
    : await queryBuilder; // Otherwise, await the query builder directly

  if (error) {
    console.error("Error fetching tool models:", error);
    if (toolName && error.code === 'PGRST116') { // PostgREST code for "No rows found"
        return NextResponse.json({ error: `Tool model with name '${toolName}' not found` }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch tool models" },
      { status: 500 }
    );
  }
  
  // If querying by specific toolName and no data found (should be caught by PGRST116, but safeguard)
  if (toolName && !toolModelsData) {
    return NextResponse.json({ error: `Tool model with name '${toolName}' not found` }, { status: 404 });
  }

  return NextResponse.json(toolModelsData); // Will be a single object if toolName was used, else an array
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
