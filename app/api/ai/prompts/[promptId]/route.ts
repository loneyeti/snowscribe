import { NextResponse } from "next/server";
import * as aiPromptService from "@/lib/services/aiPromptService";
import { getErrorMessage } from "@/lib/utils";
import { aiPromptSchema } from "@/lib/schemas/aiPrompt.schema";
import { withAuth } from "@/lib/api/utils";
import { z } from "zod";

interface PromptParams {
  promptId: string;
}

export async function GET(request: Request, { params }: { params: PromptParams }) {
  return withAuth(request, async (req, authContext) => {
    try {
      const prompt = await aiPromptService.getAIPromptById(params.promptId, authContext.user.id);
      if (!prompt) {
        return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
      }
      return NextResponse.json(prompt);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: PromptParams }) {
  return withAuth(request, async (req, authContext) => {
    try {
      const json = await request.json();
      const validatedData = aiPromptSchema.partial().parse(json);
      
      const updatedPrompt = await aiPromptService.updateAIPrompt(
        params.promptId,
        authContext.user.id,
        validatedData
      );
      return NextResponse.json(updatedPrompt);
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: error instanceof z.ZodError ? 400 : 500 }
      );
    }
  });
}

export async function DELETE(request: Request, { params }: { params: PromptParams }) {
  return withAuth(request, async (req, authContext) => {
    try {
      await aiPromptService.deleteAIPrompt(params.promptId, authContext.user.id);
      return NextResponse.json({ message: "Prompt deleted successfully" });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
