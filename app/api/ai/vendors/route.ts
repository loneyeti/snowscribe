import { NextResponse, type NextRequest } from "next/server";
import * as aiVendorService from "@/lib/services/aiVendorService";
import { getErrorMessage } from "@/lib/utils";
import { aiVendorSchema } from "@/lib/schemas/aiVendor.schema";
import { withAdminAuth } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const vendors = await aiVendorService.getAIVendors();
      return NextResponse.json(vendors);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const json = await request.json();
      const result = aiVendorSchema.safeParse(json);
      
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 }
        );
      }

      const newVendor = await aiVendorService.createAIVendor(result.data);
      return NextResponse.json(newVendor, { status: 201 });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('already exists')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
