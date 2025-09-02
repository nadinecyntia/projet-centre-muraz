const axios = require('axios');
const koboConfig = require('./config/kobo-config.js');

async function testKoboAPI() {
    try {
        console.log('🔍 Test de l\'API KoboCollect...\n');
        
        const token = koboConfig.apiToken;
        console.log('Token:', token ? '✅ Présent' : '❌ Manquant');
        
        // Test avec différentes URLs
        const urls = [
            'https://kf.kobotoolbox.org/api/v2',
            'https://kf.kobotoolbox.org/api/v1',
            'https://kobo.humanitarianresponse.info/api/v2',
            'https://kobo.humanitarianresponse.info/api/v1'
        ];
        
        for (const url of urls) {
            console.log(`\n🔗 Test de l'URL: ${url}`);
            try {
                const response = await axios.get(`${url}/forms`, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                console.log('✅ Succès - Nombre de formulaires:', response.data.length);
                
                // Si ça marche, testons le formulaire Gîtes
                try {
                    const formResponse = await axios.get(`${url}/forms/${koboConfig.forms.gites}`, {
                        headers: {
                            'Authorization': `Token ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('✅ Formulaire Gîtes trouvé:', formResponse.data.name);
                    return url; // URL qui fonctionne
                } catch (formError) {
                    console.log('❌ Formulaire Gîtes non trouvé avec cette URL');
                }
            } catch (error) {
                console.log('❌ Erreur:', error.response?.status, error.response?.statusText);
            }
        }
        
        console.log('\n❌ Aucune URL ne fonctionne');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testKoboAPI();
