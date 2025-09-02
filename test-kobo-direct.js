const axios = require('axios');

async function testKoboDirect() {
    try {
        console.log('🔍 Test direct de l\'API KoboCollect...\n');
        
        const token = 'cc56673ccdce38c375bf491b06f6132ee289606e';
        const baseUrl = 'https://kf.kobotoolbox.org';
        
        console.log('Token:', token ? '✅ Présent' : '❌ Manquant');
        console.log('Base URL:', baseUrl);
        
        // Test 1: API v2 avec /forms
        console.log('\n1️⃣ Test API v2 /forms...');
        try {
            const response = await axios.get(`${baseUrl}/api/v2/forms`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Succès - Nombre de formulaires:', response.data.length);
            
            // Afficher les IDs des formulaires disponibles
            if (response.data.length > 0) {
                console.log('   Formulaires disponibles:');
                response.data.forEach(form => {
                    console.log(`   - ${form.uid}: ${form.name}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur:', error.response?.status, error.response?.statusText);
        }
        
        // Test 2: Test direct du formulaire Gîtes
        console.log('\n2️⃣ Test direct du formulaire Gîtes...');
        try {
            const formResponse = await axios.get(`${baseUrl}/api/v2/forms/auDtEVrCioE3PnjQ9VpC4C`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Formulaire Gîtes trouvé:', formResponse.data.name);
        } catch (error) {
            console.log('❌ Erreur formulaire Gîtes:', error.response?.status, error.response?.statusText);
        }
        
        // Test 3: Test des soumissions Gîtes
        console.log('\n3️⃣ Test des soumissions Gîtes...');
        try {
            const submissionsResponse = await axios.get(`${baseUrl}/api/v2/forms/auDtEVrCioE3PnjQ9VpC4C/submissions`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Soumissions récupérées:', submissionsResponse.data.length);
        } catch (error) {
            console.log('❌ Erreur soumissions:', error.response?.status, error.response?.statusText);
        }
        
        // Test 4: Test avec l'API v1
        console.log('\n4️⃣ Test API v1...');
        try {
            const v1Response = await axios.get(`${baseUrl}/api/v1/forms`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ API v1 fonctionne:', v1Response.data.length, 'formulaires');
        } catch (error) {
            console.log('❌ Erreur API v1:', error.response?.status, error.response?.statusText);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testKoboDirect();
