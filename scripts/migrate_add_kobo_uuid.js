const { pool } = require('../config/database');

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Migration: ajout kobo_uuid (unique) sur gites/oeufs/adultes');
    await client.query('BEGIN');

    // Ajouter colonne si absente, puis contrainte unique si absente
    const ops = [
      'breeding_sites',
      'eggs_collection',
      'adult_mosquitoes'
    ];

    for (const table of ops) {
      await client.query(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS kobo_uuid TEXT;
      `);
      // créer index unique s'il n'existe pas
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${table}_kobo_uuid_key'
          ) THEN
            ALTER TABLE ${table}
            ADD CONSTRAINT ${table}_kobo_uuid_key UNIQUE (kobo_uuid);
          END IF;
        END$$;
      `);
    }

    await client.query('COMMIT');
    console.log('✅ Migration kobo_uuid terminée');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration kobo_uuid échouée:', e);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();


