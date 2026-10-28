// modified- preserved copy
import { NextRequest, NextResponse } from "next/server";
import { getEnquiryById, claimEnquiryForRetry } from "@/lib/db";
import { executeCategorization } from "@/lib/categorization";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  try {
    const existing = getEnquiryById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry categorization: Enquiry with ID '${id}' was not found`,
        },
        { status: 404 }
      );
    }

    // Validation: Only allow retry when categorizationState is 'Failed'
    if (existing.categorizationState === "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry categorization: Enquiry is already completed with category '${existing.category}'`,
        },
        { status: 400 }
      );
    }

    if (existing.categorizationState === "Pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot retry categorization: Enquiry categorization is currently pending",
        },
        { status: 400 }
      );
    }

    if (existing.categorizationState !== "Failed") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry categorization: Enquiry state is '${existing.categorizationState}', expected 'Failed'`,
        },
        { status: 400 }
      );
    }

    // Atomic claim guard: Prevent concurrent retries on the same record
    const claimed = claimEnquiryForRetry(id);
    if (!claimed) {
      return NextResponse.json(
        {
          success: false,
          error: "Enquiry is currently being processed or is no longer in a failed state",
        },
        { status: 409 }
      );
    }

    // Execute categorization for this existing record without duplicating.
    // Business status ('New', 'In Progress', 'Resolved') is strictly preserved.
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
    // Log diagnostic error server-side without leaking raw internal stack traces or secrets to clients
    console.error(`[API Error] Failed to retry categorization for enquiry '${id}':`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retry categorization",
      },
      { status: 500 }
    );
  }
}

