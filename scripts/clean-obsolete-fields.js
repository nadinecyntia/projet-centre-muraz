// Script de nettoyage des champs obsolètes
// Supprime les colonnes qui n'existent plus dans KoboToolbox
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function cleanObsoleteFields() {
    const client = await pool.connect();
    
    try {
        console.log('🧹 NETTOYAGE DES CHAMPS OBSOLÈTES DE LA BASE\n');
        
        // 1. Vérifier la structure actuelle
        console.log('📋 1. Vérification de la structure actuelle...');
        
        const currentStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'breeding_sites' 
            ORDER BY ordinal_position
        `);
        
        console.log('   Colonnes actuelles dans breeding_sites:');
        currentStructure.rows.forEach(col => {
            console.log(`     ${col.column_name}: ${col.data_type}`);
        });
        
        // 2. Supprimer les colonnes obsolètes
        console.log('\n📋 2. Suppression des colonnes obsolètes...');
        
        // Supprimer les colonnes qui n'existent plus dans KoboToolbox
        const obsoleteColumns = [
            'larvae_or_pupae_presence',  // Ancien champ
            'pupae_presence_old'         // Ancien champ (si existe)
        ];
        
        for (const column of obsoleteColumns) {
            try {
                // Vérifier si la colonne existe avant de la supprimer
                const columnExists = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'breeding_sites' 
                    AND column_name = $1
                `, [column]);
                
                if (columnExists.rows.length > 0) {
                    await client.query(`ALTER TABLE breeding_sites DROP COLUMN ${column}`);
                    console.log(`   ✅ Colonne ${column} supprimée`);
                } else {
                    console.log(`   ℹ️ Colonne ${column} n'existe pas (déjà supprimée)`);
                }
            } catch (error) {
                console.log(`   ⚠️ Erreur lors de la suppression de ${column}: ${error.message}`);
            }
        }
        
        // 3. Vérifier la structure finale
        console.log('\n📋 3. Vérification de la structure finale...');
        
        const finalStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'breeding_sites' 
            ORDER BY ordinal_position
        `);
        
        console.log('   Colonnes finales dans breeding_sites:');
        finalStructure.rows.forEach(col => {
            console.log(`     ${col.column_name}: ${col.data_type}`);
        });
        
        // 4. Vérifier que les champs actuels correspondent à KoboToolbox
        console.log('\n📋 4. Correspondance avec KoboToolbox...');
        
        const expectedFields = [
            'breeding_site_id', 'breeding_site_status', 'larvae_presence',
            'pupae_presence', 'larvae_count', 'pupae_count',
            'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count',
            'culex_pupae_count', 'anopheles_pupae_count', 'aedes_pupae_count',
            'breeding_site_class', 'breeding_site_type'
        ];
        
        const existingFields = finalStructure.rows.map(row => row.column_name);
        
        expectedFields.forEach(field => {
            if (existingFields.includes(field)) {
                console.log(`   ✅ ${field}: PRÉSENT dans la base`);
            } else {
                console.log(`   ❌ ${field}: MANQUANT dans la base`);
            }
        });
        
        console.log('\n🎉 Nettoyage terminé !');
        console.log('\n📝 Prochaines étapes :');
        console.log('   1. Vérifier que les noms de variables dans KoboToolbox correspondent');
        console.log('   2. Tester la synchronisation');
        console.log('   3. Vérifier l\'insertion des données');
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Exécuter le nettoyage
cleanObsoleteFields().catch(console.error);







