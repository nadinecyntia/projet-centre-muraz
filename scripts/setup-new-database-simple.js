const { pool } = require('../config/database');

const setupNewDatabase = async () => {
    try {
        console.log('🚀 Démarrage de la création de la nouvelle structure de base de données...');
        console.log('📊 Centre MURAZ - Plateforme de Surveillance Arboviroses\n');

        // =====================================================
        // PHASE 1 : CRÉATION DE TOUTES LES TABLES
        // =====================================================
        
        console.log('🏗️ PHASE 1 : Création des tables...\n');

        // Suppression des anciennes tables
        console.log('🗑️ Suppression des anciennes tables...');
        await pool.query('DROP TABLE IF EXISTS adult_mosquitoes CASCADE');
        await pool.query('DROP TABLE IF EXISTS breeding_sites CASCADE');
        await pool.query('DROP TABLE IF EXISTS eggs_collection CASCADE');
        await pool.query('DROP TABLE IF EXISTS household_visits CASCADE');
        await pool.query('DROP TABLE IF EXISTS entomological_indices CASCADE');
        console.log('✅ Anciennes tables supprimées\n');

        // Table 1 : Informations communes par maison
        console.log('📋 Création de la table household_visits...');
        await pool.query(`
            CREATE TABLE household_visits (
                id SERIAL PRIMARY KEY,
                investigator_name VARCHAR(100) NOT NULL,
                concession_code VARCHAR(100) NOT NULL,
                house_code VARCHAR(100) NOT NULL,
                visit_start_date DATE NOT NULL,
                visit_end_date DATE,
                visit_start_time TIME,
                visit_end_time TIME,
                sector VARCHAR(20) NOT NULL CHECK (sector IN ('Sector 6', 'Sector 9', 'Sector 26', 'Sector 33')),
                environment VARCHAR(10) NOT NULL CHECK (environment IN ('urban', 'rural')),
                gps_code VARCHAR(100) NOT NULL,
                household_size INTEGER,
                number_of_beds INTEGER,
                head_contact VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table household_visits créée');

        // Table 2 : Données œufs par maison
        console.log('📋 Création de la table eggs_collection...');
        await pool.query(`
            CREATE TABLE eggs_collection (
                id SERIAL PRIMARY KEY,
                household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
                nest_number VARCHAR(50),
                nest_code VARCHAR(100),
                pass_order VARCHAR(50),
                eggs_count INTEGER NOT NULL,
                observations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table eggs_collection créée');

        // Table 3 : Données gîtes par maison
        console.log('📋 Création de la table breeding_sites...');
        await pool.query(`
            CREATE TABLE breeding_sites (
                id SERIAL PRIMARY KEY,
                household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
                total_sites INTEGER NOT NULL,
                positive_sites INTEGER NOT NULL,
                negative_sites INTEGER NOT NULL,
                positive_containers INTEGER NOT NULL,
                negative_containers INTEGER NOT NULL,
                larvae_count INTEGER NOT NULL,
                larvae_genus TEXT[] NOT NULL,
                aedes_larvae_count INTEGER NOT NULL,
                culex_larvae_count INTEGER NOT NULL,
                anopheles_larvae_count INTEGER NOT NULL,
                nymphs_count INTEGER NOT NULL,
                nymphs_genus TEXT[] NOT NULL,
                aedes_nymphs_count INTEGER NOT NULL,
                culex_nymphs_count INTEGER NOT NULL,
                anopheles_nymphs_count INTEGER NOT NULL,
                site_types TEXT[] NOT NULL,
                site_classes TEXT[] NOT NULL,
                observations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table breeding_sites créée');

        // Table 4 : Données moustiques adultes par maison
        console.log('📋 Création de la table adult_mosquitoes...');
        await pool.query(`
            CREATE TABLE adult_mosquitoes (
                id SERIAL PRIMARY KEY,
                household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
                genus TEXT[] NOT NULL,
                species TEXT[] NOT NULL,
                collection_methods TEXT[] NOT NULL,
                prokopack_traps_count INTEGER NOT NULL,
                bg_traps_count INTEGER NOT NULL,
                capture_locations TEXT[] NOT NULL,
                prokopack_mosquitoes_count INTEGER NOT NULL,
                bg_trap_mosquitoes_count INTEGER NOT NULL,
                total_mosquitoes_count INTEGER NOT NULL,
                male_count INTEGER NOT NULL,
                female_count INTEGER NOT NULL,
                blood_fed_females_count INTEGER NOT NULL,
                gravid_females_count INTEGER NOT NULL,
                starved_females_count INTEGER NOT NULL,
                observations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table adult_mosquitoes créée');

        // Table 5 : Indices entomologiques calculés par mois
        console.log('📋 Création de la table entomological_indices...');
        await pool.query(`
            CREATE TABLE entomological_indices (
                id SERIAL PRIMARY KEY,
                sector VARCHAR(20) NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                breteau_index DECIMAL(8,2),
                house_index DECIMAL(8,2),
                container_index DECIMAL(8,2),
                positivity_index DECIMAL(8,2),
                nymphal_colonization_index DECIMAL(8,2),
                adult_per_trap_bg_index DECIMAL(8,2),
                adult_per_trap_prokopack_index DECIMAL(8,2),
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_source VARCHAR(50) DEFAULT 'kobocollect'
            )
        `);
        console.log('✅ Table entomological_indices créée\n');

        // =====================================================
        // PHASE 2 : CRÉATION DES INDEX
        // =====================================================
        
        console.log('🔍 PHASE 2 : Création des index...\n');

        // Index sur les clés étrangères
        await pool.query('CREATE INDEX idx_eggs_collection_household_id ON eggs_collection(household_visit_id)');
        await pool.query('CREATE INDEX idx_breeding_sites_household_id ON breeding_sites(household_visit_id)');
        await pool.query('CREATE INDEX idx_adult_mosquitoes_household_id ON adult_mosquitoes(household_visit_id)');

        // Index sur les secteurs et dates
        await pool.query('CREATE INDEX idx_household_visits_sector ON household_visits(sector)');
        await pool.query('CREATE INDEX idx_household_visits_date ON household_visits(visit_start_date)');
        await pool.query('CREATE INDEX idx_household_visits_environment ON household_visits(environment)');

        // Index sur les indices entomologiques
        await pool.query('CREATE INDEX idx_entomological_indices_sector ON entomological_indices(sector)');
        await pool.query('CREATE INDEX idx_entomological_indices_period ON entomological_indices(period_start, period_end)');

        // Index sur les gîtes positifs pour les calculs d'indices
        await pool.query('CREATE INDEX idx_breeding_sites_positive ON breeding_sites(positive_sites)');
        await pool.query('CREATE INDEX idx_breeding_sites_total ON breeding_sites(total_sites)');

        // Index sur les moustiques adultes pour les calculs d'indices
        await pool.query('CREATE INDEX idx_adult_mosquitoes_traps ON adult_mosquitoes(prokopack_traps_count, bg_traps_count)');
        
        console.log('✅ Tous les index créés\n');

        // =====================================================
        // PHASE 3 : CONTRAINTES DE VALIDATION
        // =====================================================
        
        console.log('🔒 PHASE 3 : Création des contraintes...\n');

        // Contraintes de validation pour les compteurs
        await pool.query('ALTER TABLE breeding_sites ADD CONSTRAINT check_positive_sites CHECK (positive_sites >= 0)');
        await pool.query('ALTER TABLE breeding_sites ADD CONSTRAINT check_total_sites CHECK (total_sites >= positive_sites + negative_sites)');
        await pool.query('ALTER TABLE breeding_sites ADD CONSTRAINT check_larvae_counts CHECK (aedes_larvae_count + culex_larvae_count + anopheles_larvae_count <= larvae_count)');
        await pool.query('ALTER TABLE breeding_sites ADD CONSTRAINT check_nymphs_counts CHECK (aedes_nymphs_count + culex_nymphs_count + anopheles_nymphs_count <= nymphs_count)');

        // Contraintes de validation pour les moustiques adultes
        await pool.query('ALTER TABLE adult_mosquitoes ADD CONSTRAINT check_mosquito_counts CHECK (male_count + female_count <= total_mosquitoes_count)');
        await pool.query('ALTER TABLE adult_mosquitoes ADD CONSTRAINT check_female_states CHECK (blood_fed_females_count + gravid_females_count + starved_females_count <= female_count)');

        // Contraintes de validation pour les dates
        await pool.query('ALTER TABLE household_visits ADD CONSTRAINT check_visit_dates CHECK (visit_start_date <= COALESCE(visit_end_date, visit_start_date))');
        
        console.log('✅ Toutes les contraintes créées\n');

        // =====================================================
        // PHASE 4 : DONNÉES DE TEST
        // =====================================================
        
        console.log('🧪 PHASE 4 : Insertion des données de test...\n');

        // Insertion de quelques secteurs de test
        await pool.query(`
            INSERT INTO household_visits (investigator_name, concession_code, house_code, visit_start_date, sector, environment, gps_code, household_size, number_of_beds, head_contact) VALUES
            ('Enquêteur Test 1', 'CONC001', 'MAISON001', '2024-01-15', 'Sector 6', 'urban', '11.180729 -4.3616', 5, 3, 'Contact Test 1'),
            ('Enquêteur Test 2', 'CONC002', 'MAISON002', '2024-01-16', 'Sector 9', 'rural', '11.180730 -4.3617', 4, 2, 'Contact Test 2')
        `);
        console.log('✅ Données de test insérées\n');

        // =====================================================
        // VÉRIFICATION FINALE
        // =====================================================
        
        console.log('🔍 Vérification finale...\n');

        // Vérifier que les tables ont été créées
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('household_visits', 'eggs_collection', 'breeding_sites', 'adult_mosquitoes', 'entomological_indices')
            ORDER BY table_name
        `;
        
        const tablesResult = await pool.query(tablesQuery);
        console.log('📋 Tables disponibles :');
        tablesResult.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        // Vérifier les données de test
        const testDataQuery = 'SELECT COUNT(*) as count FROM household_visits';
        const testDataResult = await pool.query(testDataQuery);
        console.log(`📊 Données de test : ${testDataResult.rows[0].count} enregistrements`);

        console.log('\n🎉 Structure de base de données créée avec succès !');
        console.log('✅ Tables de terrain créées');
        console.log('✅ Table des indices créée');
        console.log('✅ Index et contraintes créés');
        console.log('✅ Données de test insérées');
        console.log('\n🚀 Votre base de données est prête pour :');
        console.log('   • La synchronisation KoboCollect');
        console.log('   • Les calculs d\'indices entomologiques');
        console.log('   • La génération de cartes');
        console.log('   • Les analyses de données');

        console.log('\n🎯 Prochaines étapes :');
        console.log('   1. Configurer la synchronisation KoboCollect');
        console.log('   2. Implémenter les calculs d\'indices');
        console.log('   3. Créer la page d\'affichage des indices');
        console.log('   4. Tester avec des données réelles');

        process.exit(0);

    } catch (error) {
        console.error('\n💥 Erreur lors de la création de la base de données:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    setupNewDatabase();
}

module.exports = { setupNewDatabase };




