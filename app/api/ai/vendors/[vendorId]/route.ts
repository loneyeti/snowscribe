import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiVendorSchema } from "@/lib/schemas/aiVendor.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId } = params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
  }

  const { data: vendor, error } = await supabase
    .from("ai_vendors")
    .select("*")
    .eq("id", vendorId)
    .single();

  if (error) {
    console.error("Error fetching AI vendor:", error);
    if (error.code === "PGRST116") { // PostgREST error for "Not found"
      return NextResponse.json({ error: "AI vendor not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch AI vendor" },
      { status: 500 }
    );
  }

  if (!vendor) {
    return NextResponse.json({ error: "AI vendor not found" }, { status: 404 });
  }

  return NextResponse.json(vendor);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId } = params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
  }

  const json = await request.json();
  // For PUT, we expect all fields, but schema handles optionality for some
  const result = aiVendorSchema.safeParse(json); 

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  const { name, api_key_env_var } = result.data;

  const { data: updatedVendor, error } = await supabase
    .from("ai_vendors")
    .update({ name, api_key_env_var })
    .eq("id", vendorId)
    .select()
    .single();

  if (error) {
    console.error("Error updating AI vendor:", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "AI vendor not found" }, { status: 404 });
    }
    if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { error: "AI vendor with this name already exists." },
          { status: 409 }
        );
      }
    return NextResponse.json(
      { error: "Failed to update AI vendor" },
      { status: 500 }
    );
  }

  if (!updatedVendor) {
    return NextResponse.json({ error: "AI vendor not found after update attempt" }, { status: 404 });
  }

  return NextResponse.json(updatedVendor);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId } = params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ai_vendors")
    .delete()
    .eq("id", vendorId);

  if (error) {
    console.error("Error deleting AI vendor:", error);
     if (error.code === "PGRST116") { 
      return NextResponse.json({ error: "AI vendor not found" }, { status: 404 });
    }
    // Handle potential foreign key constraint violations if vendors are linked elsewhere
    if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json({ error: "Cannot delete vendor, it is referenced by other entities (e.g., AI Models)." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to delete AI vendor" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "AI vendor deleted successfully" }, { status: 200 });
}
