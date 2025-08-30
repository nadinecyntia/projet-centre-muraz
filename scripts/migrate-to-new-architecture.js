const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'centre_muraz',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function migrateToNewArchitecture() {
    try {
        console.log('🚀 Début de la migration vers la nouvelle architecture...');
        
        // Étape 1: Sauvegarder les données existantes
        console.log('📋 Étape 1: Sauvegarde des données existantes...');
        await backupExistingData();
        
        // Étape 2: Supprimer les anciennes tables
        console.log('🗑️ Étape 2: Suppression des anciennes tables...');
        await dropOldTables();
        
        // Étape 3: Créer les nouvelles tables
        console.log('🏗️ Étape 3: Création des nouvelles tables...');
        await createNewTables();
        
        // Étape 4: Créer les index et contraintes
        console.log('🔍 Étape 4: Création des index et contraintes...');
        await createIndexesAndConstraints();
        
        // Étape 5: Restaurer les données (si possible)
        console.log('📥 Étape 5: Restauration des données...');
        await restoreData();
        
        console.log('✅ Migration terminée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

async function backupExistingData() {
    try {
        // Vérifier si la table biologie_moleculaire existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'biologie_moleculaire'
            );
        `);
        
        if (checkTable.rows[0].exists) {
            console.log('📊 Sauvegarde de la table biologie_moleculaire...');
            
            // Créer une table de sauvegarde
            await pool.query(`
                CREATE TABLE IF NOT EXISTS biologie_moleculaire_backup AS 
                SELECT * FROM biologie_moleculaire;
            `);
            
            const backupCount = await pool.query('SELECT COUNT(*) FROM biologie_moleculaire_backup');
            console.log(`✅ ${backupCount.rows[0].count} enregistrements sauvegardés`);
        } else {
            console.log('ℹ️ Aucune table biologie_moleculaire à sauvegarder');
        }
        
    } catch (error) {
        console.error('⚠️ Erreur lors de la sauvegarde:', error);
        // Continuer même si la sauvegarde échoue
    }
}

async function dropOldTables() {
    try {
        // Supprimer les anciennes tables dans l'ordre (dépendances)
        const tablesToDrop = [
            'analyses_pcr',
            'analyses_bioessai', 
            'analyses_repas_sanguin',
            'infos_communes',
            'biologie_moleculaire',
            'molecular_biology'
        ];
        
        for (const table of tablesToDrop) {
            try {
                await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
                console.log(`🗑️ Table ${table} supprimée`);
            } catch (error) {
                console.log(`ℹ️ Table ${table} n'existait pas ou déjà supprimée`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression des tables:', error);
        throw error;
    }
}

async function createNewTables() {
    try {
        // 1. Table principale des informations communes
        console.log('🏗️ Création de la table infos_communes...');
        await pool.query(`
            CREATE TABLE infos_communes (
                id SERIAL PRIMARY KEY,
                
                -- Informations communes à toutes les analyses
                analysis_type VARCHAR(50) NOT NULL, -- PCR, RT-PCR, Bioessai, Origine Repas Sanguin
                sample_stage VARCHAR(50) NOT NULL, -- œufs, larves, moustiques
                genus TEXT[] NOT NULL, -- Array pour sélection multiple [aedes, anopheles, culex, indetermine]
                species VARCHAR(100) NOT NULL,
                sector VARCHAR(50) NOT NULL, -- secteur_6, secteur_9, secteur_26, secteur_33
                sample_count INTEGER NOT NULL,
                collection_date DATE NOT NULL,
                analysis_date DATE NOT NULL,
                complementary_info TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 2. Table des analyses PCR et RT-PCR
        console.log('🧬 Création de la table analyses_pcr...');
        await pool.query(`
            CREATE TABLE analyses_pcr (
                id SERIAL PRIMARY KEY,
                infos_communes_id INTEGER NOT NULL REFERENCES infos_communes(id) ON DELETE CASCADE,
                
                -- Champs spécifiques PCR/RT-PCR
                identified_species TEXT[] NOT NULL, -- Array pour sélection multiple
                virus_types TEXT[] NOT NULL, -- Array pour sélection multiple [dengue, chikungunya, zika, fievre_jaune]
                homozygous_count INTEGER NOT NULL, -- Nombre d'individus homozygotes pour l'allèle A
                heterozygous_count INTEGER NOT NULL, -- Nombre d'individus hétérozygotes
                total_population INTEGER NOT NULL, -- Nombre total d'individus dans la population
                allelic_frequency_a DECIMAL(5,4), -- Calculé automatiquement f(A)
                allelic_frequency_a_prime DECIMAL(5,4), -- Calculé automatiquement f(A')
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 3. Table des analyses Bioessai
        console.log('🐛 Création de la table analyses_bioessai...');
        await pool.query(`
            CREATE TABLE analyses_bioessai (
                id SERIAL PRIMARY KEY,
                infos_communes_id INTEGER NOT NULL REFERENCES infos_communes(id) ON DELETE CASCADE,
                
                -- Champs spécifiques Bioessai
                insecticide_types TEXT[] NOT NULL, -- Array pour sélection multiple
                mortality_percentage DECIMAL(5,2) NOT NULL,
                survival_percentage DECIMAL(5,2) NOT NULL,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 4. Table des analyses Origine Repas Sanguin
        console.log('🩸 Création de la table analyses_repas_sanguin...');
        await pool.query(`
            CREATE TABLE analyses_repas_sanguin (
                id SERIAL PRIMARY KEY,
                infos_communes_id INTEGER NOT NULL REFERENCES infos_communes(id) ON DELETE CASCADE,
                
                -- Champs spécifiques Origine Repas Sanguin
                blood_meal_origins TEXT[] NOT NULL, -- Array pour sélection multiple [homme, poule, bœuf, porc, chien, âne, mouton, chèvre]
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Toutes les nouvelles tables ont été créées !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des tables:', error);
        throw error;
    }
}

async function createIndexesAndConstraints() {
    try {
        console.log('🔍 Création des index pour optimiser les performances...');
        
        // Index sur infos_communes
        await pool.query('CREATE INDEX IF NOT EXISTS idx_infos_communes_analysis_type ON infos_communes(analysis_type);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_infos_communes_sector ON infos_communes(sector);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_infos_communes_date ON infos_communes(analysis_date);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_infos_communes_genus ON infos_communes USING GIN(genus);');
        
        // Index sur analyses_pcr
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_pcr_infos_id ON analyses_pcr(infos_communes_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_pcr_virus ON analyses_pcr USING GIN(virus_types);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_pcr_species ON analyses_pcr USING GIN(identified_species);');
        
        // Index sur analyses_bioessai
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_bioessai_infos_id ON analyses_bioessai(infos_communes_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_bioessai_insecticide ON analyses_bioessai USING GIN(insecticide_types);');
        
        // Index sur analyses_repas_sanguin
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_repas_infos_id ON analyses_repas_sanguin(infos_communes_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_analyses_repas_origins ON analyses_repas_sanguin USING GIN(blood_meal_origins);');
        
        console.log('✅ Tous les index ont été créés !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des index:', error);
        throw error;
    }
}

async function restoreData() {
    try {
        // Vérifier si des données de sauvegarde existent
        const checkBackup = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'biologie_moleculaire_backup'
            );
        `);
        
        if (checkBackup.rows[0].exists) {
            console.log('📥 Tentative de restauration des données...');
            
            // Pour l'instant, on ne restaure pas automatiquement
            // car la structure a complètement changé
            console.log('ℹ️ Les données de sauvegarde sont conservées dans biologie_moleculaire_backup');
            console.log('ℹ️ Une restauration manuelle sera nécessaire si besoin');
            
        } else {
            console.log('ℹ️ Aucune donnée à restaurer');
        }
        
    } catch (error) {
        console.error('⚠️ Erreur lors de la restauration:', error);
    }
}

// Fonction utilitaire pour tester la nouvelle structure
async function testNewStructure() {
    try {
        console.log('\n🧪 Test de la nouvelle structure...');
        
        // Vérifier que toutes les tables existent
        const tables = ['infos_communes', 'analyses_pcr', 'analyses_bioessai', 'analyses_repas_sanguin'];
        
        for (const table of tables) {
            const result = await pool.query(`
                SELECT COUNT(*) as count FROM ${table};
            `);
            console.log(`✅ Table ${table}: ${result.rows[0].count} enregistrements`);
        }
        
        console.log('\n🎉 Structure testée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

// Exécuter la migration
if (require.main === module) {
    migrateToNewArchitecture()
        .then(() => {
            console.log('\n🚀 Migration terminée !');
            console.log('\n📋 Prochaines étapes:');
            console.log('1. Modifier l\'API backend pour utiliser les nouvelles tables');
            console.log('2. Adapter la page d\'affichage pour les requêtes JOIN');
            console.log('3. Tester les nouveaux formulaires');
        })
        .catch((error) => {
            console.error('\n💥 Migration échouée:', error);
            process.exit(1);
        });
}

module.exports = {
    migrateToNewArchitecture,
    testNewStructure
};

