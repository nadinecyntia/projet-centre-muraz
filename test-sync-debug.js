const axios = require('axios');
const { getFormConfig, validateFormData, mapKoboDataToDB } = require('./config/kobocollect-forms');

async function testSyncDebug() {
    try {
        console.log('🔍 Test de debug de la synchronisation...\n');
        
        const token = 'cc56673ccdce38c375bf491b06f6132ee289606e';
        const baseUrl = 'https://kf.kobotoolbox.org';
        
        // Test avec les données réelles de Gîtes
        console.log('1️⃣ Récupération des données Gîtes...');
        const response = await axios.get(`${baseUrl}/api/v2/assets/auDtEVrCioE3PnjQ9VpC4C/data`, {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const submissions = response.data.results;
        console.log(`✅ ${submissions.length} soumissions trouvées`);
        
        if (submissions.length > 0) {
            const submission = submissions[0];
            console.log('\n2️⃣ Analyse de la première soumission:');
            console.log('📋 Données brutes:', JSON.stringify(submission, null, 2));
            
            console.log('\n3️⃣ Test de validation:');
            const validation = validateFormData('gites', submission);
            console.log('✅ Validation:', validation);
            
            if (validation.valid) {
                console.log('\n4️⃣ Test de mapping:');
                const mappedData = mapKoboDataToDB('gites', submission);
                console.log('✅ Données mappées:', JSON.stringify(mappedData, null, 2));
            } else {
                console.log('❌ Validation échouée:', validation.errors);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testSyncDebug();
