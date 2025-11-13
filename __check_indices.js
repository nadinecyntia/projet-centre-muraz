const { pool } = require('./config/database');

(async () => {
  try {
    const client = await pool.connect();
    const run = async (sql) => (await client.query(sql)).rows[0];

    const adultsApproved = await run(`
      SELECT 
        COUNT(*)::int AS total_rows,
        COALESCE(SUM(total_mosquitoes_count),0)::int AS sum_total,
        COALESCE(SUM(bg_trap_mosquitoes_count),0)::int AS sum_bg,
        COALESCE(SUM(prokopack_mosquitoes_count),0)::int AS sum_pk,
        COALESCE(SUM(bg_traps_count),0)::int AS traps_bg,
        COALESCE(SUM(prokopack_traps_count),0)::int AS traps_pk
      FROM adult_mosquitoes_collections
      WHERE status='approved'
    `);

    const adultsAny = await run(`
      SELECT 
        COUNT(*)::int AS total_rows,
        COALESCE(SUM(total_mosquitoes_count),0)::int AS sum_total,
        COALESCE(SUM(bg_trap_mosquitoes_count),0)::int AS sum_bg,
        COALESCE(SUM(prokopack_mosquitoes_count),0)::int AS sum_pk,
        COALESCE(SUM(bg_traps_count),0)::int AS traps_bg,
        COALESCE(SUM(prokopack_traps_count),0)::int AS traps_pk
      FROM adult_mosquitoes_collections
    `);

    const eggsApproved = await run(`
      SELECT 
        COUNT(*)::int AS total_rows,
        COALESCE(SUM(eggs_count),0)::int AS sum_eggs
      FROM eggs_collections
      WHERE status='approved'
    `);

    const breedingApproved = await run(`
      SELECT 
        COUNT(*)::int AS total_rows,
        COALESCE(SUM(CASE WHEN site_state='positive' THEN 1 ELSE 0 END),0)::int AS pos_sites
      FROM breeding_sites
      WHERE status='approved'
    `);

    console.log(JSON.stringify({ adultsApproved, adultsAny, eggsApproved, breedingApproved }, null, 2));
    client.release();
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();




