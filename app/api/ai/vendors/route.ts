import { NextResponse, type NextRequest } from "next/server";
import * as aiVendorService from "@/lib/services/aiVendorService";
import { getErrorMessage } from "@/lib/utils";
import { aiVendorSchema } from "@/lib/schemas/aiVendor.schema";

export async function GET() {
  try {
    const vendors = await aiVendorService.getAIVendors();
    return NextResponse.json(vendors);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
