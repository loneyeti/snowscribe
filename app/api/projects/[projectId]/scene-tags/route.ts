import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withProjectAuth } from "@/lib/api/utils";

const createSceneTagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  project_id: z.string().uuid("Valid Project ID is required."),
});

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    const { data: tags, error: dbError } = await supabase
      .from("scene_tags")
      .select('*')
      .or(`project_id.eq.${p.projectId},project_id.is.null`)
      .order('name', { ascending: true });

    if (dbError) {
      console.error("Error fetching scene tags:", dbError);
      return NextResponse.json({ error: "Failed to fetch scene tags", details: dbError.message }, { status: 500 });
    }

    return NextResponse.json(tags || []);
  });
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = createSceneTagSchema.safeParse({ ...jsonData, project_id: p.projectId });
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
        project_id: p.projectId,
        user_id: authContext.user.id,
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
  });
}
