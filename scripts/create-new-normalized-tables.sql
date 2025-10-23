-- ===============================================
-- SCRIPT DE CRÉATION DES TABLES NORMALISÉES
-- Centre MURAZ - Plateforme de Surveillance Arboviroses
-- ===============================================
-- Date: 2025-10-21
-- Description: Création des nouvelles tables normalisées pour remplacer
--              eggs_collection_new, breeding_sites_new, adult_mosquitoes_new
-- ===============================================

-- ===============================================
-- 1. TABLE CENTRALE : HOUSES (Maisons)
-- ===============================================

CREATE TABLE IF NOT EXISTS houses (
    id SERIAL PRIMARY KEY,
    
    -- Informations OBLIGATOIRES (communes à toutes les collectes)
    concession_code VARCHAR(50) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('urban', 'rural')),
    gps_coordinates VARCHAR(100),  -- Format: "lat,lng"
    
    -- Informations OPTIONNELLES (spécifiques à breeding_sites)
    house_code VARCHAR(50),  -- Utilisé uniquement pour breeding_sites
    household_size INTEGER CHECK (household_size >= 0),
    sleeping_unit_count INTEGER CHECK (sleeping_unit_count >= 0),
    head_contact VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    CONSTRAINT unique_house UNIQUE(concession_code, sector)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_houses_sector ON houses(sector);
CREATE INDEX IF NOT EXISTS idx_houses_environment ON houses(environment);
CREATE INDEX IF NOT EXISTS idx_houses_concession ON houses(concession_code);

COMMENT ON TABLE houses IS 'Table centrale contenant toutes les maisons de collecte';
COMMENT ON COLUMN houses.concession_code IS 'Code de la concession (identifiant unique avec sector)';
COMMENT ON COLUMN houses.sector IS 'Secteur géographique (Sector 6, 9, 22, 26, 33)';
COMMENT ON COLUMN houses.environment IS 'Type d''environnement : urban ou rural';
COMMENT ON COLUMN houses.house_code IS 'Code spécifique de la maison (optionnel, utilisé pour breeding_sites)';

-- ===============================================
-- 2. TABLE : EGGS_COLLECTIONS (Collecte d'œufs)
-- ===============================================

CREATE TABLE IF NOT EXISTS eggs_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de visite
    visit_date DATE NOT NULL,
    investigator_name VARCHAR(100),
    
    -- Données d'œufs
    nest_number VARCHAR(50),      -- Numéro du nid/piège
    nest_code VARCHAR(50),        -- Code du nid
    pass_order VARCHAR(50),       -- Ordre de passage
    eggs_count INTEGER NOT NULL CHECK (eggs_count >= 0),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_eggs_house ON eggs_collections(house_id);
CREATE INDEX IF NOT EXISTS idx_eggs_date ON eggs_collections(visit_date);
CREATE INDEX IF NOT EXISTS idx_eggs_status ON eggs_collections(status);
CREATE INDEX IF NOT EXISTS idx_eggs_submitted_by ON eggs_collections(submitted_by);

COMMENT ON TABLE eggs_collections IS 'Collecte d''œufs - 1 ligne = 1 visite dans 1 maison';
COMMENT ON COLUMN eggs_collections.house_id IS 'Référence à la maison où la collecte a été effectuée';
COMMENT ON COLUMN eggs_collections.eggs_count IS 'Nombre d''œufs collectés';

-- ===============================================
-- 3. TABLE : BREEDING_SITES (Gîtes larvaires)
-- ===============================================

CREATE TABLE IF NOT EXISTS breeding_sites (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de visite
    visit_date DATE NOT NULL,
    visit_end_date DATE,
    visit_start_time TIME,
    visit_end_time TIME,
    investigator_name VARCHAR(100) NOT NULL,
    
    -- Caractéristiques du gîte
    site_number INTEGER,  -- Numéro du gîte dans cette maison
    site_type VARCHAR(50) CHECK (site_type IN (
        'pneu', 'bidon', 'bassin', 'plate', 'box', 'table', 
        'canari', 'kettle', 'tomato_box', 'bucket', 
        'water_trough', 'gutter', 'chair', 'pot', 'other'
    )),
    site_class VARCHAR(50) CHECK (site_class IN (
        'household_waste', 'abandoned_utensils', 'car_wrecks', 
        'construction_equipment', 'breeding_utensils', 'other'
    )),
    is_positive BOOLEAN NOT NULL DEFAULT FALSE,  -- Gîte positif ou négatif
    
    -- Comptage des larves (si gîte positif)
    larvae_count INTEGER DEFAULT 0 CHECK (larvae_count >= 0),
    larvae_genus VARCHAR(20) CHECK (larvae_genus IN ('aedes', 'culex', 'anopheles', 'other')),
    
    -- Comptage des nymphes (si gîte positif)
    nymphs_count INTEGER DEFAULT 0 CHECK (nymphs_count >= 0),
    nymphs_genus VARCHAR(20) CHECK (nymphs_genus IN ('aedes', 'culex', 'anopheles', 'other')),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_breeding_house ON breeding_sites(house_id);
CREATE INDEX IF NOT EXISTS idx_breeding_date ON breeding_sites(visit_date);
CREATE INDEX IF NOT EXISTS idx_breeding_status ON breeding_sites(status);
CREATE INDEX IF NOT EXISTS idx_breeding_positive ON breeding_sites(is_positive);
CREATE INDEX IF NOT EXISTS idx_breeding_genus ON breeding_sites(larvae_genus);
CREATE INDEX IF NOT EXISTS idx_breeding_investigator ON breeding_sites(investigator_name);
CREATE INDEX IF NOT EXISTS idx_breeding_submitted_by ON breeding_sites(submitted_by);

COMMENT ON TABLE breeding_sites IS 'Gîtes larvaires - 1 ligne = 1 gîte larvaire individuel';
COMMENT ON COLUMN breeding_sites.house_id IS 'Référence à la maison où le gîte a été trouvé';
COMMENT ON COLUMN breeding_sites.is_positive IS 'TRUE si le gîte contient des larves/nymphes, FALSE sinon';
COMMENT ON COLUMN breeding_sites.site_number IS 'Numéro séquentiel du gîte dans cette maison pour cette visite';

-- ===============================================
-- 4. TABLE : ADULT_MOSQUITOES_COLLECTIONS
-- ===============================================

CREATE TABLE IF NOT EXISTS adult_mosquitoes_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de collecte
    visit_date DATE NOT NULL,
    visit_start_time TIME NOT NULL,
    visit_end_time TIME NOT NULL,
    investigator_name VARCHAR(100),
    
    -- Méthode et localisation (COMBINAISON UNIQUE par maison/date)
    collection_method VARCHAR(20) NOT NULL CHECK (collection_method IN ('prokopack', 'bg_trap', 'other')),
    capture_location VARCHAR(20) NOT NULL CHECK (capture_location IN ('interior', 'exterior')),
    traps_count INTEGER DEFAULT 1 CHECK (traps_count >= 0),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : Une seule collecte par méthode/localisation/maison/date
    CONSTRAINT unique_collection UNIQUE(house_id, visit_date, collection_method, capture_location)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_mosquitoes_house ON adult_mosquitoes_collections(house_id);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_date ON adult_mosquitoes_collections(visit_date);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_status ON adult_mosquitoes_collections(status);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_method ON adult_mosquitoes_collections(collection_method);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_location ON adult_mosquitoes_collections(capture_location);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_investigator ON adult_mosquitoes_collections(investigator_name);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_submitted_by ON adult_mosquitoes_collections(submitted_by);

COMMENT ON TABLE adult_mosquitoes_collections IS 'Collectes de moustiques adultes - 1 ligne = 1 collecte (méthode × localisation)';
COMMENT ON COLUMN adult_mosquitoes_collections.collection_method IS 'Méthode de collecte : prokopack, bg_trap, other';
COMMENT ON COLUMN adult_mosquitoes_collections.capture_location IS 'Localisation de capture : interior ou exterior';

-- ===============================================
-- 5. TABLE : MOSQUITO_SPECIMENS (Spécimens)
-- ===============================================

CREATE TABLE IF NOT EXISTS mosquito_specimens (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES adult_mosquitoes_collections(id) ON DELETE CASCADE,
    
    -- Identification taxonomique
    genus VARCHAR(20) NOT NULL CHECK (genus IN ('aedes', 'culex', 'anopheles', 'other')),
    species VARCHAR(50) CHECK (species IN ('aedes_aegypti', 'other_aedes', 'culex', 'anopheles', 'other')),
    
    -- Caractéristiques
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
    
    -- État physiologique (femelles uniquement)
    physiological_state VARCHAR(20) CHECK (physiological_state IN ('blood_fed', 'gravid', 'starved', 'unknown')),
    
    -- Nombre de spécimens identiques (permet de grouper)
    count INTEGER DEFAULT 1 CHECK (count >= 1),
    
    -- Métadonnées
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : état physiologique uniquement pour les femelles
    CONSTRAINT check_physiological_state 
        CHECK (sex = 'female' OR physiological_state IS NULL)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_specimens_collection ON mosquito_specimens(collection_id);
CREATE INDEX IF NOT EXISTS idx_specimens_genus ON mosquito_specimens(genus);
CREATE INDEX IF NOT EXISTS idx_specimens_sex ON mosquito_specimens(sex);
CREATE INDEX IF NOT EXISTS idx_specimens_state ON mosquito_specimens(physiological_state);
CREATE INDEX IF NOT EXISTS idx_specimens_species ON mosquito_specimens(species);

COMMENT ON TABLE mosquito_specimens IS 'Spécimens de moustiques - 1 ligne = 1 groupe de moustiques identiques';
COMMENT ON COLUMN mosquito_specimens.count IS 'Nombre de spécimens de ce type (permet de grouper des moustiques identiques)';
COMMENT ON COLUMN mosquito_specimens.physiological_state IS 'État physiologique (uniquement pour les femelles)';

-- ===============================================
-- AFFICHAGE DES TABLES CRÉÉES
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ TABLES CRÉÉES AVEC SUCCÈS :';
    RAISE NOTICE '   1. houses';
    RAISE NOTICE '   2. eggs_collections';
    RAISE NOTICE '   3. breeding_sites';
    RAISE NOTICE '   4. adult_mosquitoes_collections';
    RAISE NOTICE '   5. mosquito_specimens';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Prochaine étape : Créer les vues pour les calculs automatiques';
END $$;

