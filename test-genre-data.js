const axios = require('axios');

async function testGenreData() {
    try {
        console.log('🧪 Test de récupération des données par genre...');
        
        const response = await axios.get('http://localhost:3000/api/analyses');
        
        if (response.data.success) {
            const data = response.data.data;
            console.log('✅ Données récupérées avec succès');
            console.log('📊 Genres disponibles:', data.genres);
            console.log('📈 Données par genre:', data.chartData.adultesParGenre);
            
            // Afficher un exemple de données par genre
            const periodes = Object.keys(data.chartData.adultesParGenre);
            if (periodes.length > 0) {
                const premierePeriode = periodes[0];
                console.log(`📅 Données pour ${premierePeriode}:`, data.chartData.adultesParGenre[premierePeriode]);
            }
        } else {
            console.log('❌ Erreur:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testGenreData();
