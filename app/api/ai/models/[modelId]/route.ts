import { NextResponse, type NextRequest } from "next/server";
import * as aiModelService from "@/lib/services/aiModelService";
import { getErrorMessage } from "@/lib/utils";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";
import { withAdminAuth } from "@/lib/api/utils";

interface ModelParams {
  modelId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: ModelParams }
) {
  return withAdminAuth(request, async () => {
    try {
      const model = await aiModelService.getAIModelById(params.modelId);
      if (!model) {
        return NextResponse.json(
          { error: "AI model not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(model);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: ModelParams }
) {
  return withAdminAuth(request, async () => {
    try {
      const json = await request.json();
      const result = aiModelSchema.partial().safeParse(json);
      
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 }
        );
      }

      const updatedModel = await aiModelService.updateAIModel(
        params.modelId,
        result.data
      );
      return NextResponse.json(updatedModel);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: ModelParams }
) {
  return withAdminAuth(request, async () => {
    try {
      await aiModelService.deleteAIModel(params.modelId);
      return NextResponse.json(
        { message: "AI model deleted successfully" },
        { status: 200 }
      );
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('referenced')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
