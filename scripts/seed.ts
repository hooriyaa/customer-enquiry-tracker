import { createEnquiry, getDatabase } from "../src/lib/db";

export function seedDatabase() {
  const db = getDatabase();
  const existingCount = (db.prepare("SELECT COUNT(*) as count FROM enquiries").get() as { count: number }).count;

  if (existingCount > 0) {
    console.log(`[Seed] Database already contains ${existingCount} enquiries. Skipping seed.`);
    return;
  }

  console.log("[Seed] Populating initial realistic enquiries for demonstration...");

  createEnquiry({
    name: "Alexandria Morgan",
    email: "a.morgan@vanguard-logistics.com",
    message: "We need an enterprise quote for 150 team members including dedicated SLA and single sign-on integration.",
    status: "New",
    category: "Sales",
    categorizationState: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  });

  createEnquiry({
    name: "Benjamin Hayes",
    email: "b.hayes@cloudscale.io",
    message: "Our finance team flagged an unexpected transaction on invoice #INV-2026-88. Please verify and issue credit.",
    status: "In Progress",
    category: "Billing",
    categorizationState: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  });

  createEnquiry({
    name: "Claire Dupont",
    email: "c.dupont@aerotech.fr",
    message: "Getting error 502 Bad Gateway when querying webhook metrics endpoint via REST API after the latest deployment.",
    status: "In Progress",
    category: "Support",
    categorizationState: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  });

  createEnquiry({
    name: "Derek O'Connor",
    email: "derek@greenlight-solar.org",
    message: "Inquiry about sales pricing tiers and educational non-profit discounts [FAIL_ONCE]",
    status: "New",
    category: null,
    categorizationState: "Failed",
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  });

  createEnquiry({
    name: "Fatima Al-Mansoor",
    email: "fatima@gulfstream-analytics.ae",
    message: "We would like to partner with Intevoris AI Solutions to explore custom LLM fine-tuning solutions.",
    status: "Resolved",
    category: "Other",
    categorizationState: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  });

  createEnquiry({
    name: "George Sterling",
    email: "g.sterling@fintech-advisors.co.uk",
    message: "Can you provide a compliance whitepaper regarding SOC2 and GDPR data processing?",
    status: "Resolved",
    category: "Sales",
    categorizationState: "Completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  });

  console.log("[Seed] Successfully seeded 6 representative enquiries.");
}

if (require.main === module) {
  seedDatabase();
}
