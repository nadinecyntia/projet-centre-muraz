-- =====================================================
-- PHASE 1 : INDEXATION DE LA BASE DE DONNÉES
-- Optimisation pour 1,000-5,000 visites
-- =====================================================

-- Index pour optimiser les requêtes par date
CREATE INDEX IF NOT EXISTS idx_household_visits_date 
ON household_visits(visit_start_date);

-- Index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_breeding_sites_visit_id 
ON breeding_sites(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_eggs_collection_visit_id 
ON eggs_collection(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_visit_id 
ON adult_mosquitoes(household_visit_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_visits_sector_date 
ON household_visits(sector, visit_start_date);

-- Index pour les calculs d'indices
CREATE INDEX IF NOT EXISTS idx_breeding_sites_positive 
ON breeding_sites(positive_sites) WHERE positive_sites > 0;

CREATE INDEX IF NOT EXISTS idx_eggs_collection_eggs_found 
ON eggs_collection(eggs_found) WHERE eggs_found > 0;

CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_trap_type 
ON adult_mosquitoes(trap_type);

-- Index pour les agrégations
CREATE INDEX IF NOT EXISTS idx_household_visits_month 
ON household_visits(DATE_TRUNC('month', visit_start_date));

-- Index pour les contraintes de clés étrangères
CREATE INDEX IF NOT EXISTS idx_breeding_sites_visit_id_fk 
ON breeding_sites(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_eggs_collection_visit_id_fk 
ON eggs_collection(household_visit_id);

CREATE INDEX IF NOT EXISTS idx_adult_mosquitoes_visit_id_fk 
ON adult_mosquitoes(household_visit_id);

-- Index pour les requêtes de statistiques
CREATE INDEX IF NOT EXISTS idx_household_visits_sector 
ON household_visits(sector);

-- Index pour les recherches temporelles
CREATE INDEX IF NOT EXISTS idx_household_visits_date_range 
ON household_visits(visit_start_date) 
WHERE visit_start_date >= '2020-01-01';

-- Vérification des index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('household_visits', 'breeding_sites', 'eggs_collection', 'adult_mosquitoes')
ORDER BY tablename, indexname;





