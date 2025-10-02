-- =====================================================
-- NOUVEAU SYSTÈME D'ARCHIVAGE COMPLET
-- Centre MURAZ - Tables d'archive pour toutes les données
-- =====================================================

-- =====================================================
-- 1. TABLE DE MÉTADONNÉES D'ARCHIVAGE
-- =====================================================
CREATE TABLE IF NOT EXISTS archive_runs (
    id SERIAL PRIMARY KEY,
    archive_year INTEGER NOT NULL,
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    
    -- Compteurs de données archivées
    eggs_records_count INTEGER DEFAULT 0,
    breeding_sites_records_count INTEGER DEFAULT 0,
    mosquitoes_records_count INTEGER DEFAULT 0,
    analyses_pcr_records_count INTEGER DEFAULT 0,
    analyses_bioessai_records_count INTEGER DEFAULT 0,
    analyses_repas_sanguin_records_count INTEGER DEFAULT 0,
    infos_communes_records_count INTEGER DEFAULT 0,
    
    -- Métadonnées de l'opération
    started_by VARCHAR(100),
    completed_at TIMESTAMP,
    error_message TEXT,
    total_duration_seconds INTEGER,
    
    -- Index pour les requêtes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. TABLES D'ARCHIVE POUR LES DONNÉES DE COLLECTE
-- =====================================================

-- Archive des œufs
CREATE TABLE IF NOT EXISTS eggs_collection_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    eggs_concession_code VARCHAR(50) NOT NULL,
    eggs_sector VARCHAR(50) NOT NULL,
    eggs_environment VARCHAR(20) NOT NULL,
    eggs_visit_start_date DATE NOT NULL,
    eggs_gps_code VARCHAR(100),
    nest_number VARCHAR(50),
    nest_code VARCHAR(50),
    pass_order VARCHAR(50),
    eggs_count INTEGER NOT NULL,
    observations TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    validated_by VARCHAR(100),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    batch_id VARCHAR(100),
    batch_start_date DATE,
    batch_end_date DATE,
    batch_investigator VARCHAR(100),
    submitted_by VARCHAR(100),
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- Archive des gîtes larvaires
CREATE TABLE IF NOT EXISTS breeding_sites_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    site_investigator_name VARCHAR(100) NOT NULL,
    site_concession_code VARCHAR(50) NOT NULL,
    site_house_code VARCHAR(50) NOT NULL,
    site_sector VARCHAR(50) NOT NULL,
    site_environment VARCHAR(20) NOT NULL,
    site_visit_start_date DATE NOT NULL,
    site_visit_end_date DATE,
    site_visit_start_time TIME,
    site_visit_end_time TIME,
    site_gps_code VARCHAR(100),
    site_household_size INTEGER,
    site_sleeping_unit_count INTEGER,
    site_head_contact VARCHAR(100),
    total_sites_count INTEGER NOT NULL,
    positive_sites_count INTEGER NOT NULL,
    negative_sites_count INTEGER NOT NULL,
    larvae_genus TEXT[] DEFAULT '{}',
    larvae_count INTEGER,
    aedes_larvae_count INTEGER,
    culex_larvae_count INTEGER,
    anopheles_larvae_count INTEGER,
    other_larvae_count INTEGER,
    nymphs_genus TEXT[] DEFAULT '{}',
    nymphs_count INTEGER,
    aedes_nymphs_count INTEGER,
    culex_nymphs_count INTEGER,
    anopheles_nymphs_count INTEGER,
    other_nymphs_count INTEGER,
    sites_types TEXT[] DEFAULT '{}',
    site_classes TEXT[] DEFAULT '{}',
    observations TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    validated_by VARCHAR(100),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    batch_id VARCHAR(100),
    batch_start_date DATE,
    batch_end_date DATE,
    batch_investigator VARCHAR(100),
    submitted_by VARCHAR(100),
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- Archive des moustiques adultes
CREATE TABLE IF NOT EXISTS adult_mosquitoes_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    mosquitoes_concession_code VARCHAR(50) NOT NULL,
    mosquitoes_sector VARCHAR(50) NOT NULL,
    mosquitoes_environment VARCHAR(20) NOT NULL,
    mosquitoes_visit_start_date DATE NOT NULL,
    mosquitoes_visit_start_time TIME,
    mosquitoes_visit_end_time TIME,
    mosquitoes_gps_code VARCHAR(100),
    genus TEXT[] DEFAULT '{}',
    species TEXT[] DEFAULT '{}',
    collection_methods VARCHAR(50),
    capture_locations VARCHAR(50),
    prokopack_traps_count INTEGER,
    bg_traps_count INTEGER,
    prokopack_mosquitoes_count INTEGER,
    bg_trap_mosquitoes_count INTEGER,
    total_mosquitoes_count INTEGER NOT NULL,
    male_count INTEGER,
    aedes_male_count INTEGER,
    culex_male_count INTEGER,
    anopheles_male_count INTEGER,
    other_male_count INTEGER,
    female_count INTEGER,
    blood_fed_females_count INTEGER,
    gravid_females_count INTEGER,
    starved_females_count INTEGER,
    mosquitoes_aedes_count INTEGER,
    mosquitoes_culex_count INTEGER,
    mosquitoes_anopheles_count INTEGER,
    mosquitoes_other_count INTEGER,
    observations TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    validated_by VARCHAR(100),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    batch_id VARCHAR(100),
    batch_start_date DATE,
    batch_end_date DATE,
    batch_investigator VARCHAR(100),
    submitted_by VARCHAR(100),
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- =====================================================
-- 3. TABLES D'ARCHIVE POUR LES ANALYSES
-- =====================================================

-- Archive des analyses PCR
CREATE TABLE IF NOT EXISTS analyses_pcr_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    sample_id VARCHAR(100),
    commune VARCHAR(100),
    sector VARCHAR(100),
    collection_date DATE,
    analysis_date DATE,
    mosquito_genus VARCHAR(50),
    mosquito_species VARCHAR(100),
    test_type VARCHAR(100),
    result VARCHAR(50),
    ct_value DECIMAL(5,2),
    notes TEXT,
    analyst VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- Archive des analyses bioessai
CREATE TABLE IF NOT EXISTS analyses_bioessai_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    sample_id VARCHAR(100),
    commune VARCHAR(100),
    sector VARCHAR(100),
    collection_date DATE,
    analysis_date DATE,
    mosquito_genus VARCHAR(50),
    mosquito_species VARCHAR(100),
    insecticide_type VARCHAR(100),
    concentration DECIMAL(10,4),
    exposure_time INTEGER,
    mortality_rate DECIMAL(5,2),
    resistance_status VARCHAR(50),
    notes TEXT,
    analyst VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- Archive des analyses de repas sanguin
CREATE TABLE IF NOT EXISTS analyses_repas_sanguin_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    sample_id VARCHAR(100),
    commune VARCHAR(100),
    sector VARCHAR(100),
    collection_date DATE,
    analysis_date DATE,
    mosquito_genus VARCHAR(50),
    mosquito_species VARCHAR(100),
    blood_meal_source VARCHAR(100),
    host_species VARCHAR(100),
    feeding_time VARCHAR(50),
    notes TEXT,
    analyst VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- Archive des informations communales
CREATE TABLE IF NOT EXISTS infos_communes_archive (
    -- Toutes les colonnes de la table originale
    id INTEGER NOT NULL,
    commune VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    population INTEGER,
    households INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INTEGER,
    climate_zone VARCHAR(50),
    vegetation_type VARCHAR(100),
    water_sources TEXT[],
    mosquito_breeding_sites TEXT[],
    control_measures TEXT[],
    last_survey_date DATE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Colonnes d'archivage
    archived_year INTEGER NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_run_id INTEGER REFERENCES archive_runs(id),
    
    PRIMARY KEY (id, archived_year)
);

-- =====================================================
-- 4. INDEX POUR OPTIMISATION DES REQUÊTES D'ARCHIVE
-- =====================================================

-- Index pour les requêtes par année d'archivage
CREATE INDEX IF NOT EXISTS idx_eggs_collection_archive_year ON eggs_collection_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_breeding_sites_archive_year ON breeding_sites_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_archive_year ON adult_mosquitoes_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_analyses_pcr_archive_year ON analyses_pcr_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_analyses_bioessai_archive_year ON analyses_bioessai_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_analyses_repas_sanguin_archive_year ON analyses_repas_sanguin_archive(archived_year);
CREATE INDEX IF NOT EXISTS idx_infos_communes_archive_year ON infos_communes_archive(archived_year);

-- Index pour les requêtes par date de collecte dans les archives
CREATE INDEX IF NOT EXISTS idx_eggs_collection_archive_date ON eggs_collection_archive(eggs_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_breeding_sites_archive_date ON breeding_sites_archive(site_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_archive_date ON adult_mosquitoes_archive(mosquitoes_visit_start_date);

-- Index pour les requêtes par secteur dans les archives
CREATE INDEX IF NOT EXISTS idx_eggs_collection_archive_sector ON eggs_collection_archive(eggs_sector);
CREATE INDEX IF NOT EXISTS idx_breeding_sites_archive_sector ON breeding_sites_archive(site_sector);
CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_archive_sector ON adult_mosquitoes_archive(mosquitoes_sector);

-- Index pour les métadonnées d'archivage
CREATE INDEX IF NOT EXISTS idx_archive_runs_year ON archive_runs(archive_year);
CREATE INDEX IF NOT EXISTS idx_archive_runs_status ON archive_runs(status);
CREATE INDEX IF NOT EXISTS idx_archive_runs_date ON archive_runs(archive_date);

-- =====================================================
-- 5. VÉRIFICATION DE LA CRÉATION
-- =====================================================

-- Afficher les nouvelles tables d'archive créées
SELECT 'Tables d archive creees avec succes' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_archive%'
ORDER BY table_name;

-- Afficher les index créés
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%archive%'
ORDER BY tablename, indexname;
