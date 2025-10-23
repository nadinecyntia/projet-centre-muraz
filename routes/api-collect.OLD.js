const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireInvestigator } = require('../middleware/auth');

// Appliquer le middleware d'authentification pour toutes les routes de collecte
router.use(requireInvestigator);

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Trouve ou crée une maison dans la base de données
 * @param {Object} client - Client de transaction PostgreSQL
 * @param {string} concession_code - Code de la concession
 * @param {string} sector - Secteur
 * @param {string} environment - Environnement (urban/rural)
 * @param {string} gps_coordinates - Coordonnées GPS (optionnel)
 * @returns {Promise<number>} ID de la maison
 */
async function findOrCreateHouse(client, concession_code, sector, environment, gps_coordinates = null) {
    // Rechercher si la maison existe déjà
    const searchResult = await client.query(
        'SELECT id FROM houses WHERE concession_code = $1 AND sector = $2',
        [concession_code, sector]
    );
    
    if (searchResult.rows.length > 0) {
        const house_id = searchResult.rows[0].id;
        console.log(`✅ Maison existante trouvée : ID ${house_id} (${concession_code}, ${sector})`);
        return house_id;
    }
    
    // Créer la maison automatiquement
    const createResult = await client.query(
        `INSERT INTO houses (concession_code, sector, environment, gps_coordinates, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [concession_code, sector, environment, gps_coordinates]
    );
    
    const house_id = createResult.rows[0].id;
    console.log(`✅ Nouvelle maison créée : ID ${house_id} (${concession_code}, ${sector})`);
    return house_id;
}

/**
 * Met à jour les détails optionnels d'une maison (house_code, household_size, etc.)
 * @param {Object} client - Client de transaction PostgreSQL
 * @param {number} house_id - ID de la maison
 * @param {Object} details - Détails à mettre à jour
 */
async function updateHouseDetails(client, house_id, details) {
    const { house_code, household_size, sleeping_unit_count, head_contact } = details;
    
    await client.query(
        `UPDATE houses SET
            house_code = COALESCE($1, house_code),
            household_size = COALESCE($2, household_size),
            sleeping_unit_count = COALESCE($3, sleeping_unit_count),
            head_contact = COALESCE($4, head_contact),
            updated_at = NOW()
         WHERE id = $5`,
        [house_code, household_size, sleeping_unit_count, head_contact, house_id]
    );
    
    console.log(`✅ Détails maison ${house_id} mis à jour`);
}

// ===============================================
// ROUTE : COLLECTE D'ŒUFS
// ===============================================

router.post('/collect/eggs', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            eggs_concession_code,
            eggs_sector,
            eggs_environment,
            eggs_visit_start_date,
            eggs_gps_code,
            nest_number,
            nest_code,
            pass_order,
            eggs_count,
            observations
        } = req.body;
        
        // Validation des données requises
        if (!eggs_concession_code || !eggs_sector || !eggs_environment || !eggs_visit_start_date) {
            return res.status(400).json({
                success: false,
                message: 'Données requises manquantes (concession_code, sector, environment, visit_date)'
            });
        }
        
        if (eggs_count === null || eggs_count === undefined || eggs_count < 0) {
            return res.status(400).json({
                success: false,
                message: 'Le nombre d\'œufs doit être >= 0'
            });
        }
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        const house_id = await findOrCreateHouse(
            client,
            eggs_concession_code,
            eggs_sector,
            eggs_environment,
            eggs_gps_code
        );
        
        // ===== ÉTAPE 2 : INSÉRER LA COLLECTE D'ŒUFS =====
        const eggResult = await client.query(
            `INSERT INTO eggs_collections (
                house_id,
                visit_date,
                investigator_name,
                nest_number,
                nest_code,
                pass_order,
                eggs_count,
                observations,
                status,
                submitted_by,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW(), NOW())
            RETURNING id`,
            [
                house_id,
                eggs_visit_start_date,
                req.session?.user?.username || 'unknown',
                nest_number,
                nest_code,
                pass_order,
                eggs_count,
                observations,
                req.session?.user?.id || null
            ]
        );
        
        await client.query('COMMIT');
        
        console.log(`✅ Collecte d'œufs enregistrée : ID ${eggResult.rows[0].id}`);
        
        res.json({
            success: true,
            message: 'Collecte d\'œufs enregistrée avec succès',
            egg_collection_id: eggResult.rows[0].id,
            house_id: house_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte œufs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de la collecte d\'œufs',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// ===============================================
// ROUTE : COLLECTE DE GÎTES LARVAIRES
// ===============================================

router.post('/collect/breeding', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { house_info, sites } = req.body;
        
        // Validation
        if (!house_info || !sites || !Array.isArray(sites) || sites.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides : house_info et sites[] requis (au moins 1 gîte)'
            });
        }
        
        const {
            concession_code,
            sector,
            environment,
            gps_coordinates,
            house_code,
            household_size,
            sleeping_unit_count,
            head_contact,
            visit_date,
            visit_end_date,
            visit_start_time,
            visit_end_time,
            investigator_name
        } = house_info;
        
        // Validation des champs obligatoires
        if (!concession_code || !sector || !environment || !visit_date || !investigator_name) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants dans house_info'
            });
        }
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        const house_id = await findOrCreateHouse(
            client,
            concession_code,
            sector,
            environment,
            gps_coordinates
        );
        
        // ===== ÉTAPE 2 : UPDATE HOUSE DETAILS =====
        await updateHouseDetails(client, house_id, {
            house_code,
            household_size,
            sleeping_unit_count,
            head_contact
        });
        
        // ===== ÉTAPE 3 : INSÉRER TOUS LES GÎTES =====
        const insertedSites = [];
        
        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            
            const siteResult = await client.query(
                `INSERT INTO breeding_sites (
                    house_id,
                    visit_date,
                    visit_end_date,
                    visit_start_time,
                    visit_end_time,
                    investigator_name,
                    site_number,
                    site_type,
                    site_class,
                    is_positive,
                    larvae_count,
                    larvae_genus,
                    nymphs_count,
                    nymphs_genus,
                    observations,
                    status,
                    submitted_by,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', $16, NOW(), NOW())
                RETURNING id`,
                [
                    house_id,
                    visit_date,
                    visit_end_date || null,
                    visit_start_time || null,
                    visit_end_time || null,
                    investigator_name,
                    site.site_number || (i + 1),
                    site.site_type,
                    site.site_class,
                    site.is_positive || false,
                    site.larvae_count || 0,
                    site.larvae_genus || null,
                    site.nymphs_count || 0,
                    site.nymphs_genus || null,
                    site.observations || null,
                    req.session?.user?.id || null
                ]
            );
            
            insertedSites.push(siteResult.rows[0].id);
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ ${sites.length} gîte(s) enregistré(s) pour maison ${house_id}`);
        
        res.json({
            success: true,
            message: `${sites.length} gîte(s) larvaire(s) enregistré(s) avec succès`,
            house_id: house_id,
            site_ids: insertedSites
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte gîtes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement des gîtes larvaires',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// ===============================================
// ROUTE : COLLECTE DE MOUSTIQUES ADULTES
// ===============================================

router.post('/collect/mosquitoes', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { collection_info, specimens } = req.body;
        
        // Validation
        if (!collection_info) {
            return res.status(400).json({
                success: false,
                message: 'collection_info requis'
            });
        }
        
        const {
            concession_code,
            sector,
            environment,
            gps_coordinates,
            visit_date,
            visit_start_time,
            visit_end_time,
            investigator_name,
            collection_method,
            capture_location,
            traps_count,
            observations
        } = collection_info;
        
        // Validation des champs obligatoires
        if (!concession_code || !sector || !environment || !visit_date || 
            !visit_start_time || !visit_end_time || !collection_method || !capture_location) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants dans collection_info'
            });
        }
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        const house_id = await findOrCreateHouse(
            client,
            concession_code,
            sector,
            environment,
            gps_coordinates
        );
        
        // ===== ÉTAPE 2 : INSÉRER LA COLLECTE =====
        const collectionResult = await client.query(
            `INSERT INTO adult_mosquitoes_collections (
                house_id,
                visit_date,
                visit_start_time,
                visit_end_time,
                investigator_name,
                collection_method,
                capture_location,
                traps_count,
                observations,
                status,
                submitted_by,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, NOW(), NOW())
            RETURNING id`,
            [
                house_id,
                visit_date,
                visit_start_time,
                visit_end_time,
                investigator_name || req.session?.user?.username || 'unknown',
                collection_method,
                capture_location,
                traps_count || 1,
                observations || null,
                req.session?.user?.id || null
            ]
        );
        
        const collection_id = collectionResult.rows[0].id;
        
        // ===== ÉTAPE 3 : INSÉRER TOUS LES SPÉCIMENS =====
        const insertedSpecimens = [];
        
        if (specimens && Array.isArray(specimens) && specimens.length > 0) {
            for (const specimen of specimens) {
                // Validation du spécimen
                if (!specimen.genus || !specimen.sex) {
                    console.warn('⚠️  Spécimen invalide ignoré (genus et sex requis)');
                    continue;
                }
                
                const specimenResult = await client.query(
                    `INSERT INTO mosquito_specimens (
                        collection_id,
                        genus,
                        species,
                        sex,
                        physiological_state,
                        count,
                        observations,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING id`,
                    [
                        collection_id,
                        specimen.genus,
                        specimen.species || null,
                        specimen.sex,
                        specimen.physiological_state || null,
                        specimen.count || 1,
                        specimen.observations || null
                    ]
                );
                
                insertedSpecimens.push(specimenResult.rows[0].id);
            }
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ Collecte moustiques enregistrée : ID ${collection_id} avec ${insertedSpecimens.length} groupe(s) de spécimens`);
        
        res.json({
            success: true,
            message: `Collecte enregistrée avec ${insertedSpecimens.length} groupe(s) de spécimens`,
            house_id: house_id,
            collection_id: collection_id,
            specimen_ids: insertedSpecimens
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte moustiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de la collecte de moustiques',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// ===============================================
// ROUTES DE RÉCUPÉRATION DES TOTAUX CALCULÉS
// ===============================================

// Obtenir le résumé des gîtes pour une maison/date
router.get('/breeding/summary/:house_id/:visit_date', async (req, res) => {
    try {
        const { house_id, visit_date } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM breeding_sites_summary
             WHERE house_id = $1 AND visit_date = $2`,
            [house_id, visit_date]
        );
        
        if (result.rows.length > 0) {
            res.json({
                success: true,
                summary: result.rows[0]
            });
        } else {
            res.json({
                success: true,
                summary: null,
                message: 'Aucun résumé disponible pour cette maison/date'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur récupération résumé gîtes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtenir le résumé d'une collecte de moustiques
router.get('/mosquitoes/summary/:collection_id', async (req, res) => {
    try {
        const { collection_id } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM adult_mosquitoes_summary
             WHERE collection_id = $1`,
            [collection_id]
        );
        
        if (result.rows.length > 0) {
            res.json({
                success: true,
                summary: result.rows[0]
            });
        } else {
            res.json({
                success: true,
                summary: null,
                message: 'Aucun résumé disponible pour cette collecte'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur récupération résumé moustiques:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtenir toutes les collectes d'une maison
router.get('/house/:house_id/all-collections', async (req, res) => {
    try {
        const { house_id } = req.params;
        
        const eggs = await pool.query(
            'SELECT * FROM eggs_collections WHERE house_id = $1 ORDER BY visit_date DESC',
            [house_id]
        );
        
        const breeding = await pool.query(
            'SELECT * FROM breeding_sites_summary WHERE house_id = $1 ORDER BY visit_date DESC',
            [house_id]
        );
        
        const mosquitoes = await pool.query(
            'SELECT * FROM adult_mosquitoes_summary WHERE house_id = $1 ORDER BY visit_date DESC',
            [house_id]
        );
        
        res.json({
            success: true,
            house_id: parseInt(house_id),
            eggs_collections: eggs.rows,
            breeding_summaries: breeding.rows,
            mosquito_collections: mosquitoes.rows
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération collectes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

