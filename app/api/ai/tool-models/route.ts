import { NextResponse, type NextRequest } from "next/server";
import * as toolModelService from "@/lib/services/toolModelService";
import { createToolModelValuesSchema } from "@/lib/schemas/toolModel.schema";
import { getErrorMessage } from "@/lib/utils";
import { withAdminAuth } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const name = searchParams.get("name");
      
      const toolModels = await toolModelService.getToolModelsWithAIModel(name || undefined);
      return NextResponse.json(toolModels);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error fetching tool models:", error);
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
      const result = createToolModelValuesSchema.safeParse(json);

      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 }
        );
      }

      const newToolModel = await toolModelService.createToolModel(result.data);
      return NextResponse.json(newToolModel, { status: 201 });
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('already exists')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      if (message.includes('does not exist')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("Error creating tool model:", error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
