import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiPromptSchema } from "@/lib/schemas/aiPrompt.schema";
// verifyProjectOwnership is not used in this file with the current logic for prompts.

async function getPromptWithOwnershipCheck(
  supabase: Awaited<ReturnType<typeof createClient>>, // Corrected type
  promptId: string,
  userId: string
) {
  const { data: prompt, error } = await supabase // supabase is now correctly typed
    .from("ai_prompts")
    .select(`
      *,
      projects (id, title, user_id),
      users (id)
    `)
    .eq("id", promptId)
    .maybeSingle(); // Use maybeSingle to handle not found gracefully

  if (error) {
    console.error("Error fetching AI prompt for ownership check:", error);
    return { error: { message: "Failed to fetch AI prompt", details: error }, status: 500, prompt: null };
  }

  if (!prompt) {
    return { error: { message: "AI prompt not found" }, status: 404, prompt: null };
  }

  // Check ownership
  if (prompt.project_id) {
    // Project-specific prompt
    if (prompt.projects?.user_id !== userId) {
      return { error: { message: "Forbidden: You do not own the project this prompt belongs to." }, status: 403, prompt: null };
    }
  } else if (prompt.user_id) {
    // User-specific global prompt
    if (prompt.user_id !== userId) {
      return { error: { message: "Forbidden: You do not own this prompt." }, status: 403, prompt: null };
    }
  } else {
    // Truly global prompt (user_id is null, project_id is null)
    // These are generally readable by all authenticated users but not updatable/deletable by them.
    // For GET, this is fine. For PUT/DELETE, we'll add specific checks.
  }

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

  // Prevent users from updating truly global prompts
  if (!existingPrompt.project_id && !existingPrompt.user_id) {
    return NextResponse.json({ error: "Forbidden: Truly global prompts cannot be updated by users." }, { status: 403 });
  }

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
  }
  // No case for truly global prompts as they are blocked above.

  const { data: updatedPrompt, error: updateError } = await supabase
    .from("ai_prompts")
    .update(updateData)
    .eq("id", promptId)
    .select(`
      *,
      projects (id, title),
      users (id)
    `)
    .single();

  if (updateError) {
    console.error("Error updating AI prompt:", updateError);
    if (updateError.code === "PGRST116") { // Should be caught by initial check, but as a safeguard
      return NextResponse.json({ error: "AI prompt not found" }, { status: 404 });
    }
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
      { error: "Failed to update AI prompt" },
      { status: 500 }
    );
  }
  
  if (!updatedPrompt) {
    return NextResponse.json({ error: "AI prompt not found after update attempt" }, { status: 404 });
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

  // Prevent users from deleting truly global prompts
  if (!existingPrompt.project_id && !existingPrompt.user_id) {
    return NextResponse.json({ error: "Forbidden: Truly global prompts cannot be deleted by users." }, { status: 403 });
  }

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
