const { pool } = require('../config/database');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔧 Migration: add other_larvae_count and other_nymphs_count to breeding_sites');
        await client.query('BEGIN');

        // Add columns if not exist
        await client.query(`
            ALTER TABLE breeding_sites
            ADD COLUMN IF NOT EXISTS other_larvae_count INTEGER NOT NULL DEFAULT 0;
        `);
        await client.query(`
            ALTER TABLE breeding_sites
            ADD COLUMN IF NOT EXISTS other_nymphs_count INTEGER NOT NULL DEFAULT 0;
        `);

        // Drop old constraints if they exist
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    WHERE t.relname = 'breeding_sites' AND c.conname = 'check_larvae_counts'
                ) THEN
                    ALTER TABLE breeding_sites DROP CONSTRAINT check_larvae_counts;
                END IF;
            END$$;
        `);
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    WHERE t.relname = 'breeding_sites' AND c.conname = 'check_nymphs_counts'
                ) THEN
                    ALTER TABLE breeding_sites DROP CONSTRAINT check_nymphs_counts;
                END IF;
            END$$;
        `);

        // Add updated constraints including the new columns
        await client.query(`
            ALTER TABLE breeding_sites
            ADD CONSTRAINT check_larvae_counts
            CHECK (
                aedes_larvae_count + culex_larvae_count + anopheles_larvae_count + other_larvae_count <= larvae_count
            );
        `);
        await client.query(`
            ALTER TABLE breeding_sites
            ADD CONSTRAINT check_nymphs_counts
            CHECK (
                aedes_nymphs_count + culex_nymphs_count + anopheles_nymphs_count + other_nymphs_count <= nymphs_count
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Migration completed');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();


