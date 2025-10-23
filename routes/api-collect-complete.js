const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireInvestigator } = require('../middleware/auth');

// Appliquer le middleware d'authentification
router.use(requireInvestigator);

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Trouve ou crée une maison
 * Met à jour les champs optionnels s'ils sont fournis
 */
async function findOrCreateHouse(client, houseData) {
    const {
        concession_code,
        sector,
        environment,
        gps_coordinates,
        house_code,
        household_size,
        sleeping_unit_count,
        head_contact
    } = houseData;
    
    // Rechercher la maison
    const searchResult = await client.query(
        'SELECT id FROM houses WHERE concession_code = $1 AND sector = $2',
        [concession_code, sector]
    );
    
    if (searchResult.rows.length > 0) {
        const house_id = searchResult.rows[0].id;
        console.log(`✅ Maison existante : ${concession_code} (ID: ${house_id})`);
        
        // Mettre à jour les champs optionnels s'ils sont fournis
        await client.query(
            `UPDATE houses SET
                gps_coordinates = COALESCE($1, gps_coordinates),
                house_code = COALESCE($2, house_code),
                household_size = COALESCE($3, household_size),
                sleeping_unit_count = COALESCE($4, sleeping_unit_count),
                head_contact = COALESCE($5, head_contact),
                updated_at = NOW()
             WHERE id = $6`,
            [gps_coordinates, house_code, household_size, sleeping_unit_count, head_contact, house_id]
        );
        
        return house_id;
    }
    
    // Créer la maison
    const createResult = await client.query(
        `INSERT INTO houses (
            concession_code, sector, environment, gps_coordinates,
            house_code, household_size, sleeping_unit_count, head_contact,
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id`,
        [
            concession_code, sector, environment, gps_coordinates,
            house_code, household_size, sleeping_unit_count, head_contact
        ]
    );
    
    const house_id = createResult.rows[0].id;
    console.log(`✅ Nouvelle maison créée : ${concession_code} (ID: ${house_id})`);
    return house_id;
}

// ===============================================
// ROUTE 1 : COLLECTE D'ŒUFS
// ===============================================

router.post('/collect/eggs', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            // Infos maison (préfixées "eggs_" dans le frontend)
            eggs_concession_code,
            eggs_sector,
            eggs_environment,
            eggs_gps_code,
            
            // Infos collecte
            eggs_visit_start_date,
            nest_number,
            nest_code,
            pass_order,
            eggs_count,
            observations
        } = req.body;
        
        // Validation
        if (!eggs_concession_code || !eggs_sector || !eggs_environment || !eggs_visit_start_date) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Champs requis manquants'
            });
        }
        
        // 1. Trouver ou créer la maison
        const house_id = await findOrCreateHouse(client, {
            concession_code: eggs_concession_code,
            sector: eggs_sector,
            environment: eggs_environment,
            gps_coordinates: eggs_gps_code || null
        });
        
        // 2. Créer la collecte d'œufs
        const result = await client.query(
            `INSERT INTO eggs_collections (
                house_id, visit_date, nest_number, nest_code, pass_order,
                eggs_count, observations, status, submitted_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
            RETURNING id`,
            [
                house_id,
                eggs_visit_start_date,
                nest_number || null,
                nest_code || null,
                pass_order || null,
                parseInt(eggs_count) || 0,
                observations || null,
                req.user?.id || null
            ]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Collecte d\'œufs enregistrée',
            egg_collection_id: result.rows[0].id,
            house_id: house_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte œufs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
});

// ===============================================
// ROUTE 2 : COLLECTE DE GÎTES LARVAIRES
// ===============================================

router.post('/collect/breeding', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            // Infos maison
            concession_code,
            sector,
            environment,
            gps_coordinates,
            house_code,
            household_size,
            sleeping_unit_count,
            head_contact,
            
            // Infos visite
            visit_date,
            investigator_name,
            visit_start_time,
            visit_end_time,
            
            // Types et classes de gîtes
            sites_types,
            site_classes,
            
            // État du gîte
            site_state,
            
            // Larves par genre
            aedes_larvae_count,
            culex_larvae_count,
            anopheles_larvae_count,
            other_larvae_count,
            larvae_count,
            
            // Nymphes par genre
            aedes_nymphs_count,
            culex_nymphs_count,
            anopheles_nymphs_count,
            other_nymphs_count,
            nymphs_count,
            
            observations
        } = req.body;
        
        // Validation
        if (!concession_code || !sector || !environment || !visit_date || !investigator_name || !sites_types || !site_classes || !site_state) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Champs requis manquants (concession_code, sector, environment, visit_date, investigator_name, sites_types, site_classes, site_state)'
            });
        }
        
        // 1. Trouver ou créer la maison
        const house_id = await findOrCreateHouse(client, {
            concession_code,
            sector,
            environment,
            gps_coordinates: gps_coordinates || null,
            house_code: house_code || null,
            household_size: household_size ? parseInt(household_size) : null,
            sleeping_unit_count: sleeping_unit_count ? parseInt(sleeping_unit_count) : null,
            head_contact: head_contact || null
        });
        
        // Calculer les totaux automatiquement
        const aedes_larvae = parseInt(aedes_larvae_count) || 0;
        const culex_larvae = parseInt(culex_larvae_count) || 0;
        const anopheles_larvae = parseInt(anopheles_larvae_count) || 0;
        const other_larvae = parseInt(other_larvae_count) || 0;
        const total_larvae = aedes_larvae + culex_larvae + anopheles_larvae + other_larvae;
        
        const aedes_nymphs = parseInt(aedes_nymphs_count) || 0;
        const culex_nymphs = parseInt(culex_nymphs_count) || 0;
        const anopheles_nymphs = parseInt(anopheles_nymphs_count) || 0;
        const other_nymphs = parseInt(other_nymphs_count) || 0;
        const total_nymphs = aedes_nymphs + culex_nymphs + anopheles_nymphs + other_nymphs;
        
        console.log(`📊 Larves: ${aedes_larvae} + ${culex_larvae} + ${anopheles_larvae} + ${other_larvae} = ${total_larvae}`);
        console.log(`📊 Nymphes: ${aedes_nymphs} + ${culex_nymphs} + ${anopheles_nymphs} + ${other_nymphs} = ${total_nymphs}`);
        
        // 2. Créer l'enregistrement de gîte individuel
        const result = await client.query(
            `INSERT INTO breeding_sites (
                house_id, visit_date, investigator_name,
                visit_start_time, visit_end_time,
                sites_types, site_classes, site_state,
                aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count, larvae_count,
                aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count, nymphs_count,
                observations, status, submitted_by, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, 'pending', $20, NOW(), NOW()
            ) RETURNING id`,
            [
                house_id,
                visit_date,
                investigator_name,
                visit_start_time || null,
                visit_end_time || null,
                sites_types || [],  // ← ARRAY
                site_classes || [],  // ← ARRAY
                site_state,
                aedes_larvae,
                culex_larvae,
                anopheles_larvae,
                other_larvae,
                total_larvae,  // ← CALCULÉ AUTOMATIQUEMENT
                aedes_nymphs,
                culex_nymphs,
                anopheles_nymphs,
                other_nymphs,
                total_nymphs,  // ← CALCULÉ AUTOMATIQUEMENT
                observations || null,
                req.user?.id || null
            ]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Gîte larvaire enregistré',
            breeding_site_id: result.rows[0].id,
            house_id: house_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte gîtes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
});

// ===============================================
// ROUTE 3 : COLLECTE DE MOUSTIQUES ADULTES
// ===============================================

router.post('/collect/mosquitoes', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            // Infos maison
            concession_code,
            sector,
            environment,
            gps_coordinates,
            
            // Infos collecte
            visit_date,
            visit_start_time,
            visit_end_time,
            investigator_name,
            collection_methods,
            capture_locations,
            
            // Pièges
            prokopack_traps_count,
            bg_traps_count,
            prokopack_mosquitoes_count,
            bg_trap_mosquitoes_count,
            
            // Comptages par sexe
            male_count,
            female_count,
            
            // Mâles par genre
            aedes_male_count,
            culex_male_count,
            anopheles_male_count,
            other_male_count,
            
            // Femelles par état
            blood_fed_females_count,
            gravid_females_count,
            starved_females_count,
            
            // Par genre (tous sexes)
            mosquitoes_aedes_count,
            mosquitoes_culex_count,
            mosquitoes_anopheles_count,
            mosquitoes_other_count,
            
            observations
        } = req.body;
        
        // Validation
        if (!concession_code || !sector || !environment || !visit_date || 
            !visit_start_time || !visit_end_time) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Champs requis manquants'
            });
        }
        
        // 1. Trouver ou créer la maison
        const house_id = await findOrCreateHouse(client, {
            concession_code,
            sector,
            environment,
            gps_coordinates: gps_coordinates || null
        });
        
        // Calculer le total automatiquement
        const males = parseInt(male_count) || 0;
        const females = parseInt(female_count) || 0;
        const total_mosquitoes = males + females;
        
        console.log(`📊 Moustiques: ${males} mâles + ${females} femelles = ${total_mosquitoes} total`);
        
        // 2. Créer la collecte de moustiques
        const result = await client.query(
            `INSERT INTO adult_mosquitoes_collections (
                house_id, visit_date, visit_start_time, visit_end_time, investigator_name,
                collection_methods, capture_locations,
                prokopack_traps_count, bg_traps_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                total_mosquitoes_count, male_count, female_count,
                aedes_male_count, culex_male_count, anopheles_male_count, other_male_count,
                blood_fed_females_count, gravid_females_count, starved_females_count,
                mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                observations, status, submitted_by, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
                $26, 'pending', $27, NOW(), NOW()
            ) RETURNING id`,
            [
                house_id,
                visit_date,
                visit_start_time,
                visit_end_time,
                investigator_name || null,
                collection_methods || null,
                capture_locations || null,
                parseInt(prokopack_traps_count) || 0,
                parseInt(bg_traps_count) || 0,
                parseInt(prokopack_mosquitoes_count) || 0,
                parseInt(bg_trap_mosquitoes_count) || 0,
                total_mosquitoes,  // ← CALCULÉ AUTOMATIQUEMENT
                males,
                females,
                parseInt(aedes_male_count) || 0,
                parseInt(culex_male_count) || 0,
                parseInt(anopheles_male_count) || 0,
                parseInt(other_male_count) || 0,
                parseInt(blood_fed_females_count) || 0,
                parseInt(gravid_females_count) || 0,
                parseInt(starved_females_count) || 0,
                parseInt(mosquitoes_aedes_count) || 0,
                parseInt(mosquitoes_culex_count) || 0,
                parseInt(mosquitoes_anopheles_count) || 0,
                parseInt(mosquitoes_other_count) || 0,
                observations || null,
                req.user?.id || null
            ]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Collecte de moustiques enregistrée',
            collection_id: result.rows[0].id,
            house_id: house_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte moustiques:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;

