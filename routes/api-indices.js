// =====================================================
// API ENDPOINTS POUR LES INDICES - NOUVELLES TABLES
// Centre MURAZ - Endpoints d'indices adaptés aux nouvelles tables
// =====================================================

const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const { requireViewer } = require('../middleware/auth');

// Appliquer l'authentification pour toutes les routes d'indices
router.use(requireViewer);

// ===== ENDPOINT PRINCIPAL DES INDICES =====
router.get('/indices', async (req, res) => {
    console.log('🔍 API Indices appelée');
    try {
        console.log('📊 API Indices appelée');
        // Support d'archivage par année
        const { year } = req.query;
        const isArchiveQuery = year && year !== 'current';
        const tables = {
            eggs: isArchiveQuery ? 'eggs_collection_archive' : 'eggs_collection_new',
            breeding: isArchiveQuery ? 'breeding_sites_archive' : 'breeding_sites_new',
            mosquitoes: isArchiveQuery ? 'adult_mosquitoes_archive' : 'adult_mosquitoes_new'
        };
        const yearFilter = (alias) => isArchiveQuery ? ` AND ${alias}.archived_year = ${parseInt(year)}` : '';

        const client = await pool.connect();

        try {
            // Agrégations par mois (YYYY-MM) uniquement (tous secteurs confondus)
            const query = `
                WITH b AS (
                    SELECT 
                        to_char(date_trunc('month', site_visit_start_date), 'YYYY-MM') AS periode,
                        (site_concession_code || '/' || site_house_code) AS house_id,
                        total_sites_count,
                        positive_sites_count,
                        larvae_count,
                        nymphs_count
                    FROM ${tables.breeding} bs
                    WHERE bs.status='approved'${yearFilter('bs')}
                ),
                b_g AS (
                    SELECT 
                        periode,
                        COUNT(DISTINCT house_id) AS total_houses_breeding,
                        COUNT(DISTINCT CASE WHEN positive_sites_count > 0 THEN house_id END) AS positive_houses_breeding,
                        SUM(total_sites_count) AS total_sites,
                        SUM(positive_sites_count) AS positive_sites,
                        SUM(larvae_count) AS total_larvae,
                        SUM(nymphs_count) AS total_nymphs,
                        COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END) AS positive_houses_nymphs
                    FROM b GROUP BY 1
                ),
                e AS (
                    SELECT
                        to_char(date_trunc('month', eggs_visit_start_date), 'YYYY-MM') AS periode,
                        eggs_concession_code AS house_id, -- eggs_house_code supprimé
                        eggs_count,
                        NULL as eggs_household_size, -- Champ supprimé
                        NULL as eggs_sleeping_unit_count -- Champ supprimé
                    FROM ${tables.eggs} ec
                    WHERE ec.status='approved'${yearFilter('ec')}
                ),
                e_g AS (
                    SELECT 
                        periode,
                        COUNT(DISTINCT house_id) AS total_houses_eggs,
                        SUM(eggs_count) AS total_eggs,
                        COUNT(DISTINCT CASE WHEN eggs_count > 0 THEN house_id END) AS positive_houses_eggs,
                        0 AS total_household_size, -- Champ supprimé
                        0 AS total_sleeping_units -- Champ supprimé
                    FROM e GROUP BY 1
                ),
                m AS (
                    SELECT
                        to_char(date_trunc('month', mosquitoes_visit_start_date), 'YYYY-MM') AS periode,
                        mosquitoes_concession_code AS house_id, -- mosquitoes_house_code supprimé
                        total_mosquitoes_count,
                        male_count,
                        female_count,
                        blood_fed_females_count,
                        gravid_females_count,
                        starved_females_count,
                        bg_trap_mosquitoes_count,
                        prokopack_mosquitoes_count
                    FROM ${tables.mosquitoes} am
                    WHERE am.status='approved'${yearFilter('am')}
                ),
                m_g AS (
                    SELECT 
                        periode,
                        -- Logique pour compter les maisons :
                        -- Si on a 1 ligne distincte = 1 maison
                        -- Si on a 2 lignes distinctes = 1 maison (Prokopack + BG Trap)
                        -- Si on a 4 lignes distinctes = 2 maisons (2 méthodes × 2 maisons)
                        CASE 
                            WHEN COUNT(DISTINCT house_id) = 1 THEN 1
                            WHEN COUNT(DISTINCT house_id) = 2 THEN 1
                            ELSE COUNT(DISTINCT house_id) / 2
                        END AS total_houses_mosquitoes,
                        SUM(total_mosquitoes_count) AS total_mosquitoes,
                        SUM(male_count) AS total_males,
                        SUM(female_count) AS total_females,
                        SUM(blood_fed_females_count) AS blood_fed_females,
                        SUM(gravid_females_count) AS gravid_females,
                        SUM(starved_females_count) AS starved_females,
                        -- Somme des moustiques capturés par BG Trap (lignes où bg_trap_mosquitoes_count n'est pas NULL)
                        SUM(CASE WHEN bg_trap_mosquitoes_count IS NOT NULL THEN bg_trap_mosquitoes_count ELSE 0 END) AS total_bg_trap,
                        -- Somme des moustiques capturés par Prokopack (lignes où prokopack_mosquitoes_count n'est pas NULL)
                        SUM(CASE WHEN prokopack_mosquitoes_count IS NOT NULL THEN prokopack_mosquitoes_count ELSE 0 END) AS total_prokopack,
                        -- Comptage des pièges BG installés
                        SUM(CASE WHEN bg_trap_mosquitoes_count IS NOT NULL THEN 1 ELSE 0 END) AS total_bg_traps_count,
                        -- Comptage des pièges Prokopack installés
                        SUM(CASE WHEN prokopack_mosquitoes_count IS NOT NULL THEN 1 ELSE 0 END) AS total_prokopack_traps_count
                    FROM m GROUP BY 1
                ),
                joined AS (
                    SELECT COALESCE(b_g.periode, e_g.periode, m_g.periode) AS periode,
                           COALESCE(b_g.total_houses_breeding, 0) AS total_houses_breeding,
                           COALESCE(b_g.positive_houses_breeding, 0) AS positive_houses_breeding,
                           COALESCE(b_g.total_sites, 0) AS total_sites,
                           COALESCE(b_g.positive_sites, 0) AS positive_sites,
                           COALESCE(b_g.total_larvae, 0) AS total_larvae,
                           COALESCE(b_g.total_nymphs, 0) AS total_nymphs,
                           COALESCE(b_g.positive_houses_nymphs, 0) AS positive_houses_nymphs,
                           COALESCE(e_g.total_houses_eggs, 0) AS total_houses_eggs,
                           COALESCE(e_g.total_eggs, 0) AS total_eggs,
                           COALESCE(e_g.positive_houses_eggs, 0) AS positive_houses_eggs,
                           COALESCE(e_g.total_household_size, 0) AS total_household_size,
                           COALESCE(e_g.total_sleeping_units, 0) AS total_sleeping_units,
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
                SELECT *,
                    -- 1️⃣ Indice de Breteau (IB): (Nombre de gîtes positifs × 100) ÷ Nombre de maisons visitées
                    CASE WHEN total_houses_breeding > 0 THEN ROUND((positive_sites::decimal * 100) / total_houses_breeding, 2) ELSE 0 END AS breteau_index,
                    
                    -- 2️⃣ Indice de Maison (IM): (Nombre de maisons avec au moins 1 gîte positif × 100) ÷ Nombre total de maisons visitées
                    CASE WHEN total_houses_breeding > 0 THEN ROUND((positive_houses_breeding::decimal * 100) / total_houses_breeding, 2) ELSE 0 END AS house_index_breeding,
                    
                    -- 3️⃣ Indice de Récipient (IR): (Nombre de gîtes positifs × 100) ÷ Nombre total de gîtes inspectés
                    CASE WHEN total_sites > 0 THEN ROUND((positive_sites::decimal * 100) / total_sites, 2) ELSE 0 END AS container_index,
                    
                    -- 4️⃣ Indice de positivité des pondoirs (IPP): (Nombre de pièges positifs × 100) ÷ Nombre total de pièges installés
                    CASE WHEN total_houses_eggs > 0 THEN ROUND((positive_houses_eggs::decimal * 100) / total_houses_eggs, 2) ELSE 0 END AS pondoir_positivity_index,
                    
                    -- 5️⃣ Indice de colonisation nymphale (ICN): (Nombre de maisons infestées de nymphes × 100) ÷ Nombre total de maisons inspectées
                    CASE WHEN total_houses_breeding > 0 THEN ROUND((positive_houses_nymphs::decimal * 100) / total_houses_breeding, 2) ELSE 0 END AS nymphal_colonization_index,
                    
                    -- 6️⃣ Indice adultes par piège BG: Nombre total d'adultes capturés ÷ Nombre total de pièges installés
                    CASE WHEN total_bg_traps_count > 0 THEN ROUND(total_bg_trap::decimal / total_bg_traps_count, 2) ELSE 0 END AS mosquitoes_bg_per_house,
                    
                    -- 6️⃣ Indice adultes par piège Prokopack: Nombre total d'adultes capturés ÷ Nombre total de pièges installés
                    CASE WHEN total_prokopack_traps_count > 0 THEN ROUND(total_prokopack::decimal / total_prokopack_traps_count, 2) ELSE 0 END AS mosquitoes_prokopack_per_house,
                    
                    -- Indices supplémentaires (non demandés mais utiles)
                    CASE WHEN total_houses_breeding > 0 THEN ROUND((total_larvae::decimal / total_houses_breeding), 2) ELSE 0 END AS larvae_per_house,
                    CASE WHEN total_houses_breeding > 0 THEN ROUND((total_nymphs::decimal / total_houses_breeding), 2) ELSE 0 END AS nymphs_per_house,
                    CASE WHEN total_houses_eggs > 0 THEN ROUND((total_eggs::decimal / total_houses_eggs), 2) ELSE 0 END AS eggs_per_house,
                    CASE WHEN total_houses_mosquitoes > 0 THEN ROUND((total_mosquitoes::decimal / total_houses_mosquitoes), 2) ELSE 0 END AS mosquitoes_per_house,
                    CASE WHEN total_females > 0 THEN ROUND((blood_fed_females::decimal / total_females * 100), 2) ELSE 0 END AS blood_fed_index,
                    CASE WHEN total_females > 0 THEN ROUND((gravid_females::decimal / total_females * 100), 2) ELSE 0 END AS gravid_index,
                    CASE WHEN total_females > 0 THEN ROUND((starved_females::decimal / total_females * 100), 2) ELSE 0 END AS starved_index
                FROM joined
                ORDER BY periode ASC;
            `;

            const result = await client.query(query);

            // Transformer en structure attendue par le front
            const rows = result.rows || [];
            const periodesSet = new Set();
            const data = {};

            for (const r of rows) {
                const periode = r.periode;
                if (!periode) continue;
                periodesSet.add(periode);
                if (!data[periode]) data[periode] = {};
                data[periode]['all'] = {
                    ib: Number(r.breteau_index) || 0, // Indice de Breteau
                    im: Number(r.house_index_breeding) || 0, // Indice de Maison
                    ir: Number(r.container_index) || 0, // Indice de Récipient
                    ipp: Number(r.pondoir_positivity_index) || 0, // Indice de positivité des pondoirs
                    icn: Number(r.nymphal_colonization_index) || 0, // Indice de colonisation nymphale
                    iap_bg: Number(r.mosquitoes_bg_per_house) || 0, // Indice adultes par piège BG
                    iap_prokopack: Number(r.mosquitoes_prokopack_per_house) || 0 // Indice adultes par piège Prokopack
                };
            }

            const periodes = Array.from(periodesSet).sort();

            // Calcul des moyennes globales (agrégation des totaux puis indices)
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
                acc.total_sleeping_units += Number(r.total_sleeping_units) || 0;
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
                total_larvae: 0, total_nymphs: 0, positive_houses_nymphs: 0, total_houses_eggs: 0, total_eggs: 0, positive_houses_eggs: 0, total_sleeping_units: 0,
                total_houses_mosquitoes: 0, total_mosquitoes: 0, total_females: 0, blood_fed_females: 0, gravid_females: 0, starved_females: 0,
                total_bg_trap: 0, total_prokopack: 0, total_bg_traps_count: 0, total_prokopack_traps_count: 0
            });

            // Calcul des moyennes globales avec gestion d'erreur
            const moyennes = {
                ib: totals.total_houses_breeding > 0 ? Math.round((totals.positive_sites * 10000) / totals.total_houses_breeding) / 100 : 0, // Breteau Index
                im: totals.total_houses_breeding > 0 ? Math.round((totals.positive_houses_breeding * 10000) / totals.total_houses_breeding) / 100 : 0, // House Index
                ir: totals.total_sites > 0 ? Math.round((totals.positive_sites * 10000) / totals.total_sites) / 100 : 0, // Container Index
                ipp: totals.total_houses_eggs > 0 ? Math.round((totals.positive_houses_eggs * 10000) / totals.total_houses_eggs) / 100 : 0, // Pondoir Positivity Index
                icn: totals.total_houses_breeding > 0 ? Math.round((totals.positive_houses_nymphs * 10000) / totals.total_houses_breeding) / 100 : 0, // Nymphal Colonization Index
                iap_bg: totals.total_bg_traps_count > 0 ? Math.round((totals.total_bg_trap * 100) / totals.total_bg_traps_count) / 100 : 0, // Adultes par piège BG
                iap_prokopack: totals.total_prokopack_traps_count > 0 ? Math.round((totals.total_prokopack * 100) / totals.total_prokopack_traps_count) / 100 : 0 // Adultes par piège Prokopack
            };

            res.json({
                success: true,
                data,
                periodes,
                moyennes,
                message: 'Indices entomologiques (mois x secteur) calculés avec succès'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Erreur API Indices:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des indices entomologiques',
            error: error.message
        });
    }
});

// ===== ENDPOINT INDICES PAR SECTEUR =====
router.get('/indices/secteurs', async (req, res) => {
    try {
        console.log('🏘️ API Indices par secteur appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                WITH sector_data AS (
                    SELECT
                        site_sector as sector,
                        site_environment,
                        site_concession_code,
                        site_house_code,
                        total_sites_count,
                        positive_sites_count,
                        larvae_count,
                        aedes_larvae_count,
                        culex_larvae_count,
                        anopheles_larvae_count,
                        other_larvae_count,
                        nymphs_count,
                        aedes_nymphs_count,
                        culex_nymphs_count,
                        anopheles_nymphs_count,
                        other_nymphs_count
                    FROM breeding_sites_new
                    WHERE status = 'approved'
                ),
                sector_indices AS (
                    SELECT
                        sector,
                        site_environment,
                        COUNT(DISTINCT site_concession_code || '/' || site_house_code) as total_houses,
                        COUNT(DISTINCT CASE WHEN positive_sites_count > 0 THEN site_concession_code || '/' || site_house_code END) as positive_houses,
                        SUM(total_sites_count) as total_sites,
                        SUM(positive_sites_count) as positive_sites,
                        SUM(larvae_count) as total_larvae,
                        SUM(aedes_larvae_count) as aedes_larvae,
                        SUM(culex_larvae_count) as culex_larvae,
                        SUM(anopheles_larvae_count) as anopheles_larvae,
                        SUM(other_larvae_count) as other_larvae,
                        SUM(nymphs_count) as total_nymphs,
                        SUM(aedes_nymphs_count) as aedes_nymphs,
                        SUM(culex_nymphs_count) as culex_nymphs,
                        SUM(anopheles_nymphs_count) as anopheles_nymphs,
                        SUM(other_nymphs_count) as other_nymphs
                    FROM sector_data
                    GROUP BY sector, site_environment
                )
                SELECT
                    sector,
                    site_environment,
                    total_houses,
                    positive_houses,
                    total_sites,
                    positive_sites,
                    total_larvae,
                    aedes_larvae,
                    culex_larvae,
                    anopheles_larvae,
                    other_larvae,
                    total_nymphs,
                    aedes_nymphs,
                    culex_nymphs,
                    anopheles_nymphs,
                    other_nymphs,
                    
                    -- Calcul des indices
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((positive_houses::decimal / total_houses * 100), 2)
                        ELSE 0 
                    END as house_index,
                    
                    CASE 
                        WHEN total_sites > 0 
                        THEN ROUND((positive_sites::decimal / total_sites * 100), 2)
                        ELSE 0 
                    END as container_index,
                    
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((total_larvae::decimal / total_houses), 2)
                        ELSE 0 
                    END as larvae_per_house,
                    
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((total_nymphs::decimal / total_houses), 2)
                        ELSE 0 
                    END as nymphs_per_house
                    
                FROM sector_indices
                ORDER BY sector, site_environment;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} indices par secteur calculés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Indices par secteur calculés avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Indices par secteur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des indices par secteur',
            error: error.message
        });
    }
});

// ===== ENDPOINT INDICES PAR ENVIRONNEMENT =====
router.get('/indices/environnements', async (req, res) => {
    try {
        console.log('🌍 API Indices par environnement appelée');
        
        const client = await pool.connect();
        
        try {
            const query = `
                WITH env_data AS (
                    SELECT
                        site_environment,
                        site_concession_code,
                        site_house_code,
                        total_sites_count,
                        positive_sites_count,
                        larvae_count,
                        aedes_larvae_count,
                        culex_larvae_count,
                        anopheles_larvae_count,
                        other_larvae_count,
                        nymphs_count,
                        aedes_nymphs_count,
                        culex_nymphs_count,
                        anopheles_nymphs_count,
                        other_nymphs_count
                    FROM breeding_sites_new
                    WHERE status = 'approved'
                ),
                env_indices AS (
                    SELECT
                        site_environment,
                        COUNT(DISTINCT site_concession_code || '/' || site_house_code) as total_houses,
                        COUNT(DISTINCT CASE WHEN positive_sites_count > 0 THEN site_concession_code || '/' || site_house_code END) as positive_houses,
                        SUM(total_sites_count) as total_sites,
                        SUM(positive_sites_count) as positive_sites,
                        SUM(larvae_count) as total_larvae,
                        SUM(aedes_larvae_count) as aedes_larvae,
                        SUM(culex_larvae_count) as culex_larvae,
                        SUM(anopheles_larvae_count) as anopheles_larvae,
                        SUM(other_larvae_count) as other_larvae,
                        SUM(nymphs_count) as total_nymphs,
                        SUM(aedes_nymphs_count) as aedes_nymphs,
                        SUM(culex_nymphs_count) as culex_nymphs,
                        SUM(anopheles_nymphs_count) as anopheles_nymphs,
                        SUM(other_nymphs_count) as other_nymphs
                    FROM env_data
                    GROUP BY site_environment
                )
                SELECT
                    site_environment,
                    total_houses,
                    positive_houses,
                    total_sites,
                    positive_sites,
                    total_larvae,
                    aedes_larvae,
                    culex_larvae,
                    anopheles_larvae,
                    other_larvae,
                    total_nymphs,
                    aedes_nymphs,
                    culex_nymphs,
                    anopheles_nymphs,
                    other_nymphs,
                    
                    -- Calcul des indices
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((positive_houses::decimal / total_houses * 100), 2)
                        ELSE 0 
                    END as house_index,
                    
                    CASE 
                        WHEN total_sites > 0 
                        THEN ROUND((positive_sites::decimal / total_sites * 100), 2)
                        ELSE 0 
                    END as container_index,
                    
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((total_larvae::decimal / total_houses), 2)
                        ELSE 0 
                    END as larvae_per_house,
                    
                    CASE 
                        WHEN total_houses > 0 
                        THEN ROUND((total_nymphs::decimal / total_houses), 2)
                        ELSE 0 
                    END as nymphs_per_house
                    
                FROM env_indices
                ORDER BY site_environment;
            `;
            
            const result = await client.query(query);
            
            console.log(`✅ ${result.rows.length} indices par environnement calculés`);
            
            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length,
                message: 'Indices par environnement calculés avec succès'
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur API Indices par environnement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des indices par environnement',
            error: error.message
        });
    }
});

module.exports = router;
