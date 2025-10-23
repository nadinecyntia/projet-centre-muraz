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

async function checkSiteClassesData() {
    try {
        console.log('🔍 Vérification des données site_classes...');
        
        const result = await pool.query(`
            SELECT site_classes, site_environment, total_sites_count 
            FROM breeding_sites_new 
            WHERE status = 'approved' 
            LIMIT 5
        `);
        
        console.log(`📊 ${result.rows.length} enregistrements trouvés:`);
        
        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. Classes: ${row.site_classes}`);
            console.log(`   Environment: ${row.site_environment}`);
            console.log(`   Count: ${row.total_sites_count}`);
            console.log(`   Type: ${typeof row.site_classes}`);
            console.log('');
        });
        
        // Vérifier les types de données
        const typesResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN site_classes IS NOT NULL THEN 1 END) as with_classes,
                COUNT(CASE WHEN site_environment IS NOT NULL THEN 1 END) as with_environment
            FROM breeding_sites_new 
            WHERE status = 'approved'
        `);
        
        console.log('📈 Statistiques:');
        console.log(`- Total: ${typesResult.rows[0].total}`);
        console.log(`- Avec site_classes: ${typesResult.rows[0].with_classes}`);
        console.log(`- Avec environment: ${typesResult.rows[0].with_environment}`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkSiteClassesData();
