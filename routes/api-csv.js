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
        'mosquitoes_gps_code',
        'genus',
        'species',
        'collection_methods',
        'capture_locations',
        'prokopack_traps_count',
        'bg_traps_count',
        'prokopack_mosquitoes_count',
        'bg_traps_mosquitoes_count',
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

        // Lire et traiter le fichier CSV
        console.log('📄 Lecture du fichier CSV:', req.file.path);
        console.log('📊 Type de données:', dataType);
        
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', async (data) => {
                console.log('📝 Ligne CSV reçue:', data);
                try {
                    const processedData = processCSVRow(data, dataType);
                    console.log('🔄 Données traitées:', processedData);
                    const result = await insertData(processedData, dataType);
                    
                    if (result.success) {
                        insertedCount++;
                        console.log('✅ Insertion réussie');
                    } else {
                        console.log('❌ Erreur insertion:', result.error);
                        errors.push({
                            row: results.length + 1,
                            error: result.error
                        });
                    }
                    
                    results.push(processedData);
                } catch (error) {
                    console.log('❌ Erreur traitement:', error.message);
                    errors.push({
                        row: results.length + 1,
                        error: error.message
                    });
                }
            })
            .on('end', () => {
                // Nettoyer le fichier temporaire
                fs.unlinkSync(req.file.path);
                
                res.json({
                    success: true,
                    inserted: insertedCount,
                    total: results.length,
                    skipped: results.length - insertedCount,
                    errors: errors,
                    message: `Import terminé: ${insertedCount} enregistrements importés sur ${results.length} total`
                });
            })
            .on('error', (error) => {
                console.error('❌ Erreur import CSV:', error);
                fs.unlinkSync(req.file.path);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'import du fichier'
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
    
    fields.forEach(field => {
        // Chercher la valeur avec ou sans espaces
        let value = data[field] || data[field + ' '] || data[' ' + field];
        
        // Traitement spécial selon le type de champ
        if (value !== undefined && value !== null && value !== '') {
            // Conversion des types
            if (field.includes('_count') || field.includes('_size') || field.includes('_number')) {
                value = parseInt(value) || 0;
            } else if (field.includes('_date')) {
                // Validation du format de date
                if (!isValidDate(value)) {
                    throw new Error(`Format de date invalide pour ${field}: ${value}`);
                }
            } else if (field.includes('_genus') || field.includes('_types') || field.includes('_classes') || 
                       field === 'collection_methods' || field === 'capture_locations') {
                // Conversion des tableaux - vérifier si c'est déjà un JSON ou une chaîne simple
                if (value.startsWith('[') && value.endsWith(']')) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Si le JSON parsing échoue, traiter comme une chaîne simple
                        value = [value];
                    }
                } else {
                    // Traiter comme une chaîne simple et la convertir en tableau
                    value = [value];
                }
            }
            
            processedData[field] = value;
        }
    });
    
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
                            mosquitoes_visit_start_date, mosquitoes_gps_code, genus, species,
                            collection_methods, capture_locations, prokopack_traps_count, bg_traps_count,
                            prokopack_mosquitoes_count, bg_traps_mosquitoes_count, total_mosquitoes_count,
                            male_count, female_count, aedes_male_count, culex_male_count,
                            anopheles_male_count, other_male_count, blood_fed_females_count,
                            gravid_females_count, starved_females_count, mosquitoes_aedes_count,
                            mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                            observations, status, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 'pending', NOW())
                        RETURNING id
                    `;
                    values = [
                        data.mosquitoes_concession_code,
                        data.mosquitoes_sector,
                        data.mosquitoes_environment,
                        data.mosquitoes_visit_start_date,
                        data.mosquitoes_gps_code,
                        data.genus,
                        data.species,
                        data.collection_methods,
                        data.capture_locations,
                        data.prokopack_traps_count,
                        data.bg_traps_count,
                        data.prokopack_mosquitoes_count,
                        data.bg_traps_mosquitoes_count,
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
