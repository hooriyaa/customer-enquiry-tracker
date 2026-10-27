// modified- preserved copy
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import {
  initSchema,
  createEnquiry,
  getEnquiryById,
  listEnquiries,
  updateEnquiryStatus,
  updateEnquiryCategorization,
  getDashboardMetrics,
} from "../src/lib/db";
import {
  createEnquirySchema,
  updateStatusSchema,
  type Enquiry,
} from "../src/lib/types";
import {
  requestCategorization,
  executeCategorization,
} from "../src/lib/categorization";
import { createMockServer } from "../scripts/mock-ai-service";

const TEST_PORT = 8788;
const TEST_AI_URL = `http://127.0.0.1:${TEST_PORT}/categorize`;

let mockServer: http.Server;
let testDb: Database.Database;
const testDbFile = path.join(process.cwd(), "data", "test-enquiries.db");

beforeAll(async () => {
  // Ensure data dir exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Clean previous test db
  if (fs.existsSync(testDbFile)) {
    try {
      fs.unlinkSync(testDbFile);
    } catch {
      // ignore
    }
  }

  testDb = new Database(testDbFile);
  initSchema(testDb);

  // Start test mock AI server
  mockServer = createMockServer();
  await new Promise<void>((resolve) => {
    mockServer.listen(TEST_PORT, "127.0.0.1", () => resolve());
  });
});

afterAll(async () => {
  if (mockServer) {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  }
  if (testDb) {
    testDb.close();
  }
  if (fs.existsSync(testDbFile)) {
    try {
      fs.unlinkSync(testDbFile);
    } catch {
      // ignore
    }
  }
});

beforeEach(() => {
  testDb.exec("DELETE FROM enquiries");
});

describe("Intevoris Customer Enquiry Tracker — Automated Test Suite", () => {
  // Scenario 1: Valid enquiry creation and schema validation
  it("1. Valid enquiry creation: validates payload and stores in SQLite", () => {
    const payload = {
      name: "Alice Johnson",
      email: "alice@intevoris.com",
      message: "We would like to request an enterprise sales demo for 50 seats.",
    };

    const parsed = createEnquirySchema.safeParse(payload);
    expect(parsed.success).toBe(true);

    const enquiry = createEnquiry(
      {
        name: payload.name,
        email: payload.email,
        message: payload.message,
      },
      testDb
    );

    expect(enquiry.id).toBeDefined();
    expect(enquiry.name).toBe("Alice Johnson");
    expect(enquiry.email).toBe("alice@intevoris.com");
    expect(enquiry.status).toBe("New");
    expect(enquiry.categorizationState).toBe("Pending");
    expect(enquiry.category).toBeNull();

    const retrieved = getEnquiryById(enquiry.id, testDb);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(enquiry.id);
  });

  // Scenario 2: Missing required fields and whitespace-only inputs
  it("2. Missing required fields: rejects empty or whitespace-only name, email, or message", () => {
    // Whitespace-only name
    const emptyName = createEnquirySchema.safeParse({
      name: "   ",
      email: "valid@example.com",
      message: "Valid enquiry message",
    });
    expect(emptyName.success).toBe(false);
    if (!emptyName.success) {
      expect(emptyName.error.flatten().fieldErrors.name).toContain("Name is required");
    }

    // Whitespace-only email
    const emptyEmail = createEnquirySchema.safeParse({
      name: "Alice",
      email: "   ",
      message: "Valid enquiry message",
    });
    expect(emptyEmail.success).toBe(false);
    if (!emptyEmail.success) {
      expect(emptyEmail.error.flatten().fieldErrors.email).toContain("Email is required");
    }

    // Whitespace-only message
    const emptyMessage = createEnquirySchema.safeParse({
      name: "Alice",
      email: "valid@example.com",
      message: "     ",
    });
    expect(emptyMessage.success).toBe(false);

    // Message too short (< 5 chars)
    const shortMessage = createEnquirySchema.safeParse({
      name: "Alice",
      email: "valid@example.com",
      message: "Hey",
    });
    expect(shortMessage.success).toBe(false);
    if (!shortMessage.success) {
      expect(shortMessage.error.flatten().fieldErrors.message).toContain("Message must be at least 5 characters");
    }
  });

  // Scenario 3: Strict email validation
  it("3. Strict email validation: rejects user-specified malformed emails", () => {
    // Exact user-specified edge cases:
    const userReportedInvalidEmails = [
      "abc@gmail",          // Missing TLD (.com, etc.)
      "hello@",             // Missing domain and TLD
      "user@@gmail.com",    // Duplicate @ symbols
      "user name@gmail.com",// Space in local part
      "user@gmail..com",    // Consecutive dots in domain
      "user.@gmail.com",    // Trailing dot in local part
      ".user@gmail.com",    // Leading dot in local part
      "@gmail.com",         // Missing local part
      "test@.com",          // Missing domain name
      "notanemail",         // No @ or domain
      "user@domain",        // Missing TLD
      "user@.domain.com",   // Leading dot in domain
    ];

    for (const email of userReportedInvalidEmails) {
      const result = createEnquirySchema.safeParse({
        name: "Test User",
        email,
        message: "Testing email validation thoroughly",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(
          /valid email address|Email is required/
        );
      }
    }
  });

  it("3b. Valid email addresses: accepts valid addresses across various top-level and subdomains", () => {
    const validEmails = [
      "alice@intevoris.com",
      "customer@gmail.com",
      "user@yahoo.co.uk",
      "founder@tech.io",
      "sarah.jenkins@acme-corp.com",
      "david+filters@fintech-ventures.io",
      "elena_rostova@techstart.de",
      "support@sub.domain.org",
      "executive@enterprise.solutions",
    ];

    for (const email of validEmails) {
      const result = createEnquirySchema.safeParse({
        name: "Legitimate User",
        email,
        message: "This is a legitimate customer enquiry for the platform.",
      });
      expect(result.success).toBe(true);
    }
  });

  it("3c. API route safety: direct invalid submission does NOT create SQLite records", () => {
    const countBefore = (testDb.prepare("SELECT COUNT(*) as c FROM enquiries").get() as { c: number }).c;

    const invalidPayload = {
      name: "Bad Submitter",
      email: "abc@gmail", // Malformed
      message: "Testing that DB is never touched",
    };

    const parsed = createEnquirySchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);

    // Verify record was not inserted
    const countAfter = (testDb.prepare("SELECT COUNT(*) as c FROM enquiries").get() as { c: number }).c;
    expect(countAfter).toBe(countBefore);
  });

  // Scenario 4: Successful categorization across all 4 categories
  it("4. Successful categorization: categorizes Sales, Support, Billing, and Other correctly", async () => {
    // 4a. Sales
    const salesEnquiry = createEnquiry(
      {
        name: "Bob Builder",
        email: "bob@company.com",
        message: "Can we get pricing for your enterprise plan and quote?",
      },
      testDb
    );
    const categorizedSales = await executeCategorization(salesEnquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(categorizedSales.categorizationState).toBe("Completed");
    expect(categorizedSales.category).toBe("Sales");

    // 4b. Support
    const supportEnquiry = createEnquiry(
      {
        name: "Elena Tech",
        email: "elena@techstart.de",
        message: "Our application threw an unexpected error crash bug during CSV report export.",
      },
      testDb
    );
    const categorizedSupport = await executeCategorization(supportEnquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(categorizedSupport.categorizationState).toBe("Completed");
    expect(categorizedSupport.category).toBe("Support");

    // 4c. Billing
    const billingEnquiry = createEnquiry(
      {
        name: "David Chen",
        email: "david@fintech-ventures.io",
        message: "We need an updated receipt and credit card refund for billing invoice #994.",
      },
      testDb
    );
    const categorizedBilling = await executeCategorization(billingEnquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(categorizedBilling.categorizationState).toBe("Completed");
    expect(categorizedBilling.category).toBe("Billing");

    // 4d. Other
    const otherEnquiry = createEnquiry(
      {
        name: "General Visitor",
        email: "visitor@outlook.com",
        message: "Just sending a friendly hello and compliment on your corporate aesthetic and website.",
      },
      testDb
    );
    const categorizedOther = await executeCategorization(otherEnquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(categorizedOther.categorizationState).toBe("Completed");
    expect(categorizedOther.category).toBe("Other");

    // Verify all 4 persisted correctly in DB
    expect(getEnquiryById(salesEnquiry.id, testDb)?.category).toBe("Sales");
    expect(getEnquiryById(supportEnquiry.id, testDb)?.category).toBe("Support");
    expect(getEnquiryById(billingEnquiry.id, testDb)?.category).toBe("Billing");
    expect(getEnquiryById(otherEnquiry.id, testDb)?.category).toBe("Other");
  });

  // Scenario 5: Mock service unavailable
  it("5. Mock service unavailable: persists enquiry safely with Failed state", async () => {
    const enquiry = createEnquiry(
      {
        name: "Offline Test",
        email: "offline@test.com",
        message: "Need urgent support with system outage",
      },
      testDb
    );

    // Call an unreachable port (e.g., 9999)
    const categorized = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: "http://127.0.0.1:9999/categorize",
      timeoutMs: 1000,
    });

    expect(categorized.categorizationState).toBe("Failed");
    expect(categorized.category).toBeNull();

    // Verify enquiry still exists intact in SQLite!
    const fromDb = getEnquiryById(enquiry.id, testDb);
    expect(fromDb).not.toBeNull();
    expect(fromDb?.name).toBe("Offline Test");
    expect(fromDb?.categorizationState).toBe("Failed");
  });

  // Scenario 6: Invalid categorization response
  it("6. Invalid categorization response: rejects invalid category and sets Failed", async () => {
    // Create custom test server returning bad category
    const badCategoryServer = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ category: "UnrecognizedCategory123" }));
    });

    const badPort = 8789;
    await new Promise<void>((r) => badCategoryServer.listen(badPort, "127.0.0.1", () => r()));

    const enquiry = createEnquiry(
      {
        name: "Invalid Category Test",
        email: "invalid@category.com",
        message: "General enquiry message",
      },
      testDb
    );

    const result = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: `http://127.0.0.1:${badPort}/categorize`,
    });

    expect(result.categorizationState).toBe("Failed");
    expect(result.category).toBeNull();

    await new Promise<void>((r) => badCategoryServer.close(() => r()));
  });

  // Scenario 7: Persistence despite AI failure
  it("7. Persistence despite AI failure: enquiry remains queryable in DB", async () => {
    const enquiry = createEnquiry(
      {
        name: "Carol Danvers",
        email: "carol@marvel.com",
        message: "Question regarding billing invoice and receipts [FAIL_ONCE]",
      },
      testDb
    );

    // First attempt will fail due to [FAIL_ONCE]
    const firstAttempt = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });

    expect(firstAttempt.categorizationState).toBe("Failed");

    // Must be queryable by listEnquiries
    const failedList = listEnquiries({ categorizationState: "Failed" }, testDb);
    expect(failedList.length).toBe(1);
    expect(failedList[0].id).toBe(enquiry.id);
  });

  // Scenario 8: Successful retry after temporary failure ([FAIL_ONCE])
  it("8. Successful retry after temporary failure: [FAIL_ONCE] recovers on retry", async () => {
    const enquiry = createEnquiry(
      {
        name: "Dave Miller",
        email: "dave@example.com",
        message: "I need a discount quote on sales pricing [FAIL_ONCE]",
      },
      testDb
    );

    // 1st attempt fails
    const attempt1 = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(attempt1.categorizationState).toBe("Failed");

    // 2nd attempt (retry) succeeds!
    const attempt2 = await executeCategorization(attempt1, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });
    expect(attempt2.categorizationState).toBe("Completed");
    expect(attempt2.category).toBe("Sales");
  });

  // Scenario 9: Retry without duplicate records
  it("9. Retry without duplicate records: updates existing record and record count stays 1", async () => {
    const enquiry = createEnquiry(
      {
        name: "Duplicate Check",
        email: "dup@example.com",
        message: "Payment receipt billing issue [FAIL_ONCE]",
      },
      testDb
    );

    const countBefore = (testDb.prepare("SELECT COUNT(*) as c FROM enquiries").get() as { c: number }).c;
    expect(countBefore).toBe(1);

    // Initial failed attempt
    await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });

    // Retry attempt
    const retried = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });

    const countAfter = (testDb.prepare("SELECT COUNT(*) as c FROM enquiries").get() as { c: number }).c;
    expect(countAfter).toBe(1); // Still 1 record!
    expect(retried.id).toBe(enquiry.id);
    expect(retried.categorizationState).toBe("Completed");
    expect(retried.category).toBe("Billing");
  });

  // Scenario 10: Failed retry preserving the record
  it("10. Failed retry preserving the record: record is preserved if retry fails again", async () => {
    const enquiry = createEnquiry(
      {
        name: "Unreachable Retry",
        email: "unreachable@test.com",
        message: "System bug and crash report",
      },
      testDb
    );

    // First attempt against dead server
    await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: "http://127.0.0.1:9999/categorize",
      timeoutMs: 500,
    });

    // Retry again against dead server
    const retried = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: "http://127.0.0.1:9999/categorize",
      timeoutMs: 500,
    });

    expect(retried.categorizationState).toBe("Failed");
    const preserved = getEnquiryById(enquiry.id, testDb);
    expect(preserved).not.toBeNull();
    expect(preserved?.name).toBe("Unreachable Retry");
  });

  // Scenario 11: Valid business status updates
  it("11. Valid business status updates: transitions New -> In Progress -> Resolved", () => {
    const enquiry = createEnquiry(
      {
        name: "Status Tester",
        email: "status@test.com",
        message: "General question",
      },
      testDb
    );

    expect(enquiry.status).toBe("New");

    const inProgress = updateEnquiryStatus(enquiry.id, "In Progress", testDb);
    expect(inProgress?.status).toBe("In Progress");

    const resolved = updateEnquiryStatus(enquiry.id, "Resolved", testDb);
    expect(resolved?.status).toBe("Resolved");
  });

  // Scenario 12: Rejection of invalid statuses
  it("12. Rejection of invalid statuses: rejects non-permitted statuses via Zod", () => {
    const invalidStatuses = ["Closed", "Draft", "Archived", "Pending", "Deleted", ""];

    for (const status of invalidStatuses) {
      const parsed = updateStatusSchema.safeParse({ status });
      expect(parsed.success).toBe(false);
    }
  });

  // Scenario 13: Status, Category, and State filtering
  it("13. Status, Category, and State filtering: filters correctly and supports search", () => {
    createEnquiry(
      {
        name: "Zoe Sales",
        email: "zoe@sales.com",
        message: "Demo pricing inquiry",
        status: "New",
        category: "Sales",
        categorizationState: "Completed",
      },
      testDb
    );

    createEnquiry(
      {
        name: "Mark Support",
        email: "mark@support.com",
        message: "Application error crash",
        status: "In Progress",
        category: "Support",
        categorizationState: "Completed",
      },
      testDb
    );

    createEnquiry(
      {
        name: "Sarah Billing",
        email: "sarah@billing.com",
        message: "Invoice payment issue",
        status: "Resolved",
        category: "Billing",
        categorizationState: "Completed",
      },
      testDb
    );

    createEnquiry(
      {
        name: "Failed User",
        email: "failed@user.com",
        message: "Unprocessed inquiry",
        status: "New",
        category: null,
        categorizationState: "Failed",
      },
      testDb
    );

    // Filter by status
    const newEnquiries = listEnquiries({ status: "New" }, testDb);
    expect(newEnquiries.length).toBe(2);

    // Filter by category
    const salesEnquiries = listEnquiries({ category: "Sales" }, testDb);
    expect(salesEnquiries.length).toBe(1);
    expect(salesEnquiries[0].name).toBe("Zoe Sales");

    // Filter by state
    const failedEnquiries = listEnquiries({ categorizationState: "Failed" }, testDb);
    expect(failedEnquiries.length).toBe(1);
    expect(failedEnquiries[0].name).toBe("Failed User");

    // Search by text
    const searchByName = listEnquiries({ search: "Mark" }, testDb);
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].email).toBe("mark@support.com");

    const searchByEmail = listEnquiries({ search: "billing.com" }, testDb);
    expect(searchByEmail.length).toBe(1);

    const searchByMessage = listEnquiries({ search: "crash" }, testDb);
    expect(searchByMessage.length).toBe(1);
  });

  // Scenario 14: Unknown enquiry IDs
  it("14. Unknown enquiry IDs: returns null for nonexistent IDs", () => {
    const nonexistent = getEnquiryById("nonexistent-uuid-1234", testDb);
    expect(nonexistent).toBeNull();

    const updateAttempt = updateEnquiryStatus("nonexistent-uuid-1234", "In Progress", testDb);
    expect(updateAttempt).toBeNull();

    const catAttempt = updateEnquiryCategorization("nonexistent-uuid-1234", "Sales", "Completed", testDb);
    expect(catAttempt).toBeNull();
  });

  // Scenario 15: Persistence across reloads or server restarts
  it("15. Persistence across reloads: survives database disconnection and reconnect", () => {
    const enquiry = createEnquiry(
      {
        name: "Persistent User",
        email: "persist@db.com",
        message: "Survives database restarts",
        status: "In Progress",
        category: "Support",
        categorizationState: "Completed",
      },
      testDb
    );

    // Simulate process exit / database disconnect
    testDb.close();

    // Reopen from disk
    const reconnectedDb = new Database(testDbFile);
    initSchema(reconnectedDb);

    const retrieved = getEnquiryById(enquiry.id, reconnectedDb);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe("Persistent User");
    expect(retrieved?.status).toBe("In Progress");
    expect(retrieved?.category).toBe("Support");

    // Reassign testDb for subsequent tests
    testDb = reconnectedDb;
  });

  // Scenario 16: [INVALID_ONCE] recovery on retry
  it("16. [INVALID_ONCE] recovery on retry: first attempt invalid category, retry recovers", async () => {
    const enquiry = createEnquiry(
      {
        name: "Invalid Once Tester",
        email: "invalidonce@test.com",
        message: "Bug in software support needed [INVALID_ONCE]",
      },
      testDb
    );

    // First attempt: mock returns invalid category, so caller marks state as Failed
    const firstAttempt = await executeCategorization(enquiry, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });

    expect(firstAttempt.categorizationState).toBe("Failed");
    expect(firstAttempt.category).toBeNull();

    // Second attempt (retry): mock succeeds and returns valid category 'Support'
    const secondAttempt = await executeCategorization(firstAttempt, {
      dbOverride: testDb,
      urlOverride: TEST_AI_URL,
    });

    expect(secondAttempt.categorizationState).toBe("Completed");
    expect(secondAttempt.category).toBe("Support");
  });

  // Extra verification: Metrics calculation
  it("Extra: Dashboard metrics calculate live counts accurately", () => {
    createEnquiry({ name: "U1", email: "u1@test.com", message: "m1", status: "New", categorizationState: "Completed" }, testDb);
    createEnquiry({ name: "U2", email: "u2@test.com", message: "m2", status: "In Progress", categorizationState: "Completed" }, testDb);
    createEnquiry({ name: "U3", email: "u3@test.com", message: "m3", status: "Resolved", categorizationState: "Completed" }, testDb);
    createEnquiry({ name: "U4", email: "u4@test.com", message: "m4", status: "New", categorizationState: "Failed" }, testDb);

    const metrics = getDashboardMetrics(testDb);
    expect(metrics.total).toBe(4);
    expect(metrics.newCount).toBe(2);
    expect(metrics.inProgressCount).toBe(1);
    expect(metrics.resolvedCount).toBe(1);
    expect(metrics.failedCategorizationCount).toBe(1);
  });
});
