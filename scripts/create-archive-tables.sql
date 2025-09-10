-- =====================================================
-- CRÉATION DES TABLES D'ARCHIVAGE - CENTRE MURAZ
-- =====================================================

-- Table d'archive pour household_visits
CREATE TABLE IF NOT EXISTS household_visits_archive (
    id SERIAL PRIMARY KEY,
    household_visit_id VARCHAR(255) UNIQUE NOT NULL,
    visit_start_date TIMESTAMP,
    visit_end_date TIMESTAMP,
    sector VARCHAR(100),
    village VARCHAR(100),
    household_id VARCHAR(255),
    household_head_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(255) DEFAULT 'Automatic monthly archive'
);

-- Table d'archive pour breeding_sites
CREATE TABLE IF NOT EXISTS breeding_sites_archive (
    id SERIAL PRIMARY KEY,
    household_visit_id VARCHAR(255) NOT NULL,
    site_id VARCHAR(255) UNIQUE NOT NULL,
    site_type VARCHAR(100),
    site_description TEXT,
    positive_sites INTEGER DEFAULT 0,
    total_sites INTEGER DEFAULT 0,
    nymphs_present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(255) DEFAULT 'Automatic monthly archive',
    FOREIGN KEY (household_visit_id) REFERENCES household_visits_archive(household_visit_id) ON DELETE CASCADE
);

-- Table d'archive pour eggs_collection
CREATE TABLE IF NOT EXISTS eggs_collection_archive (
    id SERIAL PRIMARY KEY,
    household_visit_id VARCHAR(255) NOT NULL,
    ovitrap_id VARCHAR(255) UNIQUE NOT NULL,
    ovitrap_location VARCHAR(100),
    eggs_count INTEGER DEFAULT 0,
    eggs_present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(255) DEFAULT 'Automatic monthly archive',
    FOREIGN KEY (household_visit_id) REFERENCES household_visits_archive(household_visit_id) ON DELETE CASCADE
);

-- Table d'archive pour adult_mosquitoes
CREATE TABLE IF NOT EXISTS adult_mosquitoes_archive (
    id SERIAL PRIMARY KEY,
    household_visit_id VARCHAR(255) NOT NULL,
    trap_id VARCHAR(255) UNIQUE NOT NULL,
    trap_type VARCHAR(50),
    genus VARCHAR(50),
    aedes_count INTEGER DEFAULT 0,
    culex_count INTEGER DEFAULT 0,
    anopheles_count INTEGER DEFAULT 0,
    other_genus_count INTEGER DEFAULT 0,
    total_mosquitoes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(255) DEFAULT 'Automatic monthly archive',
    FOREIGN KEY (household_visit_id) REFERENCES household_visits_archive(household_visit_id) ON DELETE CASCADE
);

-- Table de métadonnées d'archive
CREATE TABLE IF NOT EXISTS archive_metadata (
    id SERIAL PRIMARY KEY,
    archive_month DATE NOT NULL,
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_visits_archived INTEGER DEFAULT 0,
    total_breeding_sites_archived INTEGER DEFAULT 0,
    total_eggs_collection_archived INTEGER DEFAULT 0,
    total_adult_mosquitoes_archived INTEGER DEFAULT 0,
    
    -- Indices pré-calculés pour ce mois
    ib_average DECIMAL(10, 2),
    im_average DECIMAL(10, 2),
    ir_average DECIMAL(10, 2),
    ipp_average DECIMAL(10, 2),
    icn_average DECIMAL(10, 2),
    iap_bg_average DECIMAL(10, 2),
    iap_prokopack_average DECIMAL(10, 2),
    
    -- Statistiques par secteur
    sectors_count INTEGER DEFAULT 0,
    villages_count INTEGER DEFAULT 0,
    
    -- Métriques de performance
    archive_duration_ms INTEGER,
    archive_status VARCHAR(50) DEFAULT 'completed',
    archive_notes TEXT,
    
    UNIQUE(archive_month)
);

-- Index pour optimiser les requêtes d'archive
CREATE INDEX IF NOT EXISTS idx_household_visits_archive_date 
ON household_visits_archive(visit_start_date);

CREATE INDEX IF NOT EXISTS idx_household_visits_archive_sector 
ON household_visits_archive(sector);

CREATE INDEX IF NOT EXISTS idx_breeding_sites_archive_visit 
ON breeding_sites_archive(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_eggs_collection_archive_visit 
ON eggs_collection_archive(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_archive_visit 
ON adult_mosquitoes_archive(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_archive_metadata_month 
ON archive_metadata(archive_month);

-- Vue pour faciliter l'accès aux données archivées
CREATE OR REPLACE VIEW archived_indices_summary AS
SELECT 
    am.archive_month,
    am.archive_date,
    am.total_visits_archived,
    am.ib_average,
    am.im_average,
    am.ir_average,
    am.ipp_average,
    am.icn_average,
    am.iap_bg_average,
    am.iap_prokopack_average,
    am.sectors_count,
    am.villages_count,
    am.archive_status
FROM archive_metadata am
ORDER BY am.archive_month DESC;

-- Commentaires pour documentation
COMMENT ON TABLE household_visits_archive IS 'Archive des visites de ménages (> 12 mois)';
COMMENT ON TABLE breeding_sites_archive IS 'Archive des sites de reproduction (> 12 mois)';
COMMENT ON TABLE eggs_collection_archive IS 'Archive des collections d''œufs (> 12 mois)';
COMMENT ON TABLE adult_mosquitoes_archive IS 'Archive des moustiques adultes (> 12 mois)';
COMMENT ON TABLE archive_metadata IS 'Métadonnées et indices pré-calculés des archives';

COMMENT ON VIEW archived_indices_summary IS 'Vue résumée des indices archivés par mois';

-- Affichage de confirmation
SELECT 'Tables d''archive créées avec succès!' as status;





