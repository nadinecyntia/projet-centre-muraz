const express = require('express');
const { pool } = require('../config/database');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification
router.use(requireAuth);
router.use(requireSuperAdmin);

/**
 * Récupérer tous les enregistrements en attente de validation
 * GET /api/validation/pending
 */
router.get('/pending', async (req, res) => {
    try {
        console.log('🔍 API Validation /pending appelée');
        const { limit = 1000, offset = 0, type, status, investigator } = req.query;
        console.log('📋 Paramètres:', { limit, offset, type, status, investigator });
        
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Construire les conditions WHERE
        if (type) {
            whereConditions.push(`type = $${paramIndex++}`);
            queryParams.push(type);
        }

        if (status && status !== '') {
            whereConditions.push(`status = $${paramIndex++}`);
            queryParams.push(status);
        } else if (status === '') {
            // Si status est vide, montrer tous les enregistrements
            // Pas de condition WHERE pour le status
        } else {
            // Par défaut, ne montrer que les enregistrements en attente
            whereConditions.push(`(status IS NULL OR status = 'pending')`);
        }

        if (investigator) {
            whereConditions.push(`investigator_name = $${paramIndex++}`);
            queryParams.push(investigator);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Requête simplifiée pour récupérer tous les types d'enregistrements
        const query = `
            WITH all_records AS (
                -- Enregistrements d'œufs
                SELECT 
                    id,
                    'eggs' as type,
                    NULL as investigator_name, -- Champ supprimé
                    eggs_concession_code as concession_code,
                    NULL as house_code, -- Champ supprimé
                    eggs_visit_start_date as visit_date,
                    eggs_sector as sector,
                    eggs_environment as environment,
                    eggs_gps_code as gps_code,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    status,
                    validated_at,
                    validated_by,
                    validation_notes
                FROM eggs_collection_new
                
                UNION ALL
                
                -- Enregistrements de gîtes larvaires
                SELECT 
                    id,
                    'breeding' as type,
                    site_investigator_name as investigator_name,
                    site_concession_code as concession_code,
                    site_house_code as house_code,
                    site_visit_start_date as visit_date,
                    site_sector as sector,
                    site_environment as environment,
                    site_gps_code as gps_code,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    status,
                    validated_at,
                    validated_by,
                    validation_notes
                FROM breeding_sites_new
                
                UNION ALL
                
                -- Enregistrements de moustiques adultes
                SELECT 
                    id,
                    'mosquitoes' as type,
                    NULL as investigator_name, -- Champ supprimé
                    mosquitoes_concession_code as concession_code,
                    NULL as house_code, -- Champ supprimé
                    mosquitoes_visit_start_date as visit_date,
                    mosquitoes_sector as sector,
                    mosquitoes_environment as environment,
                    mosquitoes_gps_code as gps_code,
                    observations,
                    batch_id,
                    created_at as submitted_at,
                    status,
                    validated_at,
                    validated_by,
                    validation_notes
                FROM adult_mosquitoes_new
            )
            SELECT * FROM all_records
            ${whereClause}
            ORDER BY submitted_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        console.log('🔍 Requête SQL:', query);
        console.log('📋 Paramètres:', queryParams);

        const result = await pool.query(query, queryParams);
        console.log('✅ Résultat:', result.rows.length, 'lignes');

        // Compter le total pour la pagination
        const countQuery = `
            WITH all_records AS (
                SELECT id, status FROM eggs_collection_new
                UNION ALL
                SELECT id, status FROM breeding_sites_new
                UNION ALL
                SELECT id, status FROM adult_mosquitoes_new
            )
            SELECT COUNT(*) as total FROM all_records
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: result.rows.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données',
            error: error.message
        });
    }
});


/**
 * Endpoint de test simple
 * GET /api/validation/test/:type/:id
 */
router.get('/test/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        console.log(`🧪 TEST Récupération des détails pour ${type} #${id}`);
        
        let tableName;
        
        switch (type) {
            case 'eggs':
                tableName = 'eggs_collection_new';
                break;
            case 'breeding':
                tableName = 'breeding_sites_new';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_new';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }
        
        const query = `SELECT * FROM ${tableName} WHERE id = $1`;
        console.log(`🧪 TEST Exécution requête: ${query} avec ID=${id}`);
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enregistrement non trouvé'
            });
        }
        
        const item = result.rows[0];
        item.type = type;
        
        console.log(`✅ TEST Détails récupérés pour ${type} #${id}`);
        res.json({
            success: true,
            data: item
        });
        
    } catch (error) {
        console.error('❌ TEST Erreur lors de la récupération des détails:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des détails',
            error: error.message
        });
    }
});

/**
 * Récupérer les détails d'un enregistrement spécifique
 * GET /api/validation/:type/:id
 */
router.get('/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        console.log(`🔍 NOUVEAU Récupération des détails pour ${type} #${id}`);
        
        let tableName;
        
        // Déterminer la table selon le type
        switch (type) {
            case 'eggs':
                tableName = 'eggs_collection_new';
                break;
            case 'breeding':
                tableName = 'breeding_sites_new';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_new';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }
        
        // Requête simple pour récupérer TOUTES les colonnes
        const query = `SELECT * FROM ${tableName} WHERE id = $1`;
        console.log(`🔍 Exécution requête: ${query} avec ID=${id}`);
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enregistrement non trouvé'
            });
        }
        
        const item = result.rows[0];
        
        // Ajouter le type pour le frontend
        item.type = type;
        
        console.log(`✅ NOUVEAU Détails récupérés pour ${type} #${id}`);
        res.json({
            success: true,
            data: item
        });
        
    } catch (error) {
        console.error('❌ NOUVEAU Erreur lors de la récupération des détails:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des détails',
            error: error.message
        });
    }
});

/**
 * Valider ou rejeter un enregistrement
 * POST /api/validation/validate
 */
router.post('/validate', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id, type, action, validated_by, validation_notes } = req.body;
        
        if (!id || !type || !action || !validated_by) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres manquants'
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action invalide. Utilisez "approve" ou "reject"'
            });
        }

        let tableName;
        switch (type) {
            case 'eggs':
                tableName = 'eggs_collection_new';
                break;
            case 'breeding':
                tableName = 'breeding_sites_new';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_new';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }

        // Vérifier que l'enregistrement existe
        const checkQuery = `SELECT id, status FROM ${tableName} WHERE id = $1`;
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enregistrement non trouvé'
            });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus && currentStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cet enregistrement a déjà été traité'
            });
        }

        if (action === 'approve') {
            // Valider l'enregistrement
            const updateQuery = `
                UPDATE ${tableName} 
                SET 
                    status = 'approved',
                    validated_by = $1,
                    validation_notes = $2,
                    validated_at = NOW()
                WHERE id = $3
            `;
            
            await client.query(updateQuery, [validated_by, validation_notes, id]);
        } else {
            // Supprimer définitivement l'enregistrement rejeté
            const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1`;
            await client.query(deleteQuery, [id]);
        }

        // Mettre à jour le batch si nécessaire (seulement pour les validations)
        if (action === 'approve') {
            const batchQuery = `SELECT batch_id FROM ${tableName} WHERE id = $1`;
            const batchResult = await client.query(batchQuery, [id]);
            
            if (batchResult.rows.length > 0 && batchResult.rows[0].batch_id) {
                const batchId = batchResult.rows[0].batch_id;
                
                // Vérifier si tous les enregistrements du batch sont traités
                const batchStatusQuery = `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                        COUNT(CASE WHEN status IS NULL OR status = 'pending' THEN 1 END) as pending
                    FROM (
                        SELECT status FROM eggs_collection_new WHERE batch_id = $1
                        UNION ALL
                        SELECT status FROM breeding_sites_new WHERE batch_id = $1
                        UNION ALL
                        SELECT status FROM adult_mosquitoes_new WHERE batch_id = $1
                    ) as all_records
                `;
                
                const batchStatusResult = await client.query(batchStatusQuery, [batchId]);
                const stats = batchStatusResult.rows[0];
                
                // Déterminer le nouveau statut du batch
                let newBatchStatus;
                if (parseInt(stats.pending) === 0) {
                    newBatchStatus = 'approved';
                } else {
                    newBatchStatus = 'in_progress';
                }
                
                // Mettre à jour le batch
                const updateBatchQuery = `
                    UPDATE validation_batches 
                    SET 
                        status = $1,
                        pending_records = $2,
                        updated_at = NOW()
                    WHERE batch_id = $3
                `;
                
                await client.query(updateBatchQuery, [
                    newBatchStatus,
                    parseInt(stats.pending),
                    batchId
                ]);
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: action === 'approve' ? 'Enregistrement validé avec succès' : 'Enregistrement rejeté et supprimé avec succès',
            data: action === 'approve' ? {
                id,
                type,
                status: 'approved',
                validated_by,
                validation_notes,
                validated_at: new Date().toISOString()
            } : {
                id,
                type,
                action: 'deleted'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la validation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * Récupérer les statistiques de validation
 * GET /api/validation/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const query = `
            WITH all_records AS (
                SELECT status FROM eggs_collection_new
                UNION ALL
                SELECT status FROM breeding_sites_new
                UNION ALL
                SELECT status FROM adult_mosquitoes_new
            )
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                0 as rejected,
                COUNT(CASE WHEN status IS NULL OR status = 'pending' THEN 1 END) as pending
            FROM all_records
        `;

        const result = await pool.query(query);
        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                total: parseInt(stats.total),
                approved: parseInt(stats.approved),
                rejected: parseInt(stats.rejected),
                pending: parseInt(stats.pending),
                approval_rate: stats.total > 0 ? (parseInt(stats.approved) / parseInt(stats.total) * 100).toFixed(2) : 0
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

/**
 * Récupérer la liste des enquêteurs
 * GET /api/validation/investigators
 */
router.get('/investigators', async (req, res) => {
    try {
        const query = `
            WITH all_investigators AS (
                -- Seuls les gîtes ont encore investigator_name
                SELECT site_investigator_name as investigator_name FROM breeding_sites_new WHERE site_investigator_name IS NOT NULL
            )
            SELECT DISTINCT investigator_name FROM all_investigators ORDER BY investigator_name
        `;

        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows.map(row => row.investigator_name)
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des enquêteurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des enquêteurs',
            error: error.message
        });
    }
});

/**
 * Validation en lot (batch validation)
 * POST /api/validation/batch-validate
 */
router.post('/batch-validate', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { ids, type, action, validated_by, validation_notes } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Liste d\'IDs manquante ou vide'
            });
        }

        if (!type || !action || !validated_by) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres manquants'
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action invalide. Utilisez "approve" ou "reject"'
            });
        }

        let tableName;
        switch (type) {
            case 'eggs':
                tableName = 'eggs_collection_new';
                break;
            case 'breeding':
                tableName = 'breeding_sites_new';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_new';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const placeholders = ids.map((_, index) => `$${index + 2}`).join(',');
        
        const updateQuery = `
            UPDATE ${tableName} 
            SET 
                status = $1,
                validated_by = $2,
                validation_notes = $3,
                validated_at = NOW()
            WHERE id IN (${placeholders}) 
            AND (status IS NULL OR status = 'pending')
        `;

        const updateParams = [newStatus, validated_by, validation_notes, ...ids];
        const result = await client.query(updateQuery, updateParams);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${result.rowCount} enregistrement(s) ${action === 'approve' ? 'validé(s)' : 'rejeté(s)'} avec succès`,
            data: {
                updated_count: result.rowCount,
                action,
                validated_by,
                validation_notes
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la validation en lot:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation en lot',
            error: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
