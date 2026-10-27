import { NextRequest, NextResponse } from "next/server";
import {
  createEnquirySchema,
  type BusinessStatus,
  type EnquiryCategory,
  type CategorizationState,
  type EnquiryFilters,
  BUSINESS_STATUSES,
  CATEGORIES,
  CATEGORIZATION_STATES,
} from "@/lib/types";
import { createEnquiry, listEnquiries, getDashboardMetrics } from "@/lib/db";
import { executeCategorization } from "@/lib/categorization";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const statusParam = searchParams.get("status") || undefined;
    const categoryParam = searchParams.get("category") || undefined;
    const stateParam = searchParams.get("categorizationState") || undefined;
    const search = searchParams.get("search") || undefined;

    const filters: EnquiryFilters = {};

    if (statusParam && BUSINESS_STATUSES.includes(statusParam as BusinessStatus)) {
      filters.status = statusParam as BusinessStatus;
    }

    if (categoryParam && CATEGORIES.includes(categoryParam as EnquiryCategory)) {
      filters.category = categoryParam as EnquiryCategory;
    }

    if (stateParam && CATEGORIZATION_STATES.includes(stateParam as CategorizationState)) {
      filters.categorizationState = stateParam as CategorizationState;
    }

    if (search && search.trim()) {
      filters.search = search.trim();
    }

    const enquiries = listEnquiries(filters);
    const metrics = getDashboardMetrics();

    return NextResponse.json({
      success: true,
      enquiries,
      metrics,
    });
  } catch (error: unknown) {
    console.error("Error fetching enquiries:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve enquiries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const parseResult = createEnquirySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fieldErrors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, message } = parseResult.data;

    // Step 1: Persist the enquiry in SQLite BEFORE attempting categorization
    const initialEnquiry = createEnquiry({
      name,
      email,
      message,
      status: "New",
      categorizationState: "Pending",
      category: null,
    });

    // Step 2: Attempt AI categorization safely
    const finalEnquiry = await executeCategorization(initialEnquiry);

    return NextResponse.json(
      {
        success: true,
        enquiry: finalEnquiry,
        message:
          finalEnquiry.categorizationState === "Completed"
            ? "Enquiry submitted and categorized successfully"
            : "Enquiry submitted successfully. AI categorization was marked for retry.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating enquiry:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process enquiry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
