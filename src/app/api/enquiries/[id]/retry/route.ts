import { NextRequest, NextResponse } from "next/server";
import { getEnquiryById } from "@/lib/db";
import { executeCategorization } from "@/lib/categorization";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const existing = getEnquiryById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry categorization: Enquiry with ID '${id}' does not exist`,
        },
        { status: 404 }
      );
    }

    // Execute categorization for this existing record without duplicating
    const updated = await executeCategorization(existing);

    const isSuccess = updated.categorizationState === "Completed";

    return NextResponse.json(
      {
        success: isSuccess,
        enquiry: updated,
        message: isSuccess
          ? `Categorization succeeded on retry: categorized as '${updated.category}'`
          : "Categorization retry failed. Enquiry remains safely stored with 'Failed' state.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error retrying categorization:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retry categorization",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
