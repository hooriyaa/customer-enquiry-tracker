// modified- preserved copy
# Intevoris AI Solutions — Customer Enquiry Tracker

An enterprise-grade Customer Enquiry Management & AI Triage system built with Next.js App Router, React, TypeScript, SQLite, Tailwind CSS, Zod, and UI/UX Pro Max design intelligence.

---

## 1. Project Overview & Architectural Highlights

This application serves as an intelligent customer intake and triage platform for **Intevoris AI Solutions**. It receives customer enquiries, validates payloads, guarantees database persistence, and integrates with an AI Categorization microservice running on `http://127.0.0.1:8787/categorize`.

### Key System Guarantees:
- **Persistence-First Architecture**: Enquiries are saved in SQLite *before* invoking external AI services. If the AI service is offline, times out, or returns an invalid category, the customer enquiry is **never lost**.
- **Idempotent Retry**: Failed categorizations remain visible with a distinct badge and can be retried safely. Retrying updates the **existing** record in place without duplicating records or corrupting business statuses.
- **Independent Business & AI States**: Business status (`New`, `In Progress`, `Resolved`) and AI categorization state (`Pending`, `Completed`, `Failed`) operate independently.
- **UI/UX Pro Max Design System**: Full compliance with B2B SaaS design intelligence (Minimalism & Swiss style, WCAG AA contrast, no emoji icons, keyboard focus rings, responsive layouts).

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router, Server API Routes, Client Components)
- **Language**: TypeScript 5.6 (Strict Type Checking)
- **Styling**: Tailwind CSS & Lucide React Icons
- **Database**: SQLite via `better-sqlite3` (WAL mode enabled, indexed columns)
- **Validation**: Zod schema validation (Client-side & mandatory Server-side)
- **Testing**: Vitest 2.1 (17 comprehensive automated scenarios)
- **Design Intelligence**: UI/UX Pro Max Skill (`design-system/customer-enquiry-tracker/MASTER.md`)

---

## 3. Architecture Flow

```
┌────────────────────────────────┐         ┌───────────────────────────────┐
│  Customer Enquiry Form (/submit)│         │   Business Dashboard (/)      │
└───────────────┬────────────────┘         └───────────────▲───────────────┘
                │ (POST /api/enquiries)                    │ (GET /api/enquiries)
                ▼                                          │ (PATCH /api/enquiries/:id)
┌──────────────────────────────────────────────────────────┴───────────────┐
│                      Next.js API Layer                                   │
│  • Zod Input Validation & Sanitization                                  │
│  • Parameterized DB Transactions                                         │
└───────────────────────┬──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    SQLite Database Layer                                 │
│  • STEP 1: Persist Enquiry with 'Pending' & Business Status: 'New'       │
└───────────────────────┬──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Mock AI Categorization Service (:8787)                      │
│                 http://127.0.0.1:8787/categorize                         │
├──────────────────────────────────────┬───────────────────────────────────┤
│           SUCCESS PATH               │          FAILURE PATH             │
│  • 200 OK + Valid Category          │  • Service Down / 500 Error       │
│    ('Sales', 'Billing', 'Support')  │  • Malformed / Invalid Category   │
│  • Update State -> 'Completed'       │  • Update State -> 'Failed'       │
│  • Assign Category                   │  • Category remains null          │
│                                      │  • Record KEPT SAFE in DB         │
│                                      │  • Retryable via POST /:id/retry  │
└──────────────────────────────────────┴───────────────────────────────────┘
```

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js**: v20+ (Verified with `v20.17.0`)
- **npm**: v10+ (Verified with `11.6.1`)
- **Python 3**: (Required by UI/UX Pro Max search engine; verified with `3.13.2`)

### Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Default variables in `.env.example`:
```env
DATABASE_PATH=./data/enquiries.db
AI_CATEGORIZATION_URL=http://127.0.0.1:8787/categorize
MOCK_AI_PORT=8787
```

### Seed Demo Data
To seed initial realistic enquiries (including New, In Progress, Resolved, and a retryable Failed enquiry):
```bash
npm run seed
```

---

## 5. Running the Application

### 1. Start the Mock AI Categorization Service
In your first terminal (requires Node.js 18+ as specified in the assignment PDF):
```bash
node mock-ai-service.mjs
# Or alternatively: npm run mock:ai
```
*Output: `[Mock AI Categorization Service] Running at http://127.0.0.1:8787`*

### 2. Start the Next.js Development Server
In your second terminal:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

- **Business Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Customer Enquiry Portal**: [http://localhost:3000/submit](http://localhost:3000/submit)

---

## 6. API Documentation

### 1. Create Customer Enquiry
- **Endpoint**: `POST /api/enquiries`
- **Request Body**:
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.jenkins@acme-corp.com",
  "message": "We need an enterprise quote for 50 seats and product demo."
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "enquiry": {
    "id": "c1f7f50a-9d22-4411-9a74-9b244951b142",
    "name": "Sarah Jenkins",
    "email": "sarah.jenkins@acme-corp.com",
    "message": "We need an enterprise quote for 50 seats and product demo.",
    "createdAt": "2026-10-27T22:45:00.000Z",
    "status": "New",
    "category": "Sales",
    "categorizationState": "Completed"
  },
  "message": "Enquiry submitted and categorized successfully"
}
```

### 2. List Enquiries & Dashboard Metrics
- **Endpoint**: `GET /api/enquiries`
- **Query Parameters**:
  - `status`: `New` | `In Progress` | `Resolved`
  - `category`: `Sales` | `Support` | `Billing` | `Other`
  - `categorizationState`: `Pending` | `Completed` | `Failed`
  - `search`: Filter by name, email, or message keyword
- **Response** (`200 OK`):
```json
{
  "success": true,
  "enquiries": [...],
  "metrics": {
    "total": 6,
    "newCount": 2,
    "inProgressCount": 2,
    "resolvedCount": 2,
    "failedCategorizationCount": 1
  }
}
```

### 3. Update Business Status
- **Endpoint**: `PATCH /api/enquiries/:id`
- **Request Body**:
```json
{
  "status": "In Progress"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "enquiry": { "id": "...", "status": "In Progress", ... },
  "message": "Status updated to 'In Progress'"
}
```

### 4. Retry AI Categorization
- **Endpoint**: `POST /api/enquiries/:id/retry`
- **Validation Rules**:
  - Only enquiries with `categorizationState === "Failed"` are eligible for retry.
  - Returns `400 Bad Request` if enquiry is already `Completed` or `Pending`.
  - Atomically claims the record (`Failed` -> `Pending`) to prevent concurrent race conditions (returns `409 Conflict` if already in progress).
  - Strictly preserves existing business `status` (`New`, `In Progress`, `Resolved`).
  - Zero record duplication: updates the existing SQLite record in place.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "enquiry": {
    "id": "c1f7f50a-9d22-4411-9a74-9b244951b142",
    "name": "Alex Rivera",
    "email": "alex.rivera@enterprise.org",
    "status": "In Progress",
    "category": "Billing",
    "categorizationState": "Completed"
  },
  "message": "Categorization succeeded on retry: categorized as 'Billing'"
}
```
- **Rejection Response (Already Completed)** (`400 Bad Request`):
```json
{
  "success": false,
  "error": "Cannot retry categorization: Enquiry is already completed with category 'Billing'"
}
```

---

## 7. Mock AI Service & Failure Markers

The mock service supports built-in simulation markers for testing resilience:

| Marker | Behavior on 1st Call | Behavior on Retry |
|---|---|---|
| `[FAIL_ONCE]` | Returns `503 Service Unavailable`. Enquiry is saved with `categorizationState: 'Failed'`. | Calling retry re-executes categorization, succeeds, and marks `Completed` (`Billing`). |
| `[INVALID_ONCE]` | Returns `{ "category": "Unexpected" }`. Backend rejects unknown category and marks `Failed`. | Calling retry returns a valid category and marks `Completed` (`Support`). |

---

## 8. Automated Verification Suite

Run the full automated test suite covering all 21 scenarios:
```bash
npm test
```

### Verified Scenarios (21 / 21 Passed):
1. `✓` Valid enquiry creation with SQLite persistence.
2. `✓` Rejection of missing/whitespace-only required fields (name, email, message).
3. `✓` Strict rejection of malformed emails (`abc@gmail`, `hello@`, `user@@gmail.com`, `user name@gmail.com`).
4. `✓` Acceptance of valid email addresses across diverse top-level and subdomains.
5. `✓` Direct invalid API submission safety (zero SQLite records created).
6. `✓` Successful AI categorization into `Sales`, `Billing`, `Support`, `Other`.
7. `✓` Safe fallback when AI microservice is offline (record kept intact with `Failed` state).
8. `✓` Safe rejection of invalid categories returned by AI.
9. `✓` Queryability of enquiries despite AI failures.
10. `✓` Successful retry after temporary failure via `[FAIL_ONCE]` (503 recovery).
11. `✓` Zero duplicate records during retry (record count stays constant).
12. `✓` Preservation of record if retry fails again.
13. `✓` Business status transitions (`New` -> `In Progress` -> `Resolved`).
14. `✓` Rejection of invalid business statuses (e.g., `Draft`, `Closed`).
15. `✓` Filter combinations (Status, Category, State, Search).
16. `✓` Proper `404 Not Found` responses for unknown enquiry IDs.
17. `✓` Persistence across database reconnects and process restarts.
18. `✓` Recovery from `[INVALID_ONCE]` (`Unexpected` category) on retry.
19. `✓` Real-time dashboard KPI metrics calculation.
20. `✓` Full-cycle AI timeout enforcement during slow streaming response body reading.
21. `✓` Retry endpoint validation (`Failed`-only guard, rejection of `Completed`/`Pending`, concurrency claim lock).

---

## 9. 15-Minute Technical Demonstration Script

### Step 1: Submit a Standard Sales Enquiry
1. Navigate to `/submit`.
2. Click the quick-fill button **"Sales Enquiry"**.
3. Click **"Submit Enquiry"**.
4. Observe immediate categorization as `Sales` (`Completed`).

### Step 2: Test AI Resilience with `[FAIL_ONCE]`
1. On `/submit`, click the quick-fill button **"[FAIL_ONCE] Test"**.
2. Click **"Submit Enquiry"**.
3. Observe the notice: The enquiry is **saved persistently**, but AI is flagged as `Failed`.
4. Click **"Go to Business Dashboard"**.
5. Observe the enquiry listed with a **rose "Failed" badge** and a **"Retry"** button.

### Step 3: Execute AI Retry
1. In the dashboard, click the **"Retry"** button on the failed enquiry.
2. Observe the loading spinner: on the second attempt, the mock succeeds.
3. The badge updates to **"Completed"** with the resolved category (`Sales`).
4. Note that the total enquiry count does not increase (no duplicate record).

### Step 4: Manage Business Statuses
1. Change the status dropdown from `New` to `In Progress`.
2. Notice the live metric card updates instantly.
3. Change status to `Resolved`.
4. Click **"View"** to open the full message drawer, inspecting all metadata and timestamps.

### Step 5: Filter and Search
1. Filter by `Category: Sales` to isolate sales opportunities.
2. Filter by `AI State: Completed`.
3. Search for a customer name in the search bar.
4. Click **"Reset Filters"** to restore the default view.
