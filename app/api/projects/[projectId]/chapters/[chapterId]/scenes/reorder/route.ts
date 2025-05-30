import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyProjectOwnership } from "@/lib/supabase/guards";
import { z } from "zod";

const sceneOrderUpdateSchema = z.object({
  id: z.string().uuid({ message: "Scene ID must be a valid UUID." }),
  order: z.number().int().min(0, { message: "Order must be a non-negative integer." }),
});

const batchSceneOrderUpdateRequestSchema = z.object({
  scenes: z.array(sceneOrderUpdateSchema),
});

interface ReorderParams {
  projectId: string;
  chapterId: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: ReorderParams }
) {
  const { projectId, chapterId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownershipVerification = await verifyProjectOwnership(
    supabase,
    projectId,
    user.id
  );

  if (ownershipVerification.error) {
    return NextResponse.json(
      { error: ownershipVerification.error.message },
      { status: ownershipVerification.status }
    );
  }

  const { data: chapterData, error: chapterError } = await supabase
    .from("chapters")
    .select("id")
    .eq("id", chapterId)
    .eq("project_id", projectId)
    .single();

  if (chapterError || !chapterData) {
    return NextResponse.json(
      { error: "Chapter not found or does not belong to the project." },
      { status: 404 }
    );
  }

  let json;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const validationResult = batchSceneOrderUpdateRequestSchema.safeParse(json);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { scenes: scenesToUpdate } = validationResult.data;

  for (const sceneUpdate of scenesToUpdate) {
    const { error: updateError } = await supabase
      .from("scenes")
      .update({
        order: sceneUpdate.order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sceneUpdate.id)
      .eq("chapter_id", chapterId);

    if (updateError) {
      console.error(`Error updating order for scene ${sceneUpdate.id}:`, updateError);
      return NextResponse.json(
        { error: `Failed to update order for scene ${sceneUpdate.id}. ${updateError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Scene order updated successfully" });
}
