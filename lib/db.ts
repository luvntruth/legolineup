import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { COLORS, T_VALUES } from "./constants";
import { ID_MIN, ID_MAX } from "./config";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "db.sqlite");

const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY,
  colors TEXT NOT NULL,
  t_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`);

export type SubmissionRow = {
  id: number;
  colors: string;
  t_value: string;
  updated_at: string;
};

export function upsertSubmission(id: number, colors: string[], tValue: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  if (colors.length !== 5 || !colors.every(c => COLORS.includes(c as any))) throw new Error("Invalid colors");
  if (!T_VALUES.includes(tValue as any)) throw new Error("Invalid tValue");

  const now = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO submissions(id, colors, t_value, updated_at)
    VALUES (@id, @colors, @t_value, @updated_at)
    ON CONFLICT(id) DO UPDATE SET colors=excluded.colors, t_value=excluded.t_value, updated_at=excluded.updated_at;
  `);
  stmt.run({ id, colors: JSON.stringify(colors), t_value: tValue, updated_at: now });
  return { id, colors, tValue, updatedAt: now };
}

export function getSubmission(id: number) {
  const stmt = db.prepare<[number]>("SELECT * FROM submissions WHERE id = ?");
  const row = stmt.get(id) as SubmissionRow | undefined;
  if (!row) return null;
  return { id: row.id, colors: JSON.parse(row.colors), tValue: row.t_value, updatedAt: row.updated_at };
}

export function getAllSubmissions() {
  const stmt = db.prepare<[]>("SELECT * FROM submissions ORDER BY id ASC");
  const rows = stmt.all() as SubmissionRow[];
  return rows.map(r => ({ id: r.id, colors: JSON.parse(r.colors), tValue: r.t_value, updatedAt: r.updated_at }));
}

export function getRange() {
  return { min: ID_MIN, max: ID_MAX };
}
