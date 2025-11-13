const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { pool } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB max
const MAX_ROWS = 100000; // 100,000 lignes max

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE
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

// Pas d'authentification ici - l'utilisateur est déjà authentifié pour accéder à /admin.html
// router.use(requireAuth); // Désactivé - auth déjà faite au niveau de la page admin

/**
 * Middleware de gestion d'erreurs Multer
 */
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: `Fichier trop volumineux. Taille maximale autorisée: ${MAX_FILE_SIZE / (1024 * 1024)} MB`
            });
        }
        return res.status(400).json({
            success: false,
            message: `Erreur d'upload: ${err.message}`
        });
    }
    
    if (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Erreur serveur'
        });
    }
    
    next();
}

/**
 * Mapping des anciens noms de colonnes vers les nouveaux
 */
const COLUMN_MAPPING = {
    // EGGS - anciens noms avec préfixes
    'eggs_concession_code': 'concession_code',
    'eggs_sector': 'sector',
    'eggs_environment': 'environment',
    'eggs_gps_code': 'gps_coordinates',
    'eggs_gps_coordinates': 'gps_coordinates',
    'eggs_visit_start_date': 'visit_date',
    'eggs_visit_date': 'visit_date',
    'eggs_investigator_name': 'investigator_name',
    'eggs_nest_number': 'nest_number',
    'nest_number': 'nest_number',  // Ajouter mapping direct
    'eggs_nest_code': 'nest_code',
    'nest_code': 'nest_code',      // Ajouter mapping direct
    'eggs_pass_order': 'pass_order',
    'pass_order': 'pass_order',    // Ajouter mapping direct
    'eggs_count': 'eggs_count',
    'eggs_observations': 'observations',
    
    // MOSQUITOES - anciens noms avec préfixes
    'mosquitoes_concession_code': 'concession_code',
    'mosquitoes_sector': 'sector',
    'mosquitoes_environment': 'environment',
    'mosquitoes_gps_code': 'gps_coordinates',
    'mosquitoes_visit_start_date': 'visit_date',
    'mosquitoes_visit_start_time': 'visit_start_time',
    'mosquitoes_visit_end_time': 'visit_end_time',
    
    // BREEDING SITES - anciens noms
    'site_concession_code': 'concession_code',
    'site_sector': 'sector',
    'site_environment': 'environment',
    'site_gps_code': 'gps_coordinates',
    'site_visit_start_date': 'visit_date',
    'site_investigator_name': 'investigator_name',
    'site_visit_start_time': 'visit_start_time',
    'site_visit_end_time': 'visit_end_time',
    
    // Variations avec espaces (trim automatique)
    ' visit_date': 'visit_date',
    'visit_date ': 'visit_date',
    ' prokopack_traps_count': 'prokopack_traps_count',
    'prokopack_traps_count ': 'prokopack_traps_count',
    ' bg_traps_count': 'bg_traps_count',
    'bg_traps_count ': 'bg_traps_count',
    ' visit_start_time': 'visit_start_time',
    'visit_start_time ': 'visit_start_time',
    ' visit_end_time': 'visit_end_time',
    'visit_end_time ': 'visit_end_time',
    ' aedes_male_count': 'aedes_male_count',
    'aedes_male_count ': 'aedes_male_count',
    ' anopheles_male_count': 'anopheles_male_count',
    'anopheles_male_count ': 'anopheles_male_count',
    ' mosquitoes_other_count': 'mosquitoes_other_count',
    'mosquitoes_other_count ': 'mosquitoes_other_count',
    ' observations': 'observations',
    'observations ': 'observations',
    ' concession_code': 'concession_code',
    'concession_code ': 'concession_code',
    ' sector': 'sector',
    'sector ': 'sector',
    ' environment': 'environment',
    'environment ': 'environment',
    ' gps_coordinates': 'gps_coordinates',
    'gps_coordinates ': 'gps_coordinates',
    ' collection_methods': 'collection_methods',
    'collection_methods ': 'collection_methods',
    ' capture_locations': 'capture_locations',
    'capture_locations ': 'capture_locations',
    ' prokopack_mosquitoes_count': 'prokopack_mosquitoes_count',
    'prokopack_mosquitoes_count ': 'prokopack_mosquitoes_count',
    ' bg_trap_mosquitoes_count': 'bg_trap_mosquitoes_count',
    'bg_trap_mosquitoes_count ': 'bg_trap_mosquitoes_count',
    ' total_mosquitoes_count': 'total_mosquitoes_count',
    'total_mosquitoes_count ': 'total_mosquitoes_count',
    ' blood_fed_females_count': 'blood_fed_females_count',
    'blood_fed_females_count ': 'blood_fed_females_count',
    ' gravid_females_count': 'gravid_females_count',
    'gravid_females_count ': 'gravid_females_count',
    ' starved_females_count': 'starved_females_count',
    'starved_females_count ': 'starved_females_count',
    ' culex_male_count': 'culex_male_count',
    'culex_male_count ': 'culex_male_count',
    ' other_male_count': 'other_male_count',
    'other_male_count ': 'other_male_count',
    ' mosquitoes_aedes_count': 'mosquitoes_aedes_count',
    'mosquitoes_aedes_count ': 'mosquitoes_aedes_count',
    ' mosquitoes_culex_count': 'mosquitoes_culex_count',
    'mosquitoes_culex_count ': 'mosquitoes_culex_count',
    ' mosquitoes_anopheles_count': 'mosquitoes_anopheles_count',
    'mosquitoes_anopheles_count ': 'mosquitoes_anopheles_count',
    ' male_count': 'male_count',
    'male_count ': 'male_count',
    ' female_count': 'female_count',
    'female_count ': 'female_count',
    
    // Champs spécifiques HOUSES (breeding_sites uniquement)
    'household_size': 'household_size',
    ' household_size': 'household_size',
    'household_size ': 'household_size',
    'sleeping_unit_count': 'sleeping_unit_count',
    ' sleeping_unit_count': 'sleeping_unit_count',
    'sleeping_unit_count ': 'sleeping_unit_count',
    'head_contact': 'head_contact',
    ' head_contact': 'head_contact',
    'head_contact ': 'head_contact',
};

/**
 * Normaliser les noms de colonnes d'une ligne
 */
function normalizeRowColumns(row) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(row)) {
        // Trim les espaces du nom de colonne d'abord
        const trimmedKey = key.trim();
        
        // Chercher dans le mapping avec la clé originale ET la clé trimmée
        let normalizedKey = COLUMN_MAPPING[key] || COLUMN_MAPPING[trimmedKey];
        
        // Si pas trouvé dans le mapping, utiliser la clé trimmée directement
        if (!normalizedKey) {
            normalizedKey = trimmedKey;
        }
        
        normalized[normalizedKey] = value;
    }
    
    return normalized;
}

/**
 * Convertir un nombre Excel en date SQL (YYYY-MM-DD)
 */
function excelDateToSQLDate(excelDate) {
    if (!excelDate) return null;
    
    // Si c'est déjà au format YYYY-MM-DD ou similaire, le retourner tel quel
    if (typeof excelDate === 'string' && excelDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        return excelDate.split(' ')[0]; // Prendre seulement la date
    }
    
    // Utiliser la conversion native Excel (la plus fiable)
    try {
        // Conversion native Excel : (Excel_date - 25569) * 86400 * 1000
        // 25569 = nombre de jours entre 1900-01-01 et 1970-01-01 (epoch Unix)
        const date = new Date((parseFloat(excelDate) - 25569) * 86400 * 1000);
        
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            return null;
        }
        
        // Formater en YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Erreur conversion date Excel:', error);
        return null;
    }
}

/**
 * Convertir un nombre Excel en heure SQL (HH:MM:SS)
 */
function excelTimeToSQLTime(excelTime) {
    if (!excelTime) return null;
    
    // Si c'est déjà au format HH:MM ou HH:MM:SS, le retourner
    if (typeof excelTime === 'string' && excelTime.match(/^\d{1,2}:\d{2}/)) {
        return excelTime.length === 5 ? `${excelTime}:00` : excelTime;
    }
    
    // Convertir le nombre décimal en heure
    // 0.25 = 6h, 0.5 = 12h, 0.75 = 18h, etc.
    const timeValue = parseFloat(excelTime);
    const totalSeconds = Math.round(timeValue * 24 * 60 * 60);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Normaliser les valeurs d'une ligne (convertir dates et heures Excel, normaliser secteurs)
 */
function normalizeRowValues(row) {
    const normalized = { ...row };
    
    // Colonnes de dates à convertir
    const dateColumns = ['visit_date', 'date_visit', 'visit_start_date'];
    dateColumns.forEach(col => {
        // Vérifier explicitement undefined et null, pas seulement truthy
        if (normalized[col] !== undefined && normalized[col] !== null && normalized[col] !== '') {
            normalized[col] = excelDateToSQLDate(normalized[col]);
        }
    });
    
    // Colonnes d'heures à convertir
    const timeColumns = ['visit_start_time', 'visit_end_time', 'start_time', 'end_time'];
    timeColumns.forEach(col => {
        if (normalized[col] !== undefined && normalized[col] !== null && normalized[col] !== '') {
            normalized[col] = excelTimeToSQLTime(normalized[col]);
        }
    });
    
    // Normaliser les secteurs (sector et eggs_sector)
    if (normalized.sector) {
        normalized.sector = normalizeSectorValue(normalized.sector);
    }
    if (normalized.eggs_sector) {
        normalized.eggs_sector = normalizeSectorValue(normalized.eggs_sector);
    }
    
    return normalized;
}

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
        
        // Convertir en JSON avec raw=true pour garder les nombres Excel
        const rawData = XLSX.utils.sheet_to_json(sheet, { 
            raw: true, // Garder les nombres Excel pour conversion manuelle
            defval: null // Valeur par défaut pour les cellules vides
        });
        
        // Normaliser les noms de colonnes ET les valeurs pour chaque ligne
        const data = rawData.map((row, index) => {
            const normalizedColumns = normalizeRowColumns(row);
            const normalizedValues = normalizeRowValues(normalizedColumns);
            
            // Debug pour les dates (premières 5 lignes)
            if (index < 5 && normalizedValues.visit_date) {
                console.log(`🔍 DEBUG DATE - Ligne ${index + 1}:`);
                console.log(`   Raw date: ${row.eggs_visit_start_date || row.visit_date}`);
                console.log(`   After normalizeRowColumns: ${normalizedColumns.visit_date}`);
                console.log(`   After normalizeRowValues: ${normalizedValues.visit_date}`);
            }
            
            // Debug pour les 2 premières lignes
            if (index < 2) {
                console.log(`\n🔍 DEBUG PARSING - Ligne ${index + 1}:`);
                console.log('   📥 AVANT normalizeRowColumns:');
                console.log('      nest_number:', JSON.stringify(row.nest_number));
                console.log('      eggs_nest_number:', JSON.stringify(row.eggs_nest_number));
                console.log('   📤 APRÈS normalizeRowColumns:');
                console.log('      nest_number:', JSON.stringify(normalizedColumns.nest_number));
                console.log('   ✅ APRÈS normalizeRowValues:');
                console.log('      nest_number:', JSON.stringify(normalizedValues.nest_number));
            }
            
            return normalizedValues;
        });

        return { success: true, data, sheetName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Helper function: Clean empty/whitespace values for integer fields
 */
function cleanIntegerValue(value) {
    // Si undefined, null, ou chaîne vide/espaces → retourner null
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return null;
    }
    
    // Tenter de parser en nombre
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Helper function: Normalize sector values to standard format
 * Maps variations like "Secteur 22", "sector 22", "Sector22", etc. to "Sector 22"
 */
function normalizeSectorValue(sector) {
    if (!sector || sector === null || sector === undefined) {
        return null;
    }
    
    let normalized = String(sector).trim();
    
    // Normaliser les espaces multiples en un seul espace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Mapping des variations vers les valeurs standard
    const sectorMapping = {
        // Variations françaises
        'secteur 6': 'Sector 6',
        'secteur 06': 'Sector 6',
        'secteur 9': 'Sector 9',
        'secteur 22': 'Sector 22',
        'secteur 26': 'Sector 26',
        'secteur 33': 'Sector 33',
        
        // Fautes de frappe
        'secctor 26': 'Sector 26',
        'sector26': 'Sector 26',
        'sector22': 'Sector 22',
        
        // Variations de casse
        'sector 6': 'Sector 6',
        'sector 9': 'Sector 9',
        'sector 22': 'Sector 22',
        'sector 26': 'Sector 26',
        'sector 33': 'Sector 33',
        
        // Double espace
        'sector  33': 'Sector 33',
        
        // Secteur invalide (corriger Sector 10 en Sector 9)
        'sector 10': 'Sector 9',
        'secteur 10': 'Sector 9',
        
        // Sans espace
        'sector6': 'Sector 6',
        'sector9': 'Sector 9',
        'sector22': 'Sector 22',
        'sector26': 'Sector 26',
        'sector33': 'Sector 33',
    };
    
    // Vérifier dans le mapping
    const lowerKey = normalized.toLowerCase();
    if (sectorMapping[lowerKey]) {
        return sectorMapping[lowerKey];
    }
    
    // Si déjà au bon format, capitaliser la première lettre
    const match = normalized.match(/^(sector|secteur)\s+(\d+)$/i);
    if (match) {
        const num = match[2];
        // Normaliser le format : "Sector" + espace + nombre
        return `Sector ${num}`;
    }
    
    // Si c'est déjà au bon format, le retourner tel quel
    if (/^Sector \d+$/.test(normalized)) {
        return normalized;
    }
    
    // Sinon, retourner tel quel
    return normalized;
}

/**
 * Helper function: Clean GPS coordinates, preserving "0" as valid value
 */
function cleanGPSValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    
    // Convertir en string et trim
    const strValue = String(value).trim();
    
    // Si vide après trim, retourner null
    if (strValue === '') {
        return null;
    }
    
    // Préserver "0" comme valeur valide (pas null)
    return strValue;
}

/**
 * Helper function: Clean empty/whitespace values for text fields
 */
function cleanTextValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
}

/**
 * Helper function: Preserve text values as-is (even if empty/whitespace)
 */
function preserveTextValue(value) {
    if (value === undefined || value === null) {
        return '';
    }
    
    return String(value); // Garder tel quel, même si vide ou espaces
}

/**
 * Helper function: Find or create house
 * 
 * @param {Object} client - PostgreSQL client
 * @param {Object} houseData - House data from Excel row
 * @param {string} collectionType - Type of collection ('eggs', 'breeding', 'mosquitoes')
 * @returns {number} house_id
 * 
 * STRUCTURE DE LA TABLE HOUSES:
 * - Champs COMMUNS (tous les types): concession_code, sector, environment, gps_coordinates
 * - Les champs household_size, sleeping_unit_count, head_contact sont maintenant dans breeding_sites
 */
async function findOrCreateHouse(client, houseData, collectionType = 'eggs') {
    const { 
        concession_code, 
        sector, 
        environment, 
        gps_coordinates
    } = houseData;
    
    // Chercher la maison existante
    const searchResult = await client.query(
        'SELECT id FROM houses WHERE concession_code = $1 AND sector = $2',
        [concession_code, sector]
    );
    
    if (searchResult.rows.length > 0) {
        // Maison trouvée
        const houseId = searchResult.rows[0].id;
        
        // Mettre à jour environment et GPS si fournis (tous types)
        const updateFields = [];
        const updateValues = [];
        let paramCounter = 1;
        
        if (environment) {
            updateFields.push(`environment = $${paramCounter++}`);
            updateValues.push(environment);
        }
        
        if (gps_coordinates) {
            updateFields.push(`gps_coordinates = $${paramCounter++}`);
            updateValues.push(gps_coordinates);
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = NOW()`);
            updateValues.push(houseId);
            await client.query(
                `UPDATE houses SET ${updateFields.join(', ')} WHERE id = $${paramCounter}`,
                updateValues
            );
        }
        
        return houseId;
    }
    
    // Créer une nouvelle maison (seulement les champs communs)
    const createResult = await client.query(
        `INSERT INTO houses (
            concession_code, sector, environment, gps_coordinates,
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [
            concession_code, 
            sector, 
            environment, 
            cleanGPSValue(gps_coordinates)
        ]
    );
    
    return createResult.rows[0].id;
}

/**
 * Validate eggs collection data
 */
function validateEggsData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`concession_code manquant`);
    if (!row.sector) errors.push(`sector manquant`);
    if (!row.environment) errors.push(`environment manquant`);
    if (!row.visit_date) errors.push(`visit_date manquant`);
    
    // Note: eggs_count peut être vide - sera traité comme 0 lors de l'insertion
    
    return errors;
}

/**
 * Validate breeding sites data
 */
function validateBreedingData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`concession_code manquant`);
    if (!row.sector) errors.push(`sector manquant`);
    if (!row.environment) errors.push(`environment manquant`);
    if (!row.visit_date) errors.push(`visit_date manquant`);
    if (!row.investigator_name) errors.push(`investigator_name manquant`);
    if (!row.site_state) errors.push(`site_state manquant`);
    
    return errors;
}

/**
 * Validate mosquitoes data
 */
function validateMosquitoesData(row, index) {
    const errors = [];
    
    if (!row.concession_code) errors.push(`concession_code manquant`);
    if (!row.sector) errors.push(`sector manquant`);
    if (!row.environment) errors.push(`environment manquant`);
    if (!row.visit_date) errors.push(`visit_date manquant`);
    
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
                'concession_code', 'sector', 'environment', 'gps_coordinates',
                'visit_date', 'nest_number', 'nest_code', 'pass_order',
                'eggs_count', 'observations'
            ];
            filename = 'template_eggs_collections.xlsx';
            break;
            
        case 'breeding':
            headers = [
                'concession_code', 'sector', 'environment', 'gps_coordinates',
                'household_size', 'sleeping_unit_count', 'head_contact',
                'visit_date', 'investigator_name', 'visit_start_time', 'visit_end_time', 'site_state',
                'sites_types', 'site_classes',
                'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count', 'other_larvae_count',
                'aedes_nymphs_count', 'culex_nymphs_count', 'anopheles_nymphs_count', 'other_nymphs_count',
                'observations'
            ];
            filename = 'template_breeding_sites.xlsx';
            break;
            
        case 'mosquitoes':
            headers = [
                'concession_code', 'sector', 'environment', 'gps_coordinates',
                'visit_date', 'visit_start_time', 'visit_end_time',
                'collection_methods', 'capture_locations',
                'prokopack_traps_count', 'bg_traps_count', 'prokopack_mosquitoes_count', 'bg_trap_mosquitoes_count',
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
router.post('/preview', upload.single('file'), handleMulterError, async (req, res) => {
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
        
        // Vérifier le nombre de lignes
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le fichier est vide ou ne contient pas de données valides'
            });
        }
        
        if (data.length > MAX_ROWS) {
            return res.status(400).json({
                success: false,
                message: `Trop de lignes (${data.length}). Maximum autorisé: ${MAX_ROWS} lignes`
            });
        }
        
        console.log('📊 Données parsées - Prévisualisation');
        console.log(`   Total lignes: ${data.length}`);
        
        if (data.length > 0) {
            console.log('   Première ligne (colonnes):');
            console.log('   ', Object.keys(data[0]));
            console.log('   Première ligne (valeurs):');
            console.log('   concession_code:', data[0].concession_code);
            console.log('   sector:', data[0].sector);
            console.log('   environment:', data[0].environment);
            console.log('   visit_date:', data[0].visit_date);
            console.log('   eggs_count:', data[0].eggs_count, '← CRITIQUE');
        }
        
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
            
            if (errors.length > 0 && validationErrors.length < 5) {
                console.log(`❌ Erreur ligne ${index + 2}:`, errors);
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
router.post('/execute', upload.single('file'), handleMulterError, async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('🚀 ========== DÉBUT IMPORT ==========');
        console.log('📁 Fichier reçu:', req.file ? req.file.originalname : 'AUCUN');
        console.log('📊 Type:', req.body.type);
        
        if (!req.file) {
            console.error('❌ Aucun fichier uploadé');
            return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
        }
        
        const { type } = req.body;
        if (!type || !['eggs', 'breeding', 'mosquitoes'].includes(type)) {
            console.error('❌ Type invalide:', type);
            return res.status(400).json({ success: false, message: 'Type de données invalide' });
        }
        
        console.log('📤 Parsing du fichier...');
        // Parser le fichier
        const parseResult = parseFile(req.file.buffer, req.file.originalname);
        
        if (!parseResult.success) {
            console.error('❌ Erreur parsing:', parseResult.error);
            return res.status(400).json({ 
                success: false, 
                message: 'Erreur de parsing du fichier: ' + parseResult.error 
            });
        }
        
        const data = parseResult.data;
        console.log(`✅ Fichier parsé: ${data.length} lignes`);
        
        // Vérifier le nombre de lignes
        if (data.length === 0) {
            throw new Error('Le fichier est vide ou ne contient pas de données valides');
        }
        
        if (data.length > MAX_ROWS) {
            throw new Error(`Trop de lignes (${data.length}). Maximum autorisé: ${MAX_ROWS} lignes`);
        }
        
        console.log('🔄 Début de la transaction SQL...');
        // Augmenter le timeout pour les gros imports (10 minutes)
        await client.query('SET statement_timeout = 600000');
        await client.query('BEGIN');
        
        let inserted = 0;
        let errors = [];
        let skipped = 0;
        
        console.log(`🔄 Traitement de ${data.length} lignes...`);
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Log toutes les 1000 lignes
            if (i % 1000 === 0) {
                console.log(`📊 Progression: ${i}/${data.length} lignes traitées...`);
            }
            
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
                    // Afficher les 5 premières erreurs pour debug
                    if (errors.length < 5) {
                        console.error(`❌ Ligne ${i + 2}:`, validationErrors.join(', '));
                    }
                    errors.push(`Ligne ${i + 2}: ${validationErrors.join(', ')}`);
                    skipped++;
                    continue;
                }
                
                // Find or create house
                if (i === 0) {
                    console.log('🏠 Exemple de données (première ligne):');
                    console.log('   Colonnes disponibles:', Object.keys(row));
                    console.log('   concession_code:', row.concession_code);
                    console.log('   sector:', row.sector);
                    console.log('   environment:', row.environment);
                    console.log('   visit_date:', row.visit_date);
                    console.log('   eggs_count:', row.eggs_count);
                    console.log('   🔍 nest_number (valeur brute):', JSON.stringify(row.nest_number));
                    console.log('   🔍 nest_number (type):', typeof row.nest_number);
                    console.log('   🔍 nest_number (après preserveTextValue):', JSON.stringify(preserveTextValue(row.nest_number)));
                }
                
                const houseId = await findOrCreateHouse(client, {
                    concession_code: row.concession_code,
                    sector: row.sector,
                    environment: row.environment,
                    gps_coordinates: cleanGPSValue(row.gps_coordinates),
                    // Champs spécifiques aux gîtes (breeding_sites)
                    household_size: row.household_size || null,
                    sleeping_unit_count: row.sleeping_unit_count || null,
                    head_contact: row.head_contact || null
                }, type);
                
                if (i === 0) {
                    console.log('   ✅ House ID:', houseId);
                }
                
                // Debug nest_number pour les 5 premières lignes
                if (i < 5 && row.nest_number !== undefined && row.nest_number !== null && row.nest_number !== '') {
                    console.log(`   📌 Ligne ${i + 1} a nest_number: "${row.nest_number}"`);
                }
                
                // Insert data selon le type
                switch (type) {
                    case 'eggs':
                        await client.query(
                            `INSERT INTO eggs_collections (
                                house_id, visit_date, nest_number, nest_code, 
                                pass_order, eggs_count, observations, status, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', NOW(), NOW())`,
                            [
                                houseId, row.visit_date,
                                preserveTextValue(row.nest_number), // VARCHAR - garde valeurs vides/virgules
                                cleanTextValue(row.nest_code),
                                cleanIntegerValue(row.pass_order),
                                cleanIntegerValue(row.eggs_count) || 0,
                                cleanTextValue(row.observations)
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
                        
                        // Parse sites_types and site_classes (single values, but stored as arrays in DB)
                        let sitesTypesArray = [];
                        let siteClassesArray = [];
                        
                        if (row.sites_types) {
                            // Convert to string and trim
                            const siteTypeStr = String(row.sites_types).trim();
                            if (siteTypeStr !== '') {
                                sitesTypesArray = [siteTypeStr];
                            }
                        }
                        
                        if (row.site_classes) {
                            // Convert to string and trim
                            const siteClassStr = String(row.site_classes).trim();
                            if (siteClassStr !== '') {
                                siteClassesArray = [siteClassStr];
                            }
                        }
                        
                        await client.query(
                            `INSERT INTO breeding_sites (
                                house_id, visit_date, investigator_name, visit_start_time, visit_end_time, site_state,
                                sites_types, site_classes,
                                aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count, larvae_count,
                                aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count, nymphs_count,
                                household_size, sleeping_unit_count, head_contact,
                                observations, status
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'approved')`,
                            [
                                houseId, row.visit_date, row.investigator_name, 
                                row.visit_start_time || null, row.visit_end_time || null, row.site_state,
                                sitesTypesArray, siteClassesArray,
                                row.aedes_larvae_count || 0, row.culex_larvae_count || 0, 
                                row.anopheles_larvae_count || 0, row.other_larvae_count || 0, larvaeCount,
                                row.aedes_nymphs_count || 0, row.culex_nymphs_count || 0,
                                row.anopheles_nymphs_count || 0, row.other_nymphs_count || 0, nymphsCount,
                                cleanIntegerValue(row.household_size) || null,
                                cleanIntegerValue(row.sleeping_unit_count) || null,
                                cleanTextValue(row.head_contact) || null,
                                row.observations || null
                            ]
                        );
                        break;
                        
                    case 'mosquitoes':
                        // Calculer male_count si manquant
                        const calculatedMaleCount = (parseInt(row.aedes_male_count) || 0) +
                                                   (parseInt(row.culex_male_count) || 0) +
                                                   (parseInt(row.anopheles_male_count) || 0) +
                                                   (parseInt(row.other_male_count) || 0);
                        
                        const maleCount = row.male_count !== undefined && row.male_count !== null && row.male_count !== '' 
                            ? parseInt(row.male_count) 
                            : calculatedMaleCount;
                        
                        // Utiliser total_mosquitoes_count du fichier ou calculer
                        let totalMosquitoes = 0;
                        if (row.total_mosquitoes_count !== undefined && row.total_mosquitoes_count !== null && row.total_mosquitoes_count !== '') {
                            totalMosquitoes = parseInt(row.total_mosquitoes_count) || 0;
                        } else {
                            totalMosquitoes = (maleCount || 0) + (parseInt(row.female_count) || 0);
                        }
                        
                        // Calculer female_count si manquant
                        const femaleCount = row.female_count !== undefined && row.female_count !== null && row.female_count !== '' 
                            ? parseInt(row.female_count) 
                            : Math.max(0, totalMosquitoes - maleCount);
                        
                        // Use provided times or default to 00:00:00
                        const visitStartTime = row.visit_start_time || '00:00:00';
                        const visitEndTime = row.visit_end_time || '00:00:00';
                        
                        await client.query(
                            `INSERT INTO adult_mosquitoes_collections (
                                house_id, visit_date, visit_start_time, visit_end_time,
                                collection_methods, capture_locations,
                                prokopack_traps_count, bg_traps_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                                total_mosquitoes_count, male_count, female_count,
                                aedes_male_count, culex_male_count, anopheles_male_count, other_male_count,
                                blood_fed_females_count, gravid_females_count, starved_females_count,
                                mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                                observations, status, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'approved', NOW(), NOW())`,
                            [
                                houseId, row.visit_date, visitStartTime, visitEndTime,
                                row.collection_methods || null, row.capture_locations || null,
                                row.prokopack_traps_count || 0, row.bg_traps_count || 0,
                                row.prokopack_mosquitoes_count || 0, row.bg_trap_mosquitoes_count || 0,
                                totalMosquitoes, maleCount, femaleCount,
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
        
        console.log('✅ Traitement terminé');
        console.log(`   📊 Inserted: ${inserted}`);
        console.log(`   ⚠️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors.length}`);
        
        console.log('💾 COMMIT de la transaction...');
        await client.query('COMMIT');
        console.log('✅ Transaction commitée avec succès');
        
        console.log('🚀 ========== FIN IMPORT ==========');
        
        res.json({
            success: true,
            data: {
                inserted,
                skipped,
                errors: errors.slice(0, 100) // Limiter à 100 erreurs pour l'affichage
            }
        });
        
    } catch (error) {
        console.error('❌ ========== ERREUR CRITIQUE ==========');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        await client.query('ROLLBACK');
        console.log('🔄 Transaction ROLLBACK effectué');
        
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur: ' + error.message 
        });
    } finally {
        client.release();
        console.log('🔌 Connexion DB libérée');
    }
});

module.exports = router;
