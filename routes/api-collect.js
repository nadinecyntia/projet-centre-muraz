const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Route pour collecter les données d'œufs
router.post('/collect/eggs', async (req, res) => {
    try {
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
        if (!eggs_sector || !eggs_visit_start_date || !eggs_count || !eggs_gps_code) {
            return res.status(400).json({
                success: false,
                message: 'Données requises manquantes (eggs_sector, eggs_visit_start_date, eggs_count, eggs_gps_code sont obligatoires)'
            });
        }

        const query = `
            INSERT INTO eggs_collection_new (
                eggs_concession_code,
                eggs_sector,
                eggs_environment,
                eggs_visit_start_date,
                eggs_gps_code,
                nest_number,
                nest_code,
                pass_order,
                eggs_count,
                observations,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
            RETURNING id
        `;

        const values = [
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
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Données d\'œufs enregistrées avec succès',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des œufs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement des données d\'œufs',
            error: error.message
        });
    }
});

// Route pour collecter les données de gîtes larvaires
router.post('/collect/breeding', async (req, res) => {
    try {
        const {
            site_investigator_name,
            site_concession_code,
            site_house_code,
            site_sector,
            site_environment,
            site_visit_start_date,
            site_visit_end_date,
            site_gps_code,
            site_household_size,
            site_sleeping_unit_count,
            site_head_contact,
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
            aedes_nymphs_count,
            culex_nymphs_count,
            anopheles_nymphs_count,
            other_nymphs_count,
            sites_types,
            site_classes,
            observations
        } = req.body;

        // Validation des données requises
        if (!site_investigator_name || !site_sector || !site_visit_start_date || !site_gps_code || 
            !total_sites_count || !positive_sites_count || !negative_sites_count || !larvae_count || 
            !larvae_genus || !aedes_larvae_count || !culex_larvae_count || !anopheles_larvae_count || 
            !other_larvae_count || !nymphs_count || !nymphs_genus || !aedes_nymphs_count || 
            !culex_nymphs_count || !anopheles_nymphs_count || !other_nymphs_count || 
            !sites_types || !site_classes) {
            return res.status(400).json({
                success: false,
                message: 'Données requises manquantes pour les gîtes larvaires'
            });
        }

        const query = `
            INSERT INTO breeding_sites_new (
                site_investigator_name,
                site_concession_code,
                site_house_code,
                site_sector,
                site_environment,
                site_visit_start_date,
                site_visit_end_date,
                site_gps_code,
                site_household_size,
                site_sleeping_unit_count,
                site_head_contact,
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
                aedes_nymphs_count,
                culex_nymphs_count,
                anopheles_nymphs_count,
                other_nymphs_count,
                sites_types,
                site_classes,
                observations,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, 'pending', NOW())
            RETURNING id
        `;

        const values = [
            site_investigator_name,
            site_concession_code,
            site_house_code,
            site_sector,
            site_environment,
            site_visit_start_date,
            site_visit_end_date,
            site_gps_code,
            site_household_size,
            site_sleeping_unit_count,
            site_head_contact,
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
            aedes_nymphs_count,
            culex_nymphs_count,
            anopheles_nymphs_count,
            other_nymphs_count,
            sites_types,
            site_classes,
            observations
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Données de gîtes larvaires enregistrées avec succès',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des gîtes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement des données de gîtes larvaires',
            error: error.message
        });
    }
});

// Route pour collecter les données de moustiques adultes
router.post('/collect/mosquitoes', async (req, res) => {
    try {
        const {
            mosquitoes_concession_code,
            mosquitoes_sector,
            mosquitoes_environment,
            mosquitoes_visit_start_date,
            mosquitoes_gps_code,
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
            observations
        } = req.body;

        // Validation des données requises
        if (!mosquitoes_sector || !mosquitoes_visit_start_date || 
            !mosquitoes_gps_code || !genus || !species || !collection_methods || 
            !prokopack_traps_count || !bg_traps_count || !capture_locations || 
            !prokopack_mosquitoes_count || !bg_trap_mosquitoes_count || !total_mosquitoes_count || 
            !male_count || !female_count || !blood_fed_females_count || !gravid_females_count || 
            !starved_females_count || !mosquitoes_aedes_count || !mosquitoes_culex_count || 
            !mosquitoes_anopheles_count || !mosquitoes_other_count) {
            return res.status(400).json({
                success: false,
                message: 'Données requises manquantes pour les moustiques adultes (incluant les comptes par genre)'
            });
        }

        const query = `
            INSERT INTO adult_mosquitoes_new (
                mosquitoes_concession_code,
                mosquitoes_sector,
                mosquitoes_environment,
                mosquitoes_visit_start_date,
                mosquitoes_gps_code,
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
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
            RETURNING id
        `;

        const values = [
            mosquitoes_concession_code,
            mosquitoes_sector,
            mosquitoes_environment,
            mosquitoes_visit_start_date,
            mosquitoes_gps_code,
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
            'pending',
            new Date()
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Données de moustiques adultes enregistrées avec succès',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des moustiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement des données de moustiques adultes',
            error: error.message
        });
    }
});

module.exports = router;
