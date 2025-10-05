const { pool } = require('../config/database');

async function getSchema() {
  const client = await pool.connect();
  try {
    const tablesRes = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );

    const columnsRes = await client.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`
    );

    const pkRes = await client.query(
      `SELECT
         tc.table_name,
         kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY tc.table_name, kcu.ordinal_position`
    );

    const tableSet = new Set(tablesRes.rows.map(r => r.table_name));
    const columnsByTable = {};
    for (const row of columnsRes.rows) {
      if (!tableSet.has(row.table_name)) continue;
      if (!columnsByTable[row.table_name]) columnsByTable[row.table_name] = [];
      columnsByTable[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default || null,
      });
    }

    const pkByTable = {};
    for (const row of pkRes.rows) {
      if (!pkByTable[row.table_name]) pkByTable[row.table_name] = new Set();
      pkByTable[row.table_name].add(row.column_name);
    }

    const result = [];
    for (const table of Array.from(tableSet).sort()) {
      const cols = (columnsByTable[table] || []).map(c => ({
        ...c,
        primaryKey: pkByTable[table] ? pkByTable[table].has(c.column) : false,
      }));
      result.push({ table, columns: cols });
    }

    return result;
  } finally {
    client.release();
    // Do not end pool; server may still use it
  }
}

(async () => {
  try {
    const schema = await getSchema();
    console.log(JSON.stringify({ success: true, tables: schema }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
})();


