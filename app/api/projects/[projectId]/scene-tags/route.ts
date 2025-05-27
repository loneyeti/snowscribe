import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyProjectOwnership } from "@/lib/supabase/guards";

const createSceneTagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  project_id: z.string().uuid("Valid Project ID is required."),
});

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = createSceneTagSchema.safeParse({ ...jsonData, project_id: projectId });
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { name } = validationResult.data;

  const { data: newTag, error: insertError } = await supabase
    .from("scene_tags")
    .insert({
      name,
      project_id: projectId,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating scene tag:", insertError);
    if (insertError.code === "23505") {
      return NextResponse.json({ error: `Tag "${name}" already exists for this project.` }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create scene tag", details: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(newTag, { status: 201 });
}
