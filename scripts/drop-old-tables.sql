-- ===============================================
-- SCRIPT DE SUPPRESSION DES ANCIENNES TABLES
-- Centre MURAZ - Plateforme de Surveillance Arboviroses
-- ===============================================
-- Date: 2025-10-21
-- Description: Suppression des anciennes tables non normalisées
--              ATTENTION : Cette opération est IRREVERSIBLE
--              Assurez-vous d'avoir une sauvegarde avant d'exécuter
-- ===============================================

-- ===============================================
-- AVERTISSEMENT
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATTENTION : SUPPRESSION DES ANCIENNES TABLES';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '   Ce script va supprimer les tables suivantes :';
    RAISE NOTICE '   - eggs_collection_new';
    RAISE NOTICE '   - breeding_sites_new';
    RAISE NOTICE '   - adult_mosquitoes_new';
    RAISE NOTICE '';
    RAISE NOTICE '   ❌ TOUTES LES DONNÉES SERONT PERDUES !';
    RAISE NOTICE '';
    RAISE NOTICE '   Assurez-vous d''avoir :';
    RAISE NOTICE '   ✅ Créé une sauvegarde de la base de données';
    RAISE NOTICE '   ✅ Vérifié que les nouvelles tables sont créées';
    RAISE NOTICE '   ✅ Testé le nouveau système';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
END $$;

-- ===============================================
-- SUPPRESSION DES ANCIENNES TABLES
-- ===============================================

-- 1. Supprimer la table adult_mosquitoes_new
DROP TABLE IF EXISTS adult_mosquitoes_new CASCADE;

-- 2. Supprimer la table breeding_sites_new
DROP TABLE IF EXISTS breeding_sites_new CASCADE;

-- 3. Supprimer la table eggs_collection_new
DROP TABLE IF EXISTS eggs_collection_new CASCADE;

-- ===============================================
-- VÉRIFICATION
-- ===============================================

DO $$
DECLARE
    old_table_count INTEGER;
BEGIN
    -- Vérifier que les anciennes tables sont bien supprimées
    SELECT COUNT(*) INTO old_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('eggs_collection_new', 'breeding_sites_new', 'adult_mosquitoes_new');
    
    IF old_table_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ SUPPRESSION RÉUSSIE';
        RAISE NOTICE '   Toutes les anciennes tables ont été supprimées';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING 'Certaines tables n''ont pas été supprimées !';
    END IF;
    
    -- Vérifier que les nouvelles tables existent
    SELECT COUNT(*) INTO old_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections', 'mosquito_specimens');
    
    RAISE NOTICE '📊 Nouvelles tables présentes : % / 5', old_table_count;
    
    IF old_table_count = 5 THEN
        RAISE NOTICE '✅ Toutes les nouvelles tables sont présentes';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 Vous pouvez maintenant utiliser le nouveau système normalisé !';
    ELSE
        RAISE WARNING '⚠️  Certaines nouvelles tables sont manquantes !';
        RAISE WARNING 'Exécutez d''abord les scripts :';
        RAISE WARNING '  1. create-new-normalized-tables.sql';
        RAISE WARNING '  2. create-summary-views.sql';
    END IF;
    
    RAISE NOTICE '';
END $$;

