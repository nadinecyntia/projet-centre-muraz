-- ===============================================
-- SCRIPT DE DÉPLOIEMENT COMPLET
-- Centre MURAZ - Plateforme de Surveillance Arboviroses
-- ===============================================
-- Date: 2025-10-21
-- Description: Script maître pour déployer tout le nouveau système normalisé
-- ===============================================

\echo ''
\echo '================================================================'
\echo '   DÉPLOIEMENT DU NOUVEAU SYSTÈME NORMALISÉ'
\echo '   Centre MURAZ - Plateforme de Surveillance Arboviroses'
\echo '================================================================'
\echo ''

-- ===============================================
-- ÉTAPE 1 : SAUVEGARDE DES ANCIENNES DONNÉES
-- ===============================================

\echo ''
\echo '📦 ÉTAPE 1/5 : Sauvegarde des anciennes données (optionnel)'
\echo '-------------------------------------------------------------'
\echo ''
\echo 'Si vous souhaitez sauvegarder les données actuelles :'
\echo 'Exécutez manuellement : pg_dump -U postgres -d centre_muraz_arbovirose > backup_$(date +%Y%m%d).sql'
\echo ''
\echo 'Appuyez sur Entrée pour continuer (les anciennes données seront SUPPRIMÉES)...'
\prompt 'Continuer?' confirm
\echo ''

-- ===============================================
-- ÉTAPE 2 : SUPPRESSION DES ANCIENNES TABLES
-- ===============================================

\echo ''
\echo '🗑️  ÉTAPE 2/5 : Suppression des anciennes tables'
\echo '-------------------------------------------------------------'
\echo ''

\echo 'Suppression de adult_mosquitoes_new...'
DROP TABLE IF EXISTS adult_mosquitoes_new CASCADE;

\echo 'Suppression de breeding_sites_new...'
DROP TABLE IF EXISTS breeding_sites_new CASCADE;

\echo 'Suppression de eggs_collection_new...'
DROP TABLE IF EXISTS eggs_collection_new CASCADE;

\echo '✅ Anciennes tables supprimées'
\echo ''

-- ===============================================
-- ÉTAPE 3 : CRÉATION DES NOUVELLES TABLES
-- ===============================================

\echo ''
\echo '🏗️  ÉTAPE 3/5 : Création des nouvelles tables'
\echo '-------------------------------------------------------------'
\echo ''

\i scripts/create-new-normalized-tables.sql

-- ===============================================
-- ÉTAPE 4 : CRÉATION DES VUES
-- ===============================================

\echo ''
\echo '📊 ÉTAPE 4/5 : Création des vues pour calculs automatiques'
\echo '-------------------------------------------------------------'
\echo ''

\i scripts/create-summary-views.sql

-- ===============================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ===============================================

\echo ''
\echo '✅ ÉTAPE 5/5 : Vérification finale'
\echo '-------------------------------------------------------------'
\echo ''

DO $$
DECLARE
    tables_count INTEGER;
    views_count INTEGER;
BEGIN
    -- Compter les nouvelles tables
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections', 'mosquito_specimens');
    
    -- Compter les vues
    SELECT COUNT(*) INTO views_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN ('breeding_sites_summary', 'adult_mosquitoes_summary', 'eggs_collections_with_house_info', 'houses_complete_stats');
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '   RÉSULTAT DU DÉPLOIEMENT';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Nouvelles tables créées : % / 5', tables_count;
    RAISE NOTICE '📊 Vues créées : % / 4', views_count;
    RAISE NOTICE '';
    
    IF tables_count = 5 AND views_count = 4 THEN
        RAISE NOTICE '✅ DÉPLOIEMENT RÉUSSI !';
        RAISE NOTICE '';
        RAISE NOTICE 'Prochaines étapes :';
        RAISE NOTICE '  1. Modifier server.js pour utiliser api-collect-normalized.js';
        RAISE NOTICE '  2. Redémarrer le serveur';
        RAISE NOTICE '  3. Tester les nouvelles routes de collecte';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING '⚠️  DÉPLOIEMENT INCOMPLET !';
        RAISE WARNING 'Certaines tables ou vues sont manquantes.';
    END IF;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
END $$;

