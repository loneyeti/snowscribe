import { NextResponse, type NextRequest } from "next/server";
import * as toolModelService from "@/lib/services/toolModelService";
import { updateToolModelValuesSchema } from "@/lib/schemas/toolModel.schema";
import { getErrorMessage } from "@/lib/utils";
import { withAdminAuth } from "@/lib/api/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { toolModelId: string } }
) {
  return withAdminAuth(request, async () => {
    try {
      const { toolModelId } = params;
      if (!toolModelId) {
        return NextResponse.json(
          { error: "Tool Model ID is required" },
          { status: 400 }
        );
      }

      const json = await request.json();
      const validationResult = updateToolModelValuesSchema.safeParse(json);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const updatedToolModel = await toolModelService.updateToolModel(
        toolModelId,
        validationResult.data
      );
      
      return NextResponse.json(updatedToolModel);
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message.includes('Invalid AI Model ID')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("Error updating tool model:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
