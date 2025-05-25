import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiPromptSchema } from "@/lib/schemas/aiPrompt.schema";
import { verifyProjectOwnership } from "@/lib/supabase/guards";

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/ai/prompts - Request received');
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('[API] GET /api/ai/prompts - Unauthorized:', userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const scope = searchParams.get("scope"); // 'global', 'user', 'project'
  const category = searchParams.get("category"); // Filter by category
  
  console.log('[API] GET /api/ai/prompts - Query params:', {
    projectId,
    scope,
    category,
    hasUser: !!user,
    userId: user.id
  });

  // Only select the fields we need to avoid unnecessary joins
  let query = supabase.from("ai_prompts").select(`
    id,
    name,
    prompt_text,
    category,
    project_id,
    user_id,
    created_at,
    updated_at
  `);
  
  console.log('[API] GET /api/ai/prompts - Base query created');

  if (category) {
    console.log(`[API] GET /api/ai/prompts - Filtering by category: ${category}`);
    query = query.eq("category", category);
    
    // For global scope or when no scope is specified, only return prompts with no user_id and no project_id
    if (scope === 'global' || !scope) {
      console.log(`[API] GET /api/ai/prompts - Filtering by global scope`);
      query = query.is("user_id", null).is("project_id", null);
    } else if (scope === 'user') {
      console.log(`[API] GET /api/ai/prompts - Filtering by user scope`);
      query = query.eq("user_id", user.id).is("project_id", null);
    }
  } else if (projectId) {
    // Verify project ownership if project_id is provided
    const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
    if (ownershipVerification.error) {
      return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
    }
    query = query.eq("project_id", projectId);
  } else if (scope === 'user') {
    query = query.eq("user_id", user.id).is("project_id", null);
  } else if (scope === 'global') {
    query = query.is("user_id", null).is("project_id", null);
  } else {
    // Default: fetch user's prompts and global prompts if no specific project or scope
    query = query.or(`user_id.eq.${user.id},and(user_id.is.null,project_id.is.null)`);
  }
  
  query = query.order("name", { ascending: true });

  console.log('[API] GET /api/ai/prompts - Executing query...');
  const { data: prompts, error: promptsError } = await query;

  if (promptsError) {
    console.error('[API] GET /api/ai/prompts - Error executing query:', promptsError);
    return NextResponse.json(
      { error: "Failed to fetch AI prompts" },
      { status: 500 }
    );
  }

  console.log(`[API] GET /api/ai/prompts - Query successful, found ${prompts?.length || 0} prompts`);
  if (prompts && prompts.length > 0) {
    console.log('[API] GET /api/ai/prompts - First prompt details:', {
      id: prompts[0].id,
      name: prompts[0].name,
      category: prompts[0].category,
      prompt_text_length: prompts[0].prompt_text?.length
    });
  }

  return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const result = aiPromptSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.format() },
      { status: 400 }
    );
  }

  const { project_id, name, prompt_text, category } = result.data; // Removed model_id
  let userIdForInsert: string | null = user.id;

  if (project_id) {
    const ownershipVerification = await verifyProjectOwnership(supabase, project_id, user.id);
    if (ownershipVerification.error) {
      return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
    }
    // If it's a project prompt, user_id on the prompt itself can be null
    // as ownership is through the project.
    // However, for user-specific global prompts, user_id must be set.
    // The schema allows user_id to be null.
  } else if (!project_id && !result.data.user_id) {
    // If not a project prompt and user_id is not explicitly set in payload for a global-user prompt,
    // assign current user. If it's meant to be truly global, user_id in payload should be null.
     userIdForInsert = user.id;
  } else if (!project_id && result.data.user_id && result.data.user_id !== user.id) {
    // User is trying to create a prompt for another user, not allowed unless admin (not implemented)
     return NextResponse.json({ error: "Cannot create prompts for another user." }, { status: 403 });
  } else if (!project_id && result.data.user_id === null) {
    // This is a truly global prompt, only service role should do this.
    // For now, we'll prevent users from creating truly global prompts directly.
    // They can create user-specific global prompts (user_id set, project_id null)
    // Or project-specific prompts.
    // To make a prompt truly global, it would be done via service_role or admin interface.
    // So, if user_id is explicitly null and no project_id, it's an attempt to make a global prompt.
    return NextResponse.json({ error: "User cannot create truly global prompts." }, { status: 403 });
  }

  // Define the type for insertData based on expected fields in ai_prompts table
  type AIPromptInsertData = {
    name: string;
    prompt_text: string;
    category?: string | null;
    project_id?: string | null;
    user_id?: string | null;
    // model_id?: string | null; // model_id is not in schema, so removed for now
  };

  const insertData: AIPromptInsertData = { name, prompt_text, category, project_id };
  if (project_id) {
    insertData.user_id = null; // Project prompts are not directly tied to a user on the prompt record
  } else {
    insertData.user_id = userIdForInsert; // User-specific global or if user_id was in payload
  }

  // model_id validation removed as it's not in the schema

  const { data: newPrompt, error: insertError } = await supabase
    .from("ai_prompts")
    .insert([insertData])
    .select(`
      *,
      projects (id, title),
      users (id) 
      // ai_models (id, name, api_name) // Removed as model_id is not part of prompt
    `)
    .single();

  if (insertError) {
    console.error("Error creating AI prompt:", insertError);
    if (insertError.code === "23505") { // Unique constraint violation
      return NextResponse.json(
        { error: "AI prompt with this name already exists for the given scope (project/user/global)." },
        { status: 409 }
      );
    }
    if (insertError.code === "23503") { // Foreign key constraint (e.g. project_id invalid)
        let fkErrorMsg = "Failed to create AI prompt due to invalid reference.";
        if (insertError.message.includes("project_id")) {
            fkErrorMsg = "Invalid project_id. Project does not exist.";
        }
        // model_id check removed
         return NextResponse.json({ error: fkErrorMsg }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create AI prompt" },
      { status: 500 }
    );
  }

  return NextResponse.json(newPrompt, { status: 201 });
}
