import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { config } from "dotenv";
import pg from "pg";

const { Client } = pg;

const root = process.cwd();
config({ path: path.join(root, ".env.local"), quiet: true });

const sqlFile = process.argv[2];
if (!sqlFile) {
  throw new Error("Usage: node scripts/run-sql-file.mjs <path-to-sql-file>");
}

const sqlPath = path.resolve(root, sqlFile);
if (!fs.existsSync(sqlPath)) {
  throw new Error(`SQL file not found: ${sqlPath}`);
}

const connectionString =
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL, DATABASE_URL, or POSTGRES_URL in .env.local.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync(sqlPath, "utf8");

await client.connect();
try {
  const result = await client.query(sql);
  const results = Array.isArray(result) ? result : [result];
  const lastResult = results.at(-1);
  console.log(JSON.stringify({
    file: path.relative(root, sqlPath),
    statements: results.length,
    rowCount: lastResult?.rowCount ?? 0,
    rows: lastResult?.rows ?? []
  }, null, 2));
} finally {
  await client.end();
}
