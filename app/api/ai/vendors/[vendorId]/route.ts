import { NextResponse, type NextRequest } from "next/server";
import * as aiVendorService from "@/lib/services/aiVendorService";
import { getErrorMessage } from "@/lib/utils";
import { aiVendorSchema } from "@/lib/schemas/aiVendor.schema";
import { withAdminAuth } from "@/lib/api/utils";

interface VendorParams {
  vendorId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: VendorParams }
) {
  return withAdminAuth(request, async () => {
    try {
      const vendor = await aiVendorService.getAIVendorById(params.vendorId);
      if (!vendor) {
        return NextResponse.json(
          { error: "AI vendor not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(vendor);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: VendorParams }
) {
  return withAdminAuth(request, async () => {
    try {
      const json = await request.json();
      const result = aiVendorSchema.partial().safeParse(json);
      
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.format() },
          { status: 400 }
        );
      }

      const updatedVendor = await aiVendorService.updateAIVendor(
        params.vendorId,
        result.data
      );
      return NextResponse.json(updatedVendor);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: VendorParams }
) {
  return withAdminAuth(request, async () => {
    try {
      await aiVendorService.deleteAIVendor(params.vendorId);
      return NextResponse.json(
        { message: "AI vendor deleted successfully" },
        { status: 200 }
      );
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('referenced')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}
