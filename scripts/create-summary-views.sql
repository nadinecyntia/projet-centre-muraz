-- ===============================================
-- SCRIPT DE CRÉATION DES VUES POUR CALCULS AUTOMATIQUES
-- Centre MURAZ - Plateforme de Surveillance Arboviroses
-- ===============================================
-- Date: 2025-10-21
-- Description: Création des vues qui calculent automatiquement les totaux
--              pour remplacer les colonnes calculées manuellement
-- ===============================================

-- ===============================================
-- 1. VUE : BREEDING_SITES_SUMMARY
-- ===============================================
-- Calcule automatiquement les totaux par maison/date
-- Remplace les colonnes : total_sites_count, positive_sites_count, 
--                        aedes_larvae_count, etc.

CREATE OR REPLACE VIEW breeding_sites_summary AS
SELECT 
    bs.house_id,
    bs.visit_date,
    bs.investigator_name,
    
    -- Comptages de gîtes
    COUNT(*) as total_sites_count,
    SUM(CASE WHEN bs.is_positive THEN 1 ELSE 0 END)::INTEGER as positive_sites_count,
    SUM(CASE WHEN NOT bs.is_positive THEN 1 ELSE 0 END)::INTEGER as negative_sites_count,
    
    -- Totaux larves par genre
    SUM(CASE WHEN bs.larvae_genus = 'aedes' THEN bs.larvae_count ELSE 0 END)::INTEGER as aedes_larvae_count,
    SUM(CASE WHEN bs.larvae_genus = 'culex' THEN bs.larvae_count ELSE 0 END)::INTEGER as culex_larvae_count,
    SUM(CASE WHEN bs.larvae_genus = 'anopheles' THEN bs.larvae_count ELSE 0 END)::INTEGER as anopheles_larvae_count,
    SUM(CASE WHEN bs.larvae_genus = 'other' THEN bs.larvae_count ELSE 0 END)::INTEGER as other_larvae_count,
    SUM(bs.larvae_count)::INTEGER as total_larvae_count,
    
    -- Totaux nymphes par genre
    SUM(CASE WHEN bs.nymphs_genus = 'aedes' THEN bs.nymphs_count ELSE 0 END)::INTEGER as aedes_nymphs_count,
    SUM(CASE WHEN bs.nymphs_genus = 'culex' THEN bs.nymphs_count ELSE 0 END)::INTEGER as culex_nymphs_count,
    SUM(CASE WHEN bs.nymphs_genus = 'anopheles' THEN bs.nymphs_count ELSE 0 END)::INTEGER as anopheles_nymphs_count,
    SUM(CASE WHEN bs.nymphs_genus = 'other' THEN bs.nymphs_count ELSE 0 END)::INTEGER as other_nymphs_count,
    SUM(bs.nymphs_count)::INTEGER as total_nymphs_count,
    
    -- Types et classes de gîtes présents (arrays)
    array_agg(DISTINCT bs.site_type) FILTER (WHERE bs.site_type IS NOT NULL) as site_types,
    array_agg(DISTINCT bs.site_class) FILTER (WHERE bs.site_class IS NOT NULL) as site_classes,
    array_agg(DISTINCT bs.larvae_genus) FILTER (WHERE bs.larvae_genus IS NOT NULL) as larvae_genera,
    array_agg(DISTINCT bs.nymphs_genus) FILTER (WHERE bs.nymphs_genus IS NOT NULL) as nymphs_genera,
    
    -- Informations de la maison (JOIN pour faciliter les requêtes)
    h.concession_code,
    h.house_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.household_size,
    h.sleeping_unit_count,
    h.head_contact
    
FROM breeding_sites bs
INNER JOIN houses h ON bs.house_id = h.id
WHERE bs.status IN ('pending', 'validated')  -- Exclure les données rejetées
GROUP BY 
    bs.house_id, 
    bs.visit_date, 
    bs.investigator_name,
    h.concession_code,
    h.house_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.household_size,
    h.sleeping_unit_count,
    h.head_contact;

-- Index sur la vue (pour améliorer les performances)
CREATE INDEX IF NOT EXISTS idx_breeding_summary_house 
    ON breeding_sites(house_id, visit_date) WHERE status IN ('pending', 'validated');
CREATE INDEX IF NOT EXISTS idx_breeding_summary_investigator 
    ON breeding_sites(investigator_name) WHERE status IN ('pending', 'validated');

COMMENT ON VIEW breeding_sites_summary IS 'Vue calculant automatiquement les totaux de gîtes par maison/date';

-- ===============================================
-- 2. VUE : ADULT_MOSQUITOES_SUMMARY
-- ===============================================
-- Calcule automatiquement les totaux pour chaque collecte
-- Remplace les colonnes : total_mosquitoes_count, male_count, female_count,
--                        aedes_male_count, blood_fed_females_count, etc.

CREATE OR REPLACE VIEW adult_mosquitoes_summary AS
SELECT 
    c.id as collection_id,
    c.house_id,
    c.visit_date,
    c.visit_start_time,
    c.visit_end_time,
    c.investigator_name,
    c.collection_method,
    c.capture_location,
    c.traps_count,
    c.status,
    
    -- Totaux généraux
    COALESCE(SUM(s.count), 0)::INTEGER as total_mosquitoes_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male'), 0)::INTEGER as male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female'), 0)::INTEGER as female_count,
    
    -- Mâles par genre
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'aedes'), 0)::INTEGER as aedes_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'culex'), 0)::INTEGER as culex_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'anopheles'), 0)::INTEGER as anopheles_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'other'), 0)::INTEGER as other_male_count,
    
    -- Femelles par état physiologique
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'blood_fed'), 0)::INTEGER as blood_fed_females_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'gravid'), 0)::INTEGER as gravid_females_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'starved'), 0)::INTEGER as starved_females_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'unknown'), 0)::INTEGER as unknown_females_count,
    
    -- Totaux par genre (mâles + femelles)
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'aedes'), 0)::INTEGER as aedes_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'culex'), 0)::INTEGER as culex_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'anopheles'), 0)::INTEGER as anopheles_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'other'), 0)::INTEGER as other_count,
    
    -- Genres et espèces présents (arrays)
    array_agg(DISTINCT s.genus) FILTER (WHERE s.genus IS NOT NULL) as genera,
    array_agg(DISTINCT s.species) FILTER (WHERE s.species IS NOT NULL) as species_list,
    
    -- Informations de la maison (JOIN pour faciliter les requêtes)
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates
    
FROM adult_mosquitoes_collections c
LEFT JOIN mosquito_specimens s ON c.id = s.collection_id
INNER JOIN houses h ON c.house_id = h.id
GROUP BY 
    c.id, 
    c.house_id, 
    c.visit_date, 
    c.visit_start_time,
    c.visit_end_time,
    c.investigator_name,
    c.collection_method, 
    c.capture_location,
    c.traps_count,
    c.status,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates;

-- Index sur la vue (pour améliorer les performances)
CREATE INDEX IF NOT EXISTS idx_mosquitoes_summary_house 
    ON adult_mosquitoes_collections(house_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_mosquitoes_summary_method 
    ON adult_mosquitoes_collections(collection_method, capture_location);

COMMENT ON VIEW adult_mosquitoes_summary IS 'Vue calculant automatiquement les totaux de moustiques par collecte';

-- ===============================================
-- 3. VUE : EGGS_COLLECTIONS_WITH_HOUSE_INFO
-- ===============================================
-- Vue facilitant les requêtes avec informations de maison

CREATE OR REPLACE VIEW eggs_collections_with_house_info AS
SELECT 
    e.*,
    h.concession_code,
    h.sector,
    h.environment,
    h.gps_coordinates
FROM eggs_collections e
INNER JOIN houses h ON e.house_id = h.id;

COMMENT ON VIEW eggs_collections_with_house_info IS 'Collecte d''œufs avec informations de maison pour faciliter les requêtes';

-- ===============================================
-- 4. VUE : HOUSES_COMPLETE_STATS
-- ===============================================
-- Vue donnant des statistiques complètes par maison

CREATE OR REPLACE VIEW houses_complete_stats AS
SELECT 
    h.id as house_id,
    h.concession_code,
    h.house_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.household_size,
    h.sleeping_unit_count,
    h.head_contact,
    h.created_at,
    h.updated_at,
    
    -- Nombre de collectes par type
    COUNT(DISTINCT e.id) as eggs_collections_count,
    COUNT(DISTINCT bs.visit_date) as breeding_visits_count,
    COUNT(DISTINCT amc.id) as mosquito_collections_count,
    
    -- Dernières dates de collecte
    MAX(e.visit_date) as last_eggs_collection_date,
    MAX(bs.visit_date) as last_breeding_visit_date,
    MAX(amc.visit_date) as last_mosquito_collection_date
    
FROM houses h
LEFT JOIN eggs_collections e ON h.id = e.house_id
LEFT JOIN breeding_sites bs ON h.id = bs.house_id
LEFT JOIN adult_mosquitoes_collections amc ON h.id = amc.house_id
GROUP BY 
    h.id,
    h.concession_code,
    h.house_code,
    h.sector,
    h.environment,
    h.gps_coordinates,
    h.household_size,
    h.sleeping_unit_count,
    h.head_contact,
    h.created_at,
    h.updated_at;

COMMENT ON VIEW houses_complete_stats IS 'Statistiques complètes par maison (nombre de collectes, dernières dates)';

-- ===============================================
-- AFFICHAGE DES VUES CRÉÉES
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VUES CRÉÉES AVEC SUCCÈS :';
    RAISE NOTICE '   1. breeding_sites_summary - Totaux gîtes par maison/date';
    RAISE NOTICE '   2. adult_mosquitoes_summary - Totaux moustiques par collecte';
    RAISE NOTICE '   3. eggs_collections_with_house_info - Œufs avec infos maison';
    RAISE NOTICE '   4. houses_complete_stats - Statistiques par maison';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Les totaux sont maintenant calculés AUTOMATIQUEMENT !';
    RAISE NOTICE '📊 Plus besoin de saisir manuellement les comptages agrégés';
END $$;

