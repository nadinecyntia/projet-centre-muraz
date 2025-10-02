#!/usr/bin/env node

// =====================================================
// SCRIPT D'ARCHIVAGE AUTOMATIQUE ANNUEL
// Centre MURAZ - Archivage automatique des données
// =====================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Utiliser la même configuration que l'application principale
const { pool } = require('../config/database');

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function getCurrentYear() {
    return new Date().getFullYear();
}

function getPreviousYear() {
    return getCurrentYear() - 1;
}

// =====================================================
// FONCTION D'ARCHIVAGE PRINCIPALE
// =====================================================

async function archiveYear(year) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const startTime = Date.now();
        log(`🔄 Début de l'archivage automatique de l'année ${year}`);
        
        // Créer l'enregistrement d'opération d'archivage
        const archiveRunQuery = `
            INSERT INTO archive_runs (archive_year, started_by, status)
            VALUES ($1, 'system_auto_archive', 'running')
            RETURNING id
        `;
        
        const archiveRunResult = await client.query(archiveRunQuery, [year]);
        const archiveRunId = archiveRunResult.rows[0].id;
        
        log(`📝 Opération d'archivage créée (ID: ${archiveRunId})`);
        
        // 1. Archiver les œufs
        log(`🥚 Archivage des œufs...`);
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
            WHERE EXTRACT(YEAR FROM eggs_visit_start_date) = $1::integer
            AND status = 'approved'
        `;
        
        const eggsResult = await client.query(eggsArchiveQuery, [year, archiveRunId]);
        const eggsCount = eggsResult.rowCount;
        log(`✅ ${eggsCount} enregistrements d'œufs archivés`);
        
        // 2. Archiver les gîtes larvaires
        log(`🏠 Archivage des gîtes larvaires...`);
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
            WHERE EXTRACT(YEAR FROM site_visit_start_date) = $1::integer
            AND status = 'approved'
        `;
        
        const breedingSitesResult = await client.query(breedingSitesArchiveQuery, [year, archiveRunId]);
        const breedingSitesCount = breedingSitesResult.rowCount;
        log(`✅ ${breedingSitesCount} enregistrements de gîtes larvaires archivés`);
        
        // 3. Archiver les moustiques adultes
        log(`🦟 Archivage des moustiques adultes...`);
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
            WHERE EXTRACT(YEAR FROM mosquitoes_visit_start_date) = $1::integer
            AND status = 'approved'
        `;
        
        const mosquitoesResult = await client.query(mosquitoesArchiveQuery, [year, archiveRunId]);
        const mosquitoesCount = mosquitoesResult.rowCount;
        log(`✅ ${mosquitoesCount} enregistrements de moustiques adultes archivés`);
        
        // 4. Archiver les analyses PCR
        log(`🧬 Archivage des analyses PCR...`);
        const pcrArchiveQuery = `
            INSERT INTO analyses_pcr_archive (
                id, infos_communes_id, identified_species, virus_types,
                homozygous_count, heterozygous_count, total_population,
                allelic_frequency_a, allelic_frequency_a_prime,
                created_at, updated_at, archived_year, archive_run_id
            )
            SELECT 
                id, infos_communes_id, identified_species, virus_types,
                homozygous_count, heterozygous_count, total_population,
                allelic_frequency_a, allelic_frequency_a_prime,
                created_at, updated_at, $1, $2
            FROM analyses_pcr 
            WHERE EXTRACT(YEAR FROM created_at) = $1::integer
        `;
        
        const pcrResult = await client.query(pcrArchiveQuery, [year, archiveRunId]);
        const pcrCount = pcrResult.rowCount;
        log(`✅ ${pcrCount} enregistrements d'analyses PCR archivés`);
        
        // 5. Archiver les analyses bioessai
        log(`🧪 Archivage des analyses bioessai...`);
        const bioessaiArchiveQuery = `
            INSERT INTO analyses_bioessai_archive (
                id, infos_communes_id, insecticide_types, mortality_percentage,
                survival_percentage, created_at, updated_at, archived_year, archive_run_id
            )
            SELECT 
                id, infos_communes_id, insecticide_types, mortality_percentage,
                survival_percentage, created_at, updated_at, $1, $2
            FROM analyses_bioessai 
            WHERE EXTRACT(YEAR FROM created_at) = $1::integer
        `;
        
        const bioessaiResult = await client.query(bioessaiArchiveQuery, [year, archiveRunId]);
        const bioessaiCount = bioessaiResult.rowCount;
        log(`✅ ${bioessaiCount} enregistrements d'analyses bioessai archivés`);
        
        // 6. Archiver les analyses de repas sanguin
        log(`🩸 Archivage des analyses de repas sanguin...`);
        const repasSanguinArchiveQuery = `
            INSERT INTO analyses_repas_sanguin_archive (
                id, infos_communes_id, blood_meal_origins,
                created_at, updated_at, archived_year, archive_run_id
            )
            SELECT 
                id, infos_communes_id, blood_meal_origins,
                created_at, updated_at, $1, $2
            FROM analyses_repas_sanguin 
            WHERE EXTRACT(YEAR FROM created_at) = $1::integer
        `;
        
        const repasSanguinResult = await client.query(repasSanguinArchiveQuery, [year, archiveRunId]);
        const repasSanguinCount = repasSanguinResult.rowCount;
        log(`✅ ${repasSanguinCount} enregistrements d'analyses de repas sanguin archivés`);
        
        // 7. Archiver les informations communales
        log(`🏘️ Archivage des informations communales...`);
        const infosCommunesArchiveQuery = `
            INSERT INTO infos_communes_archive (
                id, analysis_type, sample_stage, genus, species, sector,
                sample_count, collection_date, analysis_date, complementary_info,
                created_at, updated_at, archived_year, archive_run_id
            )
            SELECT 
                id, analysis_type, sample_stage, genus, species, sector,
                sample_count, collection_date, analysis_date, complementary_info,
                created_at, updated_at, $1, $2
            FROM infos_communes
            WHERE EXTRACT(YEAR FROM created_at) = $1::integer
        `;
        
        const infosCommunesResult = await client.query(infosCommunesArchiveQuery, [year, archiveRunId]);
        const infosCommunesCount = infosCommunesResult.rowCount;
        log(`✅ ${infosCommunesCount} enregistrements d'informations communales archivés`);
        
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
        
        log(`🎉 Archivage de l'année ${year} terminé avec succès en ${durationSeconds} secondes`);
        log(`📊 Résumé: ${eggsCount} œufs, ${breedingSitesCount} gîtes, ${mosquitoesCount} moustiques, ${pcrCount} PCR, ${bioessaiCount} bioessai, ${repasSanguinCount} repas sanguin, ${infosCommunesCount} communes`);
        
        return {
            success: true,
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
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// =====================================================
// FONCTION DE SUPPRESSION DES DONNÉES ORIGINALES
// =====================================================

async function cleanupOriginalData(year) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log(`🗑️ Suppression des données originales de l'année ${year}`);
        
        // Supprimer les données originales (seulement les données approuvées)
            const deleteQueries = [
                { table: 'eggs_collection_new', dateColumn: 'eggs_visit_start_date' },
                { table: 'breeding_sites_new', dateColumn: 'site_visit_start_date' },
                { table: 'adult_mosquitoes_new', dateColumn: 'mosquitoes_visit_start_date' },
                { table: 'analyses_pcr', dateColumn: 'created_at' },
                { table: 'analyses_bioessai', dateColumn: 'created_at' },
                { table: 'analyses_repas_sanguin', dateColumn: 'created_at' }
            ];
        
        const deletionResults = {};
        
        for (const queryInfo of deleteQueries) {
            const deleteQuery = `
                DELETE FROM ${queryInfo.table} 
                WHERE EXTRACT(YEAR FROM ${queryInfo.dateColumn}) = $1::integer
                ${queryInfo.table.includes('_new') ? "AND status = 'approved'" : ''}
            `;
            
            const result = await client.query(deleteQuery, [year]);
            deletionResults[queryInfo.table] = result.rowCount;
            log(`🗑️ Supprimé ${result.rowCount} enregistrements de ${queryInfo.table}`);
        }
        
        await client.query('COMMIT');
        
        log(`✅ Suppression des données originales de l'année ${year} terminée`);
        
        return {
            success: true,
            year,
            deletedRecords: deletionResults
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// =====================================================
// FONCTION PRINCIPALE
// =====================================================

async function main() {
    try {
        log('🚀 Démarrage du script d\'archivage automatique');
        
        // Obtenir l'année à archiver (par défaut: année précédente)
        const yearToArchive = process.argv[2] ? parseInt(process.argv[2]) : getPreviousYear();
        
        if (isNaN(yearToArchive) || yearToArchive < 2020 || yearToArchive > getCurrentYear()) {
            throw new Error(`Année invalide: ${yearToArchive}. Doit être entre 2020 et ${getCurrentYear()}`);
        }
        
        log(`📅 Archivage de l'année: ${yearToArchive}`);
        
        // Vérifier si l'année a déjà été archivée
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM archive_runs 
            WHERE archive_year = $1::integer AND status = 'completed'
        `;
        
        const checkResult = await pool.query(checkQuery, [yearToArchive]);
        const alreadyArchived = checkResult.rows[0].count > 0;
        
        if (alreadyArchived) {
            log(`⚠️ L'année ${yearToArchive} a déjà été archivée`, 'warning');
            
            // Demander confirmation pour réarchiver
            if (process.argv.includes('--force')) {
                log(`🔄 Réarchivage forcé de l'année ${yearToArchive}`);
            } else {
                log(`ℹ️ Utilisez --force pour forcer le réarchivage`);
                process.exit(0);
            }
        }
        
        // Effectuer l'archivage
        const archiveResult = await archiveYear(yearToArchive);
        
        // Optionnel: supprimer les données originales après archivage
        if (process.argv.includes('--cleanup')) {
            log(`🧹 Suppression des données originales après archivage`);
            const cleanupResult = await cleanupOriginalData(yearToArchive);
            log(`✅ Nettoyage terminé: ${JSON.stringify(cleanupResult.deletedRecords)}`);
        } else {
            log(`ℹ️ Les données originales sont conservées. Utilisez --cleanup pour les supprimer`);
        }
        
        log(`🎉 Script d'archivage terminé avec succès`);
        
        // Écrire un rapport
        const reportPath = path.join(__dirname, 'archive-reports', `archive-report-${yearToArchive}-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const report = {
            timestamp: new Date().toISOString(),
            year: yearToArchive,
            archiveResult,
            cleanupPerformed: process.argv.includes('--cleanup')
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log(`📄 Rapport sauvegardé: ${reportPath}`);
        
    } catch (error) {
        log(`❌ Erreur lors de l'archivage: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// =====================================================
// GESTION DES SIGNALS ET EXCEPTIONS
// =====================================================

process.on('SIGINT', async () => {
    log('🛑 Arrêt du script d\'archivage demandé', 'warning');
    await pool.end();
    process.exit(0);
});

process.on('uncaughtException', async (error) => {
    log(`❌ Exception non gérée: ${error.message}`, 'error');
    console.error(error);
    await pool.end();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    log(`❌ Promesse rejetée non gérée: ${reason}`, 'error');
    console.error(reason);
    await pool.end();
    process.exit(1);
});

// =====================================================
// AIDE ET USAGE
// =====================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
📚 Script d'Archivage Automatique - Centre MURAZ

USAGE:
  node archive-yearly.js [ANNÉE] [OPTIONS]

ARGUMENTS:
  ANNÉE              Année à archiver (défaut: année précédente)

OPTIONS:
  --force           Forcer l'archivage même si déjà fait
  --cleanup         Supprimer les données originales après archivage
  --help, -h        Afficher cette aide

EXEMPLES:
  node archive-yearly.js                    # Archiver l'année précédente
  node archive-yearly.js 2023               # Archiver l'année 2023
  node archive-yearly.js 2023 --cleanup    # Archiver et supprimer les données originales
  node archive-yearly.js 2023 --force       # Forcer le réarchivage

CRON JOB (à exécuter le 1er janvier):
  0 0 1 1 * /usr/bin/node /path/to/archive-yearly.js --cleanup

📊 Le script archive:
  - Données de collecte (œufs, gîtes, moustiques)
  - Analyses (PCR, bioessai, repas sanguin)
  - Informations communales
  - Génère un rapport JSON

🔒 Sécurité:
  - Seules les données approuvées sont archivées
  - Les données originales sont conservées sauf avec --cleanup
  - Transaction atomique (tout ou rien)
    `);
    process.exit(0);
}

// Démarrer le script
main();
