const axios = require('axios');
const koboConfig = require('./config/kobo-config.js');

async function diagnosticGites() {
    try {
        console.log('🔍 Diagnostic du formulaire Gîtes...\n');
        
        // 1. Vérifier la configuration
        console.log('1️⃣ Configuration KoboCollect:');
        console.log('   API URL:', koboConfig.apiUrl);
        console.log('   API Token:', koboConfig.apiToken ? '✅ Présent' : '❌ Manquant');
        console.log('   Form Gîtes ID:', koboConfig.forms.gites);
        
        // 2. Test de connexion à l'API KoboCollect
        console.log('\n2️⃣ Test de connexion à l\'API KoboCollect...');
        try {
            const testResponse = await axios.get(`${koboConfig.apiUrl}/forms`, {
                headers: {
                    'Authorization': `Token ${koboConfig.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Connexion API réussie');
            console.log('   Nombre de formulaires:', testResponse.data.length);
        } catch (error) {
            console.log('❌ Erreur de connexion:', error.response?.status, error.response?.statusText);
            console.log('   Message:', error.response?.data?.detail || error.message);
        }
        
        // 3. Test spécifique du formulaire Gîtes
        console.log('\n3️⃣ Test du formulaire Gîtes...');
        try {
            const formResponse = await axios.get(`${koboConfig.apiUrl}/forms/${koboConfig.forms.gites}`, {
                headers: {
                    'Authorization': `Token ${koboConfig.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Formulaire Gîtes trouvé');
            console.log('   Nom:', formResponse.data.name);
            console.log('   Champs:', Object.keys(formResponse.data.content?.survey || {}).length);
        } catch (error) {
            console.log('❌ Erreur formulaire Gîtes:', error.response?.status, error.response?.statusText);
            console.log('   Message:', error.response?.data?.detail || error.message);
        }
        
        // 4. Test des soumissions du formulaire Gîtes
        console.log('\n4️⃣ Test des soumissions Gîtes...');
        try {
            const submissionsResponse = await axios.get(`${koboConfig.apiUrl}/forms/${koboConfig.forms.gites}/submissions`, {
                headers: {
                    'Authorization': `Token ${koboConfig.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Soumissions récupérées');
            console.log('   Nombre de soumissions:', submissionsResponse.data.length);
            
            if (submissionsResponse.data.length > 0) {
                console.log('   Première soumission:', Object.keys(submissionsResponse.data[0]));
            }
        } catch (error) {
            console.log('❌ Erreur soumissions:', error.response?.status, error.response?.statusText);
            console.log('   Message:', error.response?.data?.detail || error.message);
        }
        
        // 5. Test de notre API de synchronisation
        console.log('\n5️⃣ Test de notre API de synchronisation...');
        try {
            const syncResponse = await axios.post('http://localhost:3000/api/sync-kobo/gites');
            console.log('✅ Synchronisation Gîtes:', syncResponse.data);
        } catch (error) {
            console.log('❌ Erreur synchronisation:', error.response?.status, error.response?.statusText);
            console.log('   Message:', error.response?.data || error.message);
        }
        
        console.log('\n🎯 Diagnostic terminé !');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

diagnosticGites();
