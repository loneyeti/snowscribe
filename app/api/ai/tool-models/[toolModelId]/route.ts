import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSiteAdmin } from "@/lib/supabase/guards";
import { z } from "zod";
const updateToolModelSchema = z.object({
  model_id: z.string().uuid({ message: "Valid AI Model ID is required." }),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { toolModelId: string } }
) {
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

  const { toolModelId } = await params;
  if (!toolModelId) {
    return NextResponse.json(
      { error: "Tool Model ID is required" },
      { status: 400 }
    );
  }

  let reqData;
  try {
    reqData = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validationResult = updateToolModelSchema.safeParse(reqData);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const { model_id } = validationResult.data;

  const { data: updatedToolModel, error } = await supabase
    .from("tool_model")
    .update({ model_id: model_id, updated_at: new Date().toISOString() })
    .eq("id", toolModelId)
    .select(`
      id,
      name,
      model_id,
      created_at,
      updated_at,
      ai_models (
        id,
        name,
        api_name,
        vendor_id
      )
    `)
    .single();

  if (error) {
    console.error("Error updating tool model:", error);
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json({ error: "Invalid AI Model ID provided." }, { status: 400 });
    }
    if (error.code === 'PGRST204') { // No rows found
      return NextResponse.json({ error: "Tool Model not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update tool model" },
      { status: 500 }
    );
  }

  if (!updatedToolModel) {
    return NextResponse.json(
      { error: "Tool Model not found after update." },
      { status: 404 }
    );
  }

  return NextResponse.json(updatedToolModel);
}
