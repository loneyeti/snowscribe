import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modelId } = params;

  if (!modelId) {
    return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
  }

  const { data: model, error } = await supabase
    .from("ai_models")
    .select(`
      *,
      ai_vendors (id, name)
    `)
    .eq("id", modelId)
    .single();

  if (error) {
    console.error("Error fetching AI model:", error);
    if (error.code === "PGRST116") { // PostgREST error for "Not found"
      return NextResponse.json({ error: "AI model not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch AI model" },
      { status: 500 }
    );
  }

  if (!model) {
    return NextResponse.json({ error: "AI model not found" }, { status: 404 });
  }

  return NextResponse.json(model);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modelId } = params;

  if (!modelId) {
    return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
  }

  const json = await request.json();
  const result = aiModelSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }
  
  // Ensure vendor_id exists before updating
  if (result.data.vendor_id) {
    const { data: vendor, error: vendorError } = await supabase
      .from("ai_vendors")
      .select("id")
      .eq("id", result.data.vendor_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: "Invalid vendor_id. Vendor does not exist." },
        { status: 400 }
      );
    }
  } else {
     return NextResponse.json(
        { error: "vendor_id is required." },
        { status: 400 }
      );
  }

  const { data: updatedModel, error } = await supabase
    .from("ai_models")
    .update(result.data)
    .eq("id", modelId)
    .select(`
      *,
      ai_vendors (id, name)
    `)
    .single();

  if (error) {
    console.error("Error updating AI model:", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "AI model not found" }, { status: 404 });
    }
     if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { error: "AI model with this name for the selected vendor already exists." },
          { status: 409 }
        );
      }
      if (error.code === "23503") { // Foreign key violation
        return NextResponse.json(
            { error: "Invalid vendor_id. Vendor does not exist." },
            { status: 400 }
          );
    }
    return NextResponse.json(
      { error: "Failed to update AI model" },
      { status: 500 }
    );
  }

  if (!updatedModel) {
     return NextResponse.json({ error: "AI model not found after update attempt" }, { status: 404 });
  }

  return NextResponse.json(updatedModel);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modelId } = params;

  if (!modelId) {
    return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ai_models")
    .delete()
    .eq("id", modelId);

  if (error) {
    console.error("Error deleting AI model:", error);
    if (error.code === "PGRST116") { 
      return NextResponse.json({ error: "AI model not found" }, { status: 404 });
    }
    // Handle potential foreign key constraint violations if models are linked elsewhere (e.g. ai_prompts or ai_interactions)
    if (error.code === '23503') { 
        return NextResponse.json({ error: "Cannot delete model, it is referenced by other entities." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to delete AI model" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "AI model deleted successfully" }, { status: 200 });
}
