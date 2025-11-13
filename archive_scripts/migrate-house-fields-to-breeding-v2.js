const { pool } = require('../config/database');

async function migrateHouseFieldsToBreeding() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Migration des champs spécifiques breeding_sites...');
        
        // 1. Supprimer les vues qui dépendent des colonnes
        console.log('🗑️ Suppression des vues dépendantes...');
        await client.query(`DROP VIEW IF EXISTS houses_complete_stats CASCADE`);
        await client.query(`DROP VIEW IF EXISTS eggs_collections_with_house_info CASCADE`);
        await client.query(`DROP VIEW IF EXISTS adult_mosquitoes_summary CASCADE`);
        await client.query(`DROP VIEW IF EXISTS breeding_sites_summary CASCADE`);
        
        // 2. Ajouter les colonnes à breeding_sites
        console.log('📝 Ajout des colonnes à breeding_sites...');
        await client.query(`
            ALTER TABLE breeding_sites 
            ADD COLUMN IF NOT EXISTS household_size INTEGER,
            ADD COLUMN IF NOT EXISTS sleeping_unit_count INTEGER,
            ADD COLUMN IF NOT EXISTS head_contact VARCHAR(200)
        `);
        
        // 3. Copier les données existantes de houses vers breeding_sites
        console.log('📋 Copie des données existantes...');
        await client.query(`
            UPDATE breeding_sites 
            SET 
                household_size = h.household_size,
                sleeping_unit_count = h.sleeping_unit_count,
                head_contact = h.head_contact
            FROM houses h 
            WHERE breeding_sites.house_id = h.id
            AND (h.household_size IS NOT NULL 
                 OR h.sleeping_unit_count IS NOT NULL 
                 OR h.head_contact IS NOT NULL)
        `);
        
        // 4. Supprimer les colonnes de houses
        console.log('🗑️ Suppression des colonnes de houses...');
        await client.query(`
            ALTER TABLE houses 
            DROP COLUMN IF EXISTS household_size,
            DROP COLUMN IF EXISTS sleeping_unit_count,
            DROP COLUMN IF EXISTS head_contact
        `);
        
        // 5. Recréer les vues sans les colonnes supprimées
        console.log('🔧 Recréation des vues...');
        await client.query(`
            CREATE VIEW houses_complete_stats AS
            SELECT 
                h.id,
                h.concession_code,
                h.sector,
                h.environment,
                h.gps_coordinates,
                h.created_at,
                h.updated_at,
                COUNT(DISTINCT e.id) as eggs_collections_count,
                COUNT(DISTINCT b.id) as breeding_sites_count,
                COUNT(DISTINCT m.id) as mosquitoes_collections_count
            FROM houses h
            LEFT JOIN eggs_collections e ON h.id = e.house_id
            LEFT JOIN breeding_sites b ON h.id = b.house_id
            LEFT JOIN adult_mosquitoes_collections m ON h.id = m.house_id
            GROUP BY h.id, h.concession_code, h.sector, h.environment, h.gps_coordinates, h.created_at, h.updated_at
        `);
        
        // 6. Vérifier la migration
        console.log('✅ Vérification de la migration...');
        
        const breedingCount = await client.query(`
            SELECT COUNT(*) as count 
            FROM breeding_sites 
            WHERE household_size IS NOT NULL 
               OR sleeping_unit_count IS NOT NULL 
               OR head_contact IS NOT NULL
        `);
        
        const housesStructure = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'houses' 
            ORDER BY ordinal_position
        `);
        
        const breedingStructure = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'breeding_sites' 
            ORDER BY ordinal_position
        `);
        
        console.log(`\n📊 Résultats de la migration :`);
        console.log(`- ${breedingCount.rows[0].count} enregistrements breeding_sites avec données migrées`);
        console.log(`- Colonnes houses: ${housesStructure.rows.map(r => r.column_name).join(', ')}`);
        console.log(`- Colonnes breeding_sites: ${breedingStructure.rows.map(r => r.column_name).join(', ')}`);
        
        console.log('\n✅ Migration terminée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    migrateHouseFieldsToBreeding()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateHouseFieldsToBreeding };

