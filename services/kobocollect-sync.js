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
                    // CORRECTION : Les données sont directement dans record, pas dans record.content
                    const submission = record; // ✅ CORRIGÉ !
                    
                    // Valider les données selon le type de formulaire
                    const validation = validateFormData(formType, submission);
                    if (!validation.valid) {
                        console.warn(`⚠️ Données invalides pour ${formType}:`, validation.errors);
                        errorCount++;
                        continue;
                    }
                    
                    // Mapper les données KoboCollect vers la structure de la base
                    const mappedData = mapKoboDataToDB(formType, submission);
                    
                    // Générer un ID de collection unique
                    const collectionId = submission.collection_id || 
                        `${formType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Insérer les données de base
                    const entomologicalResult = await client.query(`
                        INSERT INTO entomological_data (
                            collection_id, form_type, start_date, end_date, start_time, end_time,
                            sector, environment, gps_code, concession_code,
                            household_size, number_of_beds, number_of_households, head_of_household_contact
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        ON CONFLICT (collection_id) DO UPDATE SET
                            start_date = EXCLUDED.start_date,
                            end_date = EXCLUDED.end_date,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id
                    `, [
                        collectionId,
                        formType,
                        mappedData.start_date,
                        mappedData.end_date,
                        mappedData.start_time,
                        mappedData.end_time,
                        mappedData.sector,
                        mappedData.environment,
                        mappedData.gps_code,
                        mappedData.concession_code,
                        mappedData.household_size,
                        mappedData.number_of_beds,
                        mappedData.number_of_households,
                        mappedData.head_of_household_contact
                    ]);

                    const entomologicalDataId = entomologicalResult.rows[0].id;

                    // Traiter selon le type de formulaire
                    switch (formType) {
                        case 'gites':
                            await this.processBreedingSites(client, entomologicalDataId, submission);
                            break;
                        case 'oeufs':
                            await this.processEggsData(client, entomologicalDataId, submission);
                            break;
                        case 'adultes':
                            await this.processAdultMosquitoes(client, entomologicalDataId, submission);
                            break;
                    }

                    processedCount++;
                    
                } catch (recordError) {
                    console.error(`❌ Erreur lors du traitement:`, recordError.message);
                    errorCount++;
                }
            }

            await client.query('COMMIT');
            
            console.log(`✅ Traitement terminé: ${processedCount} traités, ${errorCount} erreurs`);
            return { processedCount, errorCount };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Traiter les gîtes larvaires
    async processBreedingSites(client, entomologicalDataId, submission) {
        if (submission.breeding_sites) {
            for (const site of submission.breeding_sites) {
                await client.query(`
                    INSERT INTO breeding_sites (
                        entomological_data_id, breeding_site_id, breeding_site_status,
                        larvae_presence, pupae_presence, larvae_count, pupae_count,
                        aedes_larvae_count, culex_larvae_count, anopheles_larvae_count,
                        culex_pupae_count, anopheles_pupae_count, aedes_pupae_count,
                        breeding_site_class
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    entomologicalDataId,
                    site.breeding_site_id || null,
                    site.breeding_site_status || null,
                    site.larvae_presence === 'oui',
                    site.pupae_presence === 'oui',
                    parseInt(site.larvae_count) || 0,
                    parseInt(site.pupae_count) || 0,
                    parseInt(site.aedes_larvae_count) || 0,
                    parseInt(site.culex_larvae_count) || 0,
                    parseInt(site.anopheles_larvae_count) || 0,
                    parseInt(site.culex_pupae_count) || 0,
                    parseInt(site.anopheles_pupae_count) || 0,
                    parseInt(site.aedes_pupae_count) || 0,
                    site.breeding_site_class || null
                ]);
            }
        }
    }

    // Traiter les données d'œufs
    async processEggsData(client, entomologicalDataId, submission) {
        if (submission.eggs_data) {
            for (const egg of submission.eggs_data) {
                await client.query(`
                    INSERT INTO eggs_data (
                        entomological_data_id, nest_number, nest_code, pass_order
                    ) VALUES ($1, $2, $3, $4)
                `, [
                    entomologicalDataId,
                    parseInt(egg.nest_number) || null,
                    egg.nest_code || null,
                    parseInt(egg.pass_order) || null
                ]);
            }
        }
    }

    // Traiter les moustiques adultes
    async processAdultMosquitoes(client, entomologicalDataId, submission) {
        if (submission.adult_mosquitoes) {
            const adult = submission.adult_mosquitoes;
            await client.query(`
                INSERT INTO adult_mosquitoes (
                    entomological_data_id, number_collected_by_concession, collection_method,
                    capture_location, aedes_presence, anopheles_presence, culex_presence,
                    other_genus_presence, male_mosquito_count, female_mosquito_count,
                    starved_female_count, gravid_female_count, blood_fed_female_count,
                    mosquito_species_aedes_count, mosquito_species_autre_aedes_count,
                    mosquito_species_culex_count, mosquito_species_anopheles_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
                entomologicalDataId,
                parseInt(adult.number_collected_by_concession) || 0,
                adult.collection_method || null,
                adult.capture_location || 'interieur',
                adult.aedes_presence === 'oui',
                adult.anopheles_presence === 'oui',
                adult.culex_presence === 'oui',
                adult.other_genus_presence === 'oui',
                parseInt(adult.male_mosquito_count) || 0,
                parseInt(adult.female_mosquito_count) || 0,
                parseInt(adult.starved_female_count) || 0,
                parseInt(adult.gravid_female_count) || 0,
                parseInt(adult.blood_fed_female_count) || 0,
                parseInt(adult.mosquito_species_aedes_count) || 0,
                parseInt(adult.mosquito_species_autre_aedes_count) || 0,
                parseInt(adult.mosquito_species_culex_count) || 0,
                parseInt(adult.mosquito_species_anopheles_count) || 0
            ]);
        }
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
                        totalProcessed += result.processedCount;
                        totalErrors += result.errorCount;
                        
                        console.log(`✅ Formulaire ${formType}: ${result.processedCount} traités, ${result.errorCount} erreurs`);
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
            
            await this.updateSyncStatus('completed', result.processedCount);
            
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
        try {
            await pool.query(`
                INSERT INTO kobocollect_sync (form_id, sync_status, records_synced, error_message)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (form_id) DO UPDATE SET
                    sync_status = EXCLUDED.sync_status,
                    records_synced = EXCLUDED.records_synced,
                    error_message = EXCLUDED.error_message,
                    last_sync_date = CURRENT_TIMESTAMP
            `, [this.formId, status, recordsCount, errorMessage]);
            
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut:', error);
        }
    }
}

module.exports = KoboCollectSync;
