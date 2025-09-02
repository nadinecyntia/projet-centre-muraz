const axios = require('axios');

async function testIndices() {
    try {
        console.log('🧮 Test de récupération des indices entomologiques...');
        
        const response = await axios.get('http://localhost:3000/api/indices');
        
        if (response.data.success) {
            console.log('✅ Indices récupérés avec succès');
            console.log('📊 Données des indices:', JSON.stringify(response.data.data, null, 2));
        } else {
            console.log('❌ Erreur:', response.data.message);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors du test:', error.message);
    }
}

testIndices();
