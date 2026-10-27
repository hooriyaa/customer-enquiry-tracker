// Intevoris AI Solutions — Supplied Mock AI Service
// Standalone ES Module runnable directly via: node mock-ai-service.mjs
// Default endpoint: POST http://127.0.0.1:8787/categorize

import http from "node:http";

const PORT = parseInt(process.env.MOCK_AI_PORT || "8787", 10);

// In-memory tracking for stateful mock markers: [FAIL_ONCE] and [INVALID_ONCE]
const failedOnceSet = new Set();
const invalidOnceSet = new Set();

export function categorizeMessage(message) {
  const lower = message.toLowerCase();

  // Sales keywords
  if (
    lower.includes("sales") ||
    lower.includes("pricing") ||
    lower.includes("quote") ||
    lower.includes("demo") ||
    lower.includes("cost") ||
    lower.includes("buy") ||
    lower.includes("purchase") ||
    lower.includes("enterprise") ||
    lower.includes("discount")
  ) {
    return "Sales";
  }

  // Billing keywords
  if (
    lower.includes("billing") ||
    lower.includes("invoice") ||
    lower.includes("charge") ||
    lower.includes("receipt") ||
    lower.includes("refund") ||
    lower.includes("payment") ||
    lower.includes("credit card") ||
    lower.includes("bank")
  ) {
    return "Billing";
  }

  // Support keywords
  if (
    lower.includes("support") ||
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("issue") ||
    lower.includes("broken") ||
    lower.includes("help") ||
    lower.includes("crash") ||
    lower.includes("failed") ||
    lower.includes("problem") ||
    lower.includes("glitch")
  ) {
    return "Support";
  }

  return "Other";
}

export function createMockServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "Intevoris AI Mock Categorizer", port: PORT }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/categorize") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const parsed = JSON.parse(body || "{}");
          const message = typeof parsed.message === "string" ? parsed.message : "";
          const identifier =
            (typeof parsed.enquiryId === "string" && parsed.enquiryId) ||
            (typeof parsed.id === "string" && parsed.id) ||
            message.trim();

          if (!message.trim()) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing or empty 'message' field" }));
            return;
          }

          // PDF Spec: [FAIL_ONCE] returns HTTP 503 on first attempt, then Billing on retry
          if (message.includes("[FAIL_ONCE]")) {
            if (!failedOnceSet.has(identifier)) {
              failedOnceSet.add(identifier);
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "Mock AI Service temporary failure triggered by [FAIL_ONCE] marker",
                  state: "first_attempt_failed",
                })
              );
              return;
            }
            failedOnceSet.delete(identifier);
          }

          // PDF Spec: [INVALID_ONCE] returns category 'Unexpected' on first attempt, then Support on retry
          if (message.includes("[INVALID_ONCE]")) {
            if (!invalidOnceSet.has(identifier)) {
              invalidOnceSet.add(identifier);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  category: "Unexpected",
                  note: "Mock invalid response triggered by [INVALID_ONCE] marker",
                })
              );
              return;
            }
            invalidOnceSet.delete(identifier);
          }

          const category = categorizeMessage(message);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ category }));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON payload", details: errorMessage }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  });

  return server;
}

const server = createMockServer();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[Mock AI Categorization Service] Running at http://127.0.0.1:${PORT}`);
  console.log(`[Mock AI Categorization Service] Supported markers: [FAIL_ONCE], [INVALID_ONCE]`);
});
