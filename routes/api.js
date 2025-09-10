const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const KoboCollectSync = require('../services/kobocollect-sync');

// Route pour récupérer les informations utilisateur
router.get('/user-info', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            id: req.session.user.id,
            username: req.session.user.username,
            email: req.session.user.email,
            role: req.session.user.role
        });
    } else {
        res.status(401).json({ error: 'Non authentifié' });
    }
});

// Route de test de la base de données
router.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            success: true, 
            message: 'Base de données accessible',
            time: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur de connexion à la base de données',
            error: error.message
        });
    }
});

// Fonction de vérification d'authentification admin
function requireAdminAuth(req, res, next) {
    // Vérifier si l'utilisateur est connecté (via session ou token)
    // Pour l'instant, on accepte toutes les requêtes mais on peut ajouter une vraie authentification plus tard
    console.log('🔐 Vérification d\'authentification admin pour la synchronisation');
    next();
}

// Route de synchronisation complète avec KoboCollect
router.post('/sync-kobo', requireAdminAuth, async (req, res) => {
    try {
        console.log('🔄 Démarrage de la synchronisation complète KoboCollect...');
        
        const koboSync = new KoboCollectSync();
        const result = await koboSync.syncAll();
        
        res.json({
            success: true,
            message: 'Synchronisation complète terminée avec succès',
            data: result
        });
        
    } catch (error) {
        console.error('❌ Erreur de synchronisation complète:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la synchronisation complète',
            error: error.message
        });
    }
});

// Route de synchronisation d'un formulaire spécifique
router.post('/sync-kobo/:formType', requireAdminAuth, async (req, res) => {
    try {
        const { formType } = req.params;
        const validFormTypes = ['gites', 'oeufs', 'adultes'];
        
        if (!validFormTypes.includes(formType)) {
            return res.status(400).json({
                success: false,
                message: 'Type de formulaire invalide. Types valides: gites, oeufs, adultes'
            });
        }
        
        console.log(`🔄 Démarrage de la synchronisation du formulaire: ${formType}`);
        
        const koboSync = new KoboCollectSync();
        const result = await koboSync.syncForm(formType);
        
        res.json({
            success: true,
            message: `Synchronisation du formulaire ${formType} terminée avec succès`,
            data: result
        });
        
    } catch (error) {
        console.error(`❌ Erreur de synchronisation du formulaire ${req.params.formType}:`, error);
        res.status(500).json({
            success: false,
            message: `Erreur lors de la synchronisation du formulaire ${req.params.formType}`,
            error: error.message
        });
    }
});

// Route pour récupérer les données entomologiques
router.get('/entomological-data', async (req, res) => {
    try {
        const { sector, start_date, end_date, limit = 100, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                hv.*,
                COUNT(bs.id) as breeding_sites_count,
                COUNT(eg.id) as eggs_count,
                COUNT(am.id) as adult_mosquitoes_count
            FROM household_visits hv
            LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
            LEFT JOIN eggs_collection eg ON hv.id = eg.household_visit_id
            LEFT JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
        `;
        
        const whereConditions = [];
        const queryParams = [];
        let paramCount = 1;
        
        if (sector) {
            whereConditions.push(`hv.sector = $${paramCount}`);
            queryParams.push(sector);
            paramCount++;
        }
        
        if (start_date) {
            whereConditions.push(`hv.visit_start_date >= $${paramCount}`);
            queryParams.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            whereConditions.push(`hv.visit_start_date <= $${paramCount}`);
            queryParams.push(end_date);
            paramCount++;
        }
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        query += ` GROUP BY hv.id ORDER BY hv.visit_start_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données',
            error: error.message
        });
    }
});



// Route pour récupérer les données de biologie moléculaire
router.get('/molecular-biology', async (req, res) => {
    try {
        const { analysis_type, start_date, end_date, limit = 100, offset = 0 } = req.query;
        
        let query = 'SELECT * FROM molecular_biology';
        const whereConditions = [];
        const queryParams = [];
        let paramCount = 1;
        
        if (analysis_type) {
            whereConditions.push(`analysis_type = $${paramCount}`);
            queryParams.push(analysis_type);
            paramCount++;
        }
        
        if (start_date) {
            whereConditions.push(`sample_date >= $${paramCount}`);
            queryParams.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            whereConditions.push(`sample_date <= $${paramCount}`);
            queryParams.push(end_date);
            paramCount++;
        }
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY sample_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données biologiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données biologiques',
            error: error.message
        });
    }
});

// Route pour insérer des données de biologie moléculaire
router.post('/molecular-biology', async (req, res) => {
    try {
        const {
            analysis_type,
            sample_date,
            mosquito_genus,
            mosquito_species,
            additional_info,
            gene_analyzed,
            virus_tested,
            result,
            viral_load,
            blood_meal_origin,
            animal_species,
            human_percentage,
            animal_percentage
        } = req.body;
        
        const query = `
            INSERT INTO molecular_biology (
                analysis_type, sample_date, mosquito_genus, mosquito_species, additional_info,
                gene_analyzed, virus_tested, result, viral_load,
                blood_meal_origin, animal_species, human_percentage, animal_percentage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        
        const values = [
            analysis_type, sample_date, mosquito_genus, mosquito_species, additional_info,
            gene_analyzed, virus_tested, result, viral_load,
            blood_meal_origin, animal_species, human_percentage, animal_percentage
        ];
        
        const result_db = await pool.query(query, values);
        
        res.json({
            success: true,
            message: 'Données biologiques insérées avec succès',
            data: result_db.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion des données biologiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'insertion des données biologiques',
            error: error.message
        });
    }
});

// Route pour obtenir le statut de la dernière synchronisation
router.get('/sync-status', async (req, res) => {
    try {
        // Vérifier le nombre de données dans chaque table
        const householdCount = await pool.query('SELECT COUNT(*) FROM household_visits');
        const breedingCount = await pool.query('SELECT COUNT(*) FROM breeding_sites');
        const eggsCount = await pool.query('SELECT COUNT(*) FROM eggs_collection');
        const adultCount = await pool.query('SELECT COUNT(*) FROM adult_mosquitoes');
        
        res.json({
            success: true,
            data: {
                status: 'ready',
                lastSync: new Date().toISOString(),
                counts: {
                    household_visits: parseInt(householdCount.rows[0].count),
                    breeding_sites: parseInt(breedingCount.rows[0].count),
                    eggs_collection: parseInt(eggsCount.rows[0].count),
                    adult_mosquitoes: parseInt(adultCount.rows[0].count)
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du statut',
            error: error.message
        });
    }
});

// Route pour récupérer toutes les données synchronisées (brutes)
router.get('/data', async (req, res) => {
    try {
        console.log('📊 Récupération des données synchronisées...');
        
        const client = await pool.connect();
        
        // Récupérer toutes les données entomologiques depuis les nouvelles tables
        const result = await client.query(`
            SELECT 
                hv.id,
                hv.investigator_name,
                hv.concession_code,
                hv.house_code,
                hv.visit_start_date,
                hv.visit_end_date,
                hv.visit_start_time,
                hv.visit_end_time,
                hv.sector,
                hv.environment,
                hv.gps_code,
                hv.household_size,
                hv.number_of_beds,
                hv.head_contact,
                hv.created_at,
                hv.updated_at,
                CASE 
                    WHEN bs.id IS NOT NULL THEN 'gites'
                    WHEN eg.id IS NOT NULL THEN 'oeufs'
                    WHEN am.id IS NOT NULL THEN 'adultes'
                    ELSE 'maison'
                END as form_type
            FROM household_visits hv
            LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
            LEFT JOIN eggs_collection eg ON hv.id = eg.household_visit_id
            LEFT JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
            ORDER BY hv.created_at DESC
        `);
        
        client.release();
        
        console.log(`✅ ${result.rows.length} données récupérées avec succès`);
        
        res.json({
            success: true,
            message: 'Données récupérées avec succès',
            data: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données',
            error: error.message
        });
    }
});



// Route pour récupérer les données par type de formulaire
router.get('/data/:formType', async (req, res) => {
    try {
        const { formType } = req.params;
        console.log(`📊 Récupération des données pour le formulaire: ${formType}`);
        
        const client = await pool.connect();
        
        // Récupérer les données du type spécifique depuis les nouvelles tables
        let query;
        let params = [];
        
        switch(formType) {
            case 'gites':
                query = `
                    SELECT 
                        hv.id,
                        hv.sector,
                        hv.environment,
                        hv.visit_start_date,
                        hv.created_at,
                        bs.total_sites,
                        bs.positive_sites,
                        bs.negative_sites,
                        bs.larvae_count,
                        bs.nymphs_count
                    FROM household_visits hv
                    INNER JOIN breeding_sites bs ON hv.id = bs.household_visit_id
                    ORDER BY hv.created_at DESC
                `;
                break;
            case 'oeufs':
                query = `
                    SELECT 
                        hv.id,
                        hv.sector,
                        hv.environment,
                        hv.visit_start_date,
                        hv.created_at,
                        eg.nest_number,
                        eg.nest_code,
                        eg.eggs_count
                    FROM household_visits hv
                    INNER JOIN eggs_collection eg ON hv.id = eg.household_visit_id
                    ORDER BY hv.created_at DESC
                `;
                break;
            case 'adultes':
                query = `
                    SELECT 
                        hv.id,
                        hv.sector,
                        hv.environment,
                        hv.visit_start_date,
                        hv.created_at,
                        am.genus,
                        am.species,
                        am.total_mosquitoes_count,
                        am.male_count,
                        am.female_count
                    FROM household_visits hv
                    INNER JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
                    ORDER BY hv.created_at DESC
                `;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type de formulaire invalide. Types acceptés: gites, oeufs, adultes'
                });
        }
        
        const result = await client.query(query, params);
        
        client.release();
        
        console.log(`✅ ${result.rows.length} données récupérées pour ${formType}`);
        
        res.json({
            success: true,
            message: `Données ${formType} récupérées avec succès`,
            data: result.rows,
            total: result.rows.length,
            formType: formType
        });
        
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des données ${req.params.formType}:`, error);
        res.status(500).json({
            success: false,
            message: `Erreur lors de la récupération des données ${req.params.formType}`,
            error: error.message
        });
    }
});

// Route pour récupérer les données formatées pour les analyses entomologiques
router.get('/analyses', async (req, res) => {
    try {
        console.log('📊 Récupération des données pour analyses entomologiques...');
        
        const client = await pool.connect();
        
        // Récupérer toutes les données entomologiques depuis les nouvelles tables
        const result = await client.query(`
            SELECT 
                hv.id,
                hv.sector,
                hv.environment,
                hv.visit_start_date,
                hv.created_at,
                bs.total_sites,
                bs.positive_sites,
                bs.negative_sites,
                bs.larvae_count,
                bs.nymphs_count,
                ec.eggs_count,
                am.prokopack_traps_count,
                am.bg_traps_count,
                am.total_mosquitoes_count,
                am.prokopack_mosquitoes_count,
                am.bg_trap_mosquitoes_count,
                am.genus,
                am.species
            FROM household_visits hv
            LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
            LEFT JOIN eggs_collection ec ON hv.id = ec.household_visit_id
            LEFT JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
            ORDER BY hv.created_at DESC
        `);
        
        client.release();
        
        // Traiter et formater les données pour les analyses
        const analysesData = processDataForAnalyses(result.rows);
        
        console.log(`✅ ${result.rows.length} données traitées pour analyses`);
        
        res.json({
            success: true,
            message: 'Données d\'analyses entomologiques récupérées avec succès',
            data: analysesData
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données d\'analyses:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données d\'analyses',
            error: error.message
        });
    }
});

// =====================================================
// ENDPOINT SPÉCIFIQUE POUR LES ŒUFS PAR SECTEUR
// =====================================================
router.get('/analyses/oeufs', async (req, res) => {
    try {
        console.log('🥚 Récupération des données œufs par secteur...');
        
        const client = await pool.connect();
        
        // Requête spécifique pour les œufs avec jointure household_visits
        const result = await client.query(`
            SELECT 
                hv.id as household_visit_id,
                hv.sector,
                hv.environment,
                hv.visit_start_date,
                hv.created_at,
                ec.id as eggs_collection_id,
                ec.nest_number,
                ec.nest_code,
                ec.pass_order,
                ec.eggs_count,
                ec.observations as eggs_observations
            FROM household_visits hv
            INNER JOIN eggs_collection ec ON hv.id = ec.household_visit_id
            WHERE ec.eggs_count IS NOT NULL 
            AND ec.eggs_count >= 0
            ORDER BY hv.visit_start_date DESC, hv.sector ASC
        `);
        
        client.release();
        
        // Traiter les données spécifiquement pour les œufs par secteur
        const oeufsData = processOeufsData(result.rows);
        
        console.log(`✅ ${result.rows.length} enregistrements d'œufs traités`);
        console.log(`📊 Secteurs trouvés: ${oeufsData.secteurs.join(', ')}`);
        console.log(`📅 Périodes trouvées: ${oeufsData.periodes.length} périodes`);
        
        res.json({
            success: true,
            message: 'Données œufs par secteur récupérées avec succès',
            data: oeufsData
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données œufs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données œufs',
            error: error.message
        });
    }
});

// =====================================================
// ENDPOINT SPÉCIFIQUE POUR LES ŒUFS PAR MOIS
// =====================================================
router.get('/analyses/oeufs-mois', async (req, res) => {
    try {
        console.log('📅 Récupération des données œufs par mois...');
        
        const client = await pool.connect();
        
        // Requête pour les œufs groupés par mois et secteur
        const result = await client.query(`
            SELECT 
                hv.sector,
                hv.visit_start_date,
                ec.eggs_count,
                DATE_TRUNC('month', hv.visit_start_date) as mois_periode
            FROM household_visits hv
            INNER JOIN eggs_collection ec ON hv.id = ec.household_visit_id
            WHERE ec.eggs_count IS NOT NULL 
            AND ec.eggs_count >= 0
            AND hv.visit_start_date IS NOT NULL
            ORDER BY hv.visit_start_date ASC
        `);
        
        client.release();
        
        // Traiter les données spécifiquement pour les œufs par mois
        const oeufsMoisData = processOeufsMoisData(result.rows);
        
        console.log(`✅ ${result.rows.length} enregistrements d'œufs traités pour l'évolution mensuelle`);
        console.log(`📊 Périodes trouvées: ${oeufsMoisData.periodes.length} mois`);
        console.log(`📊 Secteurs: ${oeufsMoisData.secteurs.join(', ')}`);
        
        res.json({
            success: true,
            message: 'Données œufs par mois récupérées avec succès',
            data: oeufsMoisData
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données œufs par mois:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données œufs par mois',
            error: error.message
        });
    }
});

// Route pour récupérer les données pour le calcul des indices entomologiques
router.get('/indices', async (req, res) => {
    try {
        console.log('🧮 Récupération des données pour calcul des indices entomologiques...');
        
        // PHASE 1 : OPTIMISATION - Pagination et filtres
        const { page = 1, limit = 50, start_date, end_date, sector } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
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
        const result = await client.query(`
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
        `);
        
        client.release();
        
        // Organiser les données pour l'interface
        const indicesData = organizeIndicesData(result.rows);
        
        console.log(`✅ Indices entomologiques calculés avec succès - ${result.rows.length} périodes`);
        
        res.json({
            success: true,
            message: 'Indices entomologiques calculés avec succès',
            data: indicesData
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
            // Données brutes pour référence
            total_breeding_visits: row.total_breeding_visits,
            positive_breeding_visits: row.positive_breeding_visits,
            total_sites: row.total_sites,
            positive_sites: row.positive_sites,
            total_nymphs: row.total_nymphs,
            visits_with_nymphs: row.visits_with_nymphs,
            total_eggs: row.total_eggs,
            total_eggs_visits: row.total_eggs_visits,
            visits_with_eggs: row.visits_with_eggs
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
    
    // Calculer les totaux bruts pour l'IB et IM
    const totalPositiveSites = rows.reduce((sum, row) => sum + (parseFloat(row.positive_sites) || 0), 0);
    const totalBreedingVisits = rows.reduce((sum, row) => sum + (parseFloat(row.total_breeding_visits) || 0), 0);
    const totalPositiveBreedingVisits = rows.reduce((sum, row) => sum + (parseFloat(row.positive_breeding_visits) || 0), 0);
    
    organized.moyennes = {
        // CORRECTION: IB calculé sur le total global, pas la moyenne
        ib: totalBreedingVisits > 0 ? Math.round((totalPositiveSites * 100.0 / totalBreedingVisits) * 100) / 100 : 0,
        // CORRECTION: IM calculé sur le total global, pas la moyenne
        im: totalBreedingVisits > 0 ? Math.round((totalPositiveBreedingVisits * 100.0 / totalBreedingVisits) * 100) / 100 : 0,
        ir: calculateAverage(allIndices.map(i => i.ir)),
        ipp: calculateAverage(allIndices.map(i => i.ipp)),
        icn: calculateAverage(allIndices.map(i => i.icn)),
        iap_bg: calculateAverage(allIndices.map(i => i.iap_bg)),
        iap_prokopack: calculateAverage(allIndices.map(i => i.iap_prokopack))
    };
    
    return organized;
}

// Fonction utilitaire pour calculer la moyenne
function calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v))
        .map(v => typeof v === 'string' ? parseFloat(v) : v);
    if (validValues.length === 0) return 0;
    return Math.round((validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100) / 100;
}

// Fonction pour traiter les données pour les analyses entomologiques
function processDataForAnalyses(data) {
    const analyses = {
        gites: [],
        oeufs: [],
        adultes: [],
        periodes: [],
        secteurs: [],
        genres: ['aedes', 'culex', 'anopheles', 'autre'],
        totalLarves: 0,
        totalOeufs: 0,
        totalAdultes: 0,
        // Données pour les graphiques
        chartData: {
            larves: {},
            oeufs: {},
            adultes: {},
            adultesParGenre: {}
        }
    };
    
    data.forEach(item => {
        const date = new Date(item.visit_start_date || item.created_at);
        const periode = getPeriode(date);
        const secteur = item.sector || 'N/A';
        
        if (!analyses.periodes.includes(periode)) {
            analyses.periodes.push(periode);
        }
        
        if (!analyses.secteurs.includes(secteur)) {
            analyses.secteurs.push(secteur);
        }
        
        // Traiter les données de gîtes larvaires (breeding_sites)
        if (item.total_sites !== null && item.total_sites !== undefined) {
            analyses.gites.push({
                id: item.id,
                secteur: secteur,
                periode: periode,
                date: item.visit_start_date || item.created_at,
                data: {
                    total_sites: item.total_sites,
                    positive_sites: item.positive_sites,
                    negative_sites: item.negative_sites,
                    larvae_count: item.larvae_count,
                    nymphs_count: item.nymphs_count,
                    sector: item.sector,
                    environment: item.environment,
                    visit_start_date: item.visit_start_date
                }
            });
            
            // Données pour graphiques - Larves
            if (!analyses.chartData.larves[periode]) {
                analyses.chartData.larves[periode] = {};
            }
            if (!analyses.chartData.larves[periode][secteur]) {
                analyses.chartData.larves[periode][secteur] = 0;
            }
            analyses.chartData.larves[periode][secteur] += (item.larvae_count || 0);
        } else {
            // Si pas de données de gîtes, initialiser quand même pour les graphiques
            if (!analyses.chartData.larves[periode]) {
                analyses.chartData.larves[periode] = {};
            }
            if (!analyses.chartData.larves[periode][secteur]) {
                analyses.chartData.larves[periode][secteur] = 0;
            }
        }
        
        // Traiter les données de moustiques adultes (adult_mosquitoes)
        console.log(`🔍 Vérification moustiques adultes pour ${secteur} - ${periode}:`, {
            total_mosquitoes_count: item.total_mosquitoes_count,
            prokopack_mosquitoes_count: item.prokopack_mosquitoes_count,
            bg_trap_mosquitoes_count: item.bg_trap_mosquitoes_count
        });
        
        if (item.total_mosquitoes_count !== null && item.total_mosquitoes_count !== undefined && item.total_mosquitoes_count >= 0) {
            console.log(`✅ Ajout des données moustiques adultes pour ${secteur} - ${periode}`);
            
            analyses.adultes.push({
                id: item.id,
                secteur: secteur,
                periode: periode,
                date: item.visit_start_date || item.created_at,
                data: {
                    total_mosquitoes_count: item.total_mosquitoes_count,
                    prokopack_mosquitoes_count: item.prokopack_mosquitoes_count,
                    bg_trap_mosquitoes_count: item.bg_trap_mosquitoes_count,
                    prokopack_traps_count: item.prokopack_traps_count,
                    bg_traps_count: item.bg_traps_count,
                    sector: item.sector,
                    environment: item.environment,
                    visit_start_date: item.visit_start_date
                }
            });
            
            // Données pour graphiques - Adultes par secteur
            if (!analyses.chartData.adultes[periode]) {
                analyses.chartData.adultes[periode] = {};
            }
            if (!analyses.chartData.adultes[periode][secteur]) {
                analyses.chartData.adultes[periode][secteur] = 0;
            }
            analyses.chartData.adultes[periode][secteur] += (item.total_mosquitoes_count || 0);
            
            // Données pour graphiques - Adultes par genre
            // Simuler des données par genre basées sur le secteur pour les tests
            if (!analyses.chartData.adultesParGenre[periode]) {
                analyses.chartData.adultesParGenre[periode] = {};
            }
            
            // Répartition par genre basée sur le secteur (pour les tests)
            const genreMapping = {
                'Sector 6': 'aedes',
                'Sector 9': 'culex', 
                'Sector 26': 'anopheles',
                'Sector 33': 'autre'
            };
            
            const genre = genreMapping[secteur] || 'autre';
            if (!analyses.chartData.adultesParGenre[periode][genre]) {
                analyses.chartData.adultesParGenre[periode][genre] = 0;
            }
            analyses.chartData.adultesParGenre[periode][genre] += (item.total_mosquitoes_count || 0);
            
            console.log(`📊 Données graphiques adultes mises à jour: ${periode} - ${secteur} = ${analyses.chartData.adultes[periode][secteur]}`);
        } else {
            console.log(`❌ Données moustiques adultes ignorées pour ${secteur} - ${periode} (total_mosquitoes_count: ${item.total_mosquitoes_count})`);
            
            // Si pas de données adultes, initialiser quand même pour les graphiques
            if (!analyses.chartData.adultes[periode]) {
                analyses.chartData.adultes[periode] = {};
            }
            if (!analyses.chartData.adultes[periode][secteur]) {
                analyses.chartData.adultes[periode][secteur] = 0;
            }
        }
        
        // Traiter les données d'œufs depuis la table eggs_collection
        if (item.eggs_count !== null && item.eggs_count !== undefined && item.eggs_count >= 0) {
            analyses.oeufs.push({
                id: item.id,
                secteur: secteur,
                periode: periode,
                date: item.visit_start_date || item.created_at,
                data: {
                    eggs_count: item.eggs_count,
                    sector: item.sector,
                    environment: item.environment,
                    visit_start_date: item.visit_start_date
                }
            });
            
            // Données pour graphiques - Œufs (vraies données d'œufs)
            if (!analyses.chartData.oeufs[periode]) {
                analyses.chartData.oeufs[periode] = {};
            }
            if (!analyses.chartData.oeufs[periode][secteur]) {
                analyses.chartData.oeufs[periode][secteur] = 0;
            }
            analyses.chartData.oeufs[periode][secteur] += (item.eggs_count || 0);
        } else {
            // Si pas de données d'œufs, initialiser quand même pour les graphiques
            if (!analyses.chartData.oeufs[periode]) {
                analyses.chartData.oeufs[periode] = {};
            }
            if (!analyses.chartData.oeufs[periode][secteur]) {
                analyses.chartData.oeufs[periode][secteur] = 0;
            }
        }
    });
    
    analyses.totalLarves = analyses.gites.length;
    analyses.totalOeufs = analyses.oeufs.length;
    analyses.totalAdultes = analyses.adultes.length;
    
    console.log('📊 RÉSUMÉ FINAL DES DONNÉES TRAITÉES:');
    console.log(`   • Gîtes: ${analyses.totalLarves}`);
    console.log(`   • Œufs: ${analyses.totalOeufs}`);
    console.log(`   • Moustiques adultes: ${analyses.totalAdultes}`);
    console.log(`   • Périodes: ${analyses.periodes.length} (${analyses.periodes.join(', ')})`);
    console.log(`   • Secteurs: ${analyses.secteurs.length} (${analyses.secteurs.join(', ')})`);
    console.log('📈 Données pour graphiques:');
    console.log(`   • Larves:`, analyses.chartData.larves);
    console.log(`   • Œufs:`, analyses.chartData.oeufs);
    console.log(`   • Adultes:`, analyses.chartData.adultes);
    
    return analyses;
}

// =====================================================
// FONCTION SPÉCIFIQUE POUR TRAITER LES DONNÉES ŒUFS
// =====================================================
function processOeufsData(data) {
    console.log('🥚 Traitement des données œufs spécifiques...');
    
    const oeufsData = {
        // Données brutes
        rawData: data,
        
        // Métadonnées
        secteurs: [],
        periodes: [],
        environments: [],
        
        // Données agrégées par secteur
        oeufsParSecteur: {},
        
        // Données agrégées par période
        oeufsParPeriode: {},
        
        // Données pour graphiques
        chartData: {
            oeufsParSecteur: {},
            oeufsParPeriode: {},
            oeufsParSecteurEtPeriode: {}
        },
        
        // Statistiques
        totalOeufs: 0,
        totalEnregistrements: data.length,
        moyenneOeufsParSecteur: {},
        moyenneOeufsParPeriode: {}
    };
    
    // Traiter chaque enregistrement
    data.forEach(item => {
        const secteur = item.sector;
        const date = new Date(item.visit_start_date || item.created_at);
        const periode = getPeriode(date);
        const environment = item.environment;
        const eggsCount = parseInt(item.eggs_count) || 0;
        
        // Ajouter aux listes uniques
        if (!oeufsData.secteurs.includes(secteur)) {
            oeufsData.secteurs.push(secteur);
        }
        if (!oeufsData.periodes.includes(periode)) {
            oeufsData.periodes.push(periode);
        }
        if (!oeufsData.environments.includes(environment)) {
            oeufsData.environments.push(environment);
        }
        
        // Agrégation par secteur
        if (!oeufsData.oeufsParSecteur[secteur]) {
            oeufsData.oeufsParSecteur[secteur] = {
                totalOeufs: 0,
                nombreEnregistrements: 0,
                moyenne: 0,
                details: []
            };
        }
        oeufsData.oeufsParSecteur[secteur].totalOeufs += eggsCount;
        oeufsData.oeufsParSecteur[secteur].nombreEnregistrements += 1;
        oeufsData.oeufsParSecteur[secteur].details.push({
            id: item.eggs_collection_id,
            nest_number: item.nest_number,
            nest_code: item.nest_code,
            eggs_count: eggsCount,
            date: date,
            periode: periode,
            environment: environment
        });
        
        // Agrégation par période
        if (!oeufsData.oeufsParPeriode[periode]) {
            oeufsData.oeufsParPeriode[periode] = {
                totalOeufs: 0,
                nombreEnregistrements: 0,
                moyenne: 0,
                secteurs: {}
            };
        }
        oeufsData.oeufsParPeriode[periode].totalOeufs += eggsCount;
        oeufsData.oeufsParPeriode[periode].nombreEnregistrements += 1;
        
        // Agrégation par secteur dans la période
        if (!oeufsData.oeufsParPeriode[periode].secteurs[secteur]) {
            oeufsData.oeufsParPeriode[periode].secteurs[secteur] = {
                totalOeufs: 0,
                nombreEnregistrements: 0
            };
        }
        oeufsData.oeufsParPeriode[periode].secteurs[secteur].totalOeufs += eggsCount;
        oeufsData.oeufsParPeriode[periode].secteurs[secteur].nombreEnregistrements += 1;
        
        // Données pour graphiques - Par secteur (total)
        if (!oeufsData.chartData.oeufsParSecteur[secteur]) {
            oeufsData.chartData.oeufsParSecteur[secteur] = 0;
        }
        oeufsData.chartData.oeufsParSecteur[secteur] += eggsCount;
        
        // Données pour graphiques - Par période
        if (!oeufsData.chartData.oeufsParPeriode[periode]) {
            oeufsData.chartData.oeufsParPeriode[periode] = {};
        }
        if (!oeufsData.chartData.oeufsParPeriode[periode][secteur]) {
            oeufsData.chartData.oeufsParPeriode[periode][secteur] = 0;
        }
        oeufsData.chartData.oeufsParPeriode[periode][secteur] += eggsCount;
        
        // Données pour graphiques - Par secteur et période
        if (!oeufsData.chartData.oeufsParSecteurEtPeriode[secteur]) {
            oeufsData.chartData.oeufsParSecteurEtPeriode[secteur] = {};
        }
        if (!oeufsData.chartData.oeufsParSecteurEtPeriode[secteur][periode]) {
            oeufsData.chartData.oeufsParSecteurEtPeriode[secteur][periode] = 0;
        }
        oeufsData.chartData.oeufsParSecteurEtPeriode[secteur][periode] += eggsCount;
        
        // Total général
        oeufsData.totalOeufs += eggsCount;
    });
    
    // Calculer les moyennes
    oeufsData.secteurs.forEach(secteur => {
        const secteurData = oeufsData.oeufsParSecteur[secteur];
        secteurData.moyenne = secteurData.nombreEnregistrements > 0 ? 
            secteurData.totalOeufs / secteurData.nombreEnregistrements : 0;
        oeufsData.moyenneOeufsParSecteur[secteur] = secteurData.moyenne;
    });
    
    oeufsData.periodes.forEach(periode => {
        const periodeData = oeufsData.oeufsParPeriode[periode];
        periodeData.moyenne = periodeData.nombreEnregistrements > 0 ? 
            periodeData.totalOeufs / periodeData.nombreEnregistrements : 0;
        oeufsData.moyenneOeufsParPeriode[periode] = periodeData.moyenne;
    });
    
    // Trier les périodes chronologiquement
    oeufsData.periodes.sort((a, b) => {
        const [moisA, anneeA] = a.split(' ');
        const [moisB, anneeB] = b.split(' ');
        const moisIndex = {
            'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
            'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
            'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
        };
        
        if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
        return moisIndex[moisA] - moisIndex[moisB];
    });
    
    console.log('🥚 RÉSUMÉ DES DONNÉES ŒUFS TRAITÉES:');
    console.log(`   • Total œufs: ${oeufsData.totalOeufs}`);
    console.log(`   • Enregistrements: ${oeufsData.totalEnregistrements}`);
    console.log(`   • Secteurs: ${oeufsData.secteurs.join(', ')}`);
    console.log(`   • Périodes: ${oeufsData.periodes.length} (${oeufsData.periodes.join(', ')})`);
    console.log(`   • Environnements: ${oeufsData.environments.join(', ')}`);
    
    return oeufsData;
}

// =====================================================
// FONCTION SPÉCIFIQUE POUR TRAITER LES DONNÉES ŒUFS PAR MOIS
// =====================================================
function processOeufsMoisData(data) {
    console.log('📅 Traitement des données œufs par mois...');
    
    const oeufsMoisData = {
        // Données brutes
        rawData: data,
        
        // Métadonnées
        secteurs: [],
        periodes: [],
        
        // Données pour graphiques - Évolution par mois
        chartData: {
            evolutionParMois: {}, // {periode: {secteur: total}}
            evolutionParSecteur: {} // {secteur: [{periode, total}]}
        },
        
        // Statistiques
        totalOeufs: 0,
        totalEnregistrements: data.length,
        moyenneParMois: {},
        moyenneParSecteur: {}
    };
    
    // Traiter chaque enregistrement
    data.forEach(item => {
        const secteur = item.sector;
        const date = new Date(item.visit_start_date);
        const periode = getPeriode(date);
        const eggsCount = parseInt(item.eggs_count) || 0;
        
        // Ajouter aux listes uniques
        if (!oeufsMoisData.secteurs.includes(secteur)) {
            oeufsMoisData.secteurs.push(secteur);
        }
        if (!oeufsMoisData.periodes.includes(periode)) {
            oeufsMoisData.periodes.push(periode);
        }
        
        // Données pour graphiques - Évolution par mois
        if (!oeufsMoisData.chartData.evolutionParMois[periode]) {
            oeufsMoisData.chartData.evolutionParMois[periode] = {};
        }
        if (!oeufsMoisData.chartData.evolutionParMois[periode][secteur]) {
            oeufsMoisData.chartData.evolutionParMois[periode][secteur] = 0;
        }
        oeufsMoisData.chartData.evolutionParMois[periode][secteur] += eggsCount;
        
        // Données pour graphiques - Évolution par secteur
        if (!oeufsMoisData.chartData.evolutionParSecteur[secteur]) {
            oeufsMoisData.chartData.evolutionParSecteur[secteur] = [];
        }
        
        // Trouver ou créer l'entrée pour cette période
        let secteurData = oeufsMoisData.chartData.evolutionParSecteur[secteur].find(d => d.periode === periode);
        if (!secteurData) {
            secteurData = { periode: periode, total: 0 };
            oeufsMoisData.chartData.evolutionParSecteur[secteur].push(secteurData);
        }
        secteurData.total += eggsCount;
        
        // Total général
        oeufsMoisData.totalOeufs += eggsCount;
    });
    
    // Trier les périodes chronologiquement
    oeufsMoisData.periodes.sort((a, b) => {
        const [moisA, anneeA] = a.split(' ');
        const [moisB, anneeB] = b.split(' ');
        const moisIndex = {
            'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
            'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
            'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
        };
        
        if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
        return moisIndex[moisA] - moisIndex[moisB];
    });
    
    // Trier les données par secteur chronologiquement
    oeufsMoisData.secteurs.forEach(secteur => {
        oeufsMoisData.chartData.evolutionParSecteur[secteur].sort((a, b) => {
            const [moisA, anneeA] = a.periode.split(' ');
            const [moisB, anneeB] = b.periode.split(' ');
            const moisIndex = {
                'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
                'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
                'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
            };
            
            if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
            return moisIndex[moisA] - moisIndex[moisB];
        });
    });
    
    console.log('📅 RÉSUMÉ DES DONNÉES ŒUFS PAR MOIS TRAITÉES:');
    console.log(`   • Total œufs: ${oeufsMoisData.totalOeufs}`);
    console.log(`   • Enregistrements: ${oeufsMoisData.totalEnregistrements}`);
    console.log(`   • Secteurs: ${oeufsMoisData.secteurs.join(', ')}`);
    console.log(`   • Périodes: ${oeufsMoisData.periodes.length} mois (${oeufsMoisData.periodes.join(', ')})`);
    
    return oeufsMoisData;
}

// Fonction utilitaire pour déterminer la période (1 mois)
function getPeriode(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const mois = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return `${mois[month]} ${year}`;
}

// Route pour obtenir le statut de synchronisation
router.get('/sync/status', async (req, res) => {
    try {
        // Simuler un statut de synchronisation
        const status = {
            status: 'success',
            lastSync: new Date().toISOString(),
            recordsCount: 0,
            message: 'Statut récupéré avec succès'
        };
        
        res.json(status);
    } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du statut',
            error: error.message
        });
    }
});

// Route pour enregistrer les données de biologie moléculaire (Nouvelle Architecture)
router.post('/biologie', async (req, res) => {
    try {
        const { form_type, ...formData } = req.body;
        
        console.log('🔵 Données reçues:', { form_type, ...formData });
        
        // Validation du type de formulaire
        if (!form_type || !['pcr_rt_pcr', 'bioessai', 'origine_repas_sanguin'].includes(form_type)) {
            return res.status(400).json({
                success: false,
                message: 'Type de formulaire invalide. Types acceptés: pcr_rt_pcr, bioessai, origine_repas_sanguin'
            });
        }
        
        // Validation des champs communs
        const requiredCommonFields = ['analysis_type', 'sample_stage', 'genus', 'species', 'sector', 'sample_count', 'collection_date', 'analysis_date'];
        for (const field of requiredCommonFields) {
            if (!formData[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Champ obligatoire manquant: ${field}`
                });
            }
        }
        
        // Validation des champs spécifiques selon le type de formulaire
        if (form_type === 'pcr_rt_pcr') {
            const requiredPCRFields = ['identified_species', 'virus_types', 'homozygous_count', 'heterozygous_count', 'total_population'];
            for (const field of requiredPCRFields) {
                if (!formData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Champ PCR obligatoire manquant: ${field}`
                    });
                }
            }
        } else if (form_type === 'bioessai') {
            const requiredBioessaiFields = ['insecticide_types', 'mortality_percentage', 'survival_percentage'];
            for (const field of requiredBioessaiFields) {
                if (!formData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Champ Bioessai obligatoire manquant: ${field}`
                    });
                }
            }
        } else if (form_type === 'origine_repas_sanguin') {
            if (!formData.blood_meal_origins) {
                return res.status(400).json({
                    success: false,
                    message: 'Champ obligatoire manquant: blood_meal_origins'
                });
            }
        }
        
        // Démarrer une transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Insérer dans infos_communes
            const insertInfosQuery = `
                INSERT INTO infos_communes (
                    analysis_type, sample_stage, genus, species, sector, 
                    sample_count, collection_date, analysis_date, complementary_info
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `;
            
            const infosValues = [
                formData.analysis_type,
                formData.sample_stage,
                Array.isArray(formData.genus) ? formData.genus : [formData.genus],
                formData.species,
                formData.sector,
                parseInt(formData.sample_count),
                new Date(formData.collection_date),
                new Date(formData.analysis_date),
                formData.complementary_info || ''
            ];
            
            const infosResult = await client.query(insertInfosQuery, infosValues);
            const infosId = infosResult.rows[0].id;
            
            console.log(`✅ Informations communes insérées avec l'ID: ${infosId}`);
            
            // 2. Insérer dans la table spécifique selon le type
            let specificTableId;
            
            if (form_type === 'pcr_rt_pcr') {
                // Calculer les fréquences alléliques
                const homozygousCount = parseInt(formData.homozygous_count);
                const heterozygousCount = parseInt(formData.heterozygous_count);
                const totalPopulation = parseInt(formData.total_population);
                
                // Formule: f(A) = (2n_AA + n_Aa) / (2N)
                const allelicFrequencyA = (2 * homozygousCount + heterozygousCount) / (2 * totalPopulation);
                const allelicFrequencyAPrime = 1 - allelicFrequencyA;
                
                console.log(`🧬 Fréquences alléliques calculées: A=${allelicFrequencyA.toFixed(4)}, A'=${allelicFrequencyAPrime.toFixed(4)}`);
                
                const insertPCRQuery = `
                    INSERT INTO analyses_pcr (
                        infos_communes_id, identified_species, virus_types,
                        homozygous_count, heterozygous_count, total_population,
                        allelic_frequency_a, allelic_frequency_a_prime
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `;
                
                const pcrValues = [
                    infosId,
                    Array.isArray(formData.identified_species) ? formData.identified_species : [formData.identified_species],
                    Array.isArray(formData.virus_types) ? formData.virus_types : [formData.virus_types],
                    homozygousCount,
                    heterozygousCount,
                    totalPopulation,
                    Math.round(allelicFrequencyA * 10000) / 10000,
                    Math.round(allelicFrequencyAPrime * 10000) / 10000
                ];
                
                const pcrResult = await client.query(insertPCRQuery, pcrValues);
                specificTableId = pcrResult.rows[0].id;
                
                console.log(`✅ Analyse PCR insérée avec l'ID: ${specificTableId}`);
                
            } else if (form_type === 'bioessai') {
                const insertBioessaiQuery = `
                    INSERT INTO analyses_bioessai (
                        infos_communes_id, insecticide_types, mortality_percentage, survival_percentage
                    ) VALUES ($1, $2, $3, $4)
                    RETURNING id
                `;
                
                const bioessaiValues = [
                    infosId,
                    Array.isArray(formData.insecticide_types) ? formData.insecticide_types : [formData.insecticide_types],
                    parseFloat(formData.mortality_percentage),
                    parseFloat(formData.survival_percentage)
                ];
                
                const bioessaiResult = await client.query(insertBioessaiQuery, bioessaiValues);
                specificTableId = bioessaiResult.rows[0].id;
                
                console.log(`✅ Analyse Bioessai insérée avec l'ID: ${specificTableId}`);
                
            } else if (form_type === 'origine_repas_sanguin') {
                const insertRepasQuery = `
                    INSERT INTO analyses_repas_sanguin (
                        infos_communes_id, blood_meal_origins
                    ) VALUES ($1, $2)
                    RETURNING id
                `;
                
                const repasValues = [
                    infosId,
                    Array.isArray(formData.blood_meal_origins) ? formData.blood_meal_origins : [formData.blood_meal_origins]
                ];
                
                const repasResult = await client.query(insertRepasQuery, repasValues);
                specificTableId = repasResult.rows[0].id;
                
                console.log(`✅ Analyse Origine Repas Sanguin insérée avec l'ID: ${specificTableId}`);
            }
            
            // Valider la transaction
            await client.query('COMMIT');
            
            console.log(`🎉 ${form_type} enregistré avec succès!`);
            
            res.json({
                success: true,
                message: `Analyse ${form_type} enregistrée avec succès`,
                data: {
                    infos_communes_id: infosId,
                    specific_table_id: specificTableId,
                    form_type: form_type
                }
            });
            
        } catch (error) {
            // Annuler la transaction en cas d'erreur
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement des données',
            error: error.message
        });
    }
});

// Route pour récupérer les données de biologie moléculaire (Nouvelle Architecture)
router.get('/biologie', async (req, res) => {
    try {
        const { type, sector, start_date, end_date } = req.query;
        
        console.log('🔍 Récupération des données de biologie moléculaire:', { type, sector, start_date, end_date });
        
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        
        // Filtres optionnels
        if (type) {
            whereConditions.push(`ic.analysis_type = $${paramIndex++}`);
            queryParams.push(type);
        }
        
        if (sector) {
            whereConditions.push(`ic.sector = $${paramIndex++}`);
            queryParams.push(sector);
        }
        
        if (start_date) {
            whereConditions.push(`ic.analysis_date >= $${paramIndex++}`);
            queryParams.push(new Date(start_date));
        }
        
        if (end_date) {
            whereConditions.push(`ic.analysis_date <= $${paramIndex++}`);
            queryParams.push(new Date(end_date));
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Requête principale avec JOINs
        const query = `
            SELECT 
                ic.id as infos_id,
                ic.analysis_type,
                ic.sample_stage,
                ic.genus,
                ic.species,
                ic.sector,
                ic.sample_count,
                ic.collection_date,
                ic.analysis_date,
                ic.complementary_info,
                ic.created_at,
                
                -- Données PCR/RT-PCR
                ap.id as pcr_id,
                ap.identified_species,
                ap.virus_types,
                ap.homozygous_count,
                ap.heterozygous_count,
                ap.total_population,
                ap.allelic_frequency_a,
                ap.allelic_frequency_a_prime,
                
                -- Données Bioessai
                ab.id as bioessai_id,
                ab.insecticide_types,
                ab.mortality_percentage,
                ab.survival_percentage,
                
                -- Données Origine Repas Sanguin
                ars.id as repas_id,
                ars.blood_meal_origins
                
            FROM infos_communes ic
            LEFT JOIN analyses_pcr ap ON ic.id = ap.infos_communes_id
            LEFT JOIN analyses_bioessai ab ON ic.id = ab.infos_communes_id
            LEFT JOIN analyses_repas_sanguin ars ON ic.id = ars.infos_communes_id
            ${whereClause}
            ORDER BY ic.analysis_date DESC, ic.created_at DESC
        `;
        
        const result = await pool.query(query, queryParams);
        
        console.log(`✅ ${result.rows.length} enregistrement(s) trouvé(s)`);
        
        res.json({
            success: true,
            message: 'Données récupérées avec succès',
            count: result.rows.length,
            data: result.rows
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données',
            error: error.message
        });
    }
});

// Route pour obtenir les statistiques de biologie moléculaire
router.get('/biologie/statistics', async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques de biologie moléculaire...');
        
        // Statistiques par type d'analyse
        const typeStats = await pool.query(`
            SELECT 
                analysis_type,
                COUNT(*) as count,
                AVG(sample_count) as avg_sample_count
            FROM infos_communes
            GROUP BY analysis_type
            ORDER BY count DESC
        `);
        
        // Statistiques par secteur
        const sectorStats = await pool.query(`
            SELECT 
                sector,
                COUNT(*) as count
            FROM infos_communes
            GROUP BY sector
            ORDER BY count DESC
        `);
        
        // Statistiques des fréquences alléliques (PCR uniquement)
        const allelicStats = await pool.query(`
            SELECT 
                AVG(allelic_frequency_a) as avg_frequency_a,
                AVG(allelic_frequency_a_prime) as avg_frequency_a_prime,
                COUNT(*) as total_pcr_analyses
            FROM analyses_pcr
        `);
        
        // Statistiques des bioessais
        const bioessaiStats = await pool.query(`
            SELECT 
                AVG(mortality_percentage) as avg_mortality,
                AVG(survival_percentage) as avg_survival,
                COUNT(*) as total_bioessai_analyses
            FROM analyses_bioessai
        `);
        
        res.json({
            success: true,
            message: 'Statistiques récupérées avec succès',
            data: {
                by_type: typeStats.rows,
                by_sector: sectorStats.rows,
                allelic_frequencies: allelicStats.rows[0],
                bioessai: bioessaiStats.rows[0]
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});


// ===== ROUTES DE SYNCHRONISATION KOBCOLLECT =====

// Route pour lancer la synchronisation
router.post('/sync', async (req, res) => {
    try {
        const { type } = req.body;
        console.log(`🔄 Début de la synchronisation KoboCollect: ${type}`);
        
        // Créer une instance du service de synchronisation
        const koboSync = new KoboCollectSync();
        
        let result;
        let message = '';
        
        if (type === 'complete') {
            // Synchronisation complète - tous les formulaires
            console.log('🔄 Lancement de la synchronisation complète...');
            result = await koboSync.syncAll();
            message = `Synchronisation complète terminée. ${result.processedCount || result.totalProcessed || 0} données traitées, ${result.errorCount || result.totalErrors || 0} erreurs.`;
            console.log('✅ Synchronisation complète terminée');
            
        } else if (type === 'larves') {
            // Synchronisation des formulaires larves
            console.log('🔄 Lancement de la synchronisation des larves...');
            result = await koboSync.syncForm('gites');
            message = `Synchronisation des données larves terminée. ${result.processed} données traitées, ${result.errors} erreurs.`;
            console.log('✅ Synchronisation larves terminée');
            
        } else if (type === 'oeufs') {
            // Synchronisation des formulaires œufs
            console.log('🔄 Lancement de la synchronisation des œufs...');
            result = await koboSync.syncForm('oeufs');
            message = `Synchronisation des données œufs terminée. ${result.processed} données traitées, ${result.errors} erreurs.`;
            console.log('✅ Synchronisation œufs terminée');
            
        } else if (type === 'adultes') {
            // Synchronisation des formulaires adultes
            console.log('🔄 Lancement de la synchronisation des adultes...');
            result = await koboSync.syncForm('adultes');
            message = `Synchronisation des données moustiques adultes terminée. ${result.processed} données traitées, ${result.errors} erreurs.`;
            console.log('✅ Synchronisation adultes terminée');
            
        } else {
            return res.status(400).json({
                success: false,
                message: 'Type de synchronisation non reconnu'
            });
        }
        
        res.json({
            success: true,
            message: message,
            type: type,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation KoboCollect:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la synchronisation',
            error: error.message
        });
    }
});

// Route pour vérifier le statut de la synchronisation
router.get('/sync/status', async (req, res) => {
    try {
        const householdCount = await pool.query('SELECT COUNT(*) FROM household_visits');
        const breedingCount = await pool.query('SELECT COUNT(*) FROM breeding_sites');
        const eggsCount = await pool.query('SELECT COUNT(*) FROM eggs_collection');
        const adultCount = await pool.query('SELECT COUNT(*) FROM adult_mosquitoes');

        res.json({
            success: true,
            status: 'success',
            lastSync: new Date().toISOString(),
            recordsCount: {
                household_visits: parseInt(householdCount.rows[0].count),
                breeding_sites: parseInt(breedingCount.rows[0].count),
                eggs_collection: parseInt(eggsCount.rows[0].count),
                adult_mosquitoes: parseInt(adultCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
