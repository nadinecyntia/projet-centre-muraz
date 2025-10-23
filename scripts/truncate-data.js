// Tronquer les tables de collecte (œufs, gîtes, moustiques) en utilisant la config DB existante
require('dotenv').config();
const { pool } = require('../config/database');

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connexion DB OK');
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE eggs_collection_new RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE breeding_sites_new RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE adult_mosquitoes_new RESTART IDENTITY CASCADE');
    await client.query('COMMIT');
    console.log('🧹 Tables vidées (IDs réinitialisés)');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur TRUNCATE:', e.message);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(1);
  } finally {
    client.release();
  }
}

main();



require('dotenv').config();
const { pool } = require('../config/database');

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connexion DB OK');
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE eggs_collection_new RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE breeding_sites_new RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE adult_mosquitoes_new RESTART IDENTITY CASCADE');
    await client.query('COMMIT');
    console.log('🧹 Tables vidées (IDs réinitialisés)');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur TRUNCATE:', e.message);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(1);
  } finally {
    client.release();
  }
}

main();





