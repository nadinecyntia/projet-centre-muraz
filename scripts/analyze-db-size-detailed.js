const { pool } = require('../config/database');

async function analyzeSize() {
    try {
        console.log('📊 ANALYSE DÉTAILLÉE DE LA TAILLE DE LA BASE DE DONNÉES\n');
        
        // Taille globale de la base
        const dbSize = await pool.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as total_size,
                pg_database_size(current_database()) as total_bytes
        `);
        
        console.log('🗄️ TAILLE GLOBALE:');
        console.log(`   ${dbSize.rows[0].total_size}\n`);
        
        // Taille par table (avec nombre de lignes)
        const tablesSize = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
                pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
                pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);
        
        console.log('📋 TAILLE PAR TABLE (ordre décroissant):\n');
        
        for (const table of tablesSize.rows) {
            // Récupérer le nombre de lignes
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.tablename}`);
            const rowCount = parseInt(countResult.rows[0].count);
            
            // Calculer la taille moyenne par ligne
            const avgSizePerRow = rowCount > 0 
                ? (table.size_bytes / rowCount).toFixed(2) 
                : 0;
            
            console.log(`📦 ${table.tablename}:`);
            console.log(`   Taille totale: ${table.size}`);
            console.log(`   - Données: ${table.table_size}`);
            console.log(`   - Indexes: ${table.indexes_size}`);
            console.log(`   - Lignes: ${rowCount.toLocaleString()}`);
            console.log(`   - Taille moyenne/ligne: ${avgSizePerRow} bytes (~${(avgSizePerRow / 1024).toFixed(2)} KB)`);
            console.log('');
        }
        
        // Taille des index
        const indexesSize = await pool.query(`
            SELECT 
                SUM(pg_indexes_size(schemaname||'.'||tablename)) as total_indexes_bytes
            FROM pg_tables
            WHERE schemaname = 'public'
        `);
        
        const indexesSizeMB = (indexesSize.rows[0].total_indexes_bytes || 0) / 1024 / 1024;
        
        console.log('📊 RÉSUMÉ:');
        console.log(`   Taille totale base: ${dbSize.rows[0].total_size}`);
        console.log(`   Taille totale index: ${indexesSizeMB.toFixed(2)} MB`);
        
        // Calculer la taille par type d'enregistrement
        const eggsCount = await pool.query('SELECT COUNT(*) as count FROM eggs_collections');
        const mosquitoesCount = await pool.query('SELECT COUNT(*) as count FROM adult_mosquitoes_collections');
        const breedingCount = await pool.query('SELECT COUNT(*) as count FROM breeding_sites');
        const housesCount = await pool.query('SELECT COUNT(*) as count FROM houses');
        
        const eggsSize = await pool.query(`SELECT pg_total_relation_size('eggs_collections') as size`);
        const mosquitoesSize = await pool.query(`SELECT pg_total_relation_size('adult_mosquitoes_collections') as size`);
        const breedingSize = await pool.query(`SELECT pg_total_relation_size('breeding_sites') as size`);
        const housesSize = await pool.query(`SELECT pg_total_relation_size('houses') as size`);
        
        console.log('\n📈 TAILLE PAR TYPE DE DONNÉES:');
        console.log(`   Eggs (${parseInt(eggsCount.rows[0].count).toLocaleString()} enregistrements): ${(eggsSize.rows[0].size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Mosquitoes (${parseInt(mosquitoesCount.rows[0].count).toLocaleString()} enregistrements): ${(mosquitoesSize.rows[0].size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Breeding sites (${parseInt(breedingCount.rows[0].count).toLocaleString()} enregistrements): ${(breedingSize.rows[0].size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Houses (${parseInt(housesCount.rows[0].count).toLocaleString()} enregistrements): ${(housesSize.rows[0].size / 1024 / 1024).toFixed(2)} MB`);
        
        // Projection basée sur la taille réelle
        const eggsSizeMB = eggsSize.rows[0].size / 1024 / 1024;
        const mosquitoesSizeMB = mosquitoesSize.rows[0].size / 1024 / 1024;
        const breedingSizeMB = breedingSize.rows[0].size / 1024 / 1024;
        
        const eggsAvgKB = eggsCount.rows[0].count > 0 ? (eggsSize.rows[0].size / 1024) / eggsCount.rows[0].count : 0;
        const mosquitoesAvgKB = mosquitoesCount.rows[0].count > 0 ? (mosquitoesSize.rows[0].size / 1024) / mosquitoesCount.rows[0].count : 0;
        const breedingAvgKB = breedingCount.rows[0].count > 0 ? (breedingSize.rows[0].size / 1024) / breedingCount.rows[0].count : 0;
        
        // Moyenne pondérée (en supposant 50% eggs, 50% mosquitoes dans la croissance)
        const avgSizePerRecordKB = (eggsAvgKB * 0.5) + (mosquitoesAvgKB * 0.5);
        
        console.log('\n🔮 PROJECTION BASÉE SUR TAILLE RÉELLE:');
        console.log(`   Taille moyenne par enregistrement:`);
        console.log(`   - Eggs: ${eggsAvgKB.toFixed(2)} KB/enregistrement`);
        console.log(`   - Mosquitoes: ${mosquitoesAvgKB.toFixed(2)} KB/enregistrement`);
        console.log(`   - Breeding: ${breedingAvgKB.toFixed(2)} KB/enregistrement`);
        console.log(`   - Moyenne pondérée: ${avgSizePerRecordKB.toFixed(2)} KB/enregistrement`);
        console.log(`\n   Avec 750 enregistrements/mois sur 10 ans (90 000 nouveaux):`);
        const newDataSizeMB = (avgSizePerRecordKB * 90000) / 1024;
        const totalFutureSizeMB = eggsSizeMB + mosquitoesSizeMB + breedingSizeMB + newDataSizeMB;
        console.log(`   - Taille supplémentaire: ~${newDataSizeMB.toFixed(2)} MB (~${(newDataSizeMB / 1024).toFixed(2)} GB)`);
        console.log(`   - Taille totale estimée: ~${totalFutureSizeMB.toFixed(2)} MB (~${(totalFutureSizeMB / 1024).toFixed(2)} GB)`);
        
        console.log(`\n   Avec 750 enregistrements/mois sur 20 ans (180 000 nouveaux):`);
        const newDataSize20MB = (avgSizePerRecordKB * 180000) / 1024;
        const totalFutureSize20MB = eggsSizeMB + mosquitoesSizeMB + breedingSizeMB + newDataSize20MB;
        console.log(`   - Taille supplémentaire: ~${newDataSize20MB.toFixed(2)} MB (~${(newDataSize20MB / 1024).toFixed(2)} GB)`);
        console.log(`   - Taille totale estimée: ~${totalFutureSize20MB.toFixed(2)} MB (~${(totalFutureSize20MB / 1024).toFixed(2)} GB)`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

analyzeSize();

