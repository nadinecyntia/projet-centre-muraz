const axios = require('axios');
const { pool } = require('../config/database');
const moment = require('moment');
const { getFormConfig, validateFormData, mapKoboDataToDB } = require('../config/kobocollect-forms');
const koboConfig = require('../config/kobo-config');

class KoboCollectSync {
    constructor() {
        this.apiUrl = koboConfig.apiUrl;
        this.apiToken = koboConfig.apiToken;
        
        // Configuration des trois formulaires
        this.forms = koboConfig.forms;
    }

    // Vérifier la configuration
    checkConfig() {
        if (!this.apiToken) {
            throw new Error('Token API KoboCollect manquant');
        }
        
        const missingForms = Object.entries(this.forms)
            .filter(([name, id]) => !id)
            .map(([name]) => name);
            
        if (missingForms.length > 0) {
            throw new Error(`IDs de formulaires manquants: ${missingForms.join(', ')}`);
        }
        
        return true;
    }

    // Récupérer les données depuis KoboCollect pour un formulaire spécifique
    async fetchDataFromKobo(formType) {
        try {
            this.checkConfig();
            
            const formId = this.forms[formType];
            if (!formId) {
                throw new Error(`Type de formulaire invalide: ${formType}`);
            }
            
            console.log(`🔄 Récupération des données du formulaire ${formType} depuis KoboCollect...`);
            
            const response = await axios.get(`${this.apiUrl}/assets/${formId}/data/`, {
                headers: {
                    'Authorization': `Token ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 1000,
                    start: 0
                }
            });

            if (response.data && response.data.results) {
                console.log(`✅ ${response.data.results.length} enregistrements récupérés pour ${formType}`);
                return response.data.results;
            } else {
                console.log(`ℹ️ Aucun enregistrement trouvé pour le formulaire ${formType}`);
                return [];
            }
            
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du formulaire ${formType}:`, error.message);
            throw error;
        }
    }

    // Traiter et insérer les données entomologiques selon le type de formulaire
    async processEntomologicalData(koboData, formType) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            let processedCount = 0;
            let errorCount = 0;
            
            for (const record of koboData) {
                try {
                    // Les données sont directement dans record
                    const submission = record;
                    
                    // Valider les données selon le type de formulaire
                    const validation = validateFormData(formType, submission);
                    if (!validation.valid) {
                        console.warn(`⚠️ Données invalides pour ${formType}:`, validation.errors);
                        errorCount++;
                        continue;
                    }
                    
                    // Mapper les données KoboCollect vers la structure de la base
                    const mappedData = mapKoboDataToDB(formType, submission);
                    
                    // Insérer les données de base dans household_visits
                    const householdResult = await client.query(`
                        INSERT INTO household_visits (
                            investigator_name, concession_code, house_code,
                            visit_start_date, visit_end_date, visit_start_time, visit_end_time,
                            sector, environment, gps_code,
                            household_size, number_of_beds, head_contact
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        ON CONFLICT (concession_code, house_code, visit_start_date)
                        DO UPDATE SET
                            visit_end_date = EXCLUDED.visit_end_date,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id
                    `, [
                        mappedData.investigator_name,
                        mappedData.concession_code,
                        mappedData.house_code,
                        mappedData.visit_start_date,
                        mappedData.visit_end_date,
                        mappedData.visit_start_time,
                        mappedData.visit_end_time,
                        mappedData.sector,
                        mappedData.environment,
                        mappedData.gps_code,
                        mappedData.household_size,
                        mappedData.number_of_beds,
                        mappedData.head_contact
                    ]);

                    const householdId = householdResult.rows[0].id;

                    // Traiter selon le type de formulaire et vérifier si une insertion a eu lieu
                    let wasInserted = false;
                    switch (formType) {
                        case 'gites':
                            wasInserted = await this.processBreedingSites(client, householdId, mappedData);
                            break;
                        case 'oeufs':
                            wasInserted = await this.processEggsData(client, householdId, mappedData);
                            break;
                        case 'adultes':
                            wasInserted = await this.processAdultMosquitoes(client, householdId, mappedData);
                            break;
                    }

                    if (wasInserted) {
                    processedCount++;
                        console.log(`✅ ${formType} traité: ${mappedData.concession_code} - ${mappedData.house_code}`);
                    } else {
                        console.log(`ℹ️ ${formType} déjà présent: ${mappedData.concession_code} - ${mappedData.house_code}`);
                    }
                    
                } catch (recordError) {
                    console.error(`❌ Erreur lors du traitement ${formType}:`, recordError.message);
                    errorCount++;
                }
            }

            await client.query('COMMIT');
            
            console.log(`✅ Traitement terminé: ${processedCount} traités, ${errorCount} erreurs`);
            return { processed: processedCount, errors: errorCount };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Traiter les gîtes larvaires
    async processBreedingSites(client, householdId, mappedData) {
        const result = await client.query(`
                    INSERT INTO breeding_sites (
                household_visit_id, total_sites, positive_sites, negative_sites,
                larvae_count, larvae_genus, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count,
                nymphs_count, nymphs_genus, aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count,
                site_types, site_classes, observations, kobo_uuid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (kobo_uuid) DO NOTHING
            RETURNING id
        `, [
            householdId,
            mappedData.total_sites,
            mappedData.positive_sites,
            mappedData.negative_sites,
            mappedData.larvae_count,
            ['aedes', 'culex', 'anopheles'], // larvae_genus
            mappedData.aedes_larvae_count,
            mappedData.culex_larvae_count,
            mappedData.anopheles_larvae_count,
            mappedData.other_larvae_count || 0,
            mappedData.nymphs_count,
            ['aedes', 'culex', 'anopheles'], // nymphs_genus
            mappedData.aedes_nymphs_count,
            mappedData.culex_nymphs_count,
            mappedData.anopheles_nymphs_count,
            mappedData.other_nymphs_count || 0,
            ['pneu', 'bidon', 'bassin'], // site_types par défaut
            ['ordures ménagères', 'ustensiles abandonnés'], // site_classes par défaut
            mappedData.observations,
            mappedData.kobo_uuid
        ]);
        return result.rows.length > 0; // Retourne true si une insertion a eu lieu
    }

    // Traiter les données d'œufs
    async processEggsData(client, householdId, mappedData) {
        const result = await client.query(`
            INSERT INTO eggs_collection (
                household_visit_id, nest_number, nest_code, pass_order, eggs_count, observations, kobo_uuid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (kobo_uuid) DO NOTHING
            RETURNING id
        `, [
            householdId,
            mappedData.nest_number,
            mappedData.nest_code,
            mappedData.pass_order,
            mappedData.eggs_count,
            'Collecte via KoboCollect',
            mappedData.kobo_uuid
        ]);
        return result.rows.length > 0; // Retourne true si une insertion a eu lieu
    }

    // Traiter les moustiques adultes
    async processAdultMosquitoes(client, householdId, mappedData) {
        // Convertir les chaînes en tableaux pour les champs array
        const genusArray = mappedData.genus ? mappedData.genus.split(' ') : [];
        const speciesArray = mappedData.species ? mappedData.species.split(' ') : [];
        const collectionMethodsArray = mappedData.collection_methods ? mappedData.collection_methods.split(' ') : [];
        const captureLocationsArray = mappedData.capture_locations ? mappedData.capture_locations.split(' ') : [];

        const result = await client.query(`
                INSERT INTO adult_mosquitoes (
                household_visit_id, genus, 
                aedes_count, culex_count, anopheles_count, other_genus_count,
                species, collection_methods,
                prokopack_traps_count, bg_traps_count, capture_locations,
                prokopack_mosquitoes_count, bg_trap_mosquitoes_count, total_mosquitoes_count,
                male_count, female_count,
                blood_fed_females_count, gravid_females_count, starved_females_count,
                observations, kobo_uuid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (kobo_uuid) DO NOTHING
            RETURNING id
        `, [
            householdId,
            genusArray,
            mappedData.aedes_count || 0,
            mappedData.culex_count || 0,
            mappedData.anopheles_count || 0,
            mappedData.other_genus_count || 0,
            speciesArray,
            collectionMethodsArray,
            mappedData.prokopack_traps_count,
            mappedData.bg_traps_count,
            captureLocationsArray,
            mappedData.prokopack_mosquitoes_count,
            mappedData.bg_trap_mosquitoes_count,
            mappedData.total_mosquitoes_count,
            mappedData.male_count,
            mappedData.female_count,
            mappedData.blood_fed_females_count,
            mappedData.gravid_females_count,
            mappedData.starved_females_count,
            mappedData.observations,
            mappedData.kobo_uuid
        ]);
        return result.rows.length > 0; // Retourne true si une insertion a eu lieu
    }

    // Synchronisation complète pour tous les formulaires
    async syncAll() {
        try {
            console.log('🚀 Démarrage de la synchronisation complète...');
            
            let totalProcessed = 0;
            let totalErrors = 0;
            
            // Synchroniser chaque formulaire
            const formTypes = ['gites', 'oeufs', 'adultes'];
            
            for (const formType of formTypes) {
                try {
                    console.log(`🔄 Synchronisation du formulaire: ${formType}`);
                    
                    // Récupérer les données du formulaire spécifique
                    const koboData = await this.fetchDataFromKobo(formType);
                    
                    if (koboData && koboData.length > 0) {
                        const result = await this.processEntomologicalData(koboData, formType);
                        totalProcessed += result.processed;
                        totalErrors += result.errors;
                        
                        console.log(`✅ Formulaire ${formType}: ${result.processed} traités, ${result.errors} erreurs`);
                    } else {
                        console.log(`ℹ️ Aucune donnée pour le formulaire: ${formType}`);
                    }
                    
                } catch (formError) {
                    console.error(`❌ Erreur lors de la synchronisation du formulaire ${formType}:`, formError);
                    totalErrors++;
                }
            }
            
            await this.updateSyncStatus('completed', totalProcessed);
            
            console.log(`🎉 Synchronisation terminée! Total: ${totalProcessed} traités, ${totalErrors} erreurs`);
            return { processedCount: totalProcessed, errorCount: totalErrors };
            
        } catch (error) {
            console.error('💥 Échec de la synchronisation:', error);
            await this.updateSyncStatus('failed', 0, error.message);
            throw error;
        }
    }

    // Synchronisation d'un formulaire spécifique
    async syncForm(formType) {
        try {
            console.log(`🚀 Démarrage de la synchronisation du formulaire: ${formType}`);
            
            const koboData = await this.fetchDataFromKobo(formType);
            const result = await this.processEntomologicalData(koboData, formType);
            
            await this.updateSyncStatus('completed', result.processed);
            
            console.log(`🎉 Synchronisation du formulaire ${formType} terminée!`);
            return result;
            
        } catch (error) {
            console.error(`💥 Échec de la synchronisation du formulaire ${formType}:`, error);
            await this.updateSyncStatus('failed', 0, error.message);
            throw error;
        }
    }

    // Mettre à jour le statut de synchronisation
    async updateSyncStatus(status, recordsCount, errorMessage = null) {
        // Neutralisé: pas de table de statut dédiée. On log uniquement.
        console.log(`ℹ️ Statut synchro: ${status}, enregistrements: ${recordsCount}` + (errorMessage ? `, erreur: ${errorMessage}` : ''));
        return true;
    }
}

module.exports = KoboCollectSync;
