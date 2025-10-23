const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
});

console.log('\n' + '='.repeat(80));
console.log('🚀 DÉPLOIEMENT DU SYSTÈME NORMALISÉ');
console.log('='.repeat(80) + '\n');

async function deploy() {
    const client = await pool.connect();
    
    try {
        // ===== ÉTAPE 1 : Vérifier l'état actuel =====
        console.log('📋 ÉTAPE 1/4 : Vérification de l\'état actuel...');
        console.log('-'.repeat(80));
        
        const oldTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('eggs_collection_new', 'breeding_sites_new', 'adult_mosquitoes_new')
            ORDER BY table_name
        `);
        
        console.log(`Anciennes tables trouvées : ${oldTablesResult.rows.length}`);
        oldTablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        if (oldTablesResult.rows.length > 0) {
            console.log('\n⚠️  Les anciennes tables vont être SUPPRIMÉES !');
            console.log('Vous avez 5 secondes pour annuler (Ctrl+C)...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // ===== ÉTAPE 2 : Supprimer les anciennes tables =====
        console.log('\n🗑️  ÉTAPE 2/4 : Suppression des anciennes tables...');
        console.log('-'.repeat(80));
        
        await client.query('DROP TABLE IF EXISTS adult_mosquitoes_new CASCADE');
        console.log('✅ adult_mosquitoes_new supprimée');
        
        await client.query('DROP TABLE IF EXISTS breeding_sites_new CASCADE');
        console.log('✅ breeding_sites_new supprimée');
        
        await client.query('DROP TABLE IF EXISTS eggs_collection_new CASCADE');
        console.log('✅ eggs_collection_new supprimée');
        
        // ===== ÉTAPE 3 : Créer les nouvelles tables =====
        console.log('\n🏗️  ÉTAPE 3/4 : Création des nouvelles tables...');
        console.log('-'.repeat(80));
        
        // Lire et exécuter le script SQL
        const sqlScript = fs.readFileSync(
            path.join(__dirname, 'create-new-normalized-tables.sql'),
            'utf8'
        );
        
        await client.query(sqlScript);
        console.log('✅ Nouvelles tables créées');
        
        // Vérifier
        const newTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections', 'mosquito_specimens')
            ORDER BY table_name
        `);
        
        console.log(`\nTables créées : ${newTablesResult.rows.length} / 5`);
        newTablesResult.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });
        
        // ===== ÉTAPE 4 : Créer les vues =====
        console.log('\n📊 ÉTAPE 4/4 : Création des vues pour calculs automatiques...');
        console.log('-'.repeat(80));
        
        const viewsScript = fs.readFileSync(
            path.join(__dirname, 'create-summary-views.sql'),
            'utf8'
        );
        
        await client.query(viewsScript);
        console.log('✅ Vues créées');
        
        // Vérifier
        const viewsResult = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('breeding_sites_summary', 'adult_mosquitoes_summary', 'eggs_collections_with_house_info', 'houses_complete_stats')
            ORDER BY table_name
        `);
        
        console.log(`\nVues créées : ${viewsResult.rows.length} / 4`);
        viewsResult.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });
        
        // ===== RÉSULTAT FINAL =====
        console.log('\n' + '='.repeat(80));
        console.log('✅ DÉPLOIEMENT RÉUSSI !');
        console.log('='.repeat(80));
        console.log('');
        console.log('Le nouveau système normalisé a été déployé avec succès :');
        console.log(`  ✅ ${newTablesResult.rows.length} tables créées`);
        console.log(`  ✅ ${viewsResult.rows.length} vues créées`);
        console.log('');
        console.log('🎯 Prochaine étape : Tester le système');
        console.log('   Exécutez : node scripts/test-new-system.js');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ ERREUR LORS DU DÉPLOIEMENT :', error.message);
        console.error('\nStack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

deploy();

