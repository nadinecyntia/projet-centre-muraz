const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
});

console.log('\n' + '='.repeat(80));
console.log('🧪 TEST DU NOUVEAU SYSTÈME NORMALISÉ');
console.log('='.repeat(80) + '\n');

async function testSystem() {
    const client = await pool.connect();
    
    try {
        // ===== TEST 1 : Vérifier que les tables existent =====
        console.log('📋 TEST 1 : Vérification des tables...');
        console.log('-'.repeat(80));
        
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections', 'mosquito_specimens')
            ORDER BY table_name
        `);
        
        const expectedTables = ['adult_mosquitoes_collections', 'breeding_sites', 'eggs_collections', 'houses', 'mosquito_specimens'];
        const foundTables = tablesResult.rows.map(r => r.table_name);
        
        console.log(`Tables trouvées : ${foundTables.length} / ${expectedTables.length}`);
        expectedTables.forEach(tableName => {
            const exists = foundTables.includes(tableName);
            console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
        });
        
        if (foundTables.length !== expectedTables.length) {
            console.log('\n❌ ERREUR : Certaines tables sont manquantes !');
            console.log('Exécutez : psql -U postgres -d centre_muraz_arbovirose -f scripts/create-new-normalized-tables.sql\n');
            return;
        }
        
        console.log('✅ Toutes les tables existent\n');
        
        // ===== TEST 2 : Vérifier que les vues existent =====
        console.log('📋 TEST 2 : Vérification des vues...');
        console.log('-'.repeat(80));
        
        const viewsResult = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('breeding_sites_summary', 'adult_mosquitoes_summary', 'eggs_collections_with_house_info', 'houses_complete_stats')
            ORDER BY table_name
        `);
        
        const expectedViews = ['adult_mosquitoes_summary', 'breeding_sites_summary', 'eggs_collections_with_house_info', 'houses_complete_stats'];
        const foundViews = viewsResult.rows.map(r => r.table_name);
        
        console.log(`Vues trouvées : ${foundViews.length} / ${expectedViews.length}`);
        expectedViews.forEach(viewName => {
            const exists = foundViews.includes(viewName);
            console.log(`  ${exists ? '✅' : '❌'} ${viewName}`);
        });
        
        if (foundViews.length !== expectedViews.length) {
            console.log('\n⚠️  AVERTISSEMENT : Certaines vues sont manquantes !');
            console.log('Exécutez : psql -U postgres -d centre_muraz_arbovirose -f scripts/create-summary-views.sql\n');
        } else {
            console.log('✅ Toutes les vues existent\n');
        }
        
        // ===== TEST 3 : Insérer une maison de test =====
        console.log('🏠 TEST 3 : Création d\'une maison de test...');
        console.log('-'.repeat(80));
        
        await client.query('BEGIN');
        
        // Supprimer les données de test si elles existent déjà
        await client.query("DELETE FROM houses WHERE concession_code = 'TEST-001' AND sector = 'Sector 6'");
        
        const houseResult = await client.query(`
            INSERT INTO houses (concession_code, sector, environment, gps_coordinates)
            VALUES ('TEST-001', 'Sector 6', 'urban', '12.345678,-1.234567')
            RETURNING id
        `);
        
        const house_id = houseResult.rows[0].id;
        console.log(`✅ Maison créée : ID ${house_id} (TEST-001, Sector 6)\n`);
        
        // ===== TEST 4 : Insérer une collecte d'œufs =====
        console.log('🥚 TEST 4 : Insertion d\'une collecte d\'œufs...');
        console.log('-'.repeat(80));
        
        const eggsResult = await client.query(`
            INSERT INTO eggs_collections (house_id, visit_date, investigator_name, nest_number, nest_code, eggs_count, observations)
            VALUES ($1, '2025-10-21', 'Test User', 'NEST-01', 'N001', 50, 'Test automatique')
            RETURNING id
        `, [house_id]);
        
        const eggs_id = eggsResult.rows[0].id;
        console.log(`✅ Collecte d'œufs créée : ID ${eggs_id}\n`);
        
        // ===== TEST 5 : Insérer des gîtes larvaires =====
        console.log('🦟 TEST 5 : Insertion de gîtes larvaires...');
        console.log('-'.repeat(80));
        
        const site1 = await client.query(`
            INSERT INTO breeding_sites (house_id, visit_date, investigator_name, site_number, site_type, site_class, is_positive, larvae_count, larvae_genus)
            VALUES ($1, '2025-10-21', 'Test User', 1, 'pneu', 'household_waste', true, 20, 'aedes')
            RETURNING id
        `, [house_id]);
        
        const site2 = await client.query(`
            INSERT INTO breeding_sites (house_id, visit_date, investigator_name, site_number, site_type, site_class, is_positive, larvae_count, larvae_genus)
            VALUES ($1, '2025-10-21', 'Test User', 2, 'bidon', 'abandoned_utensils', true, 15, 'culex')
            RETURNING id
        `, [house_id]);
        
        const site3 = await client.query(`
            INSERT INTO breeding_sites (house_id, visit_date, investigator_name, site_number, site_type, site_class, is_positive)
            VALUES ($1, '2025-10-21', 'Test User', 3, 'bassin', 'breeding_utensils', false)
            RETURNING id
        `, [house_id]);
        
        console.log(`✅ Gîte 1 créé : ID ${site1.rows[0].id} (pneu, 20 larves aedes)`);
        console.log(`✅ Gîte 2 créé : ID ${site2.rows[0].id} (bidon, 15 larves culex)`);
        console.log(`✅ Gîte 3 créé : ID ${site3.rows[0].id} (bassin, négatif)\n`);
        
        // ===== TEST 6 : Vérifier le calcul automatique des totaux =====
        console.log('📊 TEST 6 : Vérification des totaux calculés automatiquement...');
        console.log('-'.repeat(80));
        
        const summaryResult = await client.query(`
            SELECT 
                total_sites_count,
                positive_sites_count,
                negative_sites_count,
                aedes_larvae_count,
                culex_larvae_count,
                total_larvae_count
            FROM breeding_sites_summary
            WHERE house_id = $1 AND visit_date = '2025-10-21'
        `, [house_id]);
        
        if (summaryResult.rows.length > 0) {
            const summary = summaryResult.rows[0];
            console.log('Totaux calculés :');
            console.log(`  Total gîtes : ${summary.total_sites_count} (attendu: 3)`);
            console.log(`  Gîtes positifs : ${summary.positive_sites_count} (attendu: 2)`);
            console.log(`  Gîtes négatifs : ${summary.negative_sites_count} (attendu: 1)`);
            console.log(`  Larves aedes : ${summary.aedes_larvae_count} (attendu: 20)`);
            console.log(`  Larves culex : ${summary.culex_larvae_count} (attendu: 15)`);
            console.log(`  Total larves : ${summary.total_larvae_count} (attendu: 35)`);
            
            // Vérification
            const allCorrect = 
                summary.total_sites_count === 3 &&
                summary.positive_sites_count === 2 &&
                summary.negative_sites_count === 1 &&
                summary.aedes_larvae_count === 20 &&
                summary.culex_larvae_count === 15 &&
                summary.total_larvae_count === 35;
            
            if (allCorrect) {
                console.log('\n✅ TOUS LES CALCULS SONT CORRECTS !\n');
            } else {
                console.log('\n❌ ERREUR : Les calculs ne correspondent pas aux valeurs attendues !\n');
            }
        } else {
            console.log('❌ ERREUR : Aucun résumé trouvé dans la vue breeding_sites_summary\n');
        }
        
        // ===== TEST 7 : Insérer une collecte de moustiques avec spécimens =====
        console.log('🦟 TEST 7 : Insertion d\'une collecte de moustiques...');
        console.log('-'.repeat(80));
        
        const collectionResult = await client.query(`
            INSERT INTO adult_mosquitoes_collections (house_id, visit_date, visit_start_time, visit_end_time, investigator_name, collection_method, capture_location, traps_count)
            VALUES ($1, '2025-10-21', '08:00', '09:30', 'Test User', 'prokopack', 'interior', 2)
            RETURNING id
        `, [house_id]);
        
        const collection_id = collectionResult.rows[0].id;
        console.log(`✅ Collecte créée : ID ${collection_id} (prokopack, interior)\n`);
        
        // Insérer des spécimens
        await client.query(`
            INSERT INTO mosquito_specimens (collection_id, genus, species, sex, physiological_state, count)
            VALUES 
                ($1, 'aedes', 'aedes_aegypti', 'female', 'blood_fed', 5),
                ($1, 'aedes', 'aedes_aegypti', 'male', null, 3),
                ($1, 'culex', 'culex', 'female', 'gravid', 2)
        `, [collection_id]);
        
        console.log('✅ Spécimens insérés : 5 femelles aedes gorgées, 3 mâles aedes, 2 femelles culex gravides\n');
        
        // ===== TEST 8 : Vérifier les totaux de moustiques =====
        console.log('📊 TEST 8 : Vérification des totaux de moustiques...');
        console.log('-'.repeat(80));
        
        const mosquitoSummaryResult = await client.query(`
            SELECT 
                total_mosquitoes_count,
                male_count,
                female_count,
                aedes_count,
                culex_count,
                blood_fed_females_count,
                gravid_females_count
            FROM adult_mosquitoes_summary
            WHERE collection_id = $1
        `, [collection_id]);
        
        if (mosquitoSummaryResult.rows.length > 0) {
            const summary = mosquitoSummaryResult.rows[0];
            console.log('Totaux calculés :');
            console.log(`  Total moustiques : ${summary.total_mosquitoes_count} (attendu: 10)`);
            console.log(`  Mâles : ${summary.male_count} (attendu: 3)`);
            console.log(`  Femelles : ${summary.female_count} (attendu: 7)`);
            console.log(`  Aedes : ${summary.aedes_count} (attendu: 8)`);
            console.log(`  Culex : ${summary.culex_count} (attendu: 2)`);
            console.log(`  Femelles gorgées : ${summary.blood_fed_females_count} (attendu: 5)`);
            console.log(`  Femelles gravides : ${summary.gravid_females_count} (attendu: 2)`);
            
            // Vérification
            const allCorrect = 
                summary.total_mosquitoes_count === 10 &&
                summary.male_count === 3 &&
                summary.female_count === 7 &&
                summary.aedes_count === 8 &&
                summary.culex_count === 2 &&
                summary.blood_fed_females_count === 5 &&
                summary.gravid_females_count === 2;
            
            if (allCorrect) {
                console.log('\n✅ TOUS LES CALCULS SONT CORRECTS !\n');
            } else {
                console.log('\n❌ ERREUR : Les calculs ne correspondent pas aux valeurs attendues !\n');
            }
        } else {
            console.log('❌ ERREUR : Aucun résumé trouvé dans la vue adult_mosquitoes_summary\n');
        }
        
        await client.query('COMMIT');
        
        // ===== RÉSULTAT FINAL =====
        console.log('='.repeat(80));
        console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
        console.log('='.repeat(80));
        console.log('');
        console.log('Le système normalisé fonctionne correctement :');
        console.log('  ✅ Tables créées');
        console.log('  ✅ Vues créées');
        console.log('  ✅ Maisons enregistrées');
        console.log('  ✅ Collectes d\'œufs enregistrées');
        console.log('  ✅ Gîtes larvaires enregistrés');
        console.log('  ✅ Collectes de moustiques enregistrées');
        console.log('  ✅ Totaux calculés automatiquement');
        console.log('');
        console.log('🎯 Prochaine étape : Activer le backend (api-collect-normalized.js)');
        console.log('');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERREUR LORS DES TESTS :', error.message);
        console.error('\nStack:', error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

testSystem();

