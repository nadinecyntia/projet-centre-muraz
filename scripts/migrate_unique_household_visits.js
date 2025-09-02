const { pool } = require('../config/database');

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Migration: ajout contrainte unique household_visits (concession_code, house_code, visit_start_date)');
    await client.query('BEGIN');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'household_visits_unique_visit'
        ) THEN
          ALTER TABLE household_visits
          ADD CONSTRAINT household_visits_unique_visit
          UNIQUE (concession_code, house_code, visit_start_date);
        END IF;
      END$$;
    `);
    await client.query('COMMIT');
    console.log('✅ Contrainte unique créée (ou déjà existante)');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Échec migration:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

run();


