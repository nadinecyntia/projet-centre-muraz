-- =====================================================
-- SOLUTION FINALE DE NORMALISATION
-- Centre MURAZ - Structure corrigée respectant la logique métier
-- =====================================================

-- =====================================================
-- 1. TABLE DES LOCALISATIONS (Élimine la redondance géographique)
-- =====================================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    concession_code VARCHAR(50) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    gps_code VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes d'unicité
    UNIQUE(concession_code, sector, environment)
);

-- =====================================================
-- 2. TABLE DES MAISONS (Unité de calcul principale)
-- =====================================================
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    house_code VARCHAR(50) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    household_size INTEGER,
    sleeping_unit_count INTEGER,
    head_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité par localisation
    UNIQUE(house_code, location_id)
);

-- =====================================================
-- 3. TABLE DES BATches DE COLLECTE (Élimine la redondance batch)
-- =====================================================
CREATE TABLE collection_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    batch_name VARCHAR(200),
    investigator_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLE DES ESPÈCES (Remplace les arrays)
-- =====================================================
CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    genus VARCHAR(50) NOT NULL,
    species_name VARCHAR(100) NOT NULL,
    common_name VARCHAR(100),
    UNIQUE(genus, species_name)
);

-- =====================================================
-- 5. TABLE DES TYPES DE SITES (Remplace les arrays)
-- =====================================================
CREATE TABLE site_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) -- 'container', 'natural', 'artificial'
);

CREATE TABLE site_classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- =====================================================
-- 6. TABLE DES COLLECTES ADULTES (CORRECTION MAJEURE)
-- =====================================================
CREATE TABLE adult_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER REFERENCES houses(id),
    batch_id INTEGER REFERENCES collection_batches(id),
    collection_method VARCHAR(20) NOT NULL, -- 'prokopack' ou 'bg_trap'
    capture_location VARCHAR(20) NOT NULL, -- 'interior' ou 'exterior'
    visit_date DATE NOT NULL,
    visit_start_time TIME,
    visit_end_time TIME,
    
    -- Compteurs de pièges
    traps_count INTEGER DEFAULT 0,
    mosquitoes_count INTEGER DEFAULT 0,
    
    -- Compteurs par sexe
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    
    -- Compteurs par état physiologique
    blood_fed_females_count INTEGER DEFAULT 0,
    gravid_females_count INTEGER DEFAULT 0,
    starved_females_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : une seule ligne par maison/méthode/localisation/date
    UNIQUE(house_id, collection_method, capture_location, visit_date)
);

-- =====================================================
-- 7. TABLE DES COMPTAGES PAR ESPÈCE (Adultes)
-- =====================================================
CREATE TABLE adult_species_counts (
    id SERIAL PRIMARY KEY,
    adult_collection_id INTEGER REFERENCES adult_collections(id),
    species_id INTEGER REFERENCES species(id),
    count INTEGER NOT NULL DEFAULT 0,
    sex VARCHAR(10), -- 'male', 'female', 'unknown'
    physiological_state VARCHAR(20), -- 'blood_fed', 'gravid', 'starved'
    
    UNIQUE(adult_collection_id, species_id, sex, physiological_state)
);

-- =====================================================
-- 8. TABLE DES GÎTES LARVAIRES (1 ligne par gîte)
-- =====================================================
CREATE TABLE breeding_sites (
    id SERIAL PRIMARY KEY,
    house_id INTEGER REFERENCES houses(id),
    batch_id INTEGER REFERENCES collection_batches(id),
    visit_date DATE NOT NULL,
    visit_start_time TIME,
    visit_end_time TIME,
    
    -- Classification du gîte
    site_type_id INTEGER REFERENCES site_types(id),
    site_class_id INTEGER REFERENCES site_classes(id),
    
    -- État du gîte
    is_positive BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TABLE DES COMPTAGES LARVAIRES/NYMPHES
-- =====================================================
CREATE TABLE larvae_counts (
    id SERIAL PRIMARY KEY,
    breeding_site_id INTEGER REFERENCES breeding_sites(id),
    species_id INTEGER REFERENCES species(id),
    stage VARCHAR(20) NOT NULL, -- 'larvae' ou 'nymphs'
    count INTEGER NOT NULL DEFAULT 0,
    
    UNIQUE(breeding_site_id, species_id, stage)
);

-- =====================================================
-- 10. TABLE DES COLLECTES D'ŒUFS (1 ligne = 1 maison)
-- =====================================================
CREATE TABLE egg_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER REFERENCES houses(id),
    batch_id INTEGER REFERENCES collection_batches(id),
    visit_date DATE NOT NULL,
    
    -- Identification du nid
    nest_number VARCHAR(50),
    nest_code VARCHAR(50),
    pass_order VARCHAR(50),
    
    -- Comptage
    eggs_count INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : une seule ligne par maison/date
    UNIQUE(house_id, visit_date)
);

-- =====================================================
-- 11. TABLE DES VALIDATIONS (Centralise la validation)
-- =====================================================
CREATE TABLE validations (
    id SERIAL PRIMARY KEY,
    collection_type VARCHAR(20) NOT NULL, -- 'adult', 'breeding', 'eggs'
    collection_id INTEGER NOT NULL, -- ID de la collection validée
    validated_by VARCHAR(100) NOT NULL,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation_notes TEXT,
    status VARCHAR(20) NOT NULL -- 'approved', 'rejected', 'pending'
);

-- =====================================================
-- 12. INDEX POUR OPTIMISATION DES REQUÊTES
-- =====================================================

-- Index pour les calculs par maison
CREATE INDEX idx_houses_location ON houses(location_id);
CREATE INDEX idx_adult_collections_house_date ON adult_collections(house_id, visit_date);
CREATE INDEX idx_breeding_sites_house_date ON breeding_sites(house_id, visit_date);
CREATE INDEX idx_egg_collections_house_date ON egg_collections(house_id, visit_date);

-- Index pour les calculs par secteur/environnement
CREATE INDEX idx_locations_sector_env ON locations(sector, environment);

-- Index pour les calculs par batch
CREATE INDEX idx_adult_collections_batch ON adult_collections(batch_id);
CREATE INDEX idx_breeding_sites_batch ON breeding_sites(batch_id);
CREATE INDEX idx_egg_collections_batch ON egg_collections(batch_id);

-- Index pour les calculs par espèce
CREATE INDEX idx_adult_species_counts_species ON adult_species_counts(species_id);
CREATE INDEX idx_larvae_counts_species ON larvae_counts(species_id);

-- Index pour les validations
CREATE INDEX idx_validations_type_id ON validations(collection_type, collection_id);
CREATE INDEX idx_validations_status ON validations(status);

-- =====================================================
-- 13. VUES POUR FACILITER LES CALCULS D'INDICES
-- =====================================================

-- Vue pour les calculs d'adultes par maison (CORRECTION MAJEURE)
CREATE VIEW v_adult_collections_by_house AS
SELECT 
    h.id as house_id,
    h.house_code,
    l.concession_code,
    l.sector,
    l.environment,
    ac.visit_date,
    -- CORRECTION: Compter correctement les maisons (4 lignes = 1 maison)
    COUNT(DISTINCT ac.id) / 4 as total_collections_per_house,
    COUNT(DISTINCT CASE WHEN ac.collection_method = 'prokopack' THEN ac.id END) / 2 as prokopack_collections_per_house,
    COUNT(DISTINCT CASE WHEN ac.collection_method = 'bg_trap' THEN ac.id END) / 2 as bg_trap_collections_per_house,
    SUM(ac.mosquitoes_count) as total_mosquitoes,
    SUM(ac.male_count) as total_males,
    SUM(ac.female_count) as total_females,
    SUM(ac.blood_fed_females_count) as blood_fed_females,
    SUM(ac.gravid_females_count) as gravid_females,
    SUM(ac.starved_females_count) as starved_females
FROM houses h
JOIN locations l ON h.location_id = l.id
LEFT JOIN adult_collections ac ON h.id = ac.house_id AND ac.status = 'approved'
GROUP BY h.id, h.house_code, l.concession_code, l.sector, l.environment, ac.visit_date;

-- Vue pour les calculs de gîtes par maison
CREATE VIEW v_breeding_sites_by_house AS
SELECT 
    h.id as house_id,
    h.house_code,
    l.concession_code,
    l.sector,
    l.environment,
    bs.visit_date,
    COUNT(bs.id) as total_sites,
    COUNT(CASE WHEN bs.is_positive THEN bs.id END) as positive_sites,
    SUM(lc.count) FILTER (WHERE lc.stage = 'larvae') as total_larvae,
    SUM(lc.count) FILTER (WHERE lc.stage = 'nymphs') as total_nymphs
FROM houses h
JOIN locations l ON h.location_id = l.id
LEFT JOIN breeding_sites bs ON h.id = bs.house_id AND bs.status = 'approved'
LEFT JOIN larvae_counts lc ON bs.id = lc.breeding_site_id
GROUP BY h.id, h.house_code, l.concession_code, l.sector, l.environment, bs.visit_date;

-- Vue pour les calculs d'œufs par maison
CREATE VIEW v_egg_collections_by_house AS
SELECT 
    h.id as house_id,
    h.house_code,
    l.concession_code,
    l.sector,
    l.environment,
    ec.visit_date,
    SUM(ec.eggs_count) as total_eggs,
    COUNT(ec.id) as total_collections
FROM houses h
JOIN locations l ON h.location_id = l.id
LEFT JOIN egg_collections ec ON h.id = ec.house_id AND ec.status = 'approved'
GROUP BY h.id, h.house_code, l.concession_code, l.sector, l.environment, ec.visit_date;

-- =====================================================
-- 14. FONCTIONS POUR CALCULER LES INDICES (CORRIGÉES)
-- =====================================================

-- Fonction pour calculer l'Indice de Breteau (CORRIGÉE)
CREATE OR REPLACE FUNCTION calculate_breteau_index(
    p_sector VARCHAR(50),
    p_environment VARCHAR(20),
    p_period_start DATE,
    p_period_end DATE
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_houses INTEGER;
    positive_sites INTEGER;
    result DECIMAL(10,2);
BEGIN
    -- Compter les maisons visitées (CORRECTION: utiliser la vue)
    SELECT COUNT(DISTINCT house_id)
    INTO total_houses
    FROM v_breeding_sites_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end;
    
    -- Compter les gîtes positifs
    SELECT SUM(positive_sites)
    INTO positive_sites
    FROM v_breeding_sites_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculer l'indice
    IF total_houses > 0 THEN
        result := (positive_sites::DECIMAL * 100) / total_houses;
    ELSE
        result := 0;
    END IF;
    
    RETURN ROUND(result, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer l'Indice de Maison (CORRIGÉE)
CREATE OR REPLACE FUNCTION calculate_house_index(
    p_sector VARCHAR(50),
    p_environment VARCHAR(20),
    p_period_start DATE,
    p_period_end DATE
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_houses INTEGER;
    positive_houses INTEGER;
    result DECIMAL(10,2);
BEGIN
    -- Compter les maisons visitées
    SELECT COUNT(DISTINCT house_id)
    INTO total_houses
    FROM v_breeding_sites_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end;
    
    -- Compter les maisons avec au moins un gîte positif
    SELECT COUNT(DISTINCT house_id)
    INTO positive_houses
    FROM v_breeding_sites_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end
    AND positive_sites > 0;
    
    -- Calculer l'indice
    IF total_houses > 0 THEN
        result := (positive_houses::DECIMAL * 100) / total_houses;
    ELSE
        result := 0;
    END IF;
    
    RETURN ROUND(result, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer l'Indice Adultes par Piège BG (CORRIGÉE)
CREATE OR REPLACE FUNCTION calculate_adult_bg_index(
    p_sector VARCHAR(50),
    p_environment VARCHAR(20),
    p_period_start DATE,
    p_period_end DATE
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_traps INTEGER;
    total_mosquitoes INTEGER;
    result DECIMAL(10,2);
BEGIN
    -- Compter les pièges BG installés (CORRECTION: 2 pièges par maison)
    SELECT COUNT(DISTINCT house_id) * 2
    INTO total_traps
    FROM v_adult_collections_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end
    AND bg_trap_collections_per_house > 0;
    
    -- Compter les moustiques capturés par BG Trap
    SELECT SUM(total_mosquitoes)
    INTO total_mosquitoes
    FROM v_adult_collections_by_house
    WHERE sector = p_sector 
    AND environment = p_environment
    AND visit_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculer l'indice
    IF total_traps > 0 THEN
        result := total_mosquitoes::DECIMAL / total_traps;
    ELSE
        result := 0;
    END IF;
    
    RETURN ROUND(result, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. DONNÉES DE RÉFÉRENCE
-- =====================================================

-- Insérer les espèces de référence
INSERT INTO species (genus, species_name, common_name) VALUES
('aedes', 'aedes_aegypti', 'Moustique tigre'),
('aedes', 'other_aedes', 'Autres Aedes'),
('culex', 'culex', 'Culex'),
('anopheles', 'anopheles', 'Anophèle'),
('other', 'other', 'Autres');

-- Insérer les types de sites
INSERT INTO site_types (type_name, category) VALUES
('pneu', 'artificial'),
('bidon', 'artificial'),
('bassin', 'artificial'),
('plate', 'artificial'),
('box', 'artificial'),
('table', 'artificial'),
('canari', 'artificial'),
('kettle', 'artificial'),
('tomato_box', 'artificial'),
('bucket', 'artificial'),
('water_trough', 'artificial'),
('gutter', 'artificial'),
('chair', 'artificial'),
('pot', 'artificial'),
('other', 'other');

-- Insérer les classes de sites
INSERT INTO site_classes (class_name, description) VALUES
('household waste', 'Déchets ménagers'),
('abandoned utensils', 'Ustensiles abandonnés'),
('car wrecks', 'Épaves de voitures'),
('construction equipment', 'Équipements de construction'),
('breeding utensils', 'Ustensiles d''élevage'),
('other', 'Autres');







