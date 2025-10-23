const { Pool } = require('pg');

// Configuration directe pour le script
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function truncateDataTables() {
    try {
        console.log('🗑️  Début du vidage des tables de données...');
        
        // Vider breeding_sites_new
        console.log('📊 Vidage de breeding_sites_new...');
        await pool.query('TRUNCATE TABLE breeding_sites_new CASCADE');
        console.log('✅ breeding_sites_new vidée');
        
        // Vider adult_mosquitoes_new
        console.log('📊 Vidage de adult_mosquitoes_new...');
        await pool.query('TRUNCATE TABLE adult_mosquitoes_new CASCADE');
        console.log('✅ adult_mosquitoes_new vidée');
        
        // Vider eggs_collection_new
        console.log('📊 Vidage de eggs_collection_new...');
        await pool.query('TRUNCATE TABLE eggs_collection_new CASCADE');
        console.log('✅ eggs_collection_new vidée');
        
        console.log('🎉 Toutes les tables ont été vidées avec succès !');
        
        // Vérifier le nombre d'enregistrements restants
        console.log('\n🔍 Vérification des tables :');
        
        const breedingCount = await pool.query('SELECT COUNT(*) FROM breeding_sites_new');
        console.log(`breeding_sites_new: ${breedingCount.rows[0].count} enregistrements`);
        
        const adultCount = await pool.query('SELECT COUNT(*) FROM adult_mosquitoes_new');
        console.log(`adult_mosquitoes_new: ${adultCount.rows[0].count} enregistrements`);
        
        const eggsCount = await pool.query('SELECT COUNT(*) FROM eggs_collection_new');
        console.log(`eggs_collection_new: ${eggsCount.rows[0].count} enregistrements`);
        
    } catch (error) {
        console.error('❌ Erreur lors du vidage des tables:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

truncateDataTables();
