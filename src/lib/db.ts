import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  type Enquiry,
  type BusinessStatus,
  type EnquiryCategory,
  type CategorizationState,
  type EnquiryFilters,
  type DashboardMetrics,
} from "./types";

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "enquiries.db");
}

export function getDatabase(dbPath?: string): Database.Database {
  if (dbPath) {
    const db = new Database(dbPath);
    initSchema(db);
    return db;
  }

  if (!dbInstance) {
    const resolvedPath = getDatabasePath();
    dbInstance = new Database(resolvedPath);
    // Enable WAL mode for better concurrency and reliability
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
  }

  return dbInstance;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('New', 'In Progress', 'Resolved')),
      category TEXT CHECK(category IS NULL OR category IN ('Sales', 'Support', 'Billing', 'Other')),
      categorizationState TEXT NOT NULL CHECK(categorizationState IN ('Pending', 'Completed', 'Failed'))
    );

    CREATE INDEX IF NOT EXISTS idx_enquiries_createdAt ON enquiries(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_enquiries_category ON enquiries(category);
    CREATE INDEX IF NOT EXISTS idx_enquiries_categorizationState ON enquiries(categorizationState);
  `);
}

export interface CreateEnquiryParams {
  id?: string;
  name: string;
  email: string;
  message: string;
  status?: BusinessStatus;
  category?: EnquiryCategory | null;
  categorizationState?: CategorizationState;
  createdAt?: string;
}

export function createEnquiry(
  params: CreateEnquiryParams,
  dbOverride?: Database.Database
): Enquiry {
  const db = dbOverride || getDatabase();
  const id = params.id || crypto.randomUUID();
  const createdAt = params.createdAt || new Date().toISOString();
  const status: BusinessStatus = params.status || "New";
  const category: EnquiryCategory | null = params.category || null;
  const categorizationState: CategorizationState = params.categorizationState || "Pending";

  const stmt = db.prepare(`
    INSERT INTO enquiries (id, name, email, message, createdAt, status, category, categorizationState)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    params.name.trim(),
    params.email.trim(),
    params.message.trim(),
    createdAt,
    status,
    category,
    categorizationState
  );

  return {
    id,
    name: params.name.trim(),
    email: params.email.trim(),
    message: params.message.trim(),
    createdAt,
    status,
    category,
    categorizationState,
  };
}

export function getEnquiryById(
  id: string,
  dbOverride?: Database.Database
): Enquiry | null {
  const db = dbOverride || getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, email, message, createdAt, status, category, categorizationState
    FROM enquiries
    WHERE id = ?
  `);

  const row = stmt.get(id) as Enquiry | undefined;
  return row || null;
}

export function listEnquiries(
  filters?: EnquiryFilters,
  dbOverride?: Database.Database
): Enquiry[] {
  const db = dbOverride || getDatabase();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters?.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  if (filters?.categorizationState) {
    conditions.push("categorizationState = ?");
    params.push(filters.categorizationState);
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push("(name LIKE ? OR email LIKE ? OR message LIKE ?)");
    params.push(term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT id, name, email, message, createdAt, status, category, categorizationState
    FROM enquiries
    ${whereClause}
    ORDER BY datetime(createdAt) DESC, id DESC
  `;

  const stmt = db.prepare(query);
  return stmt.all(...params) as Enquiry[];
}

export function updateEnquiryStatus(
  id: string,
  status: BusinessStatus,
  dbOverride?: Database.Database
): Enquiry | null {
  const db = dbOverride || getDatabase();

  const stmt = db.prepare(`
    UPDATE enquiries
    SET status = ?
    WHERE id = ?
  `);

  const info = stmt.run(status, id);
  if (info.changes === 0) {
    return null;
  }

  return getEnquiryById(id, db);
}

export function updateEnquiryCategorization(
  id: string,
  category: EnquiryCategory | null,
  categorizationState: CategorizationState,
  dbOverride?: Database.Database
): Enquiry | null {
  const db = dbOverride || getDatabase();

  const stmt = db.prepare(`
    UPDATE enquiries
    SET category = ?, categorizationState = ?
    WHERE id = ?
  `);

  const info = stmt.run(category, categorizationState, id);
  if (info.changes === 0) {
    return null;
  }

  return getEnquiryById(id, db);
}

export function getDashboardMetrics(dbOverride?: Database.Database): DashboardMetrics {
  const db = dbOverride || getDatabase();

  const total = (db.prepare(`SELECT COUNT(*) as count FROM enquiries`).get() as { count: number }).count;
  const newCount = (db.prepare(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'New'`).get() as { count: number }).count;
  const inProgressCount = (db.prepare(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'In Progress'`).get() as { count: number }).count;
  const resolvedCount = (db.prepare(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'Resolved'`).get() as { count: number }).count;
  const failedCategorizationCount = (
    db.prepare(`SELECT COUNT(*) as count FROM enquiries WHERE categorizationState = 'Failed'`).get() as { count: number }
  ).count;

  return {
    total,
    newCount,
    inProgressCount,
    resolvedCount,
    failedCategorizationCount,
  };
}

export function clearDatabase(dbOverride?: Database.Database): void {
  const db = dbOverride || getDatabase();
  db.exec(`DELETE FROM enquiries`);
}
