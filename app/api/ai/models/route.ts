import { NextResponse } from "next/server";
import * as aiModelService from "@/lib/services/aiModelService";
import { getErrorMessage } from "@/lib/utils";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";

export async function GET() {
  try {
    const models = await aiModelService.getAIModels();
    return NextResponse.json(models);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
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
