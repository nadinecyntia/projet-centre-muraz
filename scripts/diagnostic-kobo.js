// Script de diagnostic pour KoboToolbox
// Voir exactement ce qui est envoyé et pourquoi ça ne s'insère pas
const axios = require('axios');
require('dotenv').config();

async function diagnosticKobo() {
    try {
        console.log('🔍 DIAGNOSTIC KOBOCOLLECT - Pourquoi 0 données traitées ?\n');
        
        const apiUrl = process.env.KOBO_API_URL;
        const apiToken = process.env.KOBO_API_TOKEN;
        const forms = {
            gites: process.env.KOBO_FORM_GITES_ID,
            oeufs: process.env.KOBO_FORM_OEUFS_ID,
            adultes: process.env.KOBO_FORM_ADULTES_ID
        };
        
        console.log('📋 Configuration:');
        console.log(`API URL: ${apiUrl}`);
        console.log(`API Token: ${apiToken ? '✅ Présent' : '❌ Manquant'}`);
        console.log('');
        
        // Test de chaque formulaire
        for (const [formName, formId] of Object.entries(forms)) {
            if (!formId) {
                console.log(`⚠️ ${formName}: ID manquant, ignoré`);
                continue;
            }
            
            console.log(`🔄 DIAGNOSTIC du formulaire: ${formName} (ID: ${formId})`);
            console.log('─'.repeat(60));
            
            try {
                const response = await axios.get(`${apiUrl}/assets/${formId}/data/`, {
                    headers: {
                        'Authorization': `Token ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        limit: 5,
                        start: 0
                    }
                });
                
                if (response.data && response.data.results) {
                    const records = response.data.results;
                    console.log(`📊 ${records.length} enregistrements trouvés dans KoboToolbox`);
                    
                    if (records.length > 0) {
                        console.log('\n🔍 ANALYSE du premier enregistrement:');
                        const firstRecord = records[0];
                        
                        // Afficher la structure complète
                        console.log('  Structure complète:');
                        console.log(JSON.stringify(firstRecord, null, 2));
                        
                        // Analyser les champs disponibles
                        console.log('\n📋 CHAMPS DISPONIBLES:');
                        const availableFields = Object.keys(firstRecord);
                        availableFields.forEach(field => {
                            const value = firstRecord[field];
                            const type = typeof value;
                            console.log(`  ${field}: ${type} = ${value}`);
                        });
                        
                        // Vérifier la correspondance avec la base
                        console.log('\n🎯 CORRESPONDANCE AVEC LA BASE:');
                        
                        // Champs attendus pour la table entomological_data
                        const expectedCommonFields = [
                            'start_date', 'end_date', 'start_time', 'end_time',
                            'sector', 'environment', 'gps_code', 'concession_code',
                            'household_size', 'number_of_beds', 'number_of_households',
                            'head_of_household_contact'
                        ];
                        
                        expectedCommonFields.forEach(field => {
                            if (availableFields.includes(field)) {
                                console.log(`  ✅ ${field}: PRÉSENT`);
                            } else {
                                console.log(`  ❌ ${field}: MANQUANT`);
                            }
                        });
                        
                        // Champs spécifiques selon le type de formulaire
                        let expectedSpecificFields = [];
                        switch (formName) {
                            case 'gites':
                                expectedSpecificFields = [
                                    'breeding_site_id', 'breeding_site_status', 'larvae_presence',
                                    'pupae_presence', 'larvae_count', 'pupae_count',
                                    'aedes_larvae_count', 'culex_larvae_count', 'anopheles_larvae_count',
                                    'culex_pupae_count', 'anopheles_pupae_count', 'aedes_pupae_count',
                                    'breeding_site_class', 'breeding_site_type'
                                ];
                                break;
                            case 'oeufs':
                                expectedSpecificFields = [
                                    'nest_number', 'nest_code', 'pass_order', 'eggs_count'
                                ];
                                break;
                            case 'adultes':
                                expectedSpecificFields = [
                                    'number_collected_by_concession', 'collection_method', 'capture_location',
                                    'aedes_presence', 'anopheles_presence', 'culex_presence',
                                    'other_genus_presence', 'male_mosquito_count', 'female_mosquito_count',
                                    'starved_female_count', 'gravid_female_count', 'blood_fed_female_count',
                                    'mosquito_species_aedes_count', 'mosquito_species_autre_aedes_count',
                                    'mosquito_species_culex_count', 'mosquito_species_anopheles_count'
                                ];
                                break;
                        }
                        
                        console.log(`\n🔹 CHAMPS SPÉCIFIQUES ${formName.toUpperCase()}:`);
                        expectedSpecificFields.forEach(field => {
                            if (availableFields.includes(field)) {
                                console.log(`  ✅ ${field}: PRÉSENT`);
                            } else {
                                console.log(`  ❌ ${field}: MANQUANT`);
                            }
                        });
                        
                        // Calculer le pourcentage de correspondance
                        const totalExpected = expectedCommonFields.length + expectedSpecificFields.length;
                        const totalPresent = expectedCommonFields.filter(f => availableFields.includes(f)).length +
                                           expectedSpecificFields.filter(f => availableFields.includes(f)).length;
                        const percentage = Math.round((totalPresent / totalExpected) * 100);
                        
                        console.log(`\n📊 CORRESPONDANCE GLOBALE: ${totalPresent}/${totalExpected} (${percentage}%)`);
                        
                        if (percentage < 50) {
                            console.log('  ⚠️ CORRESPONDANCE FAIBLE - Vérifiez les noms de variables !');
                        } else if (percentage < 80) {
                            console.log('  ⚠️ CORRESPONDANCE MOYENNE - Quelques ajustements nécessaires');
                        } else {
                            console.log('  ✅ CORRESPONDANCE ÉLEVÉE - Problème ailleurs');
                        }
                        
                    } else {
                        console.log('ℹ️ Aucun enregistrement trouvé dans ce formulaire');
                    }
                } else {
                    console.log(`ℹ️ Aucun enregistrement trouvé`);
                }
                
            } catch (error) {
                console.log(`❌ Erreur: ${error.message}`);
                if (error.response) {
                    console.log(`  Status: ${error.response.status}`);
                    console.log(`  Message: ${error.response.data?.detail || 'Aucun détail'}`);
                }
            }
            
            console.log('\n' + '='.repeat(60));
        }
        
        console.log('\n🎯 DIAGNOSTIC TERMINÉ !');
        console.log('\n📝 PROCHAINES ÉTAPES:');
        console.log('   1. Vérifier les noms de variables dans KoboToolbox');
        console.log('   2. S\'assurer qu\'ils correspondent exactement à la base');
        console.log('   3. Tester à nouveau la synchronisation');
        
    } catch (error) {
        console.error('💥 Erreur générale:', error.message);
    }
}

// Exécuter le diagnostic
diagnosticKobo();







