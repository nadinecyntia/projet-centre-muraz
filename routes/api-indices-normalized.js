// =====================================================
// API ENDPOINTS POUR LES INDICES - STRUCTURE NORMALISÉE
// Centre MURAZ - Calculs adaptés à la nouvelle architecture
// =====================================================

const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const { requireViewer } = require('../middleware/auth');

// Appliquer l'authentification pour toutes les routes d'indices
router.use(requireViewer);

// ===== ENDPOINT PRINCIPAL DES INDICES =====
router.get('/indices', async (req, res) => {
    console.log('🔍 API Indices (NORMALIZED) appelée');
    
    try {
        // Support d'archivage par année
        const { year } = req.query;
        const isArchiveQuery = year && year !== 'current';
        
        // Note : Pour l'instant, pas de tables d'archive pour la nouvelle structure
        // À implémenter plus tard si nécessaire
        if (isArchiveQuery) {
            return res.json({
                success: false,
                message: 'Les archives ne sont pas encore disponibles pour la nouvelle structure'
            });
        }

        const client = await pool.connect();

        try {
            // =====================================================
            // REQUÊTE SQL PRINCIPALE - CALCUL DES INDICES
            // =====================================================
            const query = `
                -- =====================================================
                -- CTE 1 : DONNÉES GÎTES LARVAIRES (par gîte individuel)
                -- =====================================================
                WITH b AS (
                    SELECT 
                        to_char(date_trunc('month', b.visit_date), 'YYYY-MM') AS periode,
                        b.house_id,
                        CASE WHEN b.site_state = 'positive' THEN 1 ELSE 0 END AS is_positive_site,
                        b.larvae_count,
                        b.nymphs_count
                    FROM breeding_sites b
                    WHERE b.status = 'approved'
                ),
                
                -- =====================================================
                -- CTE 2 : AGRÉGATION GÎTES PAR PÉRIODE
                -- =====================================================
                b_g AS (
                    SELECT 
                        periode,
                        -- ✅ Nombre de maisons visitées (DISTINCT house_id)
                        COUNT(DISTINCT house_id) AS total_houses_breeding,
                        
                        -- ✅ Nombre de maisons avec au moins 1 gîte positif
                        COUNT(DISTINCT CASE WHEN is_positive_site = 1 THEN house_id END) AS positive_houses_breeding,
                        
                        -- ✅ Nombre total de gîtes inspectés (toutes lignes)
                        COUNT(*) AS total_sites,
                        
                        -- ✅ Nombre de gîtes positifs
                        SUM(is_positive_site) AS positive_sites,
                        
                        -- ✅ Totaux larves et nymphes
                        SUM(larvae_count) AS total_larvae,
                        SUM(nymphs_count) AS total_nymphs,
                        
                        -- ✅ Nombre de maisons avec au moins 1 nymphe
                        COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END) AS positive_houses_nymphs
                    FROM b 
                    GROUP BY periode
                ),
                
                -- =====================================================
                -- CTE 3 : DONNÉES ŒUFS (1 ligne = 1 maison)
                -- =====================================================
                e AS (
                    SELECT
                        to_char(date_trunc('month', e.visit_date), 'YYYY-MM') AS periode,
                        e.house_id,
                        e.eggs_count
                    FROM eggs_collections e
                    WHERE e.status = 'approved'
                ),
                
                -- =====================================================
                -- CTE 4 : AGRÉGATION ŒUFS PAR PÉRIODE
                -- =====================================================
                e_g AS (
                    SELECT 
                        periode,
                        -- ✅ Nombre de maisons visitées pour œufs
                        COUNT(DISTINCT house_id) AS total_houses_eggs,
                        
                        -- ✅ Total d'œufs collectés
                        SUM(eggs_count) AS total_eggs,
                        
                        -- ✅ Nombre de pièges positifs (maisons avec œufs > 0)
                        COUNT(DISTINCT CASE WHEN eggs_count > 0 THEN house_id END) AS positive_houses_eggs
                    FROM e 
                    GROUP BY periode
                ),
                
                -- =====================================================
                -- CTE 5 : DONNÉES MOUSTIQUES ADULTES
                -- =====================================================
                m AS (
                    SELECT
                        to_char(date_trunc('month', m.visit_date), 'YYYY-MM') AS periode,
                        m.house_id,
                        m.total_mosquitoes_count,
                        m.male_count,
                        m.female_count,
                        m.blood_fed_females_count,
                        m.gravid_females_count,
                        m.starved_females_count,
                        COALESCE(m.bg_trap_mosquitoes_count, 0) AS bg_trap_mosquitoes_count,
                        COALESCE(m.prokopack_mosquitoes_count, 0) AS prokopack_mosquitoes_count,
                        COALESCE(m.bg_traps_count, 0) AS bg_traps_count,
                        COALESCE(m.prokopack_traps_count, 0) AS prokopack_traps_count
                    FROM adult_mosquitoes_collections m
                    WHERE m.status = 'approved'
                ),
                
                -- =====================================================
                -- CTE 6 : AGRÉGATION MOUSTIQUES PAR PÉRIODE
                -- =====================================================
                m_g AS (
                    SELECT 
                        periode,
                        -- ✅ Nombre de maisons visitées (DISTINCT house_id)
                        -- Note : Plusieurs lignes peuvent avoir le même house_id
                        -- (méthodes/locations différentes), mais on compte 1 maison
                        COUNT(DISTINCT house_id) AS total_houses_mosquitoes,
                        
                        -- ✅ Totaux moustiques
                        SUM(total_mosquitoes_count) AS total_mosquitoes,
                        SUM(male_count) AS total_males,
                        SUM(female_count) AS total_females,
                        SUM(blood_fed_females_count) AS blood_fed_females,
                        SUM(gravid_females_count) AS gravid_females,
                        SUM(starved_females_count) AS starved_females,
                        
                        -- ✅ Totaux par méthode
                        SUM(bg_trap_mosquitoes_count) AS total_bg_trap,
                        SUM(prokopack_mosquitoes_count) AS total_prokopack,
                        
                        -- ✅ Nombre total de pièges installés
                        SUM(bg_traps_count) AS total_bg_traps_count,
                        SUM(prokopack_traps_count) AS total_prokopack_traps_count
                    FROM m 
                    GROUP BY periode
                ),
                
                -- =====================================================
                -- CTE 7 : JOINTURE ET AGRÉGATION FINALE
                -- =====================================================
                joined AS (
                    SELECT 
                        COALESCE(b_g.periode, e_g.periode, m_g.periode) AS periode,
                        
                        -- Données gîtes
                        COALESCE(b_g.total_houses_breeding, 0) AS total_houses_breeding,
                        COALESCE(b_g.positive_houses_breeding, 0) AS positive_houses_breeding,
                        COALESCE(b_g.total_sites, 0) AS total_sites,
                        COALESCE(b_g.positive_sites, 0) AS positive_sites,
                        COALESCE(b_g.total_larvae, 0) AS total_larvae,
                        COALESCE(b_g.total_nymphs, 0) AS total_nymphs,
                        COALESCE(b_g.positive_houses_nymphs, 0) AS positive_houses_nymphs,
                        
                        -- Données œufs
                        COALESCE(e_g.total_houses_eggs, 0) AS total_houses_eggs,
                        COALESCE(e_g.total_eggs, 0) AS total_eggs,
                        COALESCE(e_g.positive_houses_eggs, 0) AS positive_houses_eggs,
                        
                        -- Données moustiques
                        COALESCE(m_g.total_houses_mosquitoes, 0) AS total_houses_mosquitoes,
                        COALESCE(m_g.total_mosquitoes, 0) AS total_mosquitoes,
                        COALESCE(m_g.total_males, 0) AS total_males,
                        COALESCE(m_g.total_females, 0) AS total_females,
                        COALESCE(m_g.blood_fed_females, 0) AS blood_fed_females,
                        COALESCE(m_g.gravid_females, 0) AS gravid_females,
                        COALESCE(m_g.starved_females, 0) AS starved_females,
                        COALESCE(m_g.total_bg_trap, 0) AS total_bg_trap,
                        COALESCE(m_g.total_prokopack, 0) AS total_prokopack,
                        COALESCE(m_g.total_bg_traps_count, 0) AS total_bg_traps_count,
                        COALESCE(m_g.total_prokopack_traps_count, 0) AS total_prokopack_traps_count
                    FROM b_g
                    FULL OUTER JOIN e_g ON b_g.periode = e_g.periode
                    FULL OUTER JOIN m_g ON COALESCE(b_g.periode, e_g.periode) = m_g.periode
                )
                
                -- =====================================================
                -- REQUÊTE FINALE : CALCUL DES INDICES
                -- =====================================================
                SELECT *,
                    -- ========================================================
                    -- 1️⃣ INDICE DE BRETEAU (IB)
                    -- Formule : (Nombre de gîtes positifs × 100) ÷ Nombre de maisons visitées
                    -- ========================================================
                    CASE 
                        WHEN total_houses_breeding > 0 
                        THEN ROUND((positive_sites::decimal * 100) / total_houses_breeding, 2) 
                        ELSE 0 
                    END AS breteau_index,
                    
                    -- ========================================================
                    -- 2️⃣ INDICE DE MAISON (IM)
                    -- Formule : (Nombre de maisons avec ≥1 gîte positif × 100) ÷ Nombre total de maisons visitées
                    -- ========================================================
                    CASE 
                        WHEN total_houses_breeding > 0 
                        THEN ROUND((positive_houses_breeding::decimal * 100) / total_houses_breeding, 2) 
                        ELSE 0 
                    END AS house_index_breeding,
                    
                    -- ========================================================
                    -- 3️⃣ INDICE DE RÉCIPIENT (IR)
                    -- Formule : (Nombre de gîtes positifs × 100) ÷ Nombre total de gîtes inspectés
                    -- ========================================================
                    CASE 
                        WHEN total_sites > 0 
                        THEN ROUND((positive_sites::decimal * 100) / total_sites, 2) 
                        ELSE 0 
                    END AS container_index,
                    
                    -- ========================================================
                    -- 4️⃣ INDICE DE POSITIVITÉ DES PONDOIRS (IPP)
                    -- Formule : (Nombre de pièges positifs × 100) ÷ Nombre total de pièges installés
                    -- ========================================================
                    CASE 
                        WHEN total_houses_eggs > 0 
                        THEN ROUND((positive_houses_eggs::decimal * 100) / total_houses_eggs, 2) 
                        ELSE 0 
                    END AS pondoir_positivity_index,
                    
                    -- ========================================================
                    -- 5️⃣ INDICE DE COLONISATION NYMPHALE (ICN)
                    -- Formule : (Nombre de maisons infestées de nymphes × 100) ÷ Nombre total de maisons inspectées
                    -- ========================================================
                    CASE 
                        WHEN total_houses_breeding > 0 
                        THEN ROUND((positive_houses_nymphs::decimal * 100) / total_houses_breeding, 2) 
                        ELSE 0 
                    END AS nymphal_colonization_index,
                    
                    -- ========================================================
                    -- 6️⃣ INDICE ADULTES PAR PIÈGE BG (IAP BG)
                    -- Formule : Nombre total d'adultes capturés (BG) ÷ Nombre total de pièges BG installés
                    -- ========================================================
                    CASE 
                        WHEN total_bg_traps_count > 0 
                        THEN ROUND(total_bg_trap::decimal / total_bg_traps_count, 2) 
                        ELSE 0 
                    END AS mosquitoes_bg_per_trap,
                    
                    -- ========================================================
                    -- 7️⃣ INDICE ADULTES PAR PIÈGE PROKOPACK (IAP Prokopack)
                    -- Formule : Nombre total d'adultes capturés (Prokopack) ÷ Nombre total de pièges Prokopack installés
                    -- ========================================================
                    CASE 
                        WHEN total_prokopack_traps_count > 0 
                        THEN ROUND(total_prokopack::decimal / total_prokopack_traps_count, 2) 
                        ELSE 0 
                    END AS mosquitoes_prokopack_per_trap,
                    
                    -- ========================================================
                    -- INDICES SUPPLÉMENTAIRES (pour analyses)
                    -- ========================================================
                    CASE 
                        WHEN total_houses_breeding > 0 
                        THEN ROUND((total_larvae::decimal / total_houses_breeding), 2) 
                        ELSE 0 
                    END AS larvae_per_house,
                    
                    CASE 
                        WHEN total_houses_breeding > 0 
                        THEN ROUND((total_nymphs::decimal / total_houses_breeding), 2) 
                        ELSE 0 
                    END AS nymphs_per_house,
                    
                    CASE 
                        WHEN total_houses_eggs > 0 
                        THEN ROUND((total_eggs::decimal / total_houses_eggs), 2) 
                        ELSE 0 
                    END AS eggs_per_house,
                    
                    CASE 
                        WHEN total_houses_mosquitoes > 0 
                        THEN ROUND((total_mosquitoes::decimal / total_houses_mosquitoes), 2) 
                        ELSE 0 
                    END AS mosquitoes_per_house,
                    
                    CASE 
                        WHEN total_females > 0 
                        THEN ROUND((blood_fed_females::decimal / total_females * 100), 2) 
                        ELSE 0 
                    END AS blood_fed_index,
                    
                    CASE 
                        WHEN total_females > 0 
                        THEN ROUND((gravid_females::decimal / total_females * 100), 2) 
                        ELSE 0 
                    END AS gravid_index,
                    
                    CASE 
                        WHEN total_females > 0 
                        THEN ROUND((starved_females::decimal / total_females * 100), 2) 
                        ELSE 0 
                    END AS starved_index
                    
                FROM joined
                ORDER BY periode ASC;
            `;

            console.log('📊 Exécution de la requête des indices...');
            const result = await client.query(query);

            // =====================================================
            // TRANSFORMATION DES RÉSULTATS POUR LE FRONTEND
            // =====================================================
            const rows = result.rows || [];
            console.log(`✅ ${rows.length} périodes analysées`);
            
            const periodesSet = new Set();
            const data = {};

            for (const r of rows) {
                const periode = r.periode;
                if (!periode) continue;
                
                periodesSet.add(periode);
                
                if (!data[periode]) data[periode] = {};
                
                data[periode]['all'] = {
                    // Indices principaux
                    ib: Number(r.breteau_index) || 0,
                    im: Number(r.house_index_breeding) || 0,
                    ir: Number(r.container_index) || 0,
                    ipp: Number(r.pondoir_positivity_index) || 0,
                    icn: Number(r.nymphal_colonization_index) || 0,
                    iap_bg: Number(r.mosquitoes_bg_per_trap) || 0,
                    iap_prokopack: Number(r.mosquitoes_prokopack_per_trap) || 0,
                    
                    // Données brutes (pour debug/analyses)
                    raw: {
                        total_houses_breeding: Number(r.total_houses_breeding) || 0,
                        positive_houses_breeding: Number(r.positive_houses_breeding) || 0,
                        total_sites: Number(r.total_sites) || 0,
                        positive_sites: Number(r.positive_sites) || 0,
                        total_houses_eggs: Number(r.total_houses_eggs) || 0,
                        positive_houses_eggs: Number(r.positive_houses_eggs) || 0,
                        total_bg_traps: Number(r.total_bg_traps_count) || 0,
                        total_prokopack_traps: Number(r.total_prokopack_traps_count) || 0
                    }
                };
            }

            const periodes = Array.from(periodesSet).sort();

            // =====================================================
            // CALCUL DES MOYENNES GLOBALES
            // =====================================================
            const totals = rows.reduce((acc, r) => {
                acc.total_houses_breeding += Number(r.total_houses_breeding) || 0;
                acc.positive_houses_breeding += Number(r.positive_houses_breeding) || 0;
                acc.total_sites += Number(r.total_sites) || 0;
                acc.positive_sites += Number(r.positive_sites) || 0;
                acc.total_larvae += Number(r.total_larvae) || 0;
                acc.total_nymphs += Number(r.total_nymphs) || 0;
                acc.positive_houses_nymphs += Number(r.positive_houses_nymphs) || 0;
                acc.total_houses_eggs += Number(r.total_houses_eggs) || 0;
                acc.total_eggs += Number(r.total_eggs) || 0;
                acc.positive_houses_eggs += Number(r.positive_houses_eggs) || 0;
                acc.total_houses_mosquitoes += Number(r.total_houses_mosquitoes) || 0;
                acc.total_mosquitoes += Number(r.total_mosquitoes) || 0;
                acc.total_females += Number(r.total_females) || 0;
                acc.blood_fed_females += Number(r.blood_fed_females) || 0;
                acc.gravid_females += Number(r.gravid_females) || 0;
                acc.starved_females += Number(r.starved_females) || 0;
                acc.total_bg_trap += Number(r.total_bg_trap) || 0;
                acc.total_prokopack += Number(r.total_prokopack) || 0;
                acc.total_bg_traps_count += Number(r.total_bg_traps_count) || 0;
                acc.total_prokopack_traps_count += Number(r.total_prokopack_traps_count) || 0;
                return acc;
            }, {
                total_houses_breeding: 0, positive_houses_breeding: 0, total_sites: 0, positive_sites: 0,
                total_larvae: 0, total_nymphs: 0, positive_houses_nymphs: 0, total_houses_eggs: 0, 
                total_eggs: 0, positive_houses_eggs: 0, total_houses_mosquitoes: 0, total_mosquitoes: 0, 
                total_females: 0, blood_fed_females: 0, gravid_females: 0, starved_females: 0,
                total_bg_trap: 0, total_prokopack: 0, total_bg_traps_count: 0, total_prokopack_traps_count: 0
            });

            // Calcul des moyennes avec les formules correctes
            const moyennes = {
                // 1️⃣ Indice de Breteau
                ib: totals.total_houses_breeding > 0 
                    ? Math.round((totals.positive_sites * 10000) / totals.total_houses_breeding) / 100 
                    : 0,
                
                // 2️⃣ Indice de Maison
                im: totals.total_houses_breeding > 0 
                    ? Math.round((totals.positive_houses_breeding * 10000) / totals.total_houses_breeding) / 100 
                    : 0,
                
                // 3️⃣ Indice de Récipient
                ir: totals.total_sites > 0 
                    ? Math.round((totals.positive_sites * 10000) / totals.total_sites) / 100 
                    : 0,
                
                // 4️⃣ Indice de Positivité des Pondoirs
                ipp: totals.total_houses_eggs > 0 
                    ? Math.round((totals.positive_houses_eggs * 10000) / totals.total_houses_eggs) / 100 
                    : 0,
                
                // 5️⃣ Indice de Colonisation Nymphale
                icn: totals.total_houses_breeding > 0 
                    ? Math.round((totals.positive_houses_nymphs * 10000) / totals.total_houses_breeding) / 100 
                    : 0,
                
                // 6️⃣ Indice Adultes par Piège BG
                iap_bg: totals.total_bg_traps_count > 0 
                    ? Math.round((totals.total_bg_trap * 100) / totals.total_bg_traps_count) / 100 
                    : 0,
                
                // 7️⃣ Indice Adultes par Piège Prokopack
                iap_prokopack: totals.total_prokopack_traps_count > 0 
                    ? Math.round((totals.total_prokopack * 100) / totals.total_prokopack_traps_count) / 100 
                    : 0
            };

            console.log('📊 Moyennes globales calculées:', moyennes);

            res.json({
                success: true,
                data,
                periodes,
                moyennes,
                message: 'Indices entomologiques calculés avec succès (structure normalisée)',
                year: 'current',
                mode: 'current'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Erreur API Indices (NORMALIZED):', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des indices entomologiques',
            error: error.message
        });
    }
});

module.exports = router;

