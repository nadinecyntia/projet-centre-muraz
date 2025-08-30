// Configuration des formulaires KoboCollect - CORRIGÉE selon la vraie structure
const koboForms = {
    // Formulaire 1: Gîtes Larvaires
    gites: {
        id: process.env.KOBO_FORM_GITES_ID || 'your_gites_form_id',
        name: 'Gîtes Larvaires',
        description: 'Collecte des données sur les gîtes larvaires et pupaires',
        fields: {
            // Variables communes - NOMS EXACTS de la base
            common: [
                'start_date', 'end_date', 'start_time', 'end_time',
                'sector', 'environment', 'gps_code', 'concession_code',
                'household_size', 'number_of_beds', 'number_of_households',
                'head_of_household_contact'
            ],
            // Variables spécifiques aux gîtes - NOMS EXACTS de la base
            specific: [
                'breeding_site_id', 'breeding_site_status', 'larvae_presence',
                'pupae_presence', 'larvae_count', 'pupae_count',
                'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count',
                'culex_pupae_count', 'anopheles_pupae_count', 'aedes_pupae_count',
                'breeding_site_class', 'breeding_site_type'
            ]
        }
    },

    // Formulaire 2: Œufs
    oeufs: {
        id: process.env.KOBO_FORM_OEUFS_ID || 'your_oeufs_form_id',
        name: 'Collecte des Œufs',
        description: 'Collecte des données sur les œufs de moustiques',
        fields: {
            // Variables communes - NOMS EXACTS de la base
            common: [
                'start_date', 'end_date', 'start_time', 'end_time',
                'sector', 'environment', 'gps_code', 'concession_code',
                'household_size', 'number_of_beds', 'number_of_households',
                'head_of_household_contact'
            ],
            // Variables spécifiques aux œufs - NOMS EXACTS de la base
            specific: [
                'nest_number', 'nest_code', 'pass_order', 'eggs_count'
            ]
        }
    },

    // Formulaire 3: Moustiques Adultes
    adultes: {
        id: process.env.KOBO_FORM_ADULTES_ID || 'your_adultes_form_id',
        name: 'Collecte des Moustiques Adultes',
        description: 'Collecte des données sur les moustiques adultes',
        fields: {
            // Variables communes - NOMS EXACTS de la base
            common: [
                'start_date', 'end_date', 'start_time', 'end_time',
                'sector', 'environment', 'gps_code', 'concession_code',
                'household_size', 'number_of_beds', 'number_of_households',
                'head_of_household_contact'
            ],
            // Variables spécifiques aux moustiques adultes - NOMS EXACTS de la base
            specific: [
                'number_collected_by_concession', 'collection_method', 'capture_location',
                'aedes_presence', 'anopheles_presence', 'culex_presence',
                'other_genus_presence', 'male_mosquito_count', 'female_mosquito_count',
                'starved_female_count', 'gravid_female_count', 'blood_fed_female_count',
                'mosquito_species_aedes_count', 'mosquito_species_autre_aedes_count',
                'mosquito_species_culex_count', 'mosquito_species_anopheles_count'
            ]
        }
    }
};

// Fonction pour obtenir la configuration d'un formulaire
function getFormConfig(formType) {
    return koboForms[formType] || null;
}

// Fonction pour obtenir tous les formulaires
function getAllForms() {
    return koboForms;
}

// Fonction pour valider les données selon le type de formulaire
function validateFormData(formType, data) {
    const config = getFormConfig(formType);
    if (!config) {
        return { valid: false, errors: [`Type de formulaire invalide: ${formType}`] };
    }

    const errors = [];
    
    // Seulement valider les champs CRITIQUES (communs essentiels)
    const criticalFields = [
        'start_date', 'end_date', 'sector', 'environment'
    ];
    
    // Vérifier les champs critiques
    for (const field of criticalFields) {
        if (!(field in data) || !data[field]) {
            errors.push(`Champ critique manquant: ${field}`);
        }
    }
    
    // Vérifier au moins UN champ spécifique selon le type
    let hasSpecificField = false;
    for (const field of config.fields.specific) {
        if (field in data && data[field]) {
            hasSpecificField = true;
            break;
        }
    }
    
    if (!hasSpecificField) {
        errors.push(`Aucun champ spécifique trouvé pour ${formType}`);
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Fonction pour mapper les données KoboCollect vers la structure de la base
function mapKoboDataToDB(formType, koboData) {
    const config = getFormConfig(formType);
    if (!config) {
        throw new Error(`Type de formulaire invalide: ${formType}`);
    }

    // Maintenant les noms sont identiques, pas besoin de mapping complexe
    const mappedData = {};
    
    // Mapper tous les champs disponibles
    Object.keys(koboData).forEach(koboField => {
        // Les noms sont maintenant identiques entre KoboToolbox et la base
        if (koboField !== '_id' && koboField !== 'meta' && !koboField.startsWith('_')) {
            mappedData[koboField] = koboData[koboField];
        }
    });

    return mappedData;
}

module.exports = { 
    koboForms, 
    getFormConfig, 
    getAllForms, 
    validateFormData, 
    mapKoboDataToDB 
};
