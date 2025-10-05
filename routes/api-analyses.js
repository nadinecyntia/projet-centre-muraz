// =====================================================
// API ENDPOINTS POUR LES ANALYSES - NOUVELLES TABLES
// Centre MURAZ - Endpoints adaptés aux nouvelles tables
// =====================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireViewer } = require('../middleware/auth');

// Appliquer l'authentification pour toutes les routes d'analyses
router.use(requireViewer);

// ===== ENDPOINT PRINCIPAL DES ANALYSES =====
router.get('/analyses', async (req, res) => {
    try {
        console.log('🔍 API Analyses /analyses appelée');
        
        // Support du paramètre year pour l'archivage
        const { year } = req.query;
        const isArchiveQuery = year && year !== 'current';
        
        console.log(`📅 Mode: ${isArchiveQuery ? `Archive ${year}` : 'Données actuelles'}`);
        
        const client = await pool.connect();
        
        try {
            // Requête unifiée pour toutes les données validées
            const query = `
                WITH all_data AS (
                    -- Données d'œufs validées
                    SELECT
                        'eggs' as data_type,
                        eggs_concession_code as investigator_name, -- Correction: utiliser eggs_concession_code
                        eggs_concession_code as concession_code,
                        NULL as house_code, -- Champ supprimé
                        eggs_visit_start_date as visit_date,
                        eggs_sector as sector,
                        eggs_environment as environment,
                        eggs_gps_code as gps_code,
                        eggs_count as count_value,
                        observations,
                        batch_id,
                        created_at as submitted_at,
                        validated_at
                    FROM eggs_collection_new
                    WHERE status = 'approved'
                    
                    UNION ALL
                    
                    -- Données de gîtes validées
                    SELECT
                        'breeding' as data_type,
                        site_investigator_name as investigator_name,
                        site_concession_code as concession_code,
                        site_house_code as house_code,
                        site_visit_start_date as visit_date,
                        site_sector as sector,
                        site_environment as environment,
                        site_gps_code as gps_code,
                        larvae_count as count_value,
                        observations,
                        batch_id,
                        created_at as submitted_at,
                        validated_at
                    FROM breeding_sites_new
                    WHERE status = 'approved'
                    
                    UNION ALL
                    
                    -- Données de moustiques validées
                    SELECT
                        'mosquitoes' as data_type,
                        mosquitoes_concession_code as investigator_name, -- Correction: utiliser mosquitoes_concession_code
                        mosquitoes_concession_code as concession_code,
                        NULL as house_code, -- Champ supprimé
                        mosquitoes_visit_start_date as visit_date,
                        mosquitoes_sector as sector,
                        mosquitoes_environment as environment,
                        mosquitoes_gps_code as gps_code,
                        total_mosquitoes_count as count_value,
                        observations,
                        batch_id,
                        created_at as submitted_at,
                        validated_at
                    FROM adult_mosquitoes_new
                    WHERE status = 'approved'
                )
                SELECT * FROM all_data
                ORDER BY visit_date DESC, submitted_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements d'analyses récupérés`);
            
            // ===== Agrégation pour les graphiques (structure utilisée par la page Analyses) =====
            const secteursQuery = `
                SELECT DISTINCT sector FROM (
                    SELECT eggs_sector AS sector FROM eggs_collection_new WHERE status='approved'
                    UNION
                    SELECT site_sector AS sector FROM breeding_sites_new WHERE status='approved'
                    UNION
                    SELECT mosquitoes_sector AS sector FROM adult_mosquitoes_new WHERE status='approved'
                ) t
                WHERE sector IS NOT NULL AND sector <> ''
                ORDER BY sector;
            `;
            const secteursRes = await client.query(secteursQuery);
            const secteurs = secteursRes.rows.map(r => r.sector);

            const adultesQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', am.mosquitoes_visit_start_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', am.mosquitoes_visit_start_date), 'YYYY') AS periode_label,
                    am.mosquitoes_sector AS sector,
                    SUM(am.total_mosquitoes_count) AS total
                FROM adult_mosquitoes_new am
                WHERE am.status='approved' AND am.mosquitoes_sector IS NOT NULL AND am.mosquitoes_sector <> ''
                GROUP BY 1,2
                ORDER BY 1 ASC;
            `;
            const adultesRes = await client.query(adultesQuery);
            const chartDataAdultes = {};
            for (const row of adultesRes.rows) {
                const periode = row.periode_label;
                const sector = row.sector;
                const total = Number(row.total) || 0;
                if (!chartDataAdultes[periode]) chartDataAdultes[periode] = {};
                chartDataAdultes[periode][sector] = (chartDataAdultes[periode][sector] || 0) + total;
            }

            const genresQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', am.mosquitoes_visit_start_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', am.mosquitoes_visit_start_date), 'YYYY') AS periode_label,
                    CASE 
                        WHEN array_length(am.genus,1) >= 1 THEN am.genus[1]
                        ELSE 'other'
                    END AS genre,
                    SUM(am.total_mosquitoes_count) AS total
                FROM adult_mosquitoes_new am
                WHERE am.status='approved'
                GROUP BY 1,2
                ORDER BY 1 ASC;
            `;
            const genresRes = await client.query(genresQuery);
            const chartDataAdultesParGenre = {};
            for (const row of genresRes.rows) {
                const periode = row.periode_label;
                const genre = row.genre || 'other';
                const total = Number(row.total) || 0;
                if (!chartDataAdultesParGenre[periode]) chartDataAdultesParGenre[periode] = {};
                chartDataAdultesParGenre[periode][genre] = (chartDataAdultesParGenre[periode][genre] || 0) + total;
            }

            const larvesQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', bs.site_visit_start_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', bs.site_visit_start_date), 'YYYY') AS periode_label,
                    bs.site_sector AS sector,
                    SUM(bs.larvae_count) AS total
                FROM breeding_sites_new bs
                WHERE bs.status='approved' AND bs.site_sector IS NOT NULL AND bs.site_sector <> ''
                GROUP BY 1,2
                ORDER BY 1 ASC;
            `;
            const larvesRes = await client.query(larvesQuery);
            const chartDataLarves = {};
            for (const row of larvesRes.rows) {
                const periode = row.periode_label;
                const sector = row.sector;
                const total = Number(row.total) || 0;
                if (!chartDataLarves[periode]) chartDataLarves[periode] = {};
                chartDataLarves[periode][sector] = (chartDataLarves[periode][sector] || 0) + total;
            }

            const chartData = {
                adultes: chartDataAdultes,
                adultesParGenre: chartDataAdultesParGenre,
                larves: chartDataLarves
            };

            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                secteurs,
                chartData,
                message: 'Données d\'analyses récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données d\'analyses',
            error: error.message
        });
    }
});

// ===== ENDPOINT ANALYSES D'ŒUFS =====
router.get('/analyses/oeufs', async (req, res) => {
    try {
        console.log('🥚 API Analyses Œufs appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    NULL as investigator_name, -- Champ supprimé
                    eggs_concession_code as concession_code,
                    NULL as house_code, -- Champ supprimé
                    eggs_visit_start_date as visit_date,
                    eggs_sector as sector,
                    eggs_environment as environment,
                    eggs_gps_code as gps_code,
                    eggs_count,
                    NULL as eggs_household_size, -- Champ supprimé
                    NULL as eggs_sleeping_unit_count, -- Champ supprimé
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM eggs_collection_new
                WHERE status = 'approved'
                ORDER BY eggs_visit_start_date DESC, created_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements d'œufs récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Données d\'œufs récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses Œufs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données d\'œufs',
            error: error.message
        });
    }
});

// Alias avec support d'année: /analyses/eggs
router.get('/analyses/eggs', async (req, res) => {
    try {
        console.log('🥚 API Analyses Eggs (alias) appelée');
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'eggs_collection_archive' : 'eggs_collection_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    eggs_concession_code as concession_code,
                    eggs_visit_start_date as visit_date,
                    eggs_sector as sector,
                    eggs_environment as environment,
                    eggs_count,
                    observations,
                    created_at as submitted_at
                FROM ${table}
                WHERE status = 'approved' ${yearClause}
                ORDER BY eggs_visit_start_date DESC, created_at DESC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur API Analyses Eggs alias:', error);
        res.status(500).json({ success: false, message: 'Erreur chargement œufs', error: error.message });
    }
});

// (Endpoint legacy /analyses/oeufs-mois supprimé: non utilisé et incohérent avec le schéma)

// ===== ENDPOINT ANALYSES DE GÎTES =====
router.get('/analyses/gites', async (req, res) => {
    try {
        console.log('🌱 API Analyses Gîtes appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    site_investigator_name as investigator_name,
                    site_concession_code as concession_code,
                    site_house_code as house_code,
                    site_visit_start_date as visit_date,
                    site_sector as sector,
                    site_environment as environment,
                    site_gps_code as gps_code,
                    site_classes,
                    total_sites_count,
                    positive_sites_count,
                    negative_sites_count,
                    larvae_count,
                    larvae_genus,
                    aedes_larvae_count,
                    culex_larvae_count,
                    anopheles_larvae_count,
                    other_larvae_count,
                    nymphs_count,
                    nymphs_genus,
                    sites_types,
                    site_classes,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM breeding_sites_new
                WHERE status = 'approved'
                ORDER BY site_visit_start_date DESC, created_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements de gîtes récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Données de gîtes récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses Gîtes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données de gîtes',
            error: error.message
        });
    }
});

// Alias avec support d'année: /analyses/breeding
router.get('/analyses/breeding', async (req, res) => {
    try {
        console.log('🌱 API Analyses Breeding (alias) appelée');
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'breeding_sites_archive' : 'breeding_sites_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    site_investigator_name as investigator_name,
                    site_concession_code as concession_code,
                    site_house_code as house_code,
                    site_visit_start_date as visit_date,
                    site_sector as sector,
                    site_environment as environment,
                    site_gps_code as gps_code,
                    site_classes,
                    total_sites_count,
                    positive_sites_count,
                    negative_sites_count,
                    larvae_count,
                    nymphs_count,
                    observations,
                    created_at as submitted_at
                FROM ${table}
                WHERE status = 'approved' ${yearClause}
                ORDER BY site_visit_start_date DESC, created_at DESC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur API Analyses Breeding alias:', error);
        res.status(500).json({ success: false, message: 'Erreur chargement gîtes', error: error.message });
    }
});

// ===== ENDPOINT ANALYSES DE MOUSTIQUES =====
router.get('/analyses/moustiques', async (req, res) => {
    try {
        console.log('🦟 API Analyses Moustiques appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    NULL as investigator_name, -- Champ supprimé
                    mosquitoes_concession_code as concession_code,
                    NULL as house_code, -- Champ supprimé
                    mosquitoes_visit_start_date as visit_date,
                    mosquitoes_sector as sector,
                    mosquitoes_environment as environment,
                    mosquitoes_gps_code as gps_code,
                    genus,
                    species,
                    collection_methods,
                    prokopack_traps_count,
                    bg_traps_count,
                    capture_locations,
                    prokopack_mosquitoes_count,
                    bg_trap_mosquitoes_count,
                    total_mosquitoes_count,
                    male_count,
                    aedes_male_count,
                    culex_male_count,
                    anopheles_male_count,
                    other_male_count,
                    female_count,
                    blood_fed_females_count,
                    gravid_females_count,
                    starved_females_count,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM adult_mosquitoes_new
                WHERE status = 'approved'
                ORDER BY mosquitoes_visit_start_date DESC, created_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements de moustiques récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Données de moustiques récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses Moustiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données de moustiques',
            error: error.message
        });
    }
});

// ===== ENDPOINT STATISTIQUES GÉNÉRALES =====
router.get('/analyses/statistiques', async (req, res) => {
    try {
        console.log('📊 API Statistiques Analyses appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                WITH stats AS (
                    SELECT
                        'eggs' as data_type,
                        COUNT(*) as total_records,
                        SUM(eggs_count) as total_count,
                        AVG(eggs_count) as avg_count,
                        0 as investigators_count, -- Champ supprimé
                        COUNT(DISTINCT eggs_concession_code) as concessions_count
                    FROM eggs_collection_new
                    WHERE status = 'approved'
                    
                    UNION ALL
                    
                    SELECT
                        'breeding' as data_type,
                        COUNT(*) as total_records,
                        SUM(larvae_count) as total_count,
                        AVG(larvae_count) as avg_count,
                        COUNT(DISTINCT site_investigator_name) as investigators_count,
                        COUNT(DISTINCT site_concession_code) as concessions_count
                    FROM breeding_sites_new
                    WHERE status = 'approved'
                    
                    UNION ALL
                    
                    SELECT
                        'mosquitoes' as data_type,
                        COUNT(*) as total_records,
                        SUM(total_mosquitoes_count) as total_count,
                        AVG(total_mosquitoes_count) as avg_count,
                        0 as investigators_count, -- Champ supprimé
                        COUNT(DISTINCT mosquitoes_concession_code) as concessions_count
                    FROM adult_mosquitoes_new
                    WHERE status = 'approved'
                )
                SELECT * FROM stats
                ORDER BY data_type;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} statistiques récupérées`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Statistiques d\'analyses récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

// ===== ENDPOINT ANALYSES DE LARVES =====
router.get('/analyses/larvae', async (req, res) => {
    try {
        console.log('🐛 API Analyses Larves appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    site_investigator_name as investigator_name,
                    site_concession_code as concession_code,
                    site_house_code as house_code,
                    site_visit_start_date as visit_date,
                    site_sector as sector,
                    site_environment as environment,
                    site_gps_code as gps_code,
                    larvae_count,
                    larvae_genus,
                    aedes_larvae_count,
                    culex_larvae_count,
                    anopheles_larvae_count,
                    other_larvae_count,
                    nymphs_count,
                    nymphs_genus,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM breeding_sites_new
                WHERE status = 'approved'
                ORDER BY site_visit_start_date DESC, created_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements de larves récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Données de larves récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses Larves:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données de larves',
            error: error.message
        });
    }
});

// ===== ENDPOINT ANALYSES DE MOUSTIQUES ADULTES =====
router.get('/analyses/adults', async (req, res) => {
    try {
        console.log('🦟 API Analyses Moustiques Adultes appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    NULL as investigator_name, -- Champ supprimé
                    mosquitoes_concession_code as concession_code,
                    NULL as house_code, -- Champ supprimé
                    mosquitoes_visit_start_date as visit_date,
                    mosquitoes_sector as sector,
                    mosquitoes_environment as environment,
                    mosquitoes_gps_code as gps_code,
                    genus,
                    species,
                    collection_methods,
                    prokopack_traps_count,
                    bg_traps_count,
                    capture_locations,
                    prokopack_mosquitoes_count,
                    bg_trap_mosquitoes_count,
                    total_mosquitoes_count,
                    male_count,
                    aedes_male_count,
                    culex_male_count,
                    anopheles_male_count,
                    other_male_count,
                    female_count,
                    blood_fed_females_count,
                    gravid_females_count,
                    starved_females_count,
                    mosquitoes_aedes_count,
                    mosquitoes_culex_count,
                    mosquitoes_anopheles_count,
                    mosquitoes_other_count,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    validated_at
                FROM adult_mosquitoes_new
                WHERE status = 'approved'
                ORDER BY mosquitoes_visit_start_date DESC, created_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements de moustiques adultes récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Données de moustiques adultes récupérées avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Analyses Moustiques Adultes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données de moustiques adultes',
            error: error.message
        });
    }
});

// Alias avec support d'année: /analyses/mosquitoes
router.get('/analyses/mosquitoes', async (req, res) => {
    try {
        console.log('🦟 API Analyses Mosquitoes (alias) appelée');
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'adult_mosquitoes_archive' : 'adult_mosquitoes_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    mosquitoes_concession_code as concession_code,
                    mosquitoes_visit_start_date as visit_date,
                    mosquitoes_sector as sector,
                    mosquitoes_environment as environment,
                    collection_methods,
                    capture_locations,
                    total_mosquitoes_count,
                    male_count,
                    female_count,
                    prokopack_mosquitoes_count,
                    bg_trap_mosquitoes_count,
                    mosquitoes_aedes_count,
                    mosquitoes_culex_count,
                    mosquitoes_anopheles_count,
                    mosquitoes_other_count,
                    observations,
                    created_at as submitted_at
                FROM ${table}
                WHERE status = 'approved' ${yearClause}
                ORDER BY mosquitoes_visit_start_date DESC, created_at DESC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur API Analyses Mosquitoes alias:', error);
        res.status(500).json({ success: false, message: 'Erreur chargement moustiques', error: error.message });
    }
});

module.exports = router;

// =====================================================
// ENDPOINTS D'AGRÉGATION (PERF)
// =====================================================

// Agrégats Œufs par mois (+ secteur et milieu)
router.get('/analyses/eggs-aggregates', async (req, res) => {
    try {
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'eggs_collection_archive' : 'eggs_collection_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', eggs_visit_start_date), 'YYYY-MM') AS period,
                        eggs_sector AS sector,
                        eggs_environment AS environment,
                        eggs_count::int AS eggs_count
                    FROM ${table}
                    WHERE status='approved' ${yearClause}
                )
                SELECT 
                    period,
                    COALESCE(sector, '') AS sector,
                    COALESCE(environment, '') AS environment,
                    SUM(eggs_count) AS total_eggs
                FROM base
                GROUP BY period, sector, environment
                ORDER BY period ASC, sector ASC, environment ASC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur eggs-aggregates:', error);
        res.status(500).json({ success: false, message: 'Erreur agrégation œufs', error: error.message });
    }
});

// Agrégats Gîtes par mois (+ secteur et milieu)
router.get('/analyses/breeding-aggregates', async (req, res) => {
    try {
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'breeding_sites_archive' : 'breeding_sites_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', site_visit_start_date), 'YYYY-MM') AS period,
                        site_sector AS sector,
                        site_environment AS environment,
                        total_sites_count::int AS total_sites_count,
                        larvae_count::int AS larvae_count,
                        nymphs_count::int AS nymphs_count
                    FROM ${table}
                    WHERE status='approved' ${yearClause}
                )
                SELECT 
                    period,
                    COALESCE(sector, '') AS sector,
                    COALESCE(environment, '') AS environment,
                    SUM(total_sites_count) AS total_sites,
                    SUM(larvae_count) AS total_larvae,
                    SUM(nymphs_count) AS total_nymphs
                FROM base
                GROUP BY period, sector, environment
                ORDER BY period ASC, sector ASC, environment ASC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur breeding-aggregates:', error);
        res.status(500).json({ success: false, message: 'Erreur agrégation gîtes', error: error.message });
    }
});

// Agrégats Moustiques par mois (+ secteur, milieu, méthodes/lieux)
router.get('/analyses/mosquitoes-aggregates', async (req, res) => {
    try {
        const { year } = req.query;
        const isArchive = year && year !== 'current';
        const table = isArchive ? 'adult_mosquitoes_archive' : 'adult_mosquitoes_new';
        const yearClause = isArchive ? 'AND archived_year = $1' : '';
        const params = isArchive ? [parseInt(year)] : [];
        const client = await pool.connect();
        try {
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', mosquitoes_visit_start_date), 'YYYY-MM') AS period,
                        mosquitoes_sector AS sector,
                        mosquitoes_environment AS environment,
                        collection_methods,
                        capture_locations,
                        total_mosquitoes_count::int AS total_mosquitoes_count,
                        mosquitoes_aedes_count::int AS aedes_count,
                        mosquitoes_culex_count::int AS culex_count,
                        mosquitoes_anopheles_count::int AS anopheles_count,
                        mosquitoes_other_count::int AS other_count
                    FROM ${table}
                    WHERE status='approved' ${yearClause}
                )
                SELECT 
                    period,
                    COALESCE(sector, '') AS sector,
                    COALESCE(environment, '') AS environment,
                    COALESCE(collection_methods, '') AS collection_methods,
                    COALESCE(capture_locations, '') AS capture_locations,
                    SUM(total_mosquitoes_count) AS total_mosquitoes,
                    SUM(aedes_count) AS total_aedes,
                    SUM(culex_count) AS total_culex,
                    SUM(anopheles_count) AS total_anopheles,
                    SUM(other_count) AS total_other
                FROM base
                GROUP BY period, sector, environment, collection_methods, capture_locations
                ORDER BY period ASC, sector ASC, environment ASC;
            `;
            const result = await client.query(query, params);
            res.json({ success: true, mode: isArchive ? 'archive' : 'current', year: isArchive ? parseInt(year) : null, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur mosquitoes-aggregates:', error);
        res.status(500).json({ success: false, message: 'Erreur agrégation moustiques', error: error.message });
    }
});
