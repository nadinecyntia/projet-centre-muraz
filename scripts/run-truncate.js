const { pool } = require('../config/database');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        eggs_collection_new,
        eggs_collection_archive,
        breeding_sites_new,
        breeding_sites_archive,
        adult_mosquitoes_new,
        adult_mosquitoes_archive
      RESTART IDENTITY CASCADE;
    `);
    await client.query('COMMIT');

    const counts = {};
    for (const table of [
      'eggs_collection_new',
      'eggs_collection_archive',
      'breeding_sites_new',
      'breeding_sites_archive',
      'adult_mosquitoes_new',
      'adult_mosquitoes_archive'
    ]) {
      const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
      counts[table] = r.rows[0].c;
    }
    console.log(JSON.stringify({ success: true, counts }, null, 2));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  } finally {
    client.release();
  }
}

main();


