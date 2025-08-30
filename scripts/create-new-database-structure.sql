-- =====================================================
-- SCRIPT DE CRÉATION DE LA NOUVELLE STRUCTURE DE BASE
-- Centre MURAZ - Plateforme de Surveillance Arboviroses
-- =====================================================

-- Suppression des anciennes tables si elles existent
DROP TABLE IF EXISTS adult_mosquitoes CASCADE;
DROP TABLE IF EXISTS breeding_sites CASCADE;
DROP TABLE IF EXISTS eggs_collection CASCADE;
DROP TABLE IF EXISTS household_visits CASCADE;
DROP TABLE IF EXISTS entomological_indices CASCADE;

-- =====================================================
-- PHASE 1 : CRÉATION DE TOUTES LES TABLES
-- =====================================================

-- Table 1 : Informations communes par maison
CREATE TABLE household_visits (
    id SERIAL PRIMARY KEY,
    
    -- Informations de l'enquêteur
    investigator_name VARCHAR(100) NOT NULL,
    concession_code VARCHAR(100) NOT NULL,
    house_code VARCHAR(100) NOT NULL,
    
    -- Dates et heures de visite
    visit_start_date DATE NOT NULL,
    visit_end_date DATE,
    visit_start_time TIME,
    visit_end_time TIME,
    
    -- Localisation et environnement
    sector VARCHAR(20) NOT NULL CHECK (sector IN ('Sector 6', 'Sector 9', 'Sector 26', 'Sector 33')),
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('urban', 'rural')),
    gps_code VARCHAR(100) NOT NULL,        -- Format: "11.180729 -4.3616"
    
    -- Caractéristiques de la maison
    household_size INTEGER,
    number_of_beds INTEGER,
    head_contact VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2 : Données œufs par maison
CREATE TABLE eggs_collection (
    id SERIAL PRIMARY KEY,
    household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
    
    -- Informations sur le pondoir
    nest_number VARCHAR(50),
    nest_code VARCHAR(100),
    pass_order VARCHAR(50),
    
    -- Données de collecte
    eggs_count INTEGER NOT NULL,
    observations TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3 : Données gîtes par maison
CREATE TABLE breeding_sites (
    id SERIAL PRIMARY KEY,
    household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
    
    -- Compteurs généraux
    total_sites INTEGER NOT NULL,           -- Nombre total de gîtes/récipients
    positive_sites INTEGER NOT NULL,        -- Nombre de gîtes positifs
    negative_sites INTEGER NOT NULL,        -- Nombre de gîtes négatifs
    positive_containers INTEGER NOT NULL,   -- Nombre de récipients positifs
    negative_containers INTEGER NOT NULL,   -- Nombre de récipients négatifs
    
    -- Compteurs larves
    larvae_count INTEGER NOT NULL,
    larvae_genus TEXT[] NOT NULL,           -- [aedes, culex, anopheles, autre]
    aedes_larvae_count INTEGER NOT NULL,
    culex_larvae_count INTEGER NOT NULL,
    anopheles_larvae_count INTEGER NOT NULL,
    
    -- Compteurs nymphes
    nymphs_count INTEGER NOT NULL,
    nymphs_genus TEXT[] NOT NULL,           -- [aedes, culex, anopheles, autre]
    aedes_nymphs_count INTEGER NOT NULL,
    culex_nymphs_count INTEGER NOT NULL,
    anopheles_nymphs_count INTEGER NOT NULL,
    
    -- Classification des gîtes
    site_types TEXT[] NOT NULL,             -- [pneu, bidon, bassin, assiette, boite, autre]
    site_classes TEXT[] NOT NULL,           -- [ordures ménagères, ustensiles abandonnés, épaves de véhicules, végétation, autre]
    
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4 : Données moustiques adultes par maison
CREATE TABLE adult_mosquitoes (
    id SERIAL PRIMARY KEY,
    household_visit_id INTEGER NOT NULL REFERENCES household_visits(id) ON DELETE CASCADE,
    
    -- Classification des moustiques
    genus TEXT[] NOT NULL,                  -- [aedes, culex, anopheles, autre]
    species TEXT[] NOT NULL,                -- [aedes_aegypti, autre_aedes, culex, anopheles]
    
    -- Méthode de collecte
    collection_methods TEXT[] NOT NULL,     -- [prokopack, bg_trap, prokopack_bg_trap]
    prokopack_traps_count INTEGER NOT NULL,
    bg_traps_count INTEGER NOT NULL,
    
    -- Lieu de capture
    capture_locations TEXT[] NOT NULL,      -- [interieur, exterieur]
    
    -- Compteurs par piège
    prokopack_mosquitoes_count INTEGER NOT NULL,
    bg_trap_mosquitoes_count INTEGER NOT NULL,
    total_mosquitoes_count INTEGER NOT NULL,
    
    -- Répartition par sexe
    male_count INTEGER NOT NULL,
    female_count INTEGER NOT NULL,
    
    -- États physiologiques des femelles
    blood_fed_females_count INTEGER NOT NULL,
    gravid_females_count INTEGER NOT NULL,
    starved_females_count INTEGER NOT NULL,
    
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 5 : Indices entomologiques calculés par mois
CREATE TABLE entomological_indices (
    id SERIAL PRIMARY KEY,
    
    -- Période de calcul
    sector VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,             -- Début du mois
    period_end DATE NOT NULL,               -- Fin du mois
    
    -- Indices calculés
    breteau_index DECIMAL(8,2),            -- (Gîtes positifs × 100) / Maisons visitées
    house_index DECIMAL(8,2),              -- (Maisons avec gîtes positifs × 100) / Total maisons
    container_index DECIMAL(8,2),          -- (Gîtes positifs × 100) / Total gîtes
    positivity_index DECIMAL(8,2),         -- (Pièges positifs × 100) / Total pièges
    nymphal_colonization_index DECIMAL(8,2), -- (Maisons infestées nymphes × 100) / Total maisons
    adult_per_trap_bg_index DECIMAL(8,2),  -- Moustiques / (Pièges BG × 100)
    adult_per_trap_prokopack_index DECIMAL(8,2), -- Moustiques / (Pièges Prokopack × 100)
    
    -- Métadonnées
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'kobocollect'
);

-- =====================================================
-- PHASE 2 : CRÉATION DES INDEX
-- =====================================================

-- Index sur les clés étrangères
CREATE INDEX idx_eggs_collection_household_id ON eggs_collection(household_visit_id);
CREATE INDEX idx_breeding_sites_household_id ON breeding_sites(household_visit_id);
CREATE INDEX idx_adult_mosquitoes_household_id ON adult_mosquitoes(household_visit_id);

-- Index sur les secteurs et dates
CREATE INDEX idx_household_visits_sector ON household_visits(sector);
CREATE INDEX idx_household_visits_date ON household_visits(visit_start_date);
CREATE INDEX idx_household_visits_environment ON household_visits(environment);

-- Index sur les indices entomologiques
CREATE INDEX idx_entomological_indices_sector ON entomological_indices(sector);
CREATE INDEX idx_entomological_indices_period ON entomological_indices(period_start, period_end);

-- Index sur les gîtes positifs pour les calculs d'indices
CREATE INDEX idx_breeding_sites_positive ON breeding_sites(positive_sites);
CREATE INDEX idx_breeding_sites_total ON breeding_sites(total_sites);

-- Index sur les moustiques adultes pour les calculs d'indices
CREATE INDEX idx_adult_mosquitoes_traps ON adult_mosquitoes(prokopack_traps_count, bg_traps_count);

-- =====================================================
-- PHASE 3 : CONTRAINTES DE VALIDATION
-- =====================================================

-- Contraintes de validation pour les compteurs
ALTER TABLE breeding_sites 
ADD CONSTRAINT check_positive_sites CHECK (positive_sites >= 0),
ADD CONSTRAINT check_total_sites CHECK (total_sites >= positive_sites + negative_sites),
ADD CONSTRAINT check_larvae_counts CHECK (aedes_larvae_count + culex_larvae_count + anopheles_larvae_count <= larvae_count),
ADD CONSTRAINT check_nymphs_counts CHECK (aedes_nymphs_count + culex_nymphs_count + anopheles_nymphs_count <= nymphs_count);

-- Contraintes de validation pour les moustiques adultes
ALTER TABLE adult_mosquitoes 
ADD CONSTRAINT check_mosquito_counts CHECK (male_count + female_count <= total_mosquitoes_count),
ADD CONSTRAINT check_female_states CHECK (blood_fed_females_count + gravid_females_count + starved_females_count <= female_count);

-- Contraintes de validation pour les dates
ALTER TABLE household_visits 
ADD CONSTRAINT check_visit_dates CHECK (visit_start_date <= COALESCE(visit_end_date, visit_start_date));

-- =====================================================
-- PHASE 4 : FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_household_visits_updated_at 
    BEFORE UPDATE ON household_visits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 5 : DONNÉES DE TEST
-- =====================================================

-- Insertion de quelques secteurs de test
INSERT INTO household_visits (investigator_name, concession_code, house_code, visit_start_date, sector, environment, gps_code, household_size, number_of_beds, head_contact) VALUES
('Enquêteur Test 1', 'CONC001', 'MAISON001', '2024-01-15', 'Sector 6', 'urban', '11.180729 -4.3616', 5, 3, 'Contact Test 1'),
('Enquêteur Test 2', 'CONC002', 'MAISON002', '2024-01-16', 'Sector 9', 'rural', '11.180730 -4.3617', 4, 2, 'Contact Test 2');

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Structure de base de données créée avec succès !';
    RAISE NOTICE '✅ Tables de terrain créées';
    RAISE NOTICE '✅ Table des indices créée';
    RAISE NOTICE '✅ Index et contraintes créés';
    RAISE NOTICE '✅ Données de test insérées';
    RAISE NOTICE '🚀 Prêt pour la synchronisation KoboCollect et les calculs d''indices !';
END $$;
