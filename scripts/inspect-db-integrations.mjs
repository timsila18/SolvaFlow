import pg from "pg";

const { Client } = pg;
const connectionString = process.env.INSPECT_DB_URL;

if (!connectionString) {
  throw new Error("Missing INSPECT_DB_URL.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const targetTables = process.argv.slice(2);

await client.connect();
try {
  if (targetTables.length > 0) {
    const columns = await client.query(
      `
        select table_name, column_name, data_type
        from information_schema.columns
        where table_schema = 'public'
          and table_name = any($1::text[])
        order by table_name, ordinal_position
      `,
      [targetTables]
    );
    console.log(JSON.stringify({ columns: columns.rows }, null, 2));
    process.exit(0);
  }

  const tables = await client.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public'
      and (
        table_name ilike '%mpesa%'
        or table_name ilike '%daraja%'
        or table_name ilike '%solco%'
        or table_name ilike '%finance%'
        or table_name ilike '%integration%'
        or table_name ilike '%setting%'
        or table_name ilike '%config%'
        or table_name ilike '%credential%'
      )
    order by table_name
  `);

  const columns = await client.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and (
        column_name ilike '%mpesa%'
        or column_name ilike '%daraja%'
        or column_name ilike '%paybill%'
        or column_name ilike '%till%'
        or column_name ilike '%passkey%'
        or column_name ilike '%consumer%'
        or column_name ilike '%solco%'
        or column_name ilike '%finance%'
        or column_name ilike '%integration%'
        or column_name ilike '%api%'
        or column_name ilike '%secret%'
        or column_name ilike '%key%'
        or column_name ilike '%token%'
      )
    order by table_name, column_name
  `);

  console.log(JSON.stringify({ tables: tables.rows, columns: columns.rows }, null, 2));
} finally {
  await client.end();
}
