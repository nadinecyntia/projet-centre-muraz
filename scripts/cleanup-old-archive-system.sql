-- =====================================================
-- NETTOYAGE DE L'ANCIEN SYSTÈME D'ARCHIVAGE
-- Centre MURAZ - Suppression des tables d'archive obsolètes
-- =====================================================

-- Supprimer les anciennes tables d'archive qui ne correspondent plus à l'architecture actuelle
DROP TABLE IF EXISTS archive_metadata CASCADE;
DROP TABLE IF EXISTS archived_indices_summary CASCADE;
DROP TABLE IF EXISTS molecular_biology CASCADE;
DROP TABLE IF EXISTS biologie_moleculaire_backup CASCADE;

-- Supprimer les anciennes tables d'indices qui ne sont plus utilisées
DROP TABLE IF EXISTS entomological_indices CASCADE;

-- Supprimer la table de synchronisation obsolète
DROP TABLE IF EXISTS kobocollect_sync CASCADE;

-- Vérifier que les tables ont été supprimées
SELECT 'Tables supprimées avec succès' AS status;

-- Afficher les tables restantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
