const axios = require('axios');

async function testAllForms() {
    try {
        console.log('🔍 Vérification de toutes les soumissions...\n');
        
        const token = 'cc56673ccdce38c375bf491b06f6132ee289606e';
        const baseUrl = 'https://kf.kobotoolbox.org';
        
        const forms = [
            { id: 'auDtEVrCioE3PnjQ9VpC4C', name: 'Gîtes' },
            { id: 'a2Y4srJkaBu4F8W4Qf5577', name: 'Œufs' },
            { id: 'aN4GByzPSxLW28Zc8cPMKP', name: 'Moustiques Adultes' }
        ];
        
        for (const form of forms) {
            console.log(`\n📋 Formulaire: ${form.name} (${form.id})`);
            
            try {
                // Récupérer les soumissions
                const response = await axios.get(`${baseUrl}/api/v2/assets/${form.id}/data`, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const count = response.data.count || 0;
                console.log(`   ✅ Soumissions trouvées: ${count}`);
                
                if (count > 0 && response.data.results) {
                    console.log('   📅 Dernières soumissions:');
                    response.data.results.slice(0, 3).forEach((submission, index) => {
                        const date = submission._submission_time || submission.submission_time || 'Date inconnue';
                        console.log(`      ${index + 1}. ${date}`);
                    });
                    
                    // Afficher les champs de la première soumission
                    if (response.data.results.length > 0) {
                        const firstSubmission = response.data.results[0];
                        console.log('   🔍 Champs de la première soumission:');
                        Object.keys(firstSubmission).slice(0, 10).forEach(key => {
                            console.log(`      - ${key}: ${firstSubmission[key]}`);
                        });
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ Erreur: ${error.response?.status} ${error.response?.statusText}`);
            }
        }
        
        console.log('\n🎯 Vérification terminée !');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testAllForms();
