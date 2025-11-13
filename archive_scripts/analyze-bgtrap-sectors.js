const XLSX = require('xlsx');

function analyzeSectorsInBgtrap() {
    console.log('🔍 Analyse des secteurs dans bg_trap.xlsx\n');
    
    try {
        const workbook = XLSX.readFile('uploads/bg_trap.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Lire les données brutes
        const rawData = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
        
        console.log(`Total de lignes: ${rawData.length}`);
        
        // Trouver la colonne sector
        let sectorColumn = null;
        for (const key in rawData[0]) {
            if (key.toLowerCase().includes('sector')) {
                sectorColumn = key;
                break;
            }
        }
        
        if (!sectorColumn) {
            console.log('❌ Aucune colonne sector trouvée');
            return;
        }
        
        console.log(`Colonne sector: ${sectorColumn}\n`);
        
        // Analyser tous les secteurs
        const sectorCounts = {};
        const uniqueSectors = new Set();
        
        rawData.forEach((row, index) => {
            const sector = row[sectorColumn];
            if (sector !== undefined && sector !== null) {
                const sectorStr = String(sector).trim();
                uniqueSectors.add(sectorStr);
                sectorCounts[sectorStr] = (sectorCounts[sectorStr] || 0) + 1;
            }
        });
        
        console.log('📊 Secteurs trouvés:');
        console.log(`Nombre de secteurs uniques: ${uniqueSectors.size}`);
        
        // Trier par fréquence
        const sortedSectors = Object.entries(sectorCounts)
            .sort(([,a], [,b]) => b - a);
        
        sortedSectors.forEach(([sector, count]) => {
            const isValid = ['Sector 6', 'Sector 9', 'Sector 22', 'Sector 26', 'Sector 33'].includes(sector);
            const status = isValid ? '✅' : '❌ ERREUR';
            console.log(`  ${sector}: ${count} occurrences ${status}`);
        });
        
        // Identifier les erreurs
        const validSectors = ['Sector 6', 'Sector 9', 'Sector 22', 'Sector 26', 'Sector 33'];
        const errors = Array.from(uniqueSectors).filter(sector => !validSectors.includes(sector));
        
        if (errors.length > 0) {
            console.log('\n⚠️  Erreurs de saisie détectées:');
            errors.forEach(error => {
                console.log(`  - "${error}" (${sectorCounts[error]} occurrences)`);
            });
            
            // Montrer quelques exemples d'erreurs
            console.log('\n🔍 Exemples d\'erreurs:');
            let errorExamples = 0;
            rawData.forEach((row, index) => {
                const sector = String(row[sectorColumn] || '').trim();
                if (errors.includes(sector) && errorExamples < 10) {
                    console.log(`  Ligne ${index + 1}: "${sector}"`);
                    errorExamples++;
                }
            });
        } else {
            console.log('\n✅ Tous les secteurs sont corrects !');
        }
        
        // Vérifier la distribution
        console.log('\n📈 Distribution des secteurs:');
        const total = rawData.length;
        validSectors.forEach(sector => {
            const count = sectorCounts[sector] || 0;
            const percentage = ((count / total) * 100).toFixed(1);
            console.log(`  ${sector}: ${count} (${percentage}%)`);
        });
        
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
    }
}

analyzeSectorsInBgtrap();

