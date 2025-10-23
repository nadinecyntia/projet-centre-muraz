-- =====================================================
-- STRUCTURE COMPLÈTE SELON LE FRONTEND
-- Toutes les colonnes nécessaires pour les 3 formulaires
-- =====================================================

-- 1. SUPPRIMER TOUT
DROP VIEW IF EXISTS houses_complete_stats CASCADE;
DROP VIEW IF EXISTS eggs_collections_with_house_info CASCADE;
DROP VIEW IF EXISTS adult_mosquitoes_summary CASCADE;
DROP VIEW IF EXISTS breeding_sites_summary CASCADE;

DROP TABLE IF EXISTS mosquito_specimens CASCADE;
DROP TABLE IF EXISTS adult_mosquitoes_collections CASCADE;
DROP TABLE IF EXISTS breeding_sites CASCADE;
DROP TABLE IF EXISTS eggs_collections CASCADE;
DROP TABLE IF EXISTS houses CASCADE;

-- =====================================================
-- TABLE: HOUSES
-- Informations communes à toutes les maisons
-- =====================================================
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    concession_code VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    gps_coordinates VARCHAR(100),
    house_code VARCHAR(100),
    household_size INTEGER,
    sleeping_unit_count INTEGER,
    head_contact VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(concession_code, sector)
);

CREATE INDEX idx_houses_concession ON houses(concession_code);
CREATE INDEX idx_houses_sector ON houses(sector);

-- =====================================================
-- TABLE: EGGS_COLLECTIONS
-- Collecte d'œufs (1 ligne = 1 visite)
-- =====================================================
CREATE TABLE eggs_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    investigator_name VARCHAR(200),
    nest_number VARCHAR(100),
    nest_code VARCHAR(100),
    pass_order VARCHAR(50),
    eggs_count INTEGER NOT NULL DEFAULT 0,
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eggs_house ON eggs_collections(house_id);
CREATE INDEX idx_eggs_date ON eggs_collections(visit_date);
CREATE INDEX idx_eggs_status ON eggs_collections(status);

-- =====================================================
-- TABLE: BREEDING_SITES
-- Gîtes larvaires - UNE LIGNE PAR GÎTE INDIVIDUEL
-- larvae_count et nymphs_count calculés automatiquement
-- =====================================================
CREATE TABLE breeding_sites (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    investigator_name VARCHAR(200) NOT NULL,
    visit_start_time TIME,
    visit_end_time TIME,
    
    -- État du gîte (1 ligne = 1 gîte individuel)
    site_state VARCHAR(10) NOT NULL CHECK (site_state IN ('positive', 'negative')),
    
    -- Larves par genre
    aedes_larvae_count INTEGER DEFAULT 0,
    culex_larvae_count INTEGER DEFAULT 0,
    anopheles_larvae_count INTEGER DEFAULT 0,
    other_larvae_count INTEGER DEFAULT 0,
    larvae_count INTEGER DEFAULT 0,
    
    -- Nymphes par genre
    aedes_nymphs_count INTEGER DEFAULT 0,
    culex_nymphs_count INTEGER DEFAULT 0,
    anopheles_nymphs_count INTEGER DEFAULT 0,
    other_nymphs_count INTEGER DEFAULT 0,
    nymphs_count INTEGER DEFAULT 0,
    
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_breeding_house ON breeding_sites(house_id);
CREATE INDEX idx_breeding_date ON breeding_sites(visit_date);
CREATE INDEX idx_breeding_status ON breeding_sites(status);

-- =====================================================
-- TABLE: ADULT_MOSQUITOES_COLLECTIONS
-- Collecte de moustiques - UNE LIGNE PAR VISITE
-- TOUS les comptages agrégés
-- =====================================================
CREATE TABLE adult_mosquitoes_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_start_time TIME NOT NULL,
    visit_end_time TIME NOT NULL,
    investigator_name VARCHAR(200),
    
    -- Méthodes et lieux (peuvent être multiples)
    collection_methods VARCHAR(100),
    capture_locations VARCHAR(100),
    
    -- Pièges
    prokopack_traps_count INTEGER DEFAULT 0,
    bg_traps_count INTEGER DEFAULT 0,
    prokopack_mosquitoes_count INTEGER DEFAULT 0,
    bg_trap_mosquitoes_count INTEGER DEFAULT 0,
    
    -- Total général
    total_mosquitoes_count INTEGER DEFAULT 0,
    
    -- Par sexe
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    
    -- Mâles par genre
    aedes_male_count INTEGER DEFAULT 0,
    culex_male_count INTEGER DEFAULT 0,
    anopheles_male_count INTEGER DEFAULT 0,
    other_male_count INTEGER DEFAULT 0,
    
    -- Femelles par état physiologique
    blood_fed_females_count INTEGER DEFAULT 0,
    gravid_females_count INTEGER DEFAULT 0,
    starved_females_count INTEGER DEFAULT 0,
    
    -- Par genre (tous sexes)
    mosquitoes_aedes_count INTEGER DEFAULT 0,
    mosquitoes_culex_count INTEGER DEFAULT 0,
    mosquitoes_anopheles_count INTEGER DEFAULT 0,
    mosquitoes_other_count INTEGER DEFAULT 0,
    
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mosquitoes_house ON adult_mosquitoes_collections(house_id);
CREATE INDEX idx_mosquitoes_date ON adult_mosquitoes_collections(visit_date);
CREATE INDEX idx_mosquitoes_status ON adult_mosquitoes_collections(status);

-- =====================================================
-- VUES SQL (pour analyses et exports)
-- =====================================================

-- Vue: Collectes d'œufs avec infos maison
CREATE VIEW eggs_collections_with_house_info AS
SELECT 
    ec.*,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.sleeping_unit_count
FROM eggs_collections ec
JOIN houses h ON ec.house_id = h.id;

-- Vue: Gîtes avec infos maison
CREATE VIEW breeding_sites_with_house_info AS
SELECT 
    bs.*,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates
FROM breeding_sites bs
JOIN houses h ON bs.house_id = h.id;

-- Vue: Moustiques avec infos maison
CREATE VIEW mosquitoes_with_house_info AS
SELECT 
    amc.*,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates
FROM adult_mosquitoes_collections amc
JOIN houses h ON amc.house_id = h.id;

-- Vue: Statistiques complètes par maison
CREATE VIEW houses_complete_stats AS
SELECT 
    h.id,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.sleeping_unit_count,
    COUNT(DISTINCT ec.id) as eggs_collections_count,
    COUNT(DISTINCT bs.id) as breeding_visits_count,
    COUNT(DISTINCT amc.id) as mosquito_collections_count,
    MAX(ec.visit_date) as last_eggs_visit,
    MAX(bs.visit_date) as last_breeding_visit,
    MAX(amc.visit_date) as last_mosquito_visit,
    SUM(ec.eggs_count) as total_eggs_collected,
    SUM(bs.larvae_count) as total_larvae_collected,
    SUM(amc.total_mosquitoes_count) as total_mosquitoes_collected
FROM houses h
LEFT JOIN eggs_collections ec ON h.id = ec.house_id
LEFT JOIN breeding_sites bs ON h.id = bs.house_id
LEFT JOIN adult_mosquitoes_collections amc ON h.id = amc.house_id
GROUP BY h.id, h.concession_code, h.sector, h.environment, h.gps_coordinates, h.sleeping_unit_count;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

