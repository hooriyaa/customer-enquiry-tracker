// modified- preserved copy
import { NextRequest, NextResponse } from "next/server";
import { updateStatusSchema } from "@/lib/types";
import { getEnquiryById, updateEnquiryStatus } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  try {
    const enquiry = getEnquiryById(id);

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          error: `Enquiry with ID '${id}' was not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiry,
    });
  } catch (error: unknown) {
    console.error(`[API Error] Failed to retrieve enquiry '${id}':`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve enquiry",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  try {
    const existing = getEnquiryById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Enquiry with ID '${id}' was not found`,
        },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    const parseResult = updateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed for business status update",
          fieldErrors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = updateEnquiryStatus(id, parseResult.data.status);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update status for enquiry '${id}'`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiry: updated,
      message: `Status updated to '${parseResult.data.status}'`,
    });
  } catch (error: unknown) {
    console.error(`[API Error] Failed to update enquiry status '${id}':`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update enquiry status",
      },
      { status: 500 }
    );
  }
}
