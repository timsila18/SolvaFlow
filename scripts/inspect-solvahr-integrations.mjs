import pg from "pg";

const { Client } = pg;
const connectionString = process.env.SOLVAHR_DB_URL;

if (!connectionString) {
  throw new Error("Missing SOLVAHR_DB_URL.");
}

const secretPattern = /(secret|key|token|pass|password|credential|consumer|auth|client|certificate)/i;

function mask(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(mask);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, secretPattern.test(key) ? "[set]" : mask(nested)])
    );
  }
  if (typeof value === "string" && value.length > 10) return `${value.slice(0, 4)}...[masked]`;
  return value;
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
try {
  const connectors = await client.query(`
    select id, connector_key, connector_name, connector_category, provider, status, metadata
    from public.integration_connectors
    order by connector_key
  `);

  const integrations = await client.query(`
    select
      oi.id,
      oi.organization_id,
      oi.company_id,
      oi.status,
      oi.config,
      oi.connected_at,
      ic.connector_key,
      ic.connector_name,
      ic.connector_category,
      ic.provider
    from public.organization_integrations oi
    join public.integration_connectors ic on ic.id = oi.connector_id
    order by ic.connector_key
  `);

  console.log(JSON.stringify({
    connectors: connectors.rows.map((row) => ({ ...row, metadata: mask(row.metadata) })),
    integrations: integrations.rows.map((row) => ({ ...row, config: mask(row.config) }))
  }, null, 2));
} finally {
  await client.end();
}
