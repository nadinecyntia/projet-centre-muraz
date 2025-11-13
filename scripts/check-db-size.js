const { pool } = require('../config/database');

async function checkSize() {
    try {
        const dbSize = await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        const eggs = await pool.query('SELECT COUNT(*) as total FROM eggs_collections');
        const mosquitoes = await pool.query('SELECT COUNT(*) as total FROM adult_mosquitoes_collections');
        const breeding = await pool.query('SELECT COUNT(*) as total FROM breeding_sites');
        
        console.log('📊 Taille base de données:', dbSize.rows[0].size);
        console.log('📈 Nombre d\'enregistrements:');
        console.log('  - Eggs:', eggs.rows[0].total);
        console.log('  - Mosquitoes:', mosquitoes.rows[0].total);
        console.log('  - Breeding sites:', breeding.rows[0].total);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

checkSize();


