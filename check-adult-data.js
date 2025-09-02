const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkAdultData() {
    try {
        console.log('🔍 Vérification des données adult_mosquitoes...');
        
        const result = await pool.query(`
            SELECT 
                id,
                genus,
                species,
                total_mosquitoes_count,
                created_at
            FROM adult_mosquitoes 
            LIMIT 5
        `);
        
        console.log(`📊 ${result.rows.length} enregistrements trouvés`);
        
        result.rows.forEach((row, index) => {
            console.log(`\n📋 Enregistrement ${index + 1}:`);
            console.log(`   ID: ${row.id}`);
            console.log(`   Genus: ${JSON.stringify(row.genus)}`);
            console.log(`   Species: ${JSON.stringify(row.species)}`);
            console.log(`   Total moustiques: ${row.total_mosquitoes_count}`);
            console.log(`   Créé le: ${row.created_at}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

checkAdultData();

