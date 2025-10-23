const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype) || 
            file.originalname.match(/\.(csv|xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.'));
        }
    }
});

// Middleware d'authentification
router.use(requireAuth);

/**
 * Helper function: Parse CSV/Excel file to JSON
 */
function parseFile(buffer, filename) {
    try {
        let workbook;
        
        if (filename.endsWith('.csv')) {
            // Parse CSV
            const text = buffer.toString('utf-8');
            workbook = XLSX.read(text, { type: 'string' });
        } else {
            // Parse Excel
            workbook = XLSX.read(buffer, { type: 'buffer' });
        }

        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const data = XLSX.utils.sheet_to_json(sheet, { 
            raw: false, // Convertir les dates en string
            defval: null // Valeur par défaut pour les cellules vides
        });

        return { success: true, data, sheetName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Helper function: Find or create house
 */
async function findOrCreateHouse(client, houseData) {
    const { concession_code, sector, environment, gps_coordinates, house_code } = houseData;
    
    // Chercher la maison existante
    const searchResult = await client.query(
        'SELECT id FROM houses WHERE concession_code = $1 AND sector = $2',
        [concession_code, sector]
    );
    
    if (searchResult.rows.length > 0) {
        return searchResult.rows[0].id;
    }
    
    // Créer une nouvelle maison
    const createResult = await client.query(
        `INSERT INTO houses (concession_code, sector, environment, gps_coordinates, house_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [concession_code, sector, environment, gps_coordinates, house_code]
    );
    
    return createResult.rows[0].id;
}

/**
 * Validate eggs collection data
 */
function validateEggsData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`Ligne ${index + 2}: concession_code manquant`);
    if (!row.sector) errors.push(`Ligne ${index + 2}: sector manquant`);
    if (!row.environment) errors.push(`Ligne ${index + 2}: environment manquant`);
    if (!row.visit_date) errors.push(`Ligne ${index + 2}: visit_date manquant`);
    if (row.eggs_count === undefined || row.eggs_count === null) {
        errors.push(`Ligne ${index + 2}: eggs_count manquant`);
    }
    
    return errors;
}

/**
 * Validate breeding sites data
 */
function validateBreedingData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`Ligne ${index + 2}: concession_code manquant`);
    if (!row.sector) errors.push(`Ligne ${index + 2}: sector manquant`);
    if (!row.environment) errors.push(`Ligne ${index + 2}: environment manquant`);
    if (!row.visit_date) errors.push(`Ligne ${index + 2}: visit_date manquant`);
    if (!row.investigator_name) errors.push(`Ligne ${index + 2}: investigator_name manquant`);
    if (!row.site_state) errors.push(`Ligne ${index + 2}: site_state manquant`);
    
    return errors;
}

/**
 * Validate mosquitoes data
 */
function validateMosquitoesData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`Ligne ${index + 2}: concession_code manquant`);
    if (!row.sector) errors.push(`Ligne ${index + 2}: sector manquant`);
    if (!row.environment) errors.push(`Ligne ${index + 2}: environment manquant`);
    if (!row.visit_date) errors.push(`Ligne ${index + 2}: visit_date manquant`);
    
    return errors;
}

/**
 * GET /api/import/template/:type
 * Télécharger un template Excel pour l'import
 */
router.get('/template/:type', (req, res) => {
    const { type } = req.params;
    
    let headers = [];
    let filename = '';
    
    switch (type) {
        case 'eggs':
            headers = [
                'concession_code', 'house_code', 'sector', 'environment', 'gps_coordinates',
                'visit_date', 'investigator_name', 'nest_number', 'nest_code', 'pass_order',
                'eggs_count', 'observations'
            ];
            filename = 'template_eggs_collections.xlsx';
            break;
            
        case 'breeding':
            headers = [
                'concession_code', 'house_code', 'sector', 'environment', 'gps_coordinates',
                'visit_date', 'investigator_name', 'site_state',
                'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count', 'other_larvae_count',
                'aedes_nymphs_count', 'culex_nymphs_count', 'anopheles_nymphs_count', 'other_nymphs_count',
                'observations'
            ];
            filename = 'template_breeding_sites.xlsx';
            break;
            
        case 'mosquitoes':
            headers = [
                'concession_code', 'house_code', 'sector', 'environment', 'gps_coordinates',
                'visit_date', 'investigator_name', 'collection_methods', 'capture_locations',
                'prokopack_traps_count', 'bg_traps_count',
                'male_count', 'female_count',
                'aedes_male_count', 'culex_male_count', 'anopheles_male_count', 'other_male_count',
                'blood_fed_females_count', 'gravid_females_count', 'starved_females_count',
                'mosquitoes_aedes_count', 'mosquitoes_culex_count', 'mosquitoes_anopheles_count', 'mosquitoes_other_count',
                'observations'
            ];
            filename = 'template_mosquitoes_collections.xlsx';
            break;
            
        default:
            return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    
    // Créer un workbook Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Générer le fichier
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

/**
 * POST /api/import/preview
 * Prévisualiser les données avant import
 */
router.post('/preview', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
        }
        
        const { type } = req.body;
        if (!type || !['eggs', 'breeding', 'mosquitoes'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type de données invalide' });
        }
        
        // Parser le fichier
        const parseResult = parseFile(req.file.buffer, req.file.originalname);
        
        if (!parseResult.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Erreur de parsing du fichier: ' + parseResult.error 
            });
        }
        
        const data = parseResult.data;
        
        // Valider les données
        let validationErrors = [];
        
        data.forEach((row, index) => {
            let errors = [];
            
            switch (type) {
                case 'eggs':
                    errors = validateEggsData(row, index);
                    break;
                case 'breeding':
                    errors = validateBreedingData(row, index);
                    break;
                case 'mosquitoes':
                    errors = validateMosquitoesData(row, index);
                    break;
            }
            
            validationErrors.push(...errors);
        });
        
        res.json({
            success: true,
            data: {
                totalRows: data.length,
                previewRows: data.slice(0, 10), // Premières 10 lignes
                validationErrors,
                isValid: validationErrors.length === 0,
                sheetName: parseResult.sheetName
            }
        });
        
    } catch (error) {
        console.error('Erreur preview:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur: ' + error.message 
        });
    }
});

/**
 * POST /api/import/execute
 * Exécuter l'import des données
 */
router.post('/execute', upload.single('file'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
        }
        
        const { type } = req.body;
        if (!type || !['eggs', 'breeding', 'mosquitoes'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type de données invalide' });
        }
        
        // Parser le fichier
        const parseResult = parseFile(req.file.buffer, req.file.originalname);
        
        if (!parseResult.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Erreur de parsing du fichier: ' + parseResult.error 
            });
        }
        
        const data = parseResult.data;
        
        await client.query('BEGIN');
        
        let inserted = 0;
        let errors = [];
        let skipped = 0;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
                // Valider la ligne
                let validationErrors = [];
                
                switch (type) {
                    case 'eggs':
                        validationErrors = validateEggsData(row, i);
                        break;
                    case 'breeding':
                        validationErrors = validateBreedingData(row, i);
                        break;
                    case 'mosquitoes':
                        validationErrors = validateMosquitoesData(row, i);
                        break;
                }
                
                if (validationErrors.length > 0) {
                    errors.push(`Ligne ${i + 2}: ${validationErrors.join(', ')}`);
                    skipped++;
                    continue;
                }
                
                // Find or create house
                const houseId = await findOrCreateHouse(client, {
                    concession_code: row.concession_code,
                    sector: row.sector,
                    environment: row.environment,
                    gps_coordinates: row.gps_coordinates || null,
                    house_code: row.house_code || null
                });
                
                // Insert data selon le type
                switch (type) {
                    case 'eggs':
                        await client.query(
                            `INSERT INTO eggs_collections (
                                house_id, visit_date, investigator_name, nest_number, nest_code, 
                                pass_order, eggs_count, observations, status, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())`,
                            [
                                houseId, row.visit_date, row.investigator_name || null,
                                row.nest_number || null, row.nest_code || null, row.pass_order || null,
                                row.eggs_count || 0, row.observations || null
                            ]
                        );
                        break;
                        
                    case 'breeding':
                        const larvaeCount = (parseInt(row.aedes_larvae_count) || 0) + 
                                          (parseInt(row.culex_larvae_count) || 0) + 
                                          (parseInt(row.anopheles_larvae_count) || 0) + 
                                          (parseInt(row.other_larvae_count) || 0);
                        
                        const nymphsCount = (parseInt(row.aedes_nymphs_count) || 0) + 
                                          (parseInt(row.culex_nymphs_count) || 0) + 
                                          (parseInt(row.anopheles_nymphs_count) || 0) + 
                                          (parseInt(row.other_nymphs_count) || 0);
                        
                        await client.query(
                            `INSERT INTO breeding_sites (
                                house_id, visit_date, investigator_name, site_state,
                                aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count, larvae_count,
                                aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count, nymphs_count,
                                observations, status, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW(), NOW())`,
                            [
                                houseId, row.visit_date, row.investigator_name, row.site_state,
                                row.aedes_larvae_count || 0, row.culex_larvae_count || 0, 
                                row.anopheles_larvae_count || 0, row.other_larvae_count || 0, larvaeCount,
                                row.aedes_nymphs_count || 0, row.culex_nymphs_count || 0,
                                row.anopheles_nymphs_count || 0, row.other_nymphs_count || 0, nymphsCount,
                                row.observations || null
                            ]
                        );
                        break;
                        
                    case 'mosquitoes':
                        const totalMosquitoes = (parseInt(row.male_count) || 0) + (parseInt(row.female_count) || 0);
                        
                        await client.query(
                            `INSERT INTO adult_mosquitoes_collections (
                                house_id, visit_date, investigator_name, collection_methods, capture_locations,
                                prokopack_traps_count, bg_traps_count,
                                total_mosquitoes_count, male_count, female_count,
                                aedes_male_count, culex_male_count, anopheles_male_count, other_male_count,
                                blood_fed_females_count, gravid_females_count, starved_females_count,
                                mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                                observations, status, created_at, updated_at, visit_start_time, visit_end_time
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'pending', NOW(), NOW(), '00:00:00', '00:00:00')`,
                            [
                                houseId, row.visit_date, row.investigator_name || null,
                                row.collection_methods || null, row.capture_locations || null,
                                row.prokopack_traps_count || 0, row.bg_traps_count || 0,
                                totalMosquitoes, row.male_count || 0, row.female_count || 0,
                                row.aedes_male_count || 0, row.culex_male_count || 0,
                                row.anopheles_male_count || 0, row.other_male_count || 0,
                                row.blood_fed_females_count || 0, row.gravid_females_count || 0, 
                                row.starved_females_count || 0,
                                row.mosquitoes_aedes_count || 0, row.mosquitoes_culex_count || 0,
                                row.mosquitoes_anopheles_count || 0, row.mosquitoes_other_count || 0,
                                row.observations || null
                            ]
                        );
                        break;
                }
                
                inserted++;
                
            } catch (error) {
                console.error(`Erreur ligne ${i + 2}:`, error);
                errors.push(`Ligne ${i + 2}: ${error.message}`);
                skipped++;
            }
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Import terminé',
            stats: {
                total: data.length,
                inserted,
                skipped,
                errors: errors.length
            },
            errors
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur import:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur: ' + error.message 
        });
    } finally {
        client.release();
    }
});

module.exports = router;

