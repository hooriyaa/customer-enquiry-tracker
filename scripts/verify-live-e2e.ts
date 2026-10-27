async function runLiveE2E() {
  console.log("=== STARTING LIVE END-TO-END VERIFICATION ===");
  const baseUrl = "http://localhost:3000";

  // Check 1: Health check / GET enquiries
  console.log("\n--- TEST 1: Initial GET /api/enquiries ---");
  const res1 = await fetch(`${baseUrl}/api/enquiries`);
  if (!res1.ok) throw new Error(`GET /api/enquiries failed: ${res1.status}`);
  const data1 = await res1.json();
  console.log(`[PASS] GET /api/enquiries status: ${res1.status}`);
  console.log(`[PASS] Initial count: ${data1.enquiries.length}, Metrics:`, data1.metrics);

  const initialCount = data1.enquiries.length;

  // Check 2: Submit a valid customer enquiry (Sales)
  console.log("\n--- TEST 2: Submit Valid Enquiry (Sales) ---");
  const newEnquiryPayload = {
    name: "Auditor Jane",
    email: "jane.auditor@enterprise-ai.com",
    message: "We need an enterprise sales quote and pricing for 80 seats.",
  };
  const res2 = await fetch(`${baseUrl}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newEnquiryPayload),
  });
  if (res2.status !== 201) throw new Error(`POST /api/enquiries failed: ${res2.status}`);
  const data2 = await res2.json();
  console.log(`[PASS] POST /api/enquiries status: ${res2.status}`);
  console.log(`[PASS] Created ID: ${data2.enquiry.id}`);
  console.log(`[PASS] State: ${data2.enquiry.categorizationState}, Category: ${data2.enquiry.category}`);
  if (data2.enquiry.category !== "Sales" || data2.enquiry.categorizationState !== "Completed") {
    throw new Error(`Expected category 'Sales' and state 'Completed', got: ${data2.enquiry.category}, ${data2.enquiry.categorizationState}`);
  }
  const createdId = data2.enquiry.id;

  // Check 3: Confirm it appears in GET /api/enquiries (Persistence check)
  console.log("\n--- TEST 3: Confirm Persistence in Listing ---");
  const res3 = await fetch(`${baseUrl}/api/enquiries`);
  const data3 = await res3.json();
  const found = data3.enquiries.find((e: any) => e.id === createdId);
  if (!found) throw new Error(`Enquiry ${createdId} not found in database listing!`);
  console.log(`[PASS] Found enquiry in persistent listing: "${found.name}" (${found.email})`);
  if (data3.enquiries.length !== initialCount + 1) {
    throw new Error(`Count did not increment by 1. Expected ${initialCount + 1}, got ${data3.enquiries.length}`);
  }

  // Check 4: Update Business Status (PATCH /api/enquiries/:id)
  console.log("\n--- TEST 4: Update Business Status to 'In Progress' ---");
  const res4 = await fetch(`${baseUrl}/api/enquiries/${createdId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "In Progress" }),
  });
  if (res4.status !== 200) throw new Error(`PATCH /api/enquiries/:id failed: ${res4.status}`);
  const data4 = await res4.json();
  console.log(`[PASS] Status updated to: ${data4.enquiry.status}`);
  if (data4.enquiry.status !== "In Progress") {
    throw new Error(`Expected status 'In Progress', got ${data4.enquiry.status}`);
  }

  // Verify persistence of updated status
  const res4Verify = await fetch(`${baseUrl}/api/enquiries/${createdId}`);
  const data4Verify = await res4Verify.json();
  if (data4Verify.enquiry.status !== "In Progress") {
    throw new Error("Persisted status does not match updated status!");
  }
  console.log(`[PASS] Verified persisted status in DB: ${data4Verify.enquiry.status}`);

  // Check 5: Trigger [FAIL_ONCE] scenario
  console.log("\n--- TEST 5: Trigger [FAIL_ONCE] Scenario ---");
  const failOncePayload = {
    name: "Fail Tester",
    email: "failtester@example.com",
    message: "Requesting sales pricing information and discount rates [FAIL_ONCE]",
  };
  const res5 = await fetch(`${baseUrl}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(failOncePayload),
  });
  // Must return 201 because the enquiry was persisted!
  if (res5.status !== 201) throw new Error(`Expected 201 for enquiry creation, got ${res5.status}`);
  const data5 = await res5.json();
  console.log(`[PASS] Enquiry persisted despite AI failure: ID = ${data5.enquiry.id}`);
  console.log(`[PASS] State: ${data5.enquiry.categorizationState}, Category: ${data5.enquiry.category}`);
  if (data5.enquiry.categorizationState !== "Failed") {
    throw new Error(`Expected categorizationState 'Failed', got ${data5.enquiry.categorizationState}`);
  }
  const failOnceId = data5.enquiry.id;

  // Check 6: Retry [FAIL_ONCE] enquiry and confirm no duplication
  console.log("\n--- TEST 6: Retry [FAIL_ONCE] Enquiry ---");
  const listBeforeRetry = await (await fetch(`${baseUrl}/api/enquiries`)).json();
  const countBeforeRetry = listBeforeRetry.enquiries.length;

  const res6 = await fetch(`${baseUrl}/api/enquiries/${failOnceId}/retry`, {
    method: "POST",
  });
  if (res6.status !== 200) throw new Error(`Retry failed with status ${res6.status}`);
  const data6 = await res6.json();
  console.log(`[PASS] Retry response status: ${res6.status}`);
  console.log(`[PASS] After retry: State = ${data6.enquiry.categorizationState}, Category = ${data6.enquiry.category}`);
  if (data6.enquiry.categorizationState !== "Completed" || data6.enquiry.category !== "Sales") {
    throw new Error(`Expected Completed Sales after retry, got: ${data6.enquiry.categorizationState}, ${data6.enquiry.category}`);
  }

  // Verify total count did not increase (No duplicate record!)
  const listAfterRetry = await (await fetch(`${baseUrl}/api/enquiries`)).json();
  if (listAfterRetry.enquiries.length !== countBeforeRetry) {
    throw new Error(`Duplicate record detected! Count changed from ${countBeforeRetry} to ${listAfterRetry.enquiries.length}`);
  }
  console.log(`[PASS] Zero duplicate records verified: Count remains ${listAfterRetry.enquiries.length}`);

  // Check 7: Trigger [INVALID_ONCE] scenario and recover on retry
  console.log("\n--- TEST 7: Trigger [INVALID_ONCE] Scenario & Recovery ---");
  const invalidOncePayload = {
    name: "Invalid Once Tester",
    email: "invalid@example.com",
    message: "Invoice billing question and payment charge [INVALID_ONCE]",
  };
  const res7 = await fetch(`${baseUrl}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidOncePayload),
  });
  const data7 = await res7.json();
  console.log(`[PASS] [INVALID_ONCE] 1st attempt: State = ${data7.enquiry.categorizationState}, Category = ${data7.enquiry.category}`);
  if (data7.enquiry.categorizationState !== "Failed") {
    throw new Error(`Expected categorizationState 'Failed' on invalid category, got ${data7.enquiry.categorizationState}`);
  }

  // Retry the invalid once enquiry
  const res7Retry = await fetch(`${baseUrl}/api/enquiries/${data7.enquiry.id}/retry`, {
    method: "POST",
  });
  const data7Retry = await res7Retry.json();
  console.log(`[PASS] [INVALID_ONCE] retry: State = ${data7Retry.enquiry.categorizationState}, Category = ${data7Retry.enquiry.category}`);
  if (data7Retry.enquiry.categorizationState !== "Completed" || data7Retry.enquiry.category !== "Billing") {
    throw new Error(`Expected Completed Billing on retry, got ${data7Retry.enquiry.categorizationState}, ${data7Retry.enquiry.category}`);
  }

  // Check 8: Filters (status, category, search)
  console.log("\n--- TEST 8: Verify Filters and Search ---");
  const resFilterSales = await fetch(`${baseUrl}/api/enquiries?category=Sales`);
  const dataFilterSales = await resFilterSales.json();
  const allSales = dataFilterSales.enquiries.every((e: any) => e.category === "Sales");
  console.log(`[PASS] Filter category=Sales returned ${dataFilterSales.enquiries.length} items. All sales: ${allSales}`);
  if (!allSales) throw new Error("Filter category=Sales returned non-sales enquiry");

  const resFilterStatus = await fetch(`${baseUrl}/api/enquiries?status=In Progress`);
  const dataFilterStatus = await resFilterStatus.json();
  const allInProgress = dataFilterStatus.enquiries.every((e: any) => e.status === "In Progress");
  console.log(`[PASS] Filter status='In Progress' returned ${dataFilterStatus.enquiries.length} items. All In Progress: ${allInProgress}`);
  if (!allInProgress) throw new Error("Filter status returned mismatching status");

  const resSearch = await fetch(`${baseUrl}/api/enquiries?search=Auditor Jane`);
  const dataSearch = await resSearch.json();
  console.log(`[PASS] Search 'Auditor Jane' returned ${dataSearch.enquiries.length} item(s)`);
  if (dataSearch.enquiries.length === 0 || dataSearch.enquiries[0].id !== createdId) {
    throw new Error("Search query did not return the expected enquiry");
  }

  // Check 9: Validation and Error Handling
  console.log("\n--- TEST 9: Form Validation and Error Handling ---");
  const resBadEmail = await fetch(`${baseUrl}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Bob", email: "not-an-email", message: "Hello world" }),
  });
  console.log(`[PASS] Invalid email rejected with status ${resBadEmail.status}`);
  if (resBadEmail.status !== 400) throw new Error(`Expected 400 for bad email, got ${resBadEmail.status}`);

  const resBadStatus = await fetch(`${baseUrl}/api/enquiries/${createdId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "InvalidStatusXYZ" }),
  });
  console.log(`[PASS] Invalid status rejected with status ${resBadStatus.status}`);
  if (resBadStatus.status !== 400) throw new Error(`Expected 400 for invalid status, got ${resBadStatus.status}`);

  const res404 = await fetch(`${baseUrl}/api/enquiries/nonexistent-id-0000`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Resolved" }),
  });
  console.log(`[PASS] Nonexistent ID rejected with status ${res404.status}`);
  if (res404.status !== 404) throw new Error(`Expected 404 for unknown ID, got ${res404.status}`);

  console.log("\n=== ALL LIVE END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runLiveE2E().catch((err) => {
  console.error("\n[FAIL] Live E2E Verification failed:", err);
  process.exit(1);
});
