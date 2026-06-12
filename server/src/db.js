import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.PITLANE_DB || path.join(__dirname, '..', 'pitlane.db');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reg_no TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    description TEXT,
    stage_index INTEGER NOT NULL DEFAULT 0,
    estimated_delivery TEXT,
    cost_estimate INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS job_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS job_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    stage_index INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'PITLANE Team',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const STAGES = [
  { key: 'received', label: 'Vehicle Received' },
  { key: 'inspection', label: 'Inspection & Estimate' },
  { key: 'in_service', label: 'Work In Progress' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready', label: 'Ready for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export const SERVICE_TYPES = [
  'Paint Protection Film',
  'Ceramic Coating',
  'Custom Paint & Respray',
  'Body Kit Installation',
  'Interior Upgrade',
  'Performance Tuning',
  'Ice Blasting',
  'General Service',
];

export function normalizePhone(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizeReg(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}
