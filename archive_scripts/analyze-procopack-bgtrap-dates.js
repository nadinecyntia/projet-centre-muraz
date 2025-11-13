const XLSX = require('xlsx');

function analyzeDatesInFiles() {
    console.log('🔍 Analyse des dates dans procopack et bg_trap\n');
    
    const files = [
        { name: 'procopack.xlsx', path: 'uploads/procopack.xlsx' },
        { name: 'bg_trap.xlsx', path: 'uploads/bg_trap.xlsx' }
    ];
    
    files.forEach(file => {
        console.log(`📁 ${file.name}:`);
        
        try {
            const workbook = XLSX.readFile(file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Lire les données brutes
            const rawData = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
            
            // Trouver la colonne de date
            let dateColumn = null;
            for (const key in rawData[0]) {
                if (key.toLowerCase().includes('date')) {
                    dateColumn = key;
                    break;
                }
            }
            
            if (!dateColumn) {
                console.log('  ❌ Aucune colonne de date trouvée');
                return;
            }
            
            console.log(`  Colonne de date: ${dateColumn}`);
            
            // Analyser toutes les dates uniques
            const uniqueDates = new Set();
            const dateValues = [];
            
            rawData.forEach((row, index) => {
                const value = row[dateColumn];
                if (value !== undefined && value !== null) {
                    uniqueDates.add(value);
                    dateValues.push({ index: index + 1, value: value });
                }
            });
            
            console.log(`  Total de lignes: ${rawData.length}`);
            console.log(`  Dates uniques: ${uniqueDates.size}`);
            
            // Convertir et analyser les dates
            console.log('  Analyse des dates:');
            const convertedDates = [];
            
            Array.from(uniqueDates).slice(0, 20).forEach(excelDate => {
                if (typeof excelDate === 'number') {
                    // Conversion native Excel
                    const date = new Date((excelDate - 25569) * 86400 * 1000);
                    const dateStr = date.toISOString().split('T')[0];
                    convertedDates.push({ excel: excelDate, converted: dateStr, year: date.getFullYear() });
                }
            });
            
            // Trier par date Excel
            convertedDates.sort((a, b) => a.excel - b.excel);
            
            convertedDates.forEach(item => {
                const status = item.year === 1900 ? '❌ PROBLÈME' : '✅ OK';
                console.log(`    Excel ${item.excel} → ${item.converted} ${status}`);
            });
            
            // Chercher spécifiquement les dates de janvier 1900
            const problemDates = convertedDates.filter(item => item.year === 1900);
            if (problemDates.length > 0) {
                console.log(`\n  ⚠️  ${problemDates.length} dates problématiques (1900) trouvées:`);
                problemDates.forEach(item => {
                    console.log(`    Excel ${item.excel} → ${item.converted}`);
                });
            }
            
            // Vérifier s'il y a des valeurs très petites (problématiques)
            const smallValues = Array.from(uniqueDates).filter(val => typeof val === 'number' && val < 100);
            if (smallValues.length > 0) {
                console.log(`\n  ⚠️  ${smallValues.length} valeurs très petites trouvées:`);
                smallValues.forEach(val => {
                    const date = new Date((val - 25569) * 86400 * 1000);
                    console.log(`    Excel ${val} → ${date.toISOString().split('T')[0]}`);
                });
            }
            
        } catch (error) {
            console.log(`  ❌ Erreur: ${error.message}`);
        }
        
        console.log('');
    });
}

analyzeDatesInFiles();

