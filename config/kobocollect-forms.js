// Configuration des formulaires KoboCollect - CORRIGÉE selon la vraie structure
const koboForms = {
    // Formulaire 1: Gîtes Larvaires
    gites: {
        id: process.env.KOBO_FORM_GITES_ID || 'auDtEVrCioE3PnjQ9VpC4C',
        name: 'Gîtes Larvaires',
        description: 'Collecte des données sur les gîtes larvaires et pupaires',
        fields: {
            // Variables communes - NOMS EXACTS de KoboCollect
            common: [
                'investigator_name', 'concession_code', 'house_code',
                'visit_start_date', 'visit_end_date', 'visit_start_time', 'visit_end_time',
                'sector', 'environment', 'gps_code',
                'household_size', 'number_of_beds', 'head_contact'
            ],
            // Variables spécifiques aux gîtes - NOMS EXACTS de KoboCollect
            specific: [
                'total_sites', 'positive_sites', 'negative_sites',
                // 'positive_containers', 'negative_containers', // Supprimés (redondance avec sites)
                'larvae_count', 'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count', 'other_larvae_count',
                'nymphs_count', 'aedes_nymphs_count', 'culex_nymphs_count', 'anopheles_nymphs_count', 'other_nymphs_count',
                'observations'
            ]
        }
    },

    // Formulaire 2: Œufs
    oeufs: {
        id: process.env.KOBO_FORM_OEUFS_ID || 'a2Y4srJkaBu4F8W4Qf5577',
        name: 'Collecte des Œufs',
        description: 'Collecte des données sur les œufs de moustiques',
        fields: {
            // Variables communes - NOMS EXACTS de KoboCollect
            common: [
                'investigator_name', 'concession_code', 'house_code',
                'visit_start_date', 'visit_end_date', 'visit_start_time', 'visit_end_time',
                'sector', 'environment', 'gps_code',
                'household_size', 'number_of_beds', 'head_contact'
            ],
            // Variables spécifiques aux œufs - NOMS EXACTS de KoboCollect
            specific: [
                'nest_number', 'nest_code', 'pass_order', 'eggs_count'
            ]
        }
    },

    // Formulaire 3: Moustiques Adultes
    adultes: {
        id: process.env.KOBO_FORM_ADULTES_ID || 'aN4GByzPSxLW28Zc8cPMKP',
        name: 'Collecte des Moustiques Adultes',
        description: 'Collecte des données sur les moustiques adultes',
        fields: {
            // Variables communes - NOMS EXACTS de KoboCollect
            common: [
                'investigator_name', 'concession_code', 'house_code',
                'visit_start_date', 'visit_end_date', 'visit_start_time', 'visit_end_time',
                'sector', 'environment', 'gps_code',
                'household_size', 'number_of_beds', 'head_contact'
            ],
            // Variables spécifiques aux moustiques adultes - NOMS EXACTS de KoboCollect
            specific: [
                'genus', 'species', 'collection_methods',
                'prokopack_traps_count', 'bg_traps_count', 'capture_locations',
                'prokopack_mosquitoes_count', 'bg_trap_mosquitoes_count', 'total_mosquitoes_count',
                'male_count', 'female_count',
                'blood_fed_females_count', 'gravid_females_count', 'starved_females_count',
                'observations'
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
        'visit_start_date', 'visit_end_date', 'sector', 'environment'
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

    // Mapping des champs KoboCollect vers la structure de la base
    // Normaliser le secteur de Kobo vers la BD
    const sectorMap = {
        'secteur_6': 'Sector 6',
        'secteur_9': 'Sector 9',
        'secteur_26': 'Sector 26',
        'secteur_33': 'Sector 33'
    };
    const rawSector = (koboData.sector || '').toString().toLowerCase();
    const normalizedSector = sectorMap[rawSector] || koboData.sector || 'Sector 6';

    // Normaliser l'environnement Kobo vers la BD ('urban'/'rural')
    const envRaw = (koboData.environment || '').toString().toLowerCase();
    const normalizedEnv = envRaw.includes('urb') ? 'urban' : (envRaw.includes('rur') ? 'rural' : 'urban');

    const mappedData = {
        // Identifiant unique KoBo pour idempotence
        kobo_uuid: koboData._uuid,
        // Champs communs - mapping direct
        investigator_name: koboData.investigator_name,
        concession_code: koboData.concession_code,
        house_code: koboData.house_code,
        visit_start_date: koboData.visit_start_date,
        visit_end_date: koboData.visit_end_date,
        visit_start_time: koboData.visit_start_time,
        visit_end_time: koboData.visit_end_time,
        sector: normalizedSector,
        environment: normalizedEnv,
        gps_code: koboData.gps_code,
        household_size: koboData.household_size,
        number_of_beds: koboData.number_of_beds,
        head_contact: koboData.head_contact
    };

    // Mapping spécifique selon le type de formulaire
    switch (formType) {
        case 'gites':
            // Corriger les valeurs pour respecter les contraintes de la base
            const larvaeCount = parseInt(koboData.larvae_count) || 0;
            const aedesLarvae = parseInt(koboData.aedes_larvae_count) || 0;
            const culexLarvae = parseInt(koboData.culex_larvae_count) || 0;
            const anophelesLarvae = parseInt(koboData.anopheles_larvae_count) || 0;
            const otherLarvae = parseInt(koboData.other_larvae_count) || 0;
            
            const nymphsCount = parseInt(koboData.nymphs_count) || 0;
            const aedesNymphs = parseInt(koboData.aedes_nymphs_count) || 0;
            const culexNymphs = parseInt(koboData.culex_nymphs_count) || 0;
            const anophelesNymphs = parseInt(koboData.anopheles_nymphs_count) || 0;
            const otherNymphs = parseInt(koboData.other_nymphs_count || koboData.orther_nymphs_count) || 0;
            
            // Ajuster les valeurs pour respecter les contraintes
            const totalLarvaeByGenus = aedesLarvae + culexLarvae + anophelesLarvae + otherLarvae;
            const totalNymphsByGenus = aedesNymphs + culexNymphs + anophelesNymphs + otherNymphs;
            
            // Si le total par genre est supérieur au total, utiliser le total par genre
            const adjustedLarvaeCount = totalLarvaeByGenus > larvaeCount ? totalLarvaeByGenus : larvaeCount;
            const adjustedNymphsCount = totalNymphsByGenus > nymphsCount ? totalNymphsByGenus : nymphsCount;
            
            Object.assign(mappedData, {
                total_sites: parseInt(koboData.total_sites) || 0,
                positive_sites: parseInt(koboData.positive_sites) || 0,
                negative_sites: parseInt(koboData.negative_sites) || 0,
                            // positive_containers: parseInt(koboData.positive_containers) || 0, // Supprimé
            // negative_containers: parseInt(koboData.negative_containers) || 0, // Supprimé
                larvae_count: adjustedLarvaeCount,
                aedes_larvae_count: aedesLarvae,
                culex_larvae_count: culexLarvae,
                anopheles_larvae_count: anophelesLarvae,
                other_larvae_count: otherLarvae,
                nymphs_count: adjustedNymphsCount,
                aedes_nymphs_count: aedesNymphs,
                culex_nymphs_count: culexNymphs,
                anopheles_nymphs_count: anophelesNymphs,
                other_nymphs_count: otherNymphs,
                observations: koboData.observations
            });
            break;

        case 'oeufs':
            Object.assign(mappedData, {
                nest_number: koboData.nest_number,
                nest_code: koboData.nest_code,
                pass_order: koboData.pass_order,
                eggs_count: koboData.eggs_count
            });
            break;

        case 'adultes':
            Object.assign(mappedData, {
                genus: koboData.genus,
                species: koboData.species,
                collection_methods: koboData.collection_methods,
                prokopack_traps_count: koboData.prokopack_traps_count,
                bg_traps_count: koboData.bg_traps_count,
                capture_locations: koboData.capture_locations,
                prokopack_mosquitoes_count: koboData.prokopack_mosquitoes_count,
                bg_trap_mosquitoes_count: koboData.bg_trap_mosquitoes_count,
                total_mosquitoes_count: koboData.total_mosquitoes_count,
                male_count: koboData.male_count,
                female_count: koboData.female_count,
                blood_fed_females_count: koboData.blood_fed_females_count,
                gravid_females_count: koboData.gravid_females_count,
                starved_females_count: koboData.starved_females_count,
                observations: koboData.observations
            });
            break;
    }

    return mappedData;
}

module.exports = { 
    koboForms, 
    getFormConfig, 
    getAllForms, 
    validateFormData, 
    mapKoboDataToDB 
};
