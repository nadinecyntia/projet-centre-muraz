const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

/**
 * Route API pour la Biologie Moléculaire
 * Accès restreint aux SUPER_ADMIN uniquement
 */

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);
router.use(requireSuperAdmin);

/**
 * GET /api/biologie
 * Récupère toutes les données de biologie moléculaire
 */
router.get('/', async (req, res) => {
    try {
        console.log('🧬 Récupération des données de biologie moléculaire...');
        
        const query = `
            SELECT 
                ic.id,
                ic.analysis_type,
                ic.analysis_date,
                ic.genus,
                ic.species,
                ic.complementary_info,
                ic.sample_stage,
                ic.sector,
                ic.sample_count,
                ic.collection_date,
                ic.created_at,
                ic.updated_at,
                -- Données PCR (colonnes réelles)
                pcr.allelic_frequency_a,
                pcr.allelic_frequency_a_prime,
                pcr.identified_species,
                pcr.virus_types,
                pcr.homozygous_count,
                pcr.heterozygous_count,
                pcr.total_population,
                -- Données Bioessai (colonnes réelles)
                bio.mortality_percentage,
                bio.survival_percentage,
                bio.insecticide_types,
                -- Données Repas Sanguin (colonnes réelles)
                repas.blood_meal_origins
            FROM infos_communes ic
            LEFT JOIN analyses_pcr pcr ON ic.id = pcr.infos_communes_id
            LEFT JOIN analyses_bioessai bio ON ic.id = bio.infos_communes_id
            LEFT JOIN analyses_repas_sanguin repas ON ic.id = repas.infos_communes_id
            ORDER BY ic.analysis_date DESC, ic.created_at DESC
        `;
        
        const result = await pool.query(query);
        
        console.log(`✅ ${result.rows.length} enregistrements de biologie moléculaire récupérés`);
        if (result.rows.length > 0) {
            console.log('🔍 Premier enregistrement:', result.rows[0]);
            console.log('🔍 Clés du premier enregistrement:', Object.keys(result.rows[0]));
        }
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données de biologie moléculaire:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des données',
            details: error.message
        });
    }
});

/**
 * GET /api/biologie/statistics
 * Récupère les statistiques pour les graphiques
 */
router.get('/statistics', async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques de biologie moléculaire...');
        
        // Statistiques générales
        const generalStats = await pool.query(`
            SELECT 
                COUNT(*) as total_analyses,
                COUNT(CASE WHEN ic.analysis_type LIKE '%pcr%' OR ic.analysis_type LIKE '%PCR%' THEN 1 END) as pcr_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%bioessai%' OR ic.analysis_type LIKE '%bioassay%' THEN 1 END) as bioessai_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%repas%' OR ic.analysis_type LIKE '%blood%' OR ic.analysis_type LIKE '%meal%' THEN 1 END) as repas_count
            FROM infos_communes ic
        `);
        
        // Statistiques par genre de moustique
        const genusStats = await pool.query(`
            SELECT 
                unnest(ic.genus) as genus,
                COUNT(*) as count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%pcr%' OR ic.analysis_type LIKE '%PCR%' THEN 1 END) as pcr_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%bioessai%' OR ic.analysis_type LIKE '%bioassay%' THEN 1 END) as bioessai_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%repas%' OR ic.analysis_type LIKE '%blood%' OR ic.analysis_type LIKE '%meal%' THEN 1 END) as repas_count
            FROM infos_communes ic
            WHERE ic.genus IS NOT NULL AND array_length(ic.genus, 1) > 0
            GROUP BY unnest(ic.genus)
            ORDER BY genus
        `);
        
        // Statistiques par mois
        const monthlyStats = await pool.query(`
            SELECT 
                DATE_TRUNC('month', ic.analysis_date) as month,
                COUNT(*) as count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%pcr%' OR ic.analysis_type LIKE '%PCR%' THEN 1 END) as pcr_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%bioessai%' OR ic.analysis_type LIKE '%bioassay%' THEN 1 END) as bioessai_count,
                COUNT(CASE WHEN ic.analysis_type LIKE '%repas%' OR ic.analysis_type LIKE '%blood%' OR ic.analysis_type LIKE '%meal%' THEN 1 END) as repas_count
            FROM infos_communes ic
            GROUP BY DATE_TRUNC('month', ic.analysis_date)
            ORDER BY month DESC
            LIMIT 12
        `);
        
        console.log('✅ Statistiques de biologie moléculaire récupérées');
        
        res.json({
            success: true,
            data: {
                general: generalStats.rows[0],
                byGenus: genusStats.rows,
                byMonth: monthlyStats.rows
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message
        });
    }
});

/**
 * POST /api/biologie
 * Crée une nouvelle analyse de biologie moléculaire
 */
router.post('/', async (req, res) => {
    try {
        console.log('🧬 Création d\'une nouvelle analyse de biologie moléculaire...');
        
        const {
            analysis_type,
            sector,
            species,
            genus,
            sample_stage,
            sample_count,
            collection_date,
            analysis_date,
            // Données PCR/RT-PCR
            allelic_frequency_a,
            allelic_frequency_a_prime,
            identified_species,
            virus_types,
            homozygous_count,
            heterozygous_count,
            total_population,
            // Données Bioessai
            mortality_percentage,
            survival_percentage,
            insecticide_types,
            // Données Repas Sanguin
            blood_meal_origins,
            // Informations complémentaires
            complementary_info,
            // Données molecular_biology
            gene_analyzed,
            virus_tested,
            result,
            viral_load,
            blood_meal_origin,
            animal_species,
            human_percentage,
            animal_percentage
        } = req.body;
        
        // Validation des données obligatoires
        if (!analysis_type || !sector || !species || !sample_count || !analysis_date) {
            return res.status(400).json({
                success: false,
                error: 'Champs obligatoires manquants',
                required: ['analysis_type', 'sector', 'species', 'sample_count', 'analysis_date']
            });
        }
        
        // Insérer d'abord dans infos_communes
        const infosQuery = `
            INSERT INTO infos_communes (
                analysis_type, sample_stage, genus, species, sector, sample_count,
                collection_date, analysis_date, complementary_info
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) RETURNING id
        `;
        
        // Convertir genus en tableau si c'est une chaîne
        const genusArray = Array.isArray(genus) ? genus : (genus ? [genus] : null);
        
        const infosValues = [
            analysis_type, sample_stage, genusArray, species, sector, sample_count,
            collection_date, analysis_date, complementary_info
        ];
        
        const infosResult = await pool.query(infosQuery, infosValues);
        const infosId = infosResult.rows[0].id;
        
        // Insérer dans la table spécifique selon le type d'analyse
        let specificId = infosId;
        
        if (analysis_type === 'pcr' || analysis_type === 'rt_pcr') {
            // Insérer dans analyses_pcr (colonnes réelles)
            const pcrQuery = `
                INSERT INTO analyses_pcr (
                    infos_communes_id, allelic_frequency_a, allelic_frequency_a_prime, 
                    identified_species, virus_types, homozygous_count, heterozygous_count, total_population
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8
                ) RETURNING id
            `;
            
            const pcrValues = [
                infosId, allelic_frequency_a, allelic_frequency_a_prime, 
                identified_species, virus_types, homozygous_count, heterozygous_count, total_population
            ];
            
            const pcrResult = await pool.query(pcrQuery, pcrValues);
            specificId = pcrResult.rows[0].id;
            
        } else if (analysis_type === 'bioessai') {
            // Insérer dans analyses_bioessai
            const bioQuery = `
                INSERT INTO analyses_bioessai (
                    infos_communes_id, mortality_percentage, survival_percentage, insecticide_types
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING id
            `;
            
            const bioValues = [
                infosId, mortality_percentage, survival_percentage, insecticide_types
            ];
            
            const bioResult = await pool.query(bioQuery, bioValues);
            specificId = bioResult.rows[0].id;
            
        } else if (analysis_type === 'origine_repas_sanguin') {
            // Insérer dans analyses_repas_sanguin (colonnes réelles)
            const repasQuery = `
                INSERT INTO analyses_repas_sanguin (
                    infos_communes_id, blood_meal_origins
                ) VALUES (
                    $1, $2
                ) RETURNING id
            `;
            
            const repasValues = [
                infosId, blood_meal_origins
            ];
            
            const repasResult = await pool.query(repasQuery, repasValues);
            specificId = repasResult.rows[0].id;
        }
        
        console.log(`✅ Analyse de biologie moléculaire créée avec l'ID: ${specificId}`);
        
        res.status(201).json({
            success: true,
            message: 'Analyse créée avec succès',
            data: { id: specificId }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'analyse:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de l\'analyse',
            details: error.message
        });
    }
});

/**
 * PUT /api/biologie/:id
 * Met à jour une analyse de biologie moléculaire
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🧬 Mise à jour de l'analyse ${id}...`);
        
        const {
            analysis_type,
            sector,
            species,
            genus,
            sample_stage,
            sample_count,
            collection_date,
            analysis_date,
            allelic_frequency_a,
            allelic_frequency_a_prime,
            identified_species,
            virus_types,
            homozygous_count,
            heterozygous_count,
            total_population,
            mortality_percentage,
            survival_percentage,
            insecticide_types,
            blood_meal_origins,
            complementary_info,
            // Données molecular_biology
            gene_analyzed,
            virus_tested,
            result,
            viral_load,
            blood_meal_origin,
            animal_species,
            human_percentage,
            animal_percentage
        } = req.body;
        
        // Convertir genus en tableau si c'est une chaîne
        const genusArray = Array.isArray(genus) ? genus : (genus ? [genus] : null);
        
        // Mettre à jour d'abord infos_communes
        const infosQuery = `
            UPDATE infos_communes SET
                analysis_type = $1,
                sample_stage = $2,
                genus = $3,
                species = $4,
                sector = $5,
                sample_count = $6,
                collection_date = $7,
                analysis_date = $8,
                complementary_info = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING id
        `;
        
        const infosValues = [
            analysis_type, sample_stage, genusArray, species, sector, sample_count,
            collection_date, analysis_date, complementary_info, id
        ];
        
        const infosResult = await pool.query(infosQuery, infosValues);
        
        if (infosResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Analyse non trouvée'
            });
        }
        
        console.log(`✅ Analyse ${id} mise à jour avec succès`);
        
        res.json({
            success: true,
            message: 'Analyse mise à jour avec succès',
            data: { id: infosResult.rows[0].id }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'analyse:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour de l\'analyse',
            details: error.message
        });
    }
});

/**
 * DELETE /api/biologie/:id
 * Supprime une analyse de biologie moléculaire
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🧬 Suppression de l'analyse ${id}...`);
        
        const query = 'DELETE FROM infos_communes WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Analyse non trouvée'
            });
        }
        
        console.log(`✅ Analyse ${id} supprimée avec succès`);
        
        res.json({
            success: true,
            message: 'Analyse supprimée avec succès'
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'analyse:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'analyse',
            details: error.message
        });
    }
});

module.exports = router;
