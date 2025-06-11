import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/api/utils";
import { getSceneTags, createSceneTag } from "@/lib/services/sceneTagService";
import { createSceneTagSchema } from "@/lib/services/sceneTagService";
import { getErrorMessage } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const tags = await getSceneTags(p.projectId, authContext.user.id);
      return NextResponse.json(tags);
    } catch (error) {
      console.error("Error fetching scene tags:", error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = createSceneTagSchema.safeParse({ 
        ...jsonData, 
        project_id: p.projectId 
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { name } = validationResult.data;
      const newTag = await createSceneTag(p.projectId, authContext.user.id, name);
      return NextResponse.json(newTag, { status: 201 });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error creating scene tag:", error);
      if (message.includes('already exists')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
