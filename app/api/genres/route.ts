import { NextResponse } from "next/server";
import * as genreService from "@/lib/services/genreService";
import { getErrorMessage } from "@/lib/utils";
import { withAuth } from "@/lib/api/utils";

export async function GET(request: Request) {
  // Use the withAuth wrapper to ensure the user is authenticated
  return withAuth(request, async () => {
    try {
      const genres = await genreService.getGenres();
      return NextResponse.json(genres);
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }
  });
}
