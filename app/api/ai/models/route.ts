import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSiteAdmin } from "@/lib/supabase/guards";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await isSiteAdmin(supabase);
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to perform this action" }, 
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendor_id");

  let query = supabase.from("ai_models").select(`
    *,
    ai_vendors (id, name)
  `);

  if (vendorId) {
    query = query.eq("vendor_id", vendorId);
  }

  query = query.order("name", { ascending: true });

  const { data: models, error } = await query;

  if (error) {
    console.error("Error fetching AI models:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI models" },
      { status: 500 }
    );
  }

  return NextResponse.json(models);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await isSiteAdmin(supabase);
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to perform this action" }, 
      { status: 403 }
    );
  }

  const json = await request.json();
  const result = aiModelSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  // Ensure vendor_id exists before inserting
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


  const { data: newModel, error } = await supabase
    .from("ai_models")
    .insert([result.data])
    .select(`
      *,
      ai_vendors (id, name)
    `)
    .single();

  if (error) {
    console.error("Error creating AI model:", error);
    if (error.code === "23505") { // Unique constraint violation (e.g. name + vendor_id)
      return NextResponse.json(
        { error: "AI model with this name for the selected vendor already exists." },
        { status: 409 }
      );
    }
    if (error.code === "23503") { // Foreign key violation
        return NextResponse.json(
            { error: "Invalid vendor_id. Vendor does not exist." },
            { status: 400 } // Or 404 if preferred for FK not found
          );
    }
    return NextResponse.json(
      { error: "Failed to create AI model" },
      { status: 500 }
    );
  }

  return NextResponse.json(newModel, { status: 201 });
}
