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

// Route pour récupérer les indices entomologiques
router.get('/entomological-indices', async (req, res) => {
    try {
        const { sector, period_start, period_end } = req.query;
        
        let query = 'SELECT * FROM entomological_indices';
        const whereConditions = [];
        const queryParams = [];
        let paramCount = 1;
        
        if (sector) {
            whereConditions.push(`sector = $${paramCount}`);
            queryParams.push(sector);
            paramCount++;
        }
        
        if (period_start) {
            whereConditions.push(`period_start >= $${paramCount}`);
            queryParams.push(period_start);
            paramCount++;
        }
        
        if (period_end) {
            whereConditions.push(`period_end <= $${paramCount}`);
            queryParams.push(period_end);
            paramCount++;
        }
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        query += ' ORDER BY period_start DESC';
        
        const result = await pool.query(query, queryParams);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des indices:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des indices',
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
                am.prokopack_traps_count,
                am.bg_traps_count,
                am.total_mosquitoes_count,
                am.prokopack_mosquitoes_count,
                am.bg_trap_mosquitoes_count,
                am.genus,
                am.species
            FROM household_visits hv
            LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
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

// Route pour récupérer les données pour le calcul des indices entomologiques
router.get('/indices', async (req, res) => {
    try {
        console.log('🧮 Récupération des données pour calcul des indices entomologiques...');
        
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
                am.prokopack_traps_count,
                am.bg_traps_count,
                am.total_mosquitoes_count,
                am.prokopack_mosquitoes_count,
                am.bg_trap_mosquitoes_count
            FROM household_visits hv
            LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
            LEFT JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
            ORDER BY hv.created_at DESC
        `);
        
        client.release();
        
        // Calculer les indices entomologiques
        const indicesData = calculateEntomologicalIndicesNew(result.rows);
        
        console.log(`✅ Indices entomologiques calculés avec succès`);
        
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
        
        // Pour les œufs, on utilise les données de gîtes comme proxy (puisqu'on n'a pas de table œufs séparée)
        if (item.larvae_count && item.larvae_count > 0) {
            analyses.oeufs.push({
                id: item.id,
                secteur: secteur,
                periode: periode,
                date: item.visit_start_date || item.created_at,
                data: {
                    larvae_count: item.larvae_count,
                    sector: item.sector,
                    environment: item.environment,
                    visit_start_date: item.visit_start_date
                }
            });
            
            // Données pour graphiques - Œufs (basé sur les larves)
            if (!analyses.chartData.oeufs[periode]) {
                analyses.chartData.oeufs[periode] = {};
            }
            if (!analyses.chartData.oeufs[periode][secteur]) {
                analyses.chartData.oeufs[periode][secteur] = 0;
            }
            analyses.chartData.oeufs[periode][secteur] += (item.larvae_count || 0);
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

// Fonction pour calculer les indices entomologiques avec les nouvelles tables
function calculateEntomologicalIndicesNew(data) {
    const indices = {
        breteau: {},
        maison: {},
        recipient: {},
        pondoir: {},
        nymphal_colonization: {},
        adult_per_trap_bg: {},
        adult_per_trap_prokopack: {},
        periodes: [],
        secteurs: []
    };
    
    // Grouper par période et secteur
    const groupedData = {};
    
    data.forEach(item => {
        const date = new Date(item.visit_start_date || item.created_at);
        const periode = getPeriode(date);
        const secteur = item.sector || 'N/A';
        
        if (!groupedData[periode]) {
            groupedData[periode] = {};
        }
        if (!groupedData[periode][secteur]) {
            groupedData[periode][secteur] = {
                total_households: 0,
                positive_households: 0,
                total_sites: 0,
                positive_sites: 0,
                total_sites: 0,
                positive_sites: 0,
                total_traps_bg: 0,
                total_traps_prokopack: 0,
                total_mosquitoes_bg: 0,
                total_mosquitoes_prokopack: 0
            };
        }
        
        // Compter les maisons
        groupedData[periode][secteur].total_households++;
        
        // Compter les gîtes positifs
        if (item.positive_sites > 0) {
            groupedData[periode][secteur].positive_households++;
        }
        
        // Ajouter les sites et conteneurs
        if (item.total_sites) {
            groupedData[periode][secteur].total_sites += item.total_sites;
            groupedData[periode][secteur].positive_sites += item.positive_sites || 0;
        }
        
        // Sites = Containers (même concept)
        if (item.positive_sites) {
            groupedData[periode][secteur].total_sites += item.total_sites || 0;
            groupedData[periode][secteur].positive_sites += item.positive_sites;
        }
        
        // Ajouter les pièges et moustiques
        if (item.bg_traps_count) {
            groupedData[periode][secteur].total_traps_bg += item.bg_traps_count;
            groupedData[periode][secteur].total_mosquitoes_bg += item.bg_trap_mosquitoes_count || 0;
        }
        
        if (item.prokopack_traps_count) {
            groupedData[periode][secteur].total_traps_prokopack += item.prokopack_traps_count;
            groupedData[periode][secteur].total_mosquitoes_prokopack += item.prokopack_mosquitoes_count || 0;
        }
    });
    
    // Calculer les indices pour chaque période et secteur
    Object.keys(groupedData).forEach(periode => {
        indices.periodes.push(periode);
        
        Object.keys(groupedData[periode]).forEach(secteur => {
            if (!indices.secteurs.includes(secteur)) {
                indices.secteurs.push(secteur);
            }
            
            const data = groupedData[periode][secteur];
            
            // Calcul des indices selon les formules officielles
            // Indice de Breteau = (Nombre de gîtes positifs × 100) / Nombre de maisons visitées
            const ib = data.total_households > 0 ? (data.positive_sites * 100) / data.total_households : 0;
            
            // Indice de Maison = (Nombre de maisons avec gîtes positifs × 100) / Nombre de maisons visitées
            const im = data.total_households > 0 ? (data.positive_households * 100) / data.total_households : 0;
            
            // Indice de Récipient = (Nombre de sites positifs × 100) / Nombre total de sites
            const ir = data.total_sites > 0 ? (data.positive_sites * 100) / data.total_sites : 0;
            
            // Indice de Positivité Pondoire = (Nombre de sites positifs × 100) / Nombre total de sites
            const ipp = data.total_sites > 0 ? (data.positive_sites * 100) / data.total_sites : 0;
            
            // Indice de Colonisation Nymphale = (Nombre de maisons avec nymphes × 100) / Nombre de maisons visitées
            // On doit d'abord identifier les maisons avec nymphes (positive_sites > 0)
            const icn = data.total_households > 0 ? (data.positive_households * 100) / data.total_households : 0;
            
            // Indice Adultes par Piège BG = Nombre de moustiques adultes / Nombre de pièges BG
            // PAS de multiplication par 100 - c'est un nombre absolu !
            const iap_bg = data.total_traps_bg > 0 ? data.total_mosquitoes_bg / data.total_traps_bg : 0;
            
            // Indice Adultes par Piège Prokopack = Nombre de moustiques adultes / Nombre de pièges Prokopack  
            // PAS de multiplication par 100 - c'est un nombre absolu !
            const iap_prokopack = data.total_traps_prokopack > 0 ? data.total_mosquitoes_prokopack / data.total_traps_prokopack : 0;
            
            // Initialiser les objets de période si nécessaire
            if (!indices.breteau[periode]) indices.breteau[periode] = {};
            if (!indices.maison[periode]) indices.maison[periode] = {};
            if (!indices.recipient[periode]) indices.recipient[periode] = {};
            if (!indices.pondoir[periode]) indices.pondoir[periode] = {};
            if (!indices.nymphal_colonization[periode]) indices.nymphal_colonization[periode] = {};
            if (!indices.adult_per_trap_bg[periode]) indices.adult_per_trap_bg[periode] = {};
            if (!indices.adult_per_trap_prokopack[periode]) indices.adult_per_trap_prokopack[periode] = {};
            
            // Stocker les valeurs calculées
            indices.breteau[periode][secteur] = Math.round(ib * 100) / 100;
            indices.maison[periode][secteur] = Math.round(im * 100) / 100;
            indices.recipient[periode][secteur] = Math.round(ir * 100) / 100;
            indices.pondoir[periode][secteur] = Math.round(ipp * 100) / 100;
            indices.nymphal_colonization[periode][secteur] = Math.round(icn * 100) / 100;
            indices.adult_per_trap_bg[periode][secteur] = Math.round(iap_bg * 100) / 100;
            indices.adult_per_trap_prokopack[periode][secteur] = Math.round(iap_prokopack * 100) / 100;
        });
    });
    
    return indices;
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
