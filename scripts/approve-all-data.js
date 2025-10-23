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

async function approveAllData() {
    try {
        console.log('✅ Début de l\'approbation des données...');
        
        // Approuver toutes les données d'œufs
        console.log('🥚 Approbation des données eggs_collection_new...');
        const eggsResult = await pool.query(`
            UPDATE eggs_collection_new 
            SET status = 'approved', 
                validated_at = NOW(),
                validated_by = 'admin'
            WHERE status = 'pending'
        `);
        console.log(`✅ ${eggsResult.rowCount} enregistrements d'œufs approuvés`);
        
        // Approuver toutes les données de gîtes
        console.log('🏠 Approbation des données breeding_sites_new...');
        const breedingResult = await pool.query(`
            UPDATE breeding_sites_new 
            SET status = 'approved', 
                validated_at = NOW(),
                validated_by = 'admin'
            WHERE status = 'pending'
        `);
        console.log(`✅ ${breedingResult.rowCount} enregistrements de gîtes approuvés`);
        
        // Approuver toutes les données de moustiques
        console.log('🦟 Approbation des données adult_mosquitoes_new...');
        const mosquitoesResult = await pool.query(`
            UPDATE adult_mosquitoes_new 
            SET status = 'approved', 
                validated_at = NOW(),
                validated_by = 'admin'
            WHERE status = 'pending'
        `);
        console.log(`✅ ${mosquitoesResult.rowCount} enregistrements de moustiques approuvés`);
        
        console.log('🎉 Toutes les données ont été approuvées avec succès !');
        
        // Vérification finale
        console.log('\n🔍 Vérification des statuts :');
        
        const eggsStatus = await pool.query('SELECT status, COUNT(*) FROM eggs_collection_new GROUP BY status');
        console.log('eggs_collection_new:');
        eggsStatus.rows.forEach(row => console.log(`  - ${row.status}: ${row.count}`));
        
        const breedingStatus = await pool.query('SELECT status, COUNT(*) FROM breeding_sites_new GROUP BY status');
        console.log('breeding_sites_new:');
        breedingStatus.rows.forEach(row => console.log(`  - ${row.status}: ${row.count}`));
        
        const mosquitoesStatus = await pool.query('SELECT status, COUNT(*) FROM adult_mosquitoes_new GROUP BY status');
        console.log('adult_mosquitoes_new:');
        mosquitoesStatus.rows.forEach(row => console.log(`  - ${row.status}: ${row.count}`));
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'approbation des données:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

approveAllData();
