// =====================================================
// API D'ARCHIVAGE COMPLET
// Centre MURAZ - Gestion de l'archivage des données
// =====================================================

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const { pool } = require('../config/database');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

// =====================================================
// 1. ENDPOINTS DE GESTION D'ARCHIVAGE
// =====================================================

// Lister les opérations d'archivage
router.get('/archive/runs', requireAuth, async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
        const query = `
            SELECT 
                    id,
                    archive_year,
                    archive_date,
                    status,
                    eggs_records_count,
                    breeding_sites_records_count,
                    mosquitoes_records_count,
                    analyses_pcr_records_count,
                    analyses_bioessai_records_count,
                    analyses_repas_sanguin_records_count,
                    infos_communes_records_count,
                    started_by,
                    completed_at,
                    error_message,
                    total_duration_seconds,
                    created_at
                FROM archive_runs 
                ORDER BY archive_date DESC
        `;
        
        const result = await client.query(query);
            
            res.json({
            success: true,
                data: result.rows,
                total: result.rows.length
            });
            
        } finally {
        client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des opérations d\'archivage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des opérations d\'archivage',
            details: error.message
        });
    }
});

// Obtenir les détails d'une opération d'archivage
router.get('/archive/runs/:runId', requireAuth, async (req, res) => {
    try {
        const { runId } = req.params;
        const client = await pool.connect();
        
        try {
        const query = `
            SELECT 
                    id,
                    archive_year,
                archive_date,
                    status,
                    eggs_records_count,
                    breeding_sites_records_count,
                    mosquitoes_records_count,
                    analyses_pcr_records_count,
                    analyses_bioessai_records_count,
                    analyses_repas_sanguin_records_count,
                    infos_communes_records_count,
                    started_by,
                    completed_at,
                    error_message,
                    total_duration_seconds,
                    created_at
                FROM archive_runs 
                WHERE id = $1
            `;
            
            const result = await client.query(query, [runId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Opération d\'archivage non trouvée'
                });
            }
            
            res.json({
            success: true,
                data: result.rows[0]
            });
            
        } finally {
        client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'opération d\'archivage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de l\'opération d\'archivage',
            details: error.message
        });
    }
});

// =====================================================
// 2. ENDPOINTS D'ARCHIVAGE MANUEL
// =====================================================

// Archiver les données d'une année spécifique
router.post('/archive/year/:year', requireSuperAdmin, async (req, res) => {
    const { year } = req.params;
    const startedBy = req.session.user?.username || 'system';
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const startTime = Date.now();
            
            // Créer l'enregistrement d'opération d'archivage
            const archiveRunQuery = `
                INSERT INTO archive_runs (archive_year, started_by, status)
                VALUES ($1, $2, 'running')
                RETURNING id
            `;
            
            const archiveRunResult = await client.query(archiveRunQuery, [year, startedBy]);
            const archiveRunId = archiveRunResult.rows[0].id;
            
            console.log(`🔄 Début de l'archivage de l'année ${year} (Run ID: ${archiveRunId})`);
            
            // 1. Archiver les œufs
            const eggsArchiveQuery = `
                INSERT INTO eggs_collection_archive (
                    id, eggs_concession_code, eggs_sector, eggs_environment, eggs_visit_start_date,
                    eggs_gps_code, nest_number, nest_code, pass_order, eggs_count, observations,
                    status, created_at, updated_at, validated_by, validated_at, validation_notes,
                    batch_id, batch_start_date, batch_end_date, batch_investigator, submitted_by,
                    archived_year, archive_run_id
                )
                SELECT 
                    id, eggs_concession_code, eggs_sector, eggs_environment, eggs_visit_start_date,
                    eggs_gps_code, nest_number, nest_code, pass_order, eggs_count, observations,
                    status, created_at, updated_at, validated_by, validated_at, validation_notes,
                    batch_id, batch_start_date, batch_end_date, batch_investigator, submitted_by,
                    $1, $2
                FROM eggs_collection_new 
                WHERE EXTRACT(YEAR FROM eggs_visit_start_date) = $1
                AND status = 'approved'
            `;
            
            const eggsResult = await client.query(eggsArchiveQuery, [year, archiveRunId]);
            const eggsCount = eggsResult.rowCount;
            
            // 2. Archiver les gîtes larvaires
            const breedingSitesArchiveQuery = `
                INSERT INTO breeding_sites_archive (
                    id, site_investigator_name, site_concession_code, site_house_code, site_sector,
                    site_environment, site_visit_start_date, site_visit_end_date, site_visit_start_time,
                    site_visit_end_time, site_gps_code, site_household_size, site_sleeping_unit_count,
                    site_head_contact, total_sites_count, positive_sites_count, negative_sites_count,
                    larvae_genus, larvae_count, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count,
                    other_larvae_count, nymphs_genus, nymphs_count, aedes_nymphs_count, culex_nymphs_count,
                    anopheles_nymphs_count, other_nymphs_count, sites_types, site_classes, observations,
                    status, created_at, updated_at, validated_by, validated_at, validation_notes,
                    batch_id, batch_start_date, batch_end_date, batch_investigator, submitted_by,
                    archived_year, archive_run_id
                )
                SELECT 
                    id, site_investigator_name, site_concession_code, site_house_code, site_sector,
                    site_environment, site_visit_start_date, site_visit_end_date, site_visit_start_time,
                    site_visit_end_time, site_gps_code, site_household_size, site_sleeping_unit_count,
                    site_head_contact, total_sites_count, positive_sites_count, negative_sites_count,
                    larvae_genus, larvae_count, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count,
                    other_larvae_count, nymphs_genus, nymphs_count, aedes_nymphs_count, culex_nymphs_count,
                    anopheles_nymphs_count, other_nymphs_count, sites_types, site_classes, observations,
                    status, created_at, updated_at, validated_by, validated_at, validation_notes,
                    batch_id, batch_start_date, batch_end_date, batch_investigator, submitted_by,
                    $1, $2
                FROM breeding_sites_new 
                WHERE EXTRACT(YEAR FROM site_visit_start_date) = $1
                AND status = 'approved'
            `;
            
            const breedingSitesResult = await client.query(breedingSitesArchiveQuery, [year, archiveRunId]);
            const breedingSitesCount = breedingSitesResult.rowCount;
            
            // 3. Archiver les moustiques adultes
            const mosquitoesArchiveQuery = `
                INSERT INTO adult_mosquitoes_archive (
                    id, mosquitoes_concession_code, mosquitoes_sector, mosquitoes_environment,
                    mosquitoes_visit_start_date, mosquitoes_visit_start_time, mosquitoes_visit_end_time,
                    mosquitoes_gps_code, genus, species, collection_methods, capture_locations,
                    prokopack_traps_count, bg_traps_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                    total_mosquitoes_count, male_count, aedes_male_count, culex_male_count, anopheles_male_count,
                    other_male_count, female_count, blood_fed_females_count, gravid_females_count,
                    starved_females_count, mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count,
                    mosquitoes_other_count, observations, status, created_at, updated_at, validated_by,
                    validated_at, validation_notes, batch_id, batch_start_date, batch_end_date,
                    batch_investigator, submitted_by, archived_year, archive_run_id
                )
                SELECT 
                    id, mosquitoes_concession_code, mosquitoes_sector, mosquitoes_environment,
                    mosquitoes_visit_start_date, mosquitoes_visit_start_time, mosquitoes_visit_end_time,
                    mosquitoes_gps_code, genus, species, collection_methods, capture_locations,
                    prokopack_traps_count, bg_traps_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                    total_mosquitoes_count, male_count, aedes_male_count, culex_male_count, anopheles_male_count,
                    other_male_count, female_count, blood_fed_females_count, gravid_females_count,
                    starved_females_count, mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count,
                    mosquitoes_other_count, observations, status, created_at, updated_at, validated_by,
                    validated_at, validation_notes, batch_id, batch_start_date, batch_end_date,
                    batch_investigator, submitted_by, $1, $2
                FROM adult_mosquitoes_new 
                WHERE EXTRACT(YEAR FROM mosquitoes_visit_start_date) = $1
                AND status = 'approved'
            `;
            
            const mosquitoesResult = await client.query(mosquitoesArchiveQuery, [year, archiveRunId]);
            const mosquitoesCount = mosquitoesResult.rowCount;
            
            // 4. Archiver les analyses PCR
            const pcrArchiveQuery = `
                INSERT INTO analyses_pcr_archive (
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, test_type, result, ct_value,
                    notes, analyst, created_at, updated_at, archived_year, archive_run_id
                )
                SELECT 
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, test_type, result, ct_value,
                    notes, analyst, created_at, updated_at, $1, $2
                FROM analyses_pcr 
                WHERE EXTRACT(YEAR FROM collection_date) = $1
            `;
            
            const pcrResult = await client.query(pcrArchiveQuery, [year, archiveRunId]);
            const pcrCount = pcrResult.rowCount;
            
            // 5. Archiver les analyses bioessai
            const bioessaiArchiveQuery = `
                INSERT INTO analyses_bioessai_archive (
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, insecticide_type, concentration,
                    exposure_time, mortality_rate, resistance_status, notes, analyst,
                    created_at, updated_at, archived_year, archive_run_id
                )
                SELECT 
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, insecticide_type, concentration,
                    exposure_time, mortality_rate, resistance_status, notes, analyst,
                    created_at, updated_at, $1, $2
                FROM analyses_bioessai 
                WHERE EXTRACT(YEAR FROM collection_date) = $1
            `;
            
            const bioessaiResult = await client.query(bioessaiArchiveQuery, [year, archiveRunId]);
            const bioessaiCount = bioessaiResult.rowCount;
            
            // 6. Archiver les analyses de repas sanguin
            const repasSanguinArchiveQuery = `
                INSERT INTO analyses_repas_sanguin_archive (
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, blood_meal_source, host_species,
                    feeding_time, notes, analyst, created_at, updated_at, archived_year, archive_run_id
                )
                SELECT 
                    id, sample_id, commune, sector, collection_date, analysis_date,
                    mosquito_genus, mosquito_species, blood_meal_source, host_species,
                    feeding_time, notes, analyst, created_at, updated_at, $1, $2
                FROM analyses_repas_sanguin 
                WHERE EXTRACT(YEAR FROM collection_date) = $1
            `;
            
            const repasSanguinResult = await client.query(repasSanguinArchiveQuery, [year, archiveRunId]);
            const repasSanguinCount = repasSanguinResult.rowCount;
            
            // 7. Archiver les informations communales (pas de filtre par année car données statiques)
            const infosCommunesArchiveQuery = `
                INSERT INTO infos_communes_archive (
                    id, commune, sector, environment, population, households,
                    latitude, longitude, altitude, climate_zone, vegetation_type,
                    water_sources, mosquito_breeding_sites, control_measures,
                    last_survey_date, notes, created_at, updated_at, archived_year, archive_run_id
                )
            SELECT 
                    id, commune, sector, environment, population, households,
                    latitude, longitude, altitude, climate_zone, vegetation_type,
                    water_sources, mosquito_breeding_sites, control_measures,
                    last_survey_date, notes, created_at, updated_at, $1, $2
                FROM infos_communes
            `;
            
            const infosCommunesResult = await client.query(infosCommunesArchiveQuery, [year, archiveRunId]);
            const infosCommunesCount = infosCommunesResult.rowCount;
            
            // Mettre à jour l'enregistrement d'opération d'archivage
            const endTime = Date.now();
            const durationSeconds = Math.round((endTime - startTime) / 1000);
            
            const updateArchiveRunQuery = `
                UPDATE archive_runs 
                SET 
                    status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    eggs_records_count = $1,
                    breeding_sites_records_count = $2,
                    mosquitoes_records_count = $3,
                    analyses_pcr_records_count = $4,
                    analyses_bioessai_records_count = $5,
                    analyses_repas_sanguin_records_count = $6,
                    infos_communes_records_count = $7,
                    total_duration_seconds = $8
                WHERE id = $9
            `;
            
            await client.query(updateArchiveRunQuery, [
                eggsCount, breedingSitesCount, mosquitoesCount, pcrCount,
                bioessaiCount, repasSanguinCount, infosCommunesCount,
                durationSeconds, archiveRunId
            ]);
            
            await client.query('COMMIT');
            
            console.log(`✅ Archivage de l'année ${year} terminé avec succès`);
            console.log(`📊 Résultats: ${eggsCount} œufs, ${breedingSitesCount} gîtes, ${mosquitoesCount} moustiques, ${pcrCount} PCR, ${bioessaiCount} bioessai, ${repasSanguinCount} repas sanguin, ${infosCommunesCount} communes`);
            
            res.json({
            success: true,
                message: `Archivage de l'année ${year} terminé avec succès`,
                data: {
                    archiveRunId,
                    year,
                    durationSeconds,
                    recordsArchived: {
                        eggs: eggsCount,
                        breedingSites: breedingSitesCount,
                        mosquitoes: mosquitoesCount,
                        pcr: pcrCount,
                        bioessai: bioessaiCount,
                        repasSanguin: repasSanguinCount,
                        infosCommunes: infosCommunesCount
                    }
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
        client.release();
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'archivage de l'année ${year}:`, error);
        res.status(500).json({
            success: false,
            error: `Erreur lors de l'archivage de l'année ${year}`,
            details: error.message
        });
    }
});

// =====================================================
// 3. ENDPOINTS DE SUPPRESSION DES DONNÉES ARCHIVÉES
// =====================================================

// Supprimer les données originales après archivage
router.delete('/archive/cleanup/:year', requireSuperAdmin, async (req, res) => {
    const { year } = req.params;
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            console.log(`🗑️ Suppression des données originales de l'année ${year}`);
            
            // Supprimer les données originales (seulement les données approuvées)
            const deleteQueries = [
                { table: 'eggs_collection_new', dateColumn: 'eggs_visit_start_date' },
                { table: 'breeding_sites_new', dateColumn: 'site_visit_start_date' },
                { table: 'adult_mosquitoes_new', dateColumn: 'mosquitoes_visit_start_date' },
                { table: 'analyses_pcr', dateColumn: 'collection_date' },
                { table: 'analyses_bioessai', dateColumn: 'collection_date' },
                { table: 'analyses_repas_sanguin', dateColumn: 'collection_date' }
            ];
            
            const deletionResults = {};
            
            for (const queryInfo of deleteQueries) {
                const deleteQuery = `
                    DELETE FROM ${queryInfo.table} 
                    WHERE EXTRACT(YEAR FROM ${queryInfo.dateColumn}) = $1
                    ${queryInfo.table.includes('_new') ? "AND status = 'approved'" : ''}
                `;
                
                const result = await client.query(deleteQuery, [year]);
                deletionResults[queryInfo.table] = result.rowCount;
                console.log(`🗑️ Supprimé ${result.rowCount} enregistrements de ${queryInfo.table}`);
            }
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: `Suppression des données originales de l'année ${year} terminée`,
                data: {
                    year,
                    deletedRecords: deletionResults
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors de la suppression des données de l'année ${year}:`, error);
        res.status(500).json({
            success: false,
            error: `Erreur lors de la suppression des données de l'année ${year}`,
            details: error.message
        });
    }
});

// =====================================================
// 4. ENDPOINTS DE CONSULTATION DES ARCHIVES
// =====================================================

// Obtenir les statistiques des archives
router.get('/archive/statistics', requireAuth, async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT 
                    archive_year,
                    COUNT(*) as total_runs,
                    SUM(eggs_records_count) as total_eggs_archived,
                    SUM(breeding_sites_records_count) as total_breeding_sites_archived,
                    SUM(mosquitoes_records_count) as total_mosquitoes_archived,
                    SUM(analyses_pcr_records_count) as total_pcr_archived,
                    SUM(analyses_bioessai_records_count) as total_bioessai_archived,
                    SUM(analyses_repas_sanguin_records_count) as total_repas_sanguin_archived,
                    SUM(infos_communes_records_count) as total_infos_communes_archived,
                    MAX(archive_date) as last_archive_date
                FROM archive_runs 
                WHERE status = 'completed'
                GROUP BY archive_year
                ORDER BY archive_year DESC
            `;
            
            const result = await client.query(query);
            
    res.json({
        success: true,
                data: result.rows
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques d\'archivage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques d\'archivage',
            details: error.message
        });
    }
});

// Obtenir les années disponibles dans les archives (public)
router.get('/years', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT DISTINCT archive_year 
                FROM archive_runs 
                WHERE status = 'completed'
                ORDER BY archive_year DESC
            `;
            
            const result = await client.query(query);
    
    res.json({
        success: true,
                data: result.rows.map(row => row.archive_year)
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des années archivées:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des années archivées',
            details: error.message
        });
    }
});

module.exports = router;
