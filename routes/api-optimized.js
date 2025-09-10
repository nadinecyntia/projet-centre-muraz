// =====================================================
// API OPTIMISÉE - PHASE 1
// Optimisation pour 1,000-5,000 visites
// =====================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Cache simple en mémoire pour les indices
const indicesCache = new Map();
const CACHE_TTL = 3600000; // 1 heure en millisecondes

// Route optimisée pour récupérer les indices entomologiques
router.get('/indices', async (req, res) => {
    try {
        console.log('🧮 Récupération des données pour calcul des indices entomologiques...');
        
        // PHASE 1 : OPTIMISATION - Pagination et filtres
        const { page = 1, limit = 50, start_date, end_date, sector } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Vérifier le cache
        const cacheKey = `indices:${page}:${limit}:${start_date}:${end_date}:${sector}`;
        const cachedData = indicesCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
            console.log('✅ Données récupérées depuis le cache');
            return res.json({
                success: true,
                message: 'Indices entomologiques récupérés depuis le cache',
                data: cachedData.data,
                cached: true
            });
        }
        
        const client = await pool.connect();
        
        // Construction des conditions WHERE
        let whereConditions = ['hv.visit_start_date IS NOT NULL'];
        let queryParams = [];
        let paramIndex = 1;
        
        if (start_date) {
            whereConditions.push(`hv.visit_start_date >= $${paramIndex++}`);
            queryParams.push(start_date);
        }
        
        if (end_date) {
            whereConditions.push(`hv.visit_start_date <= $${paramIndex++}`);
            queryParams.push(end_date);
        }
        
        if (sector) {
            whereConditions.push(`hv.sector = $${paramIndex++}`);
            queryParams.push(sector);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // REQUÊTE SQL OPTIMISÉE AVEC PAGINATION
        const query = `
            -- Données breeding_sites pour IB, IM, IR, ICN
            WITH breeding_data AS (
                SELECT 
                    DATE_TRUNC('month', hv.visit_start_date) as month,
                    hv.sector,
                    COUNT(bs.id) as total_breeding_visits,
                    COUNT(CASE WHEN bs.positive_sites > 0 THEN bs.id END) as positive_breeding_visits,
                    COALESCE(SUM(bs.total_sites), 0) as total_sites,
                    COALESCE(SUM(bs.positive_sites), 0) as positive_sites,
                    COALESCE(SUM(bs.nymphs_count), 0) as total_nymphs,
                    COUNT(CASE WHEN bs.nymphs_count > 0 THEN bs.id END) as visits_with_nymphs
                FROM household_visits hv
                INNER JOIN breeding_sites bs ON hv.id = bs.household_visit_id
                WHERE ${whereClause}
                GROUP BY DATE_TRUNC('month', hv.visit_start_date), hv.sector
            ),
            -- Données eggs_collection pour IPP
            eggs_data AS (
                SELECT 
                    DATE_TRUNC('month', hv.visit_start_date) as month,
                    hv.sector,
                    COUNT(ec.id) as total_eggs_visits,
                    COUNT(CASE WHEN ec.eggs_count > 0 THEN ec.id END) as visits_with_eggs,
                    COALESCE(SUM(ec.eggs_count), 0) as total_eggs
                FROM household_visits hv
                INNER JOIN eggs_collection ec ON hv.id = ec.household_visit_id
                WHERE ${whereClause}
                GROUP BY DATE_TRUNC('month', hv.visit_start_date), hv.sector
            ),
            -- Données adult_mosquitoes pour IAP
            adult_data AS (
                SELECT 
                    DATE_TRUNC('month', hv.visit_start_date) as month,
                    hv.sector,
                    COUNT(am.id) as total_adult_visits,
                    COALESCE(SUM(am.bg_traps_count), 0) as total_bg_traps,
                    COALESCE(SUM(am.bg_trap_mosquitoes_count), 0) as total_bg_mosquitoes,
                    COALESCE(SUM(am.prokopack_traps_count), 0) as total_prokopack_traps,
                    COALESCE(SUM(am.prokopack_mosquitoes_count), 0) as total_prokopack_mosquitoes
                FROM household_visits hv
                INNER JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
                WHERE ${whereClause}
                GROUP BY DATE_TRUNC('month', hv.visit_start_date), hv.sector
            ),
            -- Fusion des données
            monthly_data AS (
                SELECT 
                    COALESCE(bd.month, ed.month, ad.month) as month,
                    COALESCE(bd.sector, ed.sector, ad.sector) as sector,
                    bd.total_breeding_visits,
                    bd.positive_breeding_visits,
                    bd.total_sites,
                    bd.positive_sites,
                    bd.total_nymphs,
                    bd.visits_with_nymphs,
                    ed.total_eggs_visits,
                    ed.visits_with_eggs,
                    ed.total_eggs,
                    ad.total_adult_visits,
                    ad.total_bg_traps,
                    ad.total_bg_mosquitoes,
                    ad.total_prokopack_traps,
                    ad.total_prokopack_mosquitoes
                FROM breeding_data bd
                FULL OUTER JOIN eggs_data ed ON bd.month = ed.month AND bd.sector = ed.sector
                FULL OUTER JOIN adult_data ad ON COALESCE(bd.month, ed.month) = ad.month AND COALESCE(bd.sector, ed.sector) = ad.sector
            )
            SELECT 
                TO_CHAR(month, 'YYYY-MM') as periode,
                sector,
                total_breeding_visits,
                positive_breeding_visits,
                total_sites,
                positive_sites,
                total_nymphs,
                visits_with_nymphs,
                total_eggs_visits,
                visits_with_eggs,
                total_eggs,
                total_adult_visits,
                total_bg_traps,
                total_bg_mosquitoes,
                total_prokopack_traps,
                total_prokopack_mosquitoes,
                -- FORMULE 1: Indice de Breteau (IB) = (Sites positifs × 100) ÷ Maisons breeding_sites
                CASE 
                    WHEN total_breeding_visits > 0 THEN (ROUND((positive_sites * 100.0) / total_breeding_visits, 2))::numeric
                    ELSE 0 
                END as ib,
                -- FORMULE 2: Indice de Maison (IM) = (Maisons positives × 100) ÷ Maisons breeding_sites
                CASE 
                    WHEN total_breeding_visits > 0 THEN (ROUND((positive_breeding_visits * 100.0) / total_breeding_visits, 2))::numeric
                    ELSE 0 
                END as im,
                -- FORMULE 3: Indice de Récipient (IR) = (Sites positifs × 100) ÷ Total sites
                CASE 
                    WHEN total_sites > 0 THEN (ROUND((positive_sites * 100.0) / total_sites, 2))::numeric
                    ELSE 0 
                END as ir,
                -- FORMULE 4: Indice de Positivité Pondoire (IPP) = (Maisons avec œufs × 100) ÷ Maisons eggs_collection
                CASE 
                    WHEN total_eggs_visits > 0 THEN (ROUND((visits_with_eggs * 100.0) / total_eggs_visits, 2))::numeric
                    ELSE 0 
                END as ipp,
                -- FORMULE 5: Indice de Colonisation Nymphale (ICN) = (Maisons avec nymphes × 100) ÷ Maisons breeding_sites
                CASE 
                    WHEN total_breeding_visits > 0 THEN (ROUND((visits_with_nymphs * 100.0) / total_breeding_visits, 2))::numeric
                    ELSE 0 
                END as icn,
                -- FORMULE 6: Indice Adultes par Piège BG = Moustiques BG ÷ Pièges BG
                CASE 
                    WHEN total_bg_traps > 0 THEN (ROUND(total_bg_mosquitoes / total_bg_traps, 2))::numeric
                    ELSE 0 
                END as iap_bg,
                -- FORMULE 7: Indice Adultes par Piège Prokopack = Moustiques Prokopack ÷ Pièges Prokopack
                CASE 
                    WHEN total_prokopack_traps > 0 THEN (ROUND(total_prokopack_mosquitoes / total_prokopack_traps, 2))::numeric
                    ELSE 0 
                END as iap_prokopack
            FROM monthly_data
            ORDER BY month DESC, sector
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;
        
        const startTime = Date.now();
        const result = await client.query(query, queryParams);
        const queryTime = Date.now() - startTime;
        
        client.release();
        
        // Organiser les données pour l'interface
        const indicesData = organizeIndicesData(result.rows);
        
        // Ajouter les métriques de performance
        indicesData.performance = {
            queryTime: queryTime,
            totalRows: result.rows.length,
            page: parseInt(page),
            limit: parseInt(limit),
            offset: offset
        };
        
        // Mettre en cache
        indicesCache.set(cacheKey, {
            data: indicesData,
            timestamp: Date.now()
        });
        
        // Nettoyer le cache si nécessaire (garder seulement 100 entrées)
        if (indicesCache.size > 100) {
            const firstKey = indicesCache.keys().next().value;
            indicesCache.delete(firstKey);
        }
        
        console.log(`✅ Indices entomologiques calculés avec succès - ${result.rows.length} périodes (${queryTime}ms)`);
        
        res.json({
            success: true,
            message: 'Indices entomologiques calculés avec succès',
            data: indicesData,
            performance: {
                queryTime: queryTime,
                cached: false
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors du calcul des indices:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des indices',
            error: error.message
        });
    }
});

// Fonction pour organiser les données des indices
function organizeIndicesData(rows) {
    const organized = {
        periodes: [],
        secteurs: [],
        data: {},
        moyennes: {}
    };
    
    // Extraire les périodes et secteurs uniques
    rows.forEach(row => {
        if (!organized.periodes.includes(row.periode)) {
            organized.periodes.push(row.periode);
        }
        if (!organized.secteurs.includes(row.sector)) {
            organized.secteurs.push(row.sector);
        }
    });
    
    // Organiser par période et secteur
    rows.forEach(row => {
        if (!organized.data[row.periode]) {
            organized.data[row.periode] = {};
        }
        organized.data[row.periode][row.sector] = {
            ib: row.ib,
            im: row.im,
            ir: row.ir,
            ipp: row.ipp,
            icn: row.icn,
            iap_bg: row.iap_bg,
            iap_prokopack: row.iap_prokopack,
            total_breeding_visits: row.total_breeding_visits,
            positive_breeding_visits: row.positive_breeding_visits,
            total_sites: row.total_sites,
            positive_sites: row.positive_sites,
            total_nymphs: row.total_nymphs,
            visits_with_nymphs: row.visits_with_nymphs,
            total_eggs_visits: row.total_eggs_visits,
            visits_with_eggs: row.visits_with_eggs,
            total_eggs: row.total_eggs,
            total_adult_visits: row.total_adult_visits,
            total_bg_traps: row.total_bg_traps,
            total_bg_mosquitoes: row.total_bg_mosquitoes,
            total_prokopack_traps: row.total_prokopack_traps,
            total_prokopack_mosquitoes: row.total_prokopack_mosquitoes
        };
    });
    
    // Calculer les moyennes globales
    const allIndices = rows.map(row => ({
        ib: row.ib,
        im: row.im,
        ir: row.ir,
        ipp: row.ipp,
        icn: row.icn,
        iap_bg: row.iap_bg,
        iap_prokopack: row.iap_prokopack
    }));
    
    organized.moyennes = calculateAverage(allIndices);
    
    return organized;
}

// Fonction pour calculer les moyennes
function calculateAverage(indices) {
    if (indices.length === 0) return {};
    
    const sum = indices.reduce((acc, curr) => {
        Object.keys(curr).forEach(key => {
            if (curr[key] !== null && curr[key] !== undefined) {
                acc[key] = (acc[key] || 0) + parseFloat(curr[key]);
            }
        });
        return acc;
    }, {});
    
    const count = indices.reduce((acc, curr) => {
        Object.keys(curr).forEach(key => {
            if (curr[key] !== null && curr[key] !== undefined) {
                acc[key] = (acc[key] || 0) + 1;
            }
        });
        return acc;
    }, {});
    
    const average = {};
    Object.keys(sum).forEach(key => {
        average[key] = count[key] > 0 ? parseFloat((sum[key] / count[key]).toFixed(2)) : 0;
    });
    
    return average;
}

// Route pour nettoyer le cache
router.delete('/cache/clear', (req, res) => {
    const cacheSize = indicesCache.size;
    indicesCache.clear();
    res.json({
        success: true,
        message: `Cache nettoyé - ${cacheSize} entrées supprimées`
    });
});

// Route pour obtenir les statistiques du cache
router.get('/cache/stats', (req, res) => {
    res.json({
        success: true,
        cacheSize: indicesCache.size,
        cacheTTL: CACHE_TTL
    });
});

module.exports = router;





