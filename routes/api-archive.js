// =====================================================
// API D'ACCÈS AUX DONNÉES ARCHIVÉES - CENTRE MURAZ
// =====================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Cache pour les données archivées
const archiveCache = new Map();
const CACHE_TTL = 3600000; // 1 heure

// =====================================================
// ROUTE PRINCIPALE - STATISTIQUES D'ARCHIVAGE
// =====================================================

router.get('/archive/stats', async (req, res) => {
    try {
        const client = await pool.connect();
        
        const query = `
            SELECT 
                COUNT(*) as total_archived_months,
                COALESCE(SUM(total_visits_archived), 0) as total_visits_archived,
                COALESCE(SUM(total_breeding_sites_archived), 0) as total_breeding_sites_archived,
                COALESCE(SUM(total_eggs_collection_archived), 0) as total_eggs_collection_archived,
                COALESCE(SUM(total_adult_mosquitoes_archived), 0) as total_adult_mosquitoes_archived,
                MIN(archive_month) as oldest_archive,
                MAX(archive_month) as newest_archive,
                AVG(archive_duration_ms) as avg_archive_duration
            FROM archive_metadata
        `;
        
        const result = await client.query(query);
        const stats = result.rows[0];
        
        // Calculer l'espace économisé
        const activeDataQuery = `
            SELECT 
                COUNT(*) as active_visits,
                (SELECT COUNT(*) FROM breeding_sites) as active_breeding_sites,
                (SELECT COUNT(*) FROM eggs_collection) as active_eggs,
                (SELECT COUNT(*) FROM adult_mosquitoes) as active_mosquitoes
            FROM household_visits
        `;
        
        const activeResult = await client.query(activeDataQuery);
        const activeData = activeResult.rows[0];
        
        const response = {
            success: true,
            archive_stats: {
                total_archived_months: parseInt(stats.total_archived_months),
                total_visits_archived: parseInt(stats.total_visits_archived),
                total_breeding_sites_archived: parseInt(stats.total_breeding_sites_archived),
                total_eggs_collection_archived: parseInt(stats.total_eggs_collection_archived),
                total_adult_mosquitoes_archived: parseInt(stats.total_adult_mosquitoes_archived),
                oldest_archive: stats.oldest_archive,
                newest_archive: stats.newest_archive,
                avg_archive_duration_ms: parseInt(stats.avg_archive_duration) || 0
            },
            active_data: {
                active_visits: parseInt(activeData.active_visits),
                active_breeding_sites: parseInt(activeData.active_breeding_sites),
                active_eggs: parseInt(activeData.active_eggs),
                active_mosquitoes: parseInt(activeData.active_mosquitoes)
            },
            performance_metrics: {
                storage_optimization: stats.total_visits_archived > 0 ? 
                    Math.round((stats.total_visits_archived / (stats.total_visits_archived + activeData.active_visits)) * 100) : 0,
                data_ratio: activeData.active_visits > 0 ? 
                    Math.round((stats.total_visits_archived / activeData.active_visits) * 100) : 0
            }
        };
        
        client.release();
        res.json(response);
        
    } catch (error) {
        console.error('Erreur API archive stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques d\'archive'
        });
    }
});

// =====================================================
// ROUTE - INDICES ARCHIVÉS PAR MOIS
// =====================================================

router.get('/archive/indices', async (req, res) => {
    try {
        const { page = 1, limit = 12, start_date, end_date } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const client = await pool.connect();
        
        // Construire les conditions WHERE
        let whereClause = '';
        const queryParams = [];
        
        if (start_date && end_date) {
            whereClause = 'WHERE archive_month >= $1 AND archive_month <= $2';
            queryParams.push(start_date, end_date);
        } else if (start_date) {
            whereClause = 'WHERE archive_month >= $1';
            queryParams.push(start_date);
        } else if (end_date) {
            whereClause = 'WHERE archive_month <= $1';
            queryParams.push(end_date);
        }
        
        // Requête principale
        const query = `
            SELECT 
                archive_month,
                archive_date,
                total_visits_archived,
                ib_average,
                im_average,
                ir_average,
                ipp_average,
                icn_average,
                iap_bg_average,
                iap_prokopack_average,
                sectors_count,
                villages_count,
                archive_status
            FROM archive_metadata
            ${whereClause}
            ORDER BY archive_month DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(parseInt(limit), offset);
        
        const result = await client.query(query, queryParams);
        
        // Compter le total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM archive_metadata
            ${whereClause}
        `;
        
        const countResult = await client.query(countQuery, 
            queryParams.slice(0, -2) // Exclure LIMIT et OFFSET
        );
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / parseInt(limit));
        
        // Formater les données
        const formattedData = result.rows.map(row => ({
            month: row.archive_month,
            archive_date: row.archive_date,
            visits_count: parseInt(row.total_visits_archived),
            indices: {
                ib: parseFloat(row.ib_average) || 0,
                im: parseFloat(row.im_average) || 0,
                ir: parseFloat(row.ir_average) || 0,
                ipp: parseFloat(row.ipp_average) || 0,
                icn: parseFloat(row.icn_average) || 0,
                iap_bg: parseFloat(row.iap_bg_average) || 0,
                iap_prokopack: parseFloat(row.iap_prokopack_average) || 0
            },
            sectors_count: parseInt(row.sectors_count) || 0,
            villages_count: parseInt(row.villages_count) || 0,
            status: row.archive_status
        }));
        
        const response = {
            success: true,
            data: formattedData,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_records: total,
                limit: parseInt(limit),
                has_next: parseInt(page) < totalPages,
                has_previous: parseInt(page) > 1
            }
        };
        
        client.release();
        res.json(response);
        
    } catch (error) {
        console.error('Erreur API archive indices:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des indices archivés'
        });
    }
});

// =====================================================
// ROUTE - RECHERCHE DANS LES ARCHIVES
// =====================================================

router.get('/archive/search', async (req, res) => {
    try {
        const { q, sector, village, start_date, end_date, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const client = await pool.connect();
        
        // Construire les conditions WHERE
        const conditions = [];
        const queryParams = [];
        let paramIndex = 1;
        
        if (q) {
            conditions.push(`(hv.household_head_name ILIKE $${paramIndex} OR hv.household_id ILIKE $${paramIndex})`);
            queryParams.push(`%${q}%`);
            paramIndex++;
        }
        
        if (sector) {
            conditions.push(`hv.sector = $${paramIndex}`);
            queryParams.push(sector);
            paramIndex++;
        }
        
        if (village) {
            conditions.push(`hv.village = $${paramIndex}`);
            queryParams.push(village);
            paramIndex++;
        }
        
        if (start_date) {
            conditions.push(`hv.visit_start_date >= $${paramIndex}`);
            queryParams.push(start_date);
            paramIndex++;
        }
        
        if (end_date) {
            conditions.push(`hv.visit_start_date <= $${paramIndex}`);
            queryParams.push(end_date);
            paramIndex++;
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Requête principale
        const query = `
            SELECT 
                hv.household_visit_id,
                hv.visit_start_date,
                hv.sector,
                hv.village,
                hv.household_id,
                hv.household_head_name,
                hv.archived_at,
                COUNT(bs.id) as breeding_sites_count,
                COUNT(ec.id) as eggs_collection_count,
                COUNT(am.id) as adult_mosquitoes_count
            FROM household_visits_archive hv
            LEFT JOIN breeding_sites_archive bs ON hv.household_visit_id = bs.household_visit_id
            LEFT JOIN eggs_collection_archive ec ON hv.household_visit_id = ec.household_visit_id
            LEFT JOIN adult_mosquitoes_archive am ON hv.household_visit_id = am.household_visit_id
            ${whereClause}
            GROUP BY hv.id, hv.household_visit_id, hv.visit_start_date, hv.sector, hv.village, 
                     hv.household_id, hv.household_head_name, hv.archived_at
            ORDER BY hv.visit_start_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(parseInt(limit), offset);
        
        const result = await client.query(query, queryParams);
        
        // Compter le total
        const countQuery = `
            SELECT COUNT(DISTINCT hv.id) as total
            FROM household_visits_archive hv
            ${whereClause}
        `;
        
        const countResult = await client.query(countQuery, 
            queryParams.slice(0, -2) // Exclure LIMIT et OFFSET
        );
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / parseInt(limit));
        
        const response = {
            success: true,
            data: result.rows.map(row => ({
                household_visit_id: row.household_visit_id,
                visit_date: row.visit_start_date,
                sector: row.sector,
                village: row.village,
                household_id: row.household_id,
                household_head_name: row.household_head_name,
                archived_at: row.archived_at,
                data_counts: {
                    breeding_sites: parseInt(row.breeding_sites_count),
                    eggs_collection: parseInt(row.eggs_collection_count),
                    adult_mosquitoes: parseInt(row.adult_mosquitoes_count)
                }
            })),
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_records: total,
                limit: parseInt(limit),
                has_next: parseInt(page) < totalPages,
                has_previous: parseInt(page) > 1
            }
        };
        
        client.release();
        res.json(response);
        
    } catch (error) {
        console.error('Erreur API archive search:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche dans les archives'
        });
    }
});

// =====================================================
// ROUTE - EXPORT DES DONNÉES ARCHIVÉES
// =====================================================

router.get('/archive/export', async (req, res) => {
    try {
        const { format = 'json', month } = req.query;
        const client = await pool.connect();
        
        if (format !== 'json' && format !== 'csv') {
            return res.status(400).json({
                success: false,
                error: 'Format non supporté. Utilisez "json" ou "csv"'
            });
        }
        
        let whereClause = '';
        const queryParams = [];
        
        if (month) {
            whereClause = 'WHERE DATE_TRUNC(\'month\', hv.visit_start_date) = $1';
            queryParams.push(month);
        }
        
        const query = `
            SELECT 
                hv.household_visit_id,
                hv.visit_start_date,
                hv.sector,
                hv.village,
                hv.household_id,
                hv.household_head_name,
                hv.latitude,
                hv.longitude,
                hv.archived_at,
                bs.site_type,
                bs.positive_sites,
                bs.total_sites,
                bs.nymphs_present,
                ec.ovitrap_location,
                ec.eggs_count,
                ec.eggs_present,
                am.trap_type,
                am.genus,
                am.aedes_count,
                am.culex_count,
                am.anopheles_count,
                am.other_genus_count,
                am.total_mosquitoes_count
            FROM household_visits_archive hv
            LEFT JOIN breeding_sites_archive bs ON hv.household_visit_id = bs.household_visit_id
            LEFT JOIN eggs_collection_archive ec ON hv.household_visit_id = ec.household_visit_id
            LEFT JOIN adult_mosquitoes_archive am ON hv.household_visit_id = am.household_visit_id
            ${whereClause}
            ORDER BY hv.visit_start_date DESC
        `;
        
        const result = await client.query(query, queryParams);
        
        if (format === 'csv') {
            // Générer CSV
            const headers = [
                'household_visit_id', 'visit_start_date', 'sector', 'village',
                'household_id', 'household_head_name', 'latitude', 'longitude',
                'archived_at', 'site_type', 'positive_sites', 'total_sites',
                'nymphs_present', 'ovitrap_location', 'eggs_count', 'eggs_present',
                'trap_type', 'genus', 'aedes_count', 'culex_count', 'anopheles_count',
                'other_genus_count', 'total_mosquitoes_count'
            ];
            
            const csvContent = [
                headers.join(','),
                ...result.rows.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        return typeof value === 'string' && value.includes(',') ? 
                            `"${value}"` : value;
                    }).join(',')
                )
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="archive_export_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
            
        } else {
            // Retourner JSON
            res.json({
                success: true,
                data: result.rows,
                export_info: {
                    format: 'json',
                    total_records: result.rows.length,
                    export_date: new Date().toISOString(),
                    month_filter: month || 'all'
                }
            });
        }
        
        client.release();
        
    } catch (error) {
        console.error('Erreur API archive export:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'export des données archivées'
        });
    }
});

// =====================================================
// ROUTE - NETTOYAGE DU CACHE
// =====================================================

router.delete('/archive/cache/clear', (req, res) => {
    archiveCache.clear();
    res.json({
        success: true,
        message: 'Cache d\'archive vidé avec succès'
    });
});

// =====================================================
// ROUTE - STATISTIQUES DU CACHE
// =====================================================

router.get('/archive/cache/stats', (req, res) => {
    const cacheStats = {
        total_entries: archiveCache.size,
        cache_size_mb: 0, // Approximation
        cache_hits: 0, // À implémenter si nécessaire
        cache_misses: 0 // À implémenter si nécessaire
    };
    
    res.json({
        success: true,
        cache_stats: cacheStats
    });
});

module.exports = router;





