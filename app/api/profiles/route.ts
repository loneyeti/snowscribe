import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/utils';
import { getProfileForUser } from '@/lib/services/profileService';
import { getErrorMessage } from '@/lib/utils';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: Request, authContext: { user: { id: string } }) => {
    try {
      const profile = await getProfileForUser(authContext.user.id);
      return NextResponse.json(profile);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

// Removed POST handler - credit updates now handled directly via RPC call in AISMessageHandler
