const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
});

async function checkDatabase() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ÉTAT DE LA BASE DE DONNÉES');
    console.log('='.repeat(80) + '\n');
    
    try {
        // Lister toutes les tables
        const tablesResult = await pool.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('📋 TABLES EXISTANTES :\n');
        
        if (tablesResult.rows.length === 0) {
            console.log('❌ AUCUNE TABLE TROUVÉE !\n');
            return;
        }
        
        for (const table of tablesResult.rows) {
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            const rowCount = countResult.rows[0].count;
            
            console.log(`✅ ${table.table_name}`);
            console.log(`   Colonnes: ${table.column_count} | Lignes: ${rowCount}`);
            console.log('');
        }
        
        // Lister les vues
        const viewsResult = await pool.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        if (viewsResult.rows.length > 0) {
            console.log('\n📊 VUES EXISTANTES :\n');
            viewsResult.rows.forEach(view => {
                console.log(`✅ ${view.table_name}`);
            });
            console.log('');
        }
        
        // Résumé
        console.log('='.repeat(80));
        console.log('RÉSUMÉ :');
        console.log(`  Tables : ${tablesResult.rows.length}`);
        console.log(`  Vues : ${viewsResult.rows.length}`);
        console.log(`  Total lignes de données : ${tablesResult.rows.reduce((sum, t, i) => sum + parseInt(tablesResult.rows[i] ? 0 : 0), 0)}`);
        console.log('='.repeat(80));
        console.log('\n💡 Les tables sont VIDES car c\'est un nouveau système.');
        console.log('   Vous devez maintenant ajouter des données via :');
        console.log('   1. Le frontend : http://localhost:3000/collect');
        console.log('   2. Ou insérer des données de test');
        console.log('');
        
    } catch (error) {
        console.error('❌ ERREUR :', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();

