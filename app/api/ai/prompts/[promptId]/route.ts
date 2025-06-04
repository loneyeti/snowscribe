import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiPromptSchema } from "@/lib/schemas/aiPrompt.schema";
// verifyProjectOwnership is not used in this file with the current logic for prompts.

async function getPromptWithOwnershipCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  promptId: string,
  userId: string
) {
  const { data: prompt, error } = await supabase
    .from("ai_prompts")
    .select(`
      *,
      projects (id, title, user_id)
    `)
    .eq("id", promptId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching AI prompt for ownership check:", error);
    return { error: { message: "Failed to fetch AI prompt", details: error }, status: 500, prompt: null };
  }

  if (!prompt) {
    return { error: { message: "AI prompt not found" }, status: 404, prompt: null };
  }

  // Only check ownership if prompt is project-specific or user-specific
  if (prompt.project_id) {
    if (!prompt.projects || prompt.projects.user_id !== userId) {
      return { error: { message: "Forbidden: You do not own the project this prompt belongs to." }, status: 403, prompt: null };
    }
  } else if (prompt.user_id) {
    if (prompt.user_id !== userId) {
      return { error: { message: "Forbidden: You do not own this prompt." }, status: 403, prompt: null };
    }
  }
  // Global prompts (no project_id or user_id) are accessible to all authenticated users

  return { prompt, error: null, status: 200 };
}


export async function GET(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { promptId } = await params;
  if (!promptId) {
    return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  }

  const { prompt, error: checkError, status } = await getPromptWithOwnershipCheck(supabase, promptId, user.id);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status });
  }
  
  // For GET, if it's a truly global prompt, it's okay to return it.
  // The ownership check in getPromptWithOwnershipCheck handles project/user specific prompts.
  // If prompt is null here and no error, it means it was not found by getPromptWithOwnershipCheck.
  if (!prompt) {
      return NextResponse.json({ error: "AI prompt not found or access denied." }, { status: 404 });
  }

  // Omit sensitive project user_id from the response if not needed
  if (prompt.projects) {
    delete prompt.projects.user_id; // user_id might not exist on projects if not selected, or if projects is null.
  }


  return NextResponse.json(prompt);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { promptId } = await params;
  if (!promptId) {
    return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  }

  const { prompt: existingPrompt, error: checkError, status: checkStatus } = await getPromptWithOwnershipCheck(supabase, promptId, user.id);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: checkStatus });
  }
  if (!existingPrompt) {
     return NextResponse.json({ error: "AI prompt not found or access denied for update." }, { status: 404 });
  }

  // Global prompts (no project_id or user_id) can be updated by any authenticated user

  const json = await request.json();
  const result = aiPromptSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  const { name, prompt_text, category, project_id: new_project_id, user_id: new_user_id } = result.data;

  // Prevent changing ownership structure in ways that violate logic
  if (existingPrompt.project_id && new_project_id !== existingPrompt.project_id) {
    return NextResponse.json({ error: "Cannot change the project of a project-specific prompt." }, { status: 400 });
  }
  if (existingPrompt.user_id && new_user_id !== existingPrompt.user_id) {
     return NextResponse.json({ error: "Cannot change the user ownership of a user-specific prompt." }, { status: 400 });
  }
   if (existingPrompt.project_id && new_user_id) {
    return NextResponse.json({ error: "Project-specific prompts cannot be assigned a user_id." }, { status: 400 });
  }
  if (existingPrompt.user_id && new_project_id) {
    return NextResponse.json({ error: "User-specific global prompts cannot be assigned a project_id." }, { status: 400 });
  }


  // Prepare update data, ensuring project_id and user_id are handled correctly based on prompt type
  const updateData: Partial<typeof result.data> = { name, prompt_text, category };

  if (existingPrompt.project_id) {
    // This is a project prompt, project_id should not change, user_id on prompt record remains null
    updateData.project_id = existingPrompt.project_id;
    updateData.user_id = null;
  } else if (existingPrompt.user_id) {
    // This is a user-specific global prompt, user_id should not change, project_id remains null
    updateData.user_id = existingPrompt.user_id;
    updateData.project_id = null;
  } else {
    // This is a truly global prompt, both project_id and user_id should remain null
    updateData.project_id = null;
    updateData.user_id = null;
  }

  const { data: updatedPrompt, error: updateError } = await supabase
    .from("ai_prompts")
    .update(updateData)
    .eq("id", promptId)
    .select(`
      *,
      projects (id, title)
    `)
    .maybeSingle();

  if (updateError) {
    console.error("Error updating AI prompt:", updateError);
    if (updateError.code === "23505") { // Unique constraint violation
      return NextResponse.json(
        { error: "AI prompt with this name already exists for the given scope." },
        { status: 409 }
      );
    }
    if (updateError.code === "23503" && updateData.project_id) { // FK violation on project_id if it was somehow changed
      return NextResponse.json({ error: "Invalid project_id. Project does not exist." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update AI prompt", details: updateError.message },
      { status: 500 }
    );
  }
  
  if (!updatedPrompt) {
    // This could happen if the prompt was deleted between the check and update
    return NextResponse.json({ error: "AI prompt not found or no changes were made" }, { status: 404 });
  }

  return NextResponse.json(updatedPrompt);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { promptId } = await params;
  if (!promptId) {
    return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  }

  const { prompt: existingPrompt, error: checkError, status: checkStatus } = await getPromptWithOwnershipCheck(supabase, promptId, user.id);

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: checkStatus });
  }
   if (!existingPrompt) {
     return NextResponse.json({ error: "AI prompt not found or access denied for delete." }, { status: 404 });
  }

  // Global prompts (no project_id or user_id) can be deleted by any authenticated user

  const { error: deleteError } = await supabase
    .from("ai_prompts")
    .delete()
    .eq("id", promptId);

  if (deleteError) {
    console.error("Error deleting AI prompt:", deleteError);
    if (deleteError.code === "PGRST116") { // Should be caught by initial check
      return NextResponse.json({ error: "AI prompt not found" }, { status: 404 });
    }
    // Foreign key constraints (e.g., if prompts are used in ai_interactions) are not handled here yet
    // but could be added if necessary (e.g. error.code === '23503')
    return NextResponse.json(
      { error: "Failed to delete AI prompt" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "AI prompt deleted successfully" }, { status: 200 });
}
