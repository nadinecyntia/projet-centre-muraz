// =====================================================
// API ENDPOINTS POUR LES ANALYSES - STRUCTURE NORMALISÉE
// Centre MURAZ - Endpoints adaptés à la structure normalisée
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
        console.log('🔍 API Analyses /analyses appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            // Requête unifiée pour toutes les données validées avec JOIN sur houses
            const query = `
                WITH all_data AS (
                    -- Données d'œufs validées
                    SELECT
                        'eggs' as data_type,
                        e.investigator_name,
                        h.concession_code,
                        e.visit_date,
                        h.sector,
                        h.environment,
                        h.gps_coordinates as gps_code,
                        e.eggs_count as count_value,
                        e.observations,
                        e.created_at as submitted_at,
                        e.validated_at
                    FROM eggs_collections e
                    JOIN houses h ON e.house_id = h.id
                    WHERE e.status = 'approved'
                    
                    UNION ALL
                    
                    -- Données de gîtes validées (agrégées par maison)
                    SELECT
                        'breeding' as data_type,
                        b.investigator_name,
                        h.concession_code,
                        b.visit_date,
                        h.sector,
                        h.environment,
                        h.gps_coordinates as gps_code,
                        SUM(b.larvae_count)::INTEGER as count_value,
                        STRING_AGG(DISTINCT b.observations, '; ') as observations,
                        MIN(b.created_at) as submitted_at,
                        MIN(b.validated_at) as validated_at
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.status = 'approved'
                    GROUP BY b.investigator_name, h.concession_code, b.visit_date, h.sector, h.environment, h.gps_coordinates
                    
                    UNION ALL
                    
                    -- Données de moustiques validées (agrégées par maison)
                    SELECT
                        'mosquitoes' as data_type,
                        m.investigator_name,
                        h.concession_code,
                        m.visit_date,
                        h.sector,
                        h.environment,
                        h.gps_coordinates as gps_code,
                        m.total_mosquitoes_count as count_value,
                        m.observations,
                        m.created_at as submitted_at,
                        m.validated_at
                    FROM adult_mosquitoes_collections m
                    JOIN houses h ON m.house_id = h.id
                    WHERE m.status = 'approved'
                )
                SELECT * FROM all_data
                ORDER BY visit_date DESC, submitted_at DESC;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} enregistrements d'analyses récupérés`);
            
            // ===== Agrégation pour les graphiques =====
            const secteursQuery = `
                SELECT DISTINCT sector FROM houses
                WHERE sector IS NOT NULL AND sector <> ''
                ORDER BY sector;
            `;
            const secteursRes = await client.query(secteursQuery);
            const secteurs = secteursRes.rows.map(r => r.sector);

            // Graphique moustiques adultes par secteur et période
            const adultesQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', m.visit_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', m.visit_date), 'YYYY') AS periode_label,
                    h.sector AS sector,
                    SUM(m.total_mosquitoes_count) AS total
                FROM adult_mosquitoes_collections m
                JOIN houses h ON m.house_id = h.id
                WHERE m.status='approved' AND h.sector IS NOT NULL AND h.sector <> ''
                GROUP BY 1,2
                ORDER BY date_trunc('month', m.visit_date) ASC;
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

            // Graphique moustiques adultes par genre
            const genresQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', m.visit_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', m.visit_date), 'YYYY') AS periode_label,
                    COALESCE(
                        GREATEST(m.mosquitoes_aedes_count, m.mosquitoes_culex_count, m.mosquitoes_anopheles_count, m.mosquitoes_other_count),
                        'other'
                    ) AS genre,
                    SUM(m.total_mosquitoes_count) AS total
                FROM adult_mosquitoes_collections m
                WHERE m.status='approved'
                GROUP BY 1,2
                ORDER BY date_trunc('month', m.visit_date) ASC;
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

            // Graphique larves par secteur et période
            const larvesQuery = `
                SELECT 
                    trim(both ' ' FROM initcap(to_char(date_trunc('month', b.visit_date), 'TMMonth'))) || ' ' || to_char(date_trunc('month', b.visit_date), 'YYYY') AS periode_label,
                    h.sector AS sector,
                    SUM(b.larvae_count) AS total
                FROM breeding_sites b
                JOIN houses h ON b.house_id = h.id
                WHERE b.status='approved' AND h.sector IS NOT NULL AND h.sector <> ''
                GROUP BY 1,2
                ORDER BY date_trunc('month', m.visit_date) ASC;
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
                message: 'Données d\'analyses récupérées avec succès (structure normalisée)'
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
        console.log('🥚 API Analyses Œufs appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    e.investigator_name,
                    h.concession_code,
                    h.house_code,
                    e.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    e.nest_number,
                    e.nest_code,
                    e.pass_order,
                    e.eggs_count,
                    h.household_size,
                    e.observations,
                    e.created_at as submitted_at,
                    e.validated_at
                FROM eggs_collections e
                JOIN houses h ON e.house_id = h.id
                WHERE e.status = 'approved'
                ORDER BY e.visit_date DESC, e.created_at DESC;
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

// Alias: /analyses/eggs
router.get('/analyses/eggs', async (req, res) => {
    try {
        console.log('🥚 API Analyses Eggs (alias, NORMALIZED)');
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    h.concession_code,
                    e.visit_date,
                    h.sector,
                    h.environment,
                    e.eggs_count,
                    e.observations,
                    e.created_at as submitted_at
                FROM eggs_collections e
                JOIN houses h ON e.house_id = h.id
                WHERE e.status = 'approved'
                ORDER BY e.visit_date DESC, e.created_at DESC;
            `;
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur API Analyses Eggs alias:', error);
        res.status(500).json({ success: false, message: 'Erreur chargement œufs', error: error.message });
    }
});

// ===== ENDPOINT ANALYSES DE GÎTES =====
router.get('/analyses/gites', async (req, res) => {
    try {
        console.log('🌱 API Analyses Gîtes appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    b.investigator_name,
                    h.concession_code,
                    h.house_code,
                    b.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    b.site_state,
                    b.aedes_larvae_count,
                    b.culex_larvae_count,
                    b.anopheles_larvae_count,
                    b.other_larvae_count,
                    b.larvae_count,
                    b.aedes_nymphs_count,
                    b.culex_nymphs_count,
                    b.anopheles_nymphs_count,
                    b.other_nymphs_count,
                    b.nymphs_count,
                    b.observations,
                    b.created_at as submitted_at,
                    b.validated_at
                FROM breeding_sites b
                JOIN houses h ON b.house_id = h.id
                WHERE b.status = 'approved'
                ORDER BY b.visit_date DESC, b.created_at DESC;
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

// Alias: /analyses/breeding
router.get('/analyses/breeding', async (req, res) => {
    try {
        console.log('🌱 API Analyses Breeding (alias, NORMALIZED)');
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    b.investigator_name,
                    h.concession_code,
                    h.house_code,
                    b.visit_date,
                    h.sector,
                    h.environment,
                    b.site_state,
                    b.larvae_count,
                    b.nymphs_count,
                    b.observations,
                    b.created_at as submitted_at
                FROM breeding_sites b
                JOIN houses h ON b.house_id = h.id
                WHERE b.status = 'approved'
                ORDER BY b.visit_date DESC, b.created_at DESC;
            `;
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
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
        console.log('🦟 API Analyses Moustiques appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    m.investigator_name,
                    h.concession_code,
                    h.house_code,
                    m.visit_date,
                    m.visit_start_time,
                    m.visit_end_time,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    m.collection_methods,
                    m.prokopack_traps_count,
                    m.bg_traps_count,
                    m.capture_locations,
                    m.prokopack_mosquitoes_count,
                    m.bg_trap_mosquitoes_count,
                    m.total_mosquitoes_count,
                    m.male_count,
                    m.aedes_male_count,
                    m.culex_male_count,
                    m.anopheles_male_count,
                    m.other_male_count,
                    m.female_count,
                    m.blood_fed_females_count,
                    m.gravid_females_count,
                    m.starved_females_count,
                    m.mosquitoes_aedes_count,
                    m.mosquitoes_culex_count,
                    m.mosquitoes_anopheles_count,
                    m.mosquitoes_other_count,
                    m.observations,
                    m.created_at as submitted_at,
                    m.validated_at
                FROM adult_mosquitoes_collections m
                JOIN houses h ON m.house_id = h.id
                WHERE m.status = 'approved'
                ORDER BY m.visit_date DESC, m.created_at DESC;
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
        console.log('📊 API Statistiques Analyses appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                WITH stats AS (
                    SELECT
                        'eggs' as data_type,
                        COUNT(*) as total_records,
                        SUM(e.eggs_count) as total_count,
                        AVG(e.eggs_count) as avg_count,
                        COUNT(DISTINCT e.investigator_name) as investigators_count,
                        COUNT(DISTINCT h.concession_code) as concessions_count
                    FROM eggs_collections e
                    JOIN houses h ON e.house_id = h.id
                    WHERE e.status = 'approved'
                    
                    UNION ALL
                    
                    SELECT
                        'breeding' as data_type,
                        COUNT(*) as total_records,
                        SUM(b.larvae_count) as total_count,
                        AVG(b.larvae_count) as avg_count,
                        COUNT(DISTINCT b.investigator_name) as investigators_count,
                        COUNT(DISTINCT h.concession_code) as concessions_count
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.status = 'approved'
                    
                    UNION ALL
                    
                    SELECT
                        'mosquitoes' as data_type,
                        COUNT(*) as total_records,
                        SUM(m.total_mosquitoes_count) as total_count,
                        AVG(m.total_mosquitoes_count) as avg_count,
                        COUNT(DISTINCT m.investigator_name) as investigators_count,
                        COUNT(DISTINCT h.concession_code) as concessions_count
                    FROM adult_mosquitoes_collections m
                    JOIN houses h ON m.house_id = h.id
                    WHERE m.status = 'approved'
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
        console.log('🐛 API Analyses Larves appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    b.investigator_name,
                    h.concession_code,
                    h.house_code,
                    b.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    b.larvae_count,
                    b.aedes_larvae_count,
                    b.culex_larvae_count,
                    b.anopheles_larvae_count,
                    b.other_larvae_count,
                    b.nymphs_count,
                    b.aedes_nymphs_count,
                    b.culex_nymphs_count,
                    b.anopheles_nymphs_count,
                    b.other_nymphs_count,
                    b.observations,
                    b.created_at as submitted_at,
                    b.validated_at
                FROM breeding_sites b
                JOIN houses h ON b.house_id = h.id
                WHERE b.status = 'approved'
                ORDER BY b.visit_date DESC, b.created_at DESC;
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
        console.log('🦟 API Analyses Moustiques Adultes appelée (NORMALIZED)');
        
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT
                    m.investigator_name,
                    h.concession_code,
                    h.house_code,
                    m.visit_date,
                    m.visit_start_time,
                    m.visit_end_time,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    m.collection_methods,
                    m.prokopack_traps_count,
                    m.bg_traps_count,
                    m.capture_locations,
                    m.prokopack_mosquitoes_count,
                    m.bg_trap_mosquitoes_count,
                    m.total_mosquitoes_count,
                    m.male_count,
                    m.aedes_male_count,
                    m.culex_male_count,
                    m.anopheles_male_count,
                    m.other_male_count,
                    m.female_count,
                    m.blood_fed_females_count,
                    m.gravid_females_count,
                    m.starved_females_count,
                    m.mosquitoes_aedes_count,
                    m.mosquitoes_culex_count,
                    m.mosquitoes_anopheles_count,
                    m.mosquitoes_other_count,
                    m.observations,
                    m.created_at as submitted_at,
                    m.validated_at
                FROM adult_mosquitoes_collections m
                JOIN houses h ON m.house_id = h.id
                WHERE m.status = 'approved'
                ORDER BY m.visit_date DESC, m.created_at DESC;
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

// Alias: /analyses/mosquitoes
router.get('/analyses/mosquitoes', async (req, res) => {
    try {
        console.log('🦟 API Analyses Mosquitoes (alias, NORMALIZED)');
        const client = await pool.connect();
        try {
            const query = `
                SELECT
                    h.concession_code,
                    m.visit_date,
                    m.visit_start_time,
                    m.visit_end_time,
                    h.sector,
                    h.environment,
                    m.collection_methods,
                    m.capture_locations,
                    m.total_mosquitoes_count,
                    m.male_count,
                    m.female_count,
                    m.prokopack_mosquitoes_count,
                    m.bg_trap_mosquitoes_count,
                    m.mosquitoes_aedes_count,
                    m.mosquitoes_culex_count,
                    m.mosquitoes_anopheles_count,
                    m.mosquitoes_other_count,
                    m.observations,
                    m.created_at as submitted_at
                FROM adult_mosquitoes_collections m
                JOIN houses h ON m.house_id = h.id
                WHERE m.status = 'approved'
                ORDER BY m.visit_date DESC, m.created_at DESC;
            `;
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
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
        const client = await pool.connect();
        try {
            const year = req.query.year && req.query.year !== 'current' ? parseInt(req.query.year, 10) : null;
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', e.visit_date), 'YYYY-MM') AS period,
                        h.sector AS sector,
                        h.environment AS environment,
                        e.eggs_count::int AS eggs_count
                    FROM eggs_collections e
                    JOIN houses h ON e.house_id = h.id
                    WHERE e.status='approved' ${year ? `AND EXTRACT(YEAR FROM e.visit_date) = ${year}` : ''}
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
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
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
        const client = await pool.connect();
        try {
            const year = req.query.year && req.query.year !== 'current' ? parseInt(req.query.year, 10) : null;
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', b.visit_date), 'YYYY-MM') AS period,
                        h.sector AS sector,
                        h.environment AS environment,
                        COUNT(*) AS total_sites_count,
                        SUM(b.larvae_count)::int AS larvae_count,
                        SUM(b.nymphs_count)::int AS nymphs_count
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.status='approved' ${year ? `AND EXTRACT(YEAR FROM b.visit_date) = ${year}` : ''}
                    GROUP BY 1, 2, 3
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
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur breeding-aggregates:', error);
        res.status(500).json({ success: false, message: 'Erreur agrégation gîtes', error: error.message });
    }
});

// Nouvelle route: Agrégation par classes de gîtes et environnement
router.get('/analyses/breeding-by-class-environment', async (req, res) => {
    try {
        console.log('📊 API Analyses: Breeding by Class & Environment');
        const client = await pool.connect();
        try {
            const year = req.query.year && req.query.year !== 'current' ? parseInt(req.query.year, 10) : null;
            const query = `
                WITH unnested AS (
                    SELECT 
                        b.id,
                        h.environment,
                        unnest(b.site_classes) AS site_class,
                        b.larvae_count,
                        b.nymphs_count
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.status = 'approved' ${year ? `AND EXTRACT(YEAR FROM b.visit_date) = ${year}` : ''}
                        AND b.site_classes IS NOT NULL
                        AND array_length(b.site_classes, 1) > 0
                        AND h.environment IS NOT NULL
                )
                SELECT 
                    site_class,
                    environment,
                    COUNT(*) AS total_sites,
                    SUM(larvae_count)::int AS total_larvae,
                    SUM(nymphs_count)::int AS total_nymphs
                FROM unnested
                GROUP BY site_class, environment
                ORDER BY site_class, environment;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} groupes (classe x environnement) récupérés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur breeding-by-class-environment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur agrégation classes de gîtes par environnement', 
            error: error.message 
        });
    }
});

// Agrégats Moustiques par mois (+ secteur, milieu, méthodes/lieux)
router.get('/analyses/mosquitoes-aggregates', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const year = req.query.year && req.query.year !== 'current' ? parseInt(req.query.year, 10) : null;
            const query = `
                WITH base AS (
                    SELECT 
                        to_char(date_trunc('month', m.visit_date), 'YYYY-MM') AS period,
                        h.sector AS sector,
                        h.environment AS environment,
                        m.collection_methods,
                        m.capture_locations,
                        m.total_mosquitoes_count::int AS total_mosquitoes_count,
                        m.mosquitoes_aedes_count::int AS aedes_count,
                        m.mosquitoes_culex_count::int AS culex_count,
                        m.mosquitoes_anopheles_count::int AS anopheles_count,
                        m.mosquitoes_other_count::int AS other_count
                    FROM adult_mosquitoes_collections m
                    JOIN houses h ON m.house_id = h.id
                    WHERE m.status='approved' ${year ? `AND EXTRACT(YEAR FROM m.visit_date) = ${year}` : ''}
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
            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erreur mosquitoes-aggregates:', error);
        res.status(500).json({ success: false, message: 'Erreur agrégation moustiques', error: error.message });
    }
});

