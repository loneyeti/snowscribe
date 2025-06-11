import { NextResponse } from "next/server";
import * as aiVendorService from "@/lib/services/aiVendorService";
import { getErrorMessage } from "@/lib/utils";
import { aiVendorSchema } from "@/lib/schemas/aiVendor.schema";

interface VendorParams {
  vendorId: string;
}

export async function GET(
  request: Request,
  { params }: { params: VendorParams }
) {
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
      { status: message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: VendorParams }
) {
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
    return NextResponse.json(
      { error: message },
      { 
        status: message.includes('Forbidden') ? 403 :
               message.includes('already exists') ? 409 :
               500 
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: VendorParams }
) {
  try {
    await aiVendorService.deleteAIVendor(params.vendorId);
    return NextResponse.json(
      { message: "AI vendor deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { 
        status: message.includes('Forbidden') ? 403 :
               message.includes('referenced') ? 409 :
               500 
      }
    );
  }
}
