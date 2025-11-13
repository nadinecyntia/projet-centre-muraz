const { pool } = require('./config/database');
(async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query(`
      SELECT id, visit_date, collection_methods, capture_locations,
             total_mosquitoes_count, bg_trap_mosquitoes_count, prokopack_mosquitoes_count,
             bg_traps_count, prokopack_traps_count
      FROM adult_mosquitoes_collections
      WHERE status='approved' AND prokopack_traps_count > 0
      ORDER BY id DESC LIMIT 10
    `);
    console.log(JSON.stringify(rows, null, 2));
    client.release();
    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();


