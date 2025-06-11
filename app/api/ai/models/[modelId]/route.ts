import { NextResponse } from "next/server";
import * as aiModelService from "@/lib/services/aiModelService";
import { getErrorMessage } from "@/lib/utils";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";

interface ModelParams {
  modelId: string;
}

export async function GET(
  request: Request,
  { params }: { params: ModelParams }
) {
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
      { status: message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: ModelParams }
) {
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
    return NextResponse.json(
      { error: message },
      { 
        status: message.includes('Forbidden') ? 403 :
               message.includes('already exists') ? 409 :
               500 
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: ModelParams }
) {
  try {
    await aiModelService.deleteAIModel(params.modelId);
    return NextResponse.json(
      { message: "AI model deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { 
        status: message.includes('Forbidden') ? 403 :
               message.includes('referenced') ? 409 :
               500 
      }
    );
  }
}
