import { NextResponse, type NextRequest } from "next/server";
import * as aiModelService from "@/lib/services/aiModelService";
import { getErrorMessage } from "@/lib/utils";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";
import { withAdminAuth } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const models = await aiModelService.getAIModels();
      return NextResponse.json(models);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const json = await request.json();
      const result = aiModelSchema.safeParse(json);
      
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 }
        );
      }

      const newModel = await aiModelService.createAIModel(result.data);
      return NextResponse.json(newModel, { status: 201 });
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
