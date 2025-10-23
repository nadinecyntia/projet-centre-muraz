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

async function testAnalysesQuery() {
    try {
        console.log('🔍 Test de la requête analyses...');
        
        // Test de la requête exacte de l'API
        const query = `
            WITH all_data AS (
                -- Données d'œufs validées
                SELECT
                    'eggs' as data_type,
                    eggs_concession_code as investigator_name,
                    eggs_concession_code as concession_code,
                    NULL as house_code,
                    eggs_visit_start_date as visit_date,
                    eggs_sector as sector,
                    eggs_environment as environment,
                    eggs_gps_code as gps_code,
                    eggs_count as count_value,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM eggs_collection_new
                WHERE status = 'approved'
                
                UNION ALL
                
                -- Données de gîtes validées
                SELECT
                    'breeding' as data_type,
                    site_investigator_name as investigator_name,
                    site_concession_code as concession_code,
                    site_house_code as house_code,
                    site_visit_start_date as visit_date,
                    site_sector as sector,
                    site_environment as environment,
                    site_gps_code as gps_code,
                    larvae_count as count_value,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM breeding_sites_new
                WHERE status = 'approved'
                
                UNION ALL
                
                -- Données de moustiques validées
                SELECT
                    'mosquitoes' as data_type,
                    mosquitoes_concession_code as investigator_name,
                    mosquitoes_concession_code as concession_code,
                    NULL as house_code,
                    mosquitoes_visit_start_date as visit_date,
                    mosquitoes_sector as sector,
                    mosquitoes_environment as environment,
                    mosquitoes_gps_code as gps_code,
                    total_mosquitoes_count as count_value,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM adult_mosquitoes_new
                WHERE status = 'approved'
            )
            SELECT * FROM all_data
            ORDER BY visit_date DESC, submitted_at DESC
            LIMIT 10;
        `;
        
        const result = await pool.query(query);
        
        console.log(`✅ ${result.rows.length} enregistrements trouvés`);
        
        if (result.rows.length > 0) {
            console.log('\n📊 Premiers enregistrements:');
            result.rows.slice(0, 3).forEach((row, index) => {
                console.log(`${index + 1}. Type: ${row.data_type}, Secteur: ${row.sector}, Date: ${row.visit_date}`);
            });
        }
        
        // Test des comptages par type
        console.log('\n📈 Comptages par type:');
        const eggsCount = await pool.query("SELECT COUNT(*) FROM eggs_collection_new WHERE status = 'approved'");
        const breedingCount = await pool.query("SELECT COUNT(*) FROM breeding_sites_new WHERE status = 'approved'");
        const mosquitoesCount = await pool.query("SELECT COUNT(*) FROM adult_mosquitoes_new WHERE status = 'approved'");
        
        console.log(`- Œufs: ${eggsCount.rows[0].count}`);
        console.log(`- Gîtes: ${breedingCount.rows[0].count}`);
        console.log(`- Moustiques: ${mosquitoesCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testAnalysesQuery();
