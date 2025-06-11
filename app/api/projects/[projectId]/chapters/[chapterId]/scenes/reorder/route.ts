import { NextResponse, type NextRequest } from "next/server";
import { withProjectAuth } from "@/lib/api/utils";
import { z } from "zod";
import * as sceneService from "@/lib/services/sceneService";
import { getErrorMessage } from "@/lib/utils";

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
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const json = await req.json();
      const validationResult = batchSceneOrderUpdateRequestSchema.safeParse(json);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      await sceneService.reorderScenes(
        p.projectId,
        p.chapterId,
        authContext.user.id,
        validationResult.data.scenes
      );

      return NextResponse.json({ message: "Scene order updated successfully" });
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      console.error("Error reordering scenes:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
