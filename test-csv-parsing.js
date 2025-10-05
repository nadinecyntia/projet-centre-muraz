const fs = require('fs');
const csv = require('csv-parser');

async function testCSVParsing() {
    console.log('📄 Test parsing CSV...');
    
    const results = [];
    
    fs.createReadStream('test-mosquitoes-simple.csv')
        .pipe(csv())
        .on('data', (data) => {
            console.log('📝 Ligne CSV:', data);
            results.push(data);
        })
        .on('end', () => {
            console.log('✅ Parsing terminé');
            console.log('📊 Nombre de lignes:', results.length);
            console.log('📋 Première ligne:', results[0]);
        })
        .on('error', (error) => {
            console.error('❌ Erreur parsing:', error);
        });
}

testCSVParsing();
