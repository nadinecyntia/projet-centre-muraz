// =====================================================
// API ENDPOINTS POUR L'IMPORT CSV
// Centre MURAZ - Import de données en masse via CSV
// =====================================================

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { pool } = require('../config/database');
const router = express.Router();

// Appliquer l'authentification pour toutes les routes CSV
router.use(requireAuth);

// Configuration multer pour l'upload de fichiers
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers CSV sont autorisés'), false);
        }
    }
});

// ===== CONFIGURATION DES CHAMPS CSV =====
const CSV_FIELDS = {
    eggs: [
        'eggs_concession_code',
        'eggs_sector', 
        'eggs_environment',
        'eggs_visit_start_date',
        'eggs_gps_code',
        'nest_number',
        'nest_code',
        'pass_order',
        'eggs_count',
        'observations'
    ],
    breeding: [
        'site_investigator_name',
        'site_concession_code',
        'site_house_code',
        'site_sector',
        'site_environment',
        'site_visit_start_date',
        'site_gps_code',
        'total_sites_count',
        'positive_sites_count',
        'negative_sites_count',
        'larvae_genus',
        'larvae_count',
        'aedes_larvae_count',
        'culex_larvae_count',
        'anopheles_larvae_count',
        'other_larvae_count',
        'nymphs_genus',
        'nymphs_count',
        'aedes_nymphs_count',
        'culex_nymphs_count',
        'anopheles_nymphs_count',
        'other_nymphs_count',
        'sites_types',
        'site_classes',
        'observations'
    ],
    mosquitoes: [
        'mosquitoes_concession_code',
        'mosquitoes_sector',
        'mosquitoes_environment',
        'mosquitoes_visit_start_date',
        'mosquitoes_visit_start_time',
        'mosquitoes_visit_end_time',
        'mosquitoes_gps_code',
        'genus',
        'species',
        'collection_methods',
        'capture_locations',
        'prokopack_traps_count',
        'bg_traps_count',
        'prokopack_mosquitoes_count',
        'bg_trap_mosquitoes_count',
        'total_mosquitoes_count',
        'male_count',
        'female_count',
        'aedes_male_count',
        'culex_male_count',
        'anopheles_male_count',
        'other_male_count',
        'blood_fed_females_count',
        'gravid_females_count',
        'starved_females_count',
        'mosquitoes_aedes_count',
        'mosquitoes_culex_count',
        'mosquitoes_anopheles_count',
        'mosquitoes_other_count',
        'observations'
    ]
};

// ===== ENDPOINT PRÉVISUALISATION CSV =====
router.post('/preview', upload.single('csvFile'), async (req, res) => {
    try {
        console.log('📊 Prévisualisation CSV demandée');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier CSV fourni'
            });
        }

        const { dataType } = req.body;
        const results = [];
        const headers = [];
        let validationErrors = [];

        // Lire le fichier CSV
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('headers', (headerList) => {
                headers.push(...headerList);
                
                // Valider les en-têtes si un type de données est spécifié
                if (dataType && CSV_FIELDS[dataType]) {
                    const expectedFields = CSV_FIELDS[dataType];
                    const actualFields = headerList.map(field => field.trim()); // Supprimer les espaces
                    
                    // Créer un mapping pour les colonnes avec espaces
                    const fieldMapping = {};
                    actualFields.forEach(actualField => {
                        const trimmedField = actualField.trim();
                        expectedFields.forEach(expectedField => {
                            if (trimmedField === expectedField || 
                                trimmedField.replace(/\s+/g, '') === expectedField.replace(/\s+/g, '')) {
                                fieldMapping[actualField] = expectedField;
                            }
                        });
                    });
                    
                    const missingFields = expectedFields.filter(field => 
                        !actualFields.includes(field) && 
                        !Object.values(fieldMapping).includes(field)
                    );
                    const extraFields = actualFields.filter(field => 
                        !expectedFields.includes(field) && 
                        !fieldMapping[field]
                    );
                    
                    if (missingFields.length > 0) {
                        validationErrors.push(`Colonnes manquantes: ${missingFields.join(', ')}`);
                    }
                    
                    if (extraFields.length > 0) {
                        validationErrors.push(`Colonnes supplémentaires: ${extraFields.join(', ')}`);
                    }
                }
            })
            .on('data', (data) => {
                results.push(Object.values(data));
            })
            .on('end', () => {
                // Nettoyer le fichier temporaire
                fs.unlinkSync(req.file.path);
                
                res.json({
                    success: true,
                    data: {
                        headers,
                        rows: results.slice(0, 20), // Limiter à 20 lignes pour la prévisualisation
                        totalRows: results.length,
                        dataType: dataType,
                        validationErrors: validationErrors,
                        isValid: validationErrors.length === 0
                    }
                });
            })
            .on('error', (error) => {
                console.error('❌ Erreur lecture CSV:', error);
                fs.unlinkSync(req.file.path);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la lecture du fichier CSV'
                });
            });

    } catch (error) {
        console.error('❌ Erreur prévisualisation CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la prévisualisation'
        });
    }
});

// ===== ENDPOINT IMPORT CSV =====
router.post('/import', upload.single('csvFile'), async (req, res) => {
    try {
        console.log('📥 Import CSV demandé');
        
        const { dataType } = req.body;
        
        if (!req.file || !dataType) {
            return res.status(400).json({
                success: false,
                message: 'Fichier CSV et type de données requis'
            });
        }

        if (!CSV_FIELDS[dataType]) {
            return res.status(400).json({
                success: false,
                message: 'Type de données invalide'
            });
        }

        const results = [];
        const errors = [];
        let insertedCount = 0;
        let streamHeaders = [];
        const tasks = [];

        // Lire et traiter le fichier CSV
        console.log('📄 Lecture du fichier CSV:', req.file.path);
        console.log('📊 Type de données:', dataType);
        console.log('📁 Taille du fichier:', req.file.size, 'bytes');
        
        let lineCount = 0;
        
        // Vérifier que le fichier existe et n'est pas vide
        if (!fs.existsSync(req.file.path)) {
            return res.status(400).json({
                success: false,
                message: 'Fichier CSV introuvable'
            });
        }
        
        const fileStats = fs.statSync(req.file.path);
        console.log('📁 Fichier trouvé, taille:', fileStats.size, 'bytes');
        
        if (fileStats.size === 0) {
            return res.status(400).json({
                success: false,
                message: 'Fichier CSV vide'
            });
        }
        
        // Lire le contenu brut pour debug
        const rawContent = fs.readFileSync(req.file.path, 'utf8');
        console.log('📄 Contenu brut (premiers 200 chars):', rawContent.substring(0, 200));
        console.log('📄 Nombre de lignes brutes:', rawContent.split('\n').length);
        
        const readStream = fs.createReadStream(req.file.path);
        readStream
            .pipe(csv())
            .on('headers', (hdrs) => {
                streamHeaders = (hdrs || []).map(h => (h || '').trim());
                console.log('🧭 En-têtes détectés (parser):', streamHeaders);
            })
            .on('data', (data) => {
                lineCount++;
                console.log(`📝 Ligne CSV ${lineCount} reçue:`, Object.keys(data).length, 'colonnes');
                console.log('📝 Premières colonnes:', Object.keys(data).slice(0, 5));
                const task = (async () => {
                    try {
                        const processedData = processCSVRow(data, dataType);
                        console.log('🔄 Données traitées:', processedData);
                        const result = await insertData(processedData, dataType);
                        if (result.success) {
                            console.log('✅ Insertion réussie');
                            return { success: true, data: processedData };
                        } else {
                            console.log('❌ Erreur insertion:', result.error);
                            return { success: false, error: result.error, data: processedData };
                        }
                    } catch (error) {
                        console.log('❌ Erreur traitement:', error.message);
                        return { success: false, error: error.message, data };
                    }
                })();
                tasks.push(task);
            })
            .on('end', async () => {
                console.log(`📊 Total lignes traitées (parser): ${lineCount}`);
                let manualRowCount = 0;

                // Fallback manuel si le parser n'a rien lu
                if (lineCount === 0) {
                    console.warn('⚠️ Parser CSV n\'a retourné aucune ligne. Activation du fallback manuel.');
                    const lines = rawContent.split(/\r?\n/).filter(l => l && l.trim().length > 0);
                    if (lines.length > 1) {
                        const headerLine = lines[0];
                        const manualHeaders = headerLine.split(',').map(h => h.trim());
                        console.log('🧭 En-têtes détectés (manuel):', manualHeaders);
                        for (let i = 1; i < lines.length; i++) {
                            const row = lines[i];
                            // Simple split, ne gère pas les quotes imbriquées mais suffisant pour debug
                            const cols = row.split(',');
                            const obj = {};
                            manualHeaders.forEach((h, idx) => {
                                obj[h] = cols[idx] !== undefined ? cols[idx] : '';
                            });
                            try {
                                const processedData = processCSVRow(obj, dataType);
                                const result = await insertData(processedData, dataType);
                                if (result.success) {
                                    results.push(processedData);
                                    insertedCount++;
                                } else {
                                    errors.push({ row: i, error: result.error, data: processedData });
                                }
                                manualRowCount++;
                            } catch (e) {
                                errors.push({ row: i, error: e.message, data: obj });
                            }
                        }
                    }
                }

                // Attendre toutes les insertions lancées par le parser
                if (tasks.length > 0) {
                    const taskResults = await Promise.all(tasks);
                    for (const tr of taskResults) {
                        if (tr.success) {
                            results.push(tr.data);
                            insertedCount++;
                        } else {
                            errors.push({ row: results.length + 1, error: tr.error, data: tr.data });
                        }
                    }
                }

                // Nettoyer le fichier temporaire
                try { fs.unlinkSync(req.file.path); } catch (_) {}

                res.json({
                    success: true,
                    inserted: insertedCount,
                    total: results.length,
                    skipped: Math.max(0, (results.length - insertedCount)),
                    errors: errors,
                    message: `Import terminé: ${insertedCount} enregistrements importés sur ${results.length} total`,
                    debug: {
                        filePath: req.file.path,
                        fileSize: req.file.size,
                        parserRowCount: lineCount,
                        manualRowCount,
                        parserHeaders: streamHeaders,
                        contentPreview: rawContent.substring(0, 200)
                    }
                });
            })
            .on('error', (error) => {
                console.error('❌ Erreur import CSV:', error);
                console.error('❌ Détails erreur:', error.stack);
                fs.unlinkSync(req.file.path);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'import CSV',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('❌ Erreur import CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'import'
        });
    }
});

// ===== ENDPOINT TÉLÉCHARGEMENT TEMPLATES =====
router.get('/template/:type', (req, res) => {
    try {
        const { type } = req.params;
        
        if (!CSV_FIELDS[type]) {
            return res.status(400).json({
                success: false,
                message: 'Type de template invalide'
            });
        }

        const fields = CSV_FIELDS[type];
        const csvContent = generateCSVTemplate(fields, type);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_template.csv"`);
        res.send(csvContent);

    } catch (error) {
        console.error('❌ Erreur template CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du template'
        });
    }
});

// ===== FONCTIONS UTILITAIRES =====

function processCSVRow(data, dataType) {
    const processedData = {};
    const fields = CSV_FIELDS[dataType];

    // Normaliser les clés source: trim des espaces et suppression des espaces superflus
    const normalizedSource = {};
    Object.keys(data || {}).forEach((rawKey) => {
        const trimmedKey = (rawKey || '').trim();
        if (trimmedKey) normalizedSource[trimmedKey] = data[rawKey];
    });

    // Alias pour gérer les variantes d'en-têtes rencontrées dans les fichiers
    const aliasesByExpected = {
        // moustiques
        bg_trap_mosquitoes_count: ['bg_traps_mosquitoes_count', 'bg_trap_mosquitos_count'],
        mosquitoes_visit_start_time: ['visit_start_time', 'mosquitoes_start_time'],
        mosquitoes_visit_end_time: ['visit_end_time', 'mosquitoes_end_time'],
        female_count: ['female_count '],
        total_mosquitoes_count: ['total_mosquitoes_count '],
    };

    fields.forEach((field) => {
        // Chercher la valeur normalisée
        let value = normalizedSource[field];
        if (value === undefined) {
            const aliases = aliasesByExpected[field] || [];
            for (const alias of aliases) {
                if (normalizedSource[alias] !== undefined) {
                    value = normalizedSource[alias];
                    break;
                }
            }
        }

        // Traitement spécial selon le type de champ
        if (value !== undefined && value !== null && value !== '') {
            // Conversion des types numériques (garder les décimales)
            if (field.includes('_count') || field.includes('_size') || field.includes('_number')) {
                const parsed = parseFloat(String(value).toString().replace(',', '.'));
                value = isNaN(parsed) ? 0 : parsed;
            } else if (field.includes('_date')) {
                // Validation du format de date
                if (!isValidDate(value)) {
                    throw new Error(`Format de date invalide pour ${field}: ${value}`);
                }
            } else if (
                field.includes('_genus') || field === 'genus' || field === 'species' ||
                field.includes('_types') ||
                field.includes('_classes') ||
                field === 'collection_methods' ||
                field === 'capture_locations'
            ) {
                // Conversion des tableaux - CSV peut contenir "a,b,c" ou un JSON d'array
                const stringValue = String(value).trim();
                if (stringValue.startsWith('[') && stringValue.endsWith(']')) {
                    try {
                        value = JSON.parse(stringValue);
                    } catch (_) {
                        value = [stringValue];
                    }
                } else if (stringValue.includes(',')) {
                    value = stringValue
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean);
                } else {
                    value = [stringValue];
                }

                // Normalisation des valeurs autorisées
                if (field === 'collection_methods') {
                    const allowedMethods = ['prokopack', 'bg', 'cdc', 'human_landing'];
                    value = value
                        .map(v => v.toLowerCase())
                        .map(v => (v === 'bg_trap' ? 'bg' : v))
                        .filter(v => allowedMethods.includes(v));
                    if (value.length === 0) value = ['prokopack'];
                }
                if (field === 'capture_locations') {
                    // Aligner sur la contrainte DB: 'interior' | 'exterior'
                    const allowedLocations = ['interior', 'exterior'];
                    value = value
                        .map(v => v.toLowerCase())
                        .map(v => {
                            if (v === 'indoor' || v === 'inside') return 'interior';
                            if (v === 'outdoor' || v === 'outside') return 'exterior';
                            return v;
                        })
                        .filter(v => allowedLocations.includes(v));
                    if (value.length === 0) value = ['interior'];
                }
            }

            processedData[field] = value;
        }
    });

    // Post-traitements et valeurs par défaut pour moustiques
    if (dataType === 'mosquitoes') {
        // Nettoyage de strings
        if (processedData.mosquitoes_sector) {
            processedData.mosquitoes_sector = String(processedData.mosquitoes_sector).trim();
        }

        // Valeurs numériques obligatoires par défaut à 0 si absentes
        const numericMustHave = [
            'prokopack_traps_count', 'bg_traps_count', 'prokopack_mosquitoes_count',
            'bg_trap_mosquitoes_count', 'male_count', 'female_count',
            'aedes_male_count', 'culex_male_count', 'anopheles_male_count', 'other_male_count',
            'blood_fed_females_count', 'gravid_females_count', 'starved_females_count',
            'mosquitoes_aedes_count', 'mosquitoes_culex_count', 'mosquitoes_anopheles_count', 'mosquitoes_other_count'
        ];
        numericMustHave.forEach((k) => {
            if (processedData[k] === undefined || processedData[k] === null || processedData[k] === '') {
                processedData[k] = 0;
            }
        });

        // total_mosquitoes_count: calculer si manquant
        if (processedData.total_mosquitoes_count === undefined || processedData.total_mosquitoes_count === null || processedData.total_mosquitoes_count === '') {
            const a = Number(processedData.prokopack_mosquitoes_count || 0);
            const b = Number(processedData.bg_trap_mosquitoes_count || 0);
            processedData.total_mosquitoes_count = a + b;
        }

        // Défaut pour listes contraintes
        if (!processedData.collection_methods || (Array.isArray(processedData.collection_methods) && processedData.collection_methods.length === 0)) {
            processedData.collection_methods = 'prokopack';
        }
        if (!processedData.capture_locations || (Array.isArray(processedData.capture_locations) && processedData.capture_locations.length === 0)) {
            processedData.capture_locations = 'interior';
        }
    }

    return processedData;
}

async function insertData(data, dataType) {
    try {
        const client = await pool.connect();
        
        try {
            let query, values;
            
            switch (dataType) {
                case 'eggs':
                    query = `
                        INSERT INTO eggs_collection_new (
                            eggs_concession_code, eggs_sector, eggs_environment, eggs_visit_start_date,
                            eggs_gps_code, nest_number, nest_code, pass_order, eggs_count, observations,
                            status, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
                        RETURNING id
                    `;
                    values = [
                        data.eggs_concession_code,
                        data.eggs_sector,
                        data.eggs_environment,
                        data.eggs_visit_start_date,
                        data.eggs_gps_code,
                        data.nest_number,
                        data.nest_code,
                        data.pass_order,
                        data.eggs_count,
                        data.observations
                    ];
                    break;
                    
                case 'breeding':
                    query = `
                        INSERT INTO breeding_sites_new (
                            site_investigator_name, site_concession_code, site_house_code, site_sector,
                            site_environment, site_visit_start_date, site_gps_code, total_sites_count,
                            positive_sites_count, negative_sites_count, larvae_genus, larvae_count,
                            aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count,
                            nymphs_genus, nymphs_count, aedes_nymphs_count, culex_nymphs_count,
                            anopheles_nymphs_count, other_nymphs_count, sites_types, site_classes,
                            observations, status, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'pending', NOW())
                        RETURNING id
                    `;
                    values = [
                        data.site_investigator_name,
                        data.site_concession_code,
                        data.site_house_code,
                        data.site_sector,
                        data.site_environment,
                        data.site_visit_start_date,
                        data.site_gps_code,
                        data.total_sites_count,
                        data.positive_sites_count,
                        data.negative_sites_count,
                        data.larvae_genus,
                        data.larvae_count,
                        data.aedes_larvae_count,
                        data.culex_larvae_count,
                        data.anopheles_larvae_count,
                        data.other_larvae_count,
                        data.nymphs_genus,
                        data.nymphs_count,
                        data.aedes_nymphs_count,
                        data.culex_nymphs_count,
                        data.anopheles_nymphs_count,
                        data.other_nymphs_count,
                        data.sites_types,
                        data.site_classes,
                        data.observations
                    ];
                    break;
                    
                case 'mosquitoes':
                    query = `
                        INSERT INTO adult_mosquitoes_new (
                            mosquitoes_concession_code, mosquitoes_sector, mosquitoes_environment,
                            mosquitoes_visit_start_date, mosquitoes_visit_start_time, mosquitoes_visit_end_time,
                            mosquitoes_gps_code, genus, species,
                            collection_methods, capture_locations, prokopack_traps_count, bg_traps_count,
                            prokopack_mosquitoes_count, bg_trap_mosquitoes_count, total_mosquitoes_count,
                            male_count, female_count, aedes_male_count, culex_male_count,
                            anopheles_male_count, other_male_count, blood_fed_females_count,
                            gravid_females_count, starved_females_count, mosquitoes_aedes_count,
                            mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                            observations, status, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 'pending', NOW())
                        RETURNING id
                    `;
                    values = [
                        data.mosquitoes_concession_code,
                        data.mosquitoes_sector,
                        data.mosquitoes_environment,
                        data.mosquitoes_visit_start_date,
                        data.mosquitoes_visit_start_time || null,
                        data.mosquitoes_visit_end_time || null,
                        data.mosquitoes_gps_code,
                        (Array.isArray(data.genus) ? data.genus : (data.genus ? [String(data.genus)] : [])),
                        (Array.isArray(data.species) ? data.species : (data.species ? [String(data.species)] : [])),
                        // collection_methods: certaines bases imposent un scalaire via une contrainte CHECK
                        // on insère la première valeur normalisée (prokopack/bg/cdc/human_landing)
                        (Array.isArray(data.collection_methods) ? (data.collection_methods[0] || null) : (data.collection_methods ? String(data.collection_methods) : null)),
                        // capture_locations: certaines bases imposent un scalaire via une contrainte CHECK
                        // on insère la première valeur normalisée (inside/outside)
                        (Array.isArray(data.capture_locations) ? (data.capture_locations[0] || null) : (data.capture_locations ? String(data.capture_locations) : null)),
                        data.prokopack_traps_count,
                        data.bg_traps_count,
                        data.prokopack_mosquitoes_count,
                        data.bg_trap_mosquitoes_count,
                        data.total_mosquitoes_count,
                        data.male_count,
                        data.female_count,
                        data.aedes_male_count,
                        data.culex_male_count,
                        data.anopheles_male_count,
                        data.other_male_count,
                        data.blood_fed_females_count,
                        data.gravid_females_count,
                        data.starved_females_count,
                        data.mosquitoes_aedes_count,
                        data.mosquitoes_culex_count,
                        data.mosquitoes_anopheles_count,
                        data.mosquitoes_other_count,
                        data.observations
                    ];
                    break;
            }
            
            const result = await client.query(query, values);
            return { success: true, id: result.rows[0].id };
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur insertion données:', error);
        return { success: false, error: error.message };
    }
}

function generateCSVTemplate(fields, type) {
    let csvContent = fields.join(',') + '\n';
    
    // Ajouter des exemples de données selon le type
    switch (type) {
        case 'eggs':
            csvContent += 'CONC001,Sector 6,urban,2025-01-15,12.345678,-1.234567,NEST001,NEST001,PASS001,25,Observation œufs\n';
            csvContent += 'CONC002,Sector 9,rural,2025-01-16,12.345679,-1.234568,NEST002,NEST002,PASS002,30,Observation œufs 2\n';
            break;
        case 'breeding':
            csvContent += 'INV001,CONC001,HOUSE001,Sector 6,urban,2025-01-15,12.345678,-1.234567,5,3,2,aedes;culex,15,8,5,2,anopheles,8,3,2,3,plate;box,breeding_utensils,Observation gîtes\n';
            break;
        case 'mosquitoes':
            csvContent += 'CONC001,Sector 6,urban,2025-01-15,12.345678,-1.234567,aedes;culex,aedes_aegypti;culex_quinquefasciatus,prokopack,interior,2,1,15,8,23,12,11,3,5,2,1,8,10,3,2,Observation moustiques\n';
            break;
    }
    
    return csvContent;
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

module.exports = router;
