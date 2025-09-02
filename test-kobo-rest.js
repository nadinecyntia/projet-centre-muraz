const axios = require('axios');

async function testKoboREST() {
    try {
        console.log('🔍 Test de l\'API REST KoBoToolbox...\n');
        
        const token = 'cc56673ccdce38c375bf491b06f6132ee289606e';
        const baseUrl = 'https://kf.kobotoolbox.org';
        
        console.log('Token:', token ? '✅ Présent' : '❌ Manquant');
        console.log('Base URL:', baseUrl);
        
        // Test 1: API REST avec /api/v2/assets
        console.log('\n1️⃣ Test API REST /api/v2/assets...');
        try {
            const response = await axios.get(`${baseUrl}/api/v2/assets`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Succès - Nombre d\'assets:', response.data.count);
            
            // Afficher les assets disponibles
            if (response.data.results && response.data.results.length > 0) {
                console.log('   Assets disponibles:');
                response.data.results.forEach(asset => {
                    console.log(`   - ${asset.uid}: ${asset.name} (${asset.asset_type})`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur:', error.response?.status, error.response?.statusText);
            console.log('   Message:', error.response?.data?.detail || error.message);
        }
        
        // Test 2: Test direct du formulaire Gîtes avec assets
        console.log('\n2️⃣ Test direct du formulaire Gîtes (assets)...');
        try {
            const formResponse = await axios.get(`${baseUrl}/api/v2/assets/auDtEVrCioE3PnjQ9VpC4C`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Asset Gîtes trouvé:', formResponse.data.name);
        } catch (error) {
            console.log('❌ Erreur asset Gîtes:', error.response?.status, error.response?.statusText);
        }
        
        // Test 3: Test des soumissions avec l'API REST
        console.log('\n3️⃣ Test des soumissions (API REST)...');
        try {
            const submissionsResponse = await axios.get(`${baseUrl}/api/v2/assets/auDtEVrCioE3PnjQ9VpC4C/data`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Soumissions récupérées:', submissionsResponse.data.count || 0);
        } catch (error) {
            console.log('❌ Erreur soumissions:', error.response?.status, error.response?.statusText);
        }
        
        // Test 4: Test avec l'API v1 legacy
        console.log('\n4️⃣ Test API v1 legacy...');
        try {
            const v1Response = await axios.get(`${baseUrl}/api/v1/data`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ API v1 legacy fonctionne');
        } catch (error) {
            console.log('❌ Erreur API v1 legacy:', error.response?.status, error.response?.statusText);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testKoboREST();
