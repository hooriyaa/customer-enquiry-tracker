// modified- preserved copy
import { z } from "zod";

export const CATEGORIES = ["Sales", "Support", "Billing", "Other"] as const;
export type EnquiryCategory = (typeof CATEGORIES)[number];

export const BUSINESS_STATUSES = ["New", "In Progress", "Resolved"] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const CATEGORIZATION_STATES = ["Pending", "Completed", "Failed"] as const;
export type CategorizationState = (typeof CATEGORIZATION_STATES)[number];

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string; // ISO 8601 timestamp string
  status: BusinessStatus;
  category: EnquiryCategory | null;
  categorizationState: CategorizationState;
}

/**
 * Strict, practical email regex requiring:
 * 1. Valid local-part (alphanumeric with single non-consecutive dots/hyphens/plus/underscores, no spaces)
 * 2. Exactly one @
 * 3. Valid domain name (alphanumeric labels separated by single dots)
 * 4. Valid TLD of at least 2 alphabetic characters (rejects missing TLD like abc@gmail)
 */
export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

export const createEnquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .regex(STRICT_EMAIL_REGEX, "Please provide a valid email address (e.g. name@domain.com)"),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(5000, "Message cannot exceed 5,000 characters"),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const updateStatusSchema = z.object({
  status: z.enum(BUSINESS_STATUSES, {
    errorMap: () => ({ message: "Status must be 'New', 'In Progress', or 'Resolved'" }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export interface EnquiryFilters {
  status?: BusinessStatus;
  category?: EnquiryCategory;
  categorizationState?: CategorizationState;
  search?: string;
}

export interface DashboardMetrics {
  total: number;
  newCount: number;
  inProgressCount: number;
  resolvedCount: number;
  failedCategorizationCount: number;
}
