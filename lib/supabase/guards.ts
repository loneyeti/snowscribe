import { type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types'; // Import the Database type

interface ProjectVerificationSuccess {
  project: { id: string }; // Can be expanded if more project details are needed by callers
  error: null;
  status: 200;
}

interface ProjectVerificationFailure {
  project: null;
  error: { message: string };
  status: 400 | 401 | 403 | 404 | 500; // HTTP status codes
}

export type ProjectVerificationResult = ProjectVerificationSuccess | ProjectVerificationFailure;

/**
 * Verifies that a project exists and belongs to the authenticated user.
 * @param supabase The Supabase client instance.
 * @param projectId The ID of the project to verify.
 * @param userId The ID of the authenticated user.
 * @returns An object indicating success or failure of the verification.
 */
export async function verifyProjectOwnership(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string
): Promise<ProjectVerificationResult> {
  if (!projectId) {
    return { project: null, error: { message: 'Project ID is required for verification.' }, status: 400 };
  }
  if (!userId) {
    // This indicates the user is not authenticated, which should be checked before calling this guard.
    return { project: null, error: { message: 'User not authenticated. Cannot verify project ownership.' }, status: 401 };
  }

  const { data: projectData, error: fetchError } = await supabase
    .from('projects')
    .select('id') // Only select 'id', or more fields if consistently needed by callers
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    console.error(`Project ownership verification query failed for project ${projectId}, user ${userId}: ${fetchError.message}`);
    // PGRST116: "Searched for a single row, but found no rows" (project not found for user or doesn't exist)
    // Other codes might indicate a different server-side issue.
    const status = fetchError.code === 'PGRST116' ? 404 : 500;
    const message = status === 404 ? 'Project not found or access denied.' : 'Server error verifying project ownership.';
    return { project: null, error: { message }, status };
  }

  if (!projectData) {
    // This case should be covered by PGRST116, but acts as a fallback.
    return { project: null, error: { message: 'Project not found or access denied.' }, status: 404 };
  }

  return { project: projectData, error: null, status: 200 };
}
