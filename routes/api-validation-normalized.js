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
        console.log('🔍 API Validation /pending appelée (VERSION NORMALISÉE)');
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
        } else {
            // Par défaut, ne montrer que les enregistrements en attente
            whereConditions.push(`(status IS NULL OR status = 'pending')`);
        }

        if (investigator) {
            whereConditions.push(`investigator_name = $${paramIndex++}`);
            queryParams.push(investigator);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Requête adaptée pour la structure normalisée avec JOIN sur houses
        const query = `
            WITH all_records AS (
                -- Enregistrements d'œufs
                SELECT 
                    e.id,
                    'eggs' as type,
                    e.investigator_name,
                    h.concession_code,
                    h.house_code,
                    e.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    e.observations,
                    e.created_at as submitted_at,
                    e.status,
                    e.validated_at,
                    e.validated_by,
                    e.validation_notes
                FROM eggs_collections e
                JOIN houses h ON e.house_id = h.id
                
                UNION ALL
                
                -- Enregistrements de gîtes larvaires
                SELECT 
                    b.id,
                    'breeding' as type,
                    b.investigator_name,
                    h.concession_code,
                    h.house_code,
                    b.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    b.observations,
                    b.created_at as submitted_at,
                    b.status,
                    b.validated_at,
                    b.validated_by,
                    b.validation_notes
                FROM breeding_sites b
                JOIN houses h ON b.house_id = h.id
                
                UNION ALL
                
                -- Enregistrements de moustiques adultes
                SELECT 
                    m.id,
                    'mosquitoes' as type,
                    m.investigator_name,
                    h.concession_code,
                    h.house_code,
                    m.visit_date,
                    h.sector,
                    h.environment,
                    h.gps_coordinates as gps_code,
                    m.observations,
                    m.created_at as submitted_at,
                    m.status,
                    m.validated_at,
                    m.validated_by,
                    m.validation_notes
                FROM adult_mosquitoes_collections m
                JOIN houses h ON m.house_id = h.id
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
                SELECT e.id, e.status FROM eggs_collections e
                UNION ALL
                SELECT b.id, b.status FROM breeding_sites b
                UNION ALL
                SELECT m.id, m.status FROM adult_mosquitoes_collections m
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
 * Endpoint de test simple (utilisé par le frontend pour le modal)
 * GET /api/validation/test/:type/:id
 */
router.get('/test/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        console.log(`🔍 TEST Récupération des détails pour ${type} #${id}`);
        
        let query;
        
        // Déterminer la requête selon le type avec JOIN sur houses
        switch (type) {
            case 'eggs':
                query = `
                    SELECT 
                        e.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM eggs_collections e
                    JOIN houses h ON e.house_id = h.id
                    WHERE e.id = $1
                `;
                break;
            case 'breeding':
                query = `
                    SELECT 
                        b.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.id = $1
                `;
                break;
            case 'mosquitoes':
                query = `
                    SELECT 
                        m.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM adult_mosquitoes_collections m
                    JOIN houses h ON m.house_id = h.id
                    WHERE m.id = $1
                `;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }
        
        console.log(`🔍 Exécution requête avec JOIN sur houses, ID=${id}`);
        
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
        console.log(`🔍 Récupération des détails pour ${type} #${id} (VERSION NORMALISÉE)`);
        
        let query;
        
        // Déterminer la requête selon le type avec JOIN sur houses
        switch (type) {
            case 'eggs':
                query = `
                    SELECT 
                        e.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM eggs_collections e
                    JOIN houses h ON e.house_id = h.id
                    WHERE e.id = $1
                `;
                break;
            case 'breeding':
                query = `
                    SELECT 
                        b.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM breeding_sites b
                    JOIN houses h ON b.house_id = h.id
                    WHERE b.id = $1
                `;
                break;
            case 'mosquitoes':
                query = `
                    SELECT 
                        m.*,
                        h.concession_code,
                        h.house_code,
                        h.sector,
                        h.environment,
                        h.gps_coordinates
                    FROM adult_mosquitoes_collections m
                    JOIN houses h ON m.house_id = h.id
                    WHERE m.id = $1
                `;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }
        
        console.log(`🔍 Exécution requête avec JOIN sur houses, ID=${id}`);
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enregistrement non trouvé'
            });
        }
        
        const item = result.rows[0];
        item.type = type;
        
        console.log(`✅ Détails récupérés pour ${type} #${id}`);
        res.json({
            success: true,
            data: item
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des détails:', error);
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
        
        const { id, type, action, validation_notes } = req.body;
        
        // Récupérer l'utilisateur depuis la session (ajouté par middleware auth)
        // Si pas de session, utiliser NULL au lieu d'un ID fictif
        const validated_by = req.session?.userId || null;
        
        console.log(`📝 Validation par utilisateur ID: ${validated_by || 'NULL (session non disponible)'}`);
        
        if (!id || !type || !action) {
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
                tableName = 'eggs_collections';
                break;
            case 'breeding':
                tableName = 'breeding_sites';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_collections';
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
                SELECT status FROM eggs_collections
                UNION ALL
                SELECT status FROM breeding_sites
                UNION ALL
                SELECT status FROM adult_mosquitoes_collections
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
                SELECT investigator_name FROM eggs_collections WHERE investigator_name IS NOT NULL
                UNION
                SELECT investigator_name FROM breeding_sites WHERE investigator_name IS NOT NULL
                UNION
                SELECT investigator_name FROM adult_mosquitoes_collections WHERE investigator_name IS NOT NULL
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
        
        const { ids, type, action, validation_notes } = req.body;
        
        // Récupérer l'utilisateur depuis la session (ajouté par middleware auth)
        // Si pas de session, utiliser NULL au lieu d'un ID fictif
        const validated_by = req.session?.userId || null;
        
        console.log(`📝 Validation en lot par utilisateur ID: ${validated_by || 'NULL (session non disponible)'}`);
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Liste d\'IDs manquante ou vide'
            });
        }

        if (!type || !action) {
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
                tableName = 'eggs_collections';
                break;
            case 'breeding':
                tableName = 'breeding_sites';
                break;
            case 'mosquitoes':
                tableName = 'adult_mosquitoes_collections';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type d\'enregistrement invalide'
                });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const placeholders = ids.map((_, index) => `$${index + 4}`).join(',');
        
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

