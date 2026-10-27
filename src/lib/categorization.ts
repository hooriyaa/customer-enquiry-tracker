// modified- preserved copy
import {
  type Enquiry,
  type EnquiryCategory,
  CATEGORIES,
} from "./types";
import { updateEnquiryCategorization } from "./db";
import type Database from "better-sqlite3";

export interface CategorizationResult {
  success: boolean;
  category?: EnquiryCategory;
  error?: string;
}

export function getCategorizationUrl(): string {
  return process.env.AI_CATEGORIZATION_URL || "http://127.0.0.1:8787/categorize";
}

export async function requestCategorization(
  id: string,
  message: string,
  timeoutMs: number = 5000,
  urlOverride?: string
): Promise<CategorizationResult> {
  const url = urlOverride || getCategorizationUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enquiryId: id,
        id,
        message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorBody = "";
      try {
        errorBody = await res.text();
      } catch {
        // ignore text parsing error
      }
      return {
        success: false,
        error: `Categorization service returned HTTP ${res.status}: ${errorBody || res.statusText}`,
      };
    }

    const data = (await res.json()) as { category?: string };

    if (!data || typeof data.category !== "string") {
      return {
        success: false,
        error: "Categorization service returned malformed response missing 'category' string",
      };
    }

    const trimmedCategory = data.category.trim();
    if (!CATEGORIES.includes(trimmedCategory as EnquiryCategory)) {
      return {
        success: false,
        error: `Categorization service returned invalid category '${trimmedCategory}'. Expected one of: ${CATEGORIES.join(", ")}`,
      };
    }

    return {
      success: true,
      category: trimmedCategory as EnquiryCategory,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Categorization request timed out after " + timeoutMs + "ms"
          : err.message
        : "Unknown network error";

    return {
      success: false,
      error: `Failed to connect to categorization service: ${errorMessage}`,
    };
  }
}

/**
 * Executes the full categorization workflow for an enquiry.
 * Persists the outcome ('Completed' or 'Failed') safely in the database.
 * Never throws or loses the original enquiry.
 */
export async function executeCategorization(
  enquiry: Enquiry,
  options?: {
    dbOverride?: Database.Database;
    timeoutMs?: number;
    urlOverride?: string;
  }
): Promise<Enquiry> {
  const result = await requestCategorization(
    enquiry.id,
    enquiry.message,
    options?.timeoutMs,
    options?.urlOverride
  );

  if (result.success && result.category) {
    const updated = updateEnquiryCategorization(
      enquiry.id,
      result.category,
      "Completed",
      options?.dbOverride
    );
    return updated || enquiry;
  }

  // Failure: update state to Failed, category remains null
  const failed = updateEnquiryCategorization(
    enquiry.id,
    null,
    "Failed",
    options?.dbOverride
  );
  return failed || enquiry;
}
