import { NextResponse } from "next/server";
import * as aiPromptService from "@/lib/services/aiPromptService";
import { getErrorMessage } from "@/lib/utils";
import { aiPromptSchema } from "@/lib/schemas/aiPrompt.schema";
import { withAuth } from "@/lib/api/utils";
import { z } from "zod";

export async function GET(request: Request) {
  return withAuth(request, async (req, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');
      const scope = searchParams.get('scope') as 'global' | 'user' | 'project' | null;
      const category = searchParams.get('category');

      const filter = {
        ...(projectId && { projectId }),
        ...(scope && { scope }),
        ...(category && { category })
      };

      const prompts = await aiPromptService.getAIPrompts(authContext.user.id, filter);
      return NextResponse.json(prompts);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (req, authContext) => {
    try {
      const json = await request.json();
      const validatedData = aiPromptSchema.parse(json);
      
      const newPrompt = await aiPromptService.createAIPrompt(
        authContext.user.id, 
        validatedData
      );
      return NextResponse.json(newPrompt, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: error instanceof z.ZodError ? 400 : 500 }
      );
    }
  });
}
