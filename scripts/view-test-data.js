const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
});

async function viewTestData() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DONNÉES DE TEST ACTUELLES');
    console.log('='.repeat(80) + '\n');
    
    try {
        // Maisons
        console.log('🏠 MAISONS :');
        console.log('-'.repeat(80));
        const houses = await pool.query('SELECT * FROM houses ORDER BY id');
        if (houses.rows.length > 0) {
            houses.rows.forEach(h => {
                console.log(`  ID ${h.id} : ${h.concession_code} | ${h.sector} | ${h.environment}`);
            });
        } else {
            console.log('  Aucune maison');
        }
        console.log('');
        
        // Œufs
        console.log('🥚 COLLECTES D\'ŒUFS :');
        console.log('-'.repeat(80));
        const eggs = await pool.query(`
            SELECT e.*, h.concession_code, h.sector 
            FROM eggs_collections e
            JOIN houses h ON e.house_id = h.id
            ORDER BY e.id
        `);
        if (eggs.rows.length > 0) {
            eggs.rows.forEach(e => {
                console.log(`  ID ${e.id} : ${e.concession_code} (${e.sector}) | Date: ${e.visit_date} | Œufs: ${e.eggs_count}`);
            });
        } else {
            console.log('  Aucune collecte d\'œufs');
        }
        console.log('');
        
        // Gîtes
        console.log('🦟 GÎTES LARVAIRES :');
        console.log('-'.repeat(80));
        const sites = await pool.query(`
            SELECT s.*, h.concession_code, h.sector 
            FROM breeding_sites s
            JOIN houses h ON s.house_id = h.id
            ORDER BY s.id
        `);
        if (sites.rows.length > 0) {
            sites.rows.forEach(s => {
                console.log(`  ID ${s.id} : ${s.concession_code} | ${s.site_type} | ${s.is_positive ? '✅ Positif' : '❌ Négatif'} | Larves: ${s.larvae_count} (${s.larvae_genus || '-'})`);
            });
        } else {
            console.log('  Aucun gîte');
        }
        console.log('');
        
        // Résumé des gîtes (calculé automatiquement)
        console.log('📊 RÉSUMÉ GÎTES (Calculé automatiquement) :');
        console.log('-'.repeat(80));
        const summary = await pool.query('SELECT * FROM breeding_sites_summary');
        if (summary.rows.length > 0) {
            summary.rows.forEach(s => {
                console.log(`  Maison ${s.house_id} | Date: ${s.visit_date}`);
                console.log(`    Total gîtes: ${s.total_sites_count} (${s.positive_sites_count} positifs, ${s.negative_sites_count} négatifs)`);
                console.log(`    Larves aedes: ${s.aedes_larvae_count} | culex: ${s.culex_larvae_count} | Total: ${s.total_larvae_count}`);
            });
        } else {
            console.log('  Aucun résumé');
        }
        console.log('');
        
        // Moustiques adultes
        console.log('🦟 COLLECTES MOUSTIQUES :');
        console.log('-'.repeat(80));
        const collections = await pool.query(`
            SELECT c.*, h.concession_code, h.sector 
            FROM adult_mosquitoes_collections c
            JOIN houses h ON c.house_id = h.id
            ORDER BY c.id
        `);
        if (collections.rows.length > 0) {
            collections.rows.forEach(c => {
                console.log(`  ID ${c.id} : ${c.concession_code} | ${c.collection_method} × ${c.capture_location} | Date: ${c.visit_date}`);
            });
        } else {
            console.log('  Aucune collecte');
        }
        console.log('');
        
        // Spécimens
        console.log('🔬 SPÉCIMENS :');
        console.log('-'.repeat(80));
        const specimens = await pool.query('SELECT * FROM mosquito_specimens ORDER BY id');
        if (specimens.rows.length > 0) {
            specimens.rows.forEach(s => {
                console.log(`  Collection ${s.collection_id} : ${s.count}× ${s.genus} ${s.species || ''} | ${s.sex} ${s.physiological_state || ''}`);
            });
        } else {
            console.log('  Aucun spécimen');
        }
        console.log('');
        
        // Résumé moustiques (calculé automatiquement)
        console.log('📊 RÉSUMÉ MOUSTIQUES (Calculé automatiquement) :');
        console.log('-'.repeat(80));
        const mosquitoSummary = await pool.query('SELECT * FROM adult_mosquitoes_summary');
        if (mosquitoSummary.rows.length > 0) {
            mosquitoSummary.rows.forEach(s => {
                console.log(`  Collecte ${s.collection_id} | ${s.collection_method} × ${s.capture_location}`);
                console.log(`    Total: ${s.total_mosquitoes_count} moustiques (${s.male_count} mâles, ${s.female_count} femelles)`);
                console.log(`    Aedes: ${s.aedes_count} | Culex: ${s.culex_count} | Anopheles: ${s.anopheles_count}`);
            });
        } else {
            console.log('  Aucun résumé');
        }
        console.log('');
        
        console.log('='.repeat(80));
        console.log('✅ Ces données ont été créées par le script de test');
        console.log('🎯 Testez maintenant le frontend : http://localhost:3000/collect');
        console.log('='.repeat(80));
        console.log('');
        
    } catch (error) {
        console.error('❌ ERREUR :', error.message);
    } finally {
        await pool.end();
    }
}

viewTestData();

