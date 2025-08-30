const { pool } = require('../config/database');

const createTables = async () => {
    try {
        console.log('🗄️ Création des tables de la base de données...');

        // Table des utilisateurs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table des sessions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid VARCHAR(255) PRIMARY KEY,
                sess JSON NOT NULL,
                expire TIMESTAMP(6) NOT NULL
            );
        `);

        // Table principale des données entomologiques (variables communes)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entomological_data (
                id SERIAL PRIMARY KEY,
                collection_id VARCHAR(100) UNIQUE NOT NULL,
                form_type VARCHAR(50) NOT NULL, -- 'gites', 'oeufs', 'adultes'
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                sector VARCHAR(50) NOT NULL,
                environment VARCHAR(20) NOT NULL,
                gps_code VARCHAR(100),
                concession_code VARCHAR(100),
                household_size INTEGER,
                number_of_beds INTEGER,
                number_of_households INTEGER,
                head_of_household_contact VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table des gîtes larvaires (formulaire 1)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS breeding_sites (
                id SERIAL PRIMARY KEY,
                entomological_data_id INTEGER REFERENCES entomological_data(id),
                breeding_site_id VARCHAR(100),
                breeding_site_status VARCHAR(50),
                larvae_presence BOOLEAN,
                pupae_presence BOOLEAN,
                larvae_count INTEGER,
                pupae_count INTEGER,
                aedes_larvae_count INTEGER,
                culex_larvae_count INTEGER,
                anopheles_larvae_count INTEGER,
                culex_pupae_count INTEGER,
                anopheles_pupae_count INTEGER,
                aedes_pupae_count INTEGER,
                breeding_site_class VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table des œufs (formulaire 2)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS eggs_data (
                id SERIAL PRIMARY KEY,
                entomological_data_id INTEGER REFERENCES entomological_data(id),
                nest_number INTEGER,
                nest_code VARCHAR(100),
                pass_order INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table des moustiques adultes (formulaire 3)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS adult_mosquitoes (
                id SERIAL PRIMARY KEY,
                entomological_data_id INTEGER REFERENCES entomological_data(id),
                number_collected_by_concession INTEGER,
                collection_method VARCHAR(50),
                capture_location VARCHAR(20),
                aedes_presence BOOLEAN,
                anopheles_presence BOOLEAN,
                culex_presence BOOLEAN,
                other_genus_presence BOOLEAN,
                male_mosquito_count INTEGER,
                female_mosquito_count INTEGER,
                starved_female_count INTEGER,
                gravid_female_count INTEGER,
                blood_fed_female_count INTEGER,
                mosquito_species_aedes_count INTEGER,
                mosquito_species_autre_aedes_count INTEGER,
                mosquito_species_culex_count INTEGER,
                mosquito_species_anopheles_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table de la biologie moléculaire
        await pool.query(`
            CREATE TABLE IF NOT EXISTS molecular_biology (
                id SERIAL PRIMARY KEY,
                analysis_type VARCHAR(50) NOT NULL,
                sample_date DATE NOT NULL,
                mosquito_genus VARCHAR(50),
                mosquito_species VARCHAR(100),
                additional_info TEXT,
                
                -- Champs PCR Allélique (simplifiés)
                gene_analyzed VARCHAR(100),
                
                -- Champs RT-PCR Virus
                virus_tested VARCHAR(100),
                result VARCHAR(20),
                viral_load DECIMAL(10,2),
                
                -- Champs PCR Repas de Sang
                blood_meal_origin VARCHAR(20),
                animal_species VARCHAR(100),
                human_percentage DECIMAL(5,2),
                animal_percentage DECIMAL(5,2),
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table des indices entomologiques (calculés automatiquement)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entomological_indices (
                id SERIAL PRIMARY KEY,
                sector VARCHAR(50) NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                breteau_index DECIMAL(5,2),
                house_index DECIMAL(5,2),
                container_index DECIMAL(5,2),
                positivity_index DECIMAL(5,2),
                nymphal_colonization_index DECIMAL(5,2),
                adult_per_trap_index DECIMAL(5,2),
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table de synchronisation KoboCollect
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kobocollect_sync (
                id SERIAL PRIMARY KEY,
                form_id VARCHAR(100) NOT NULL,
                last_sync_date TIMESTAMP,
                records_synced INTEGER DEFAULT 0,
                sync_status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Toutes les tables ont été créées avec succès !');
        
        // Créer un utilisateur admin par défaut
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ('admin', 'admin@centre-muraz.bf', $1, 'admin')
            ON CONFLICT (username) DO NOTHING;
        `, [hashedPassword]);
        
        console.log('✅ Utilisateur admin créé (username: admin, password: admin123)');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des tables:', error);
        throw error;
    }
};

const createIndexes = async () => {
    try {
        console.log('🔍 Création des index pour optimiser les performances...');
        
        // Index pour les données entomologiques
        await pool.query('CREATE INDEX IF NOT EXISTS idx_entomological_data_sector ON entomological_data(sector);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_entomological_data_date ON entomological_data(start_date, end_date);');
        
        // Index pour la biologie moléculaire
        await pool.query('CREATE INDEX IF NOT EXISTS idx_molecular_biology_type ON molecular_biology(analysis_type);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_molecular_biology_date ON molecular_biology(sample_date);');
        
        // Index pour les indices entomologiques
        await pool.query('CREATE INDEX IF NOT EXISTS idx_entomological_indices_sector ON entomological_indices(sector);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_entomological_indices_period ON entomological_indices(period_start, period_end);');
        
        console.log('✅ Tous les index ont été créés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des index:', error);
        throw error;
    }
};

const setupDatabase = async () => {
    try {
        await createTables();
        await createIndexes();
        console.log('🎉 Configuration de la base de données terminée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('💥 Échec de la configuration de la base de données:', error);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    setupDatabase();
}

module.exports = { createTables, createIndexes, setupDatabase };
