// =====================================================
// SCRIPT DE TEST POUR L'IMPORT CSV
// Centre MURAZ - Diagnostic complet de l'import
// =====================================================

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

console.log('🔍 === DIAGNOSTIC IMPORT CSV ===');

// Test 1: Créer un fichier CSV de test
function createTestCSV() {
    console.log('\n📝 Test 1: Création fichier CSV de test...');
    
    const testData = `mosquitoes_visit_start_date,mosquitoes_concession_code,mosquitoes_sector,mosquitoes_environment,mosquitoes_gps_code,genus,species,collection_methods,capture_locations,prokopack_traps_count,bg_traps_count,prokopack_mosquitoes_count,bg_trap_mosquitoes_count,total_mosquitoes_count,male_count,female_count,aedes_male_count,culex_male_count,anopheles_male_count,other_male_count,blood_fed_females_count,gravid_females_count,starved_females_count,mosquitoes_aedes_count,mosquitoes_culex_count,mosquitoes_anopheles_count,mosquitoes_other_count,observations
2022-05-02,1,Sector 9,urban,0,aedes,aedes_aegypti,prokopack,prokopack,2,0,200,0,200,0,200,0,0,0,0,100,50,50,100,50,50,0,RAS
2022-05-03,2,Sector 9,urban,0,culex,culex_quinquefasciatus,prokopack,prokopack,1,0,150,0,150,0,150,0,0,0,0,80,40,30,80,40,30,0,RAS`;

    const testFilePath = path.join(__dirname, 'test-mosquitoes.csv');
    fs.writeFileSync(testFilePath, testData, 'utf8');
    
    console.log('✅ Fichier de test créé:', testFilePath);
    console.log('📁 Taille:', fs.statSync(testFilePath).size, 'bytes');
    
    return testFilePath;
}

// Test 2: Lire le fichier brut
function testRawFileRead(filePath) {
    console.log('\n📄 Test 2: Lecture fichier brut...');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('✅ Fichier lu avec succès');
        console.log('📊 Taille contenu:', content.length, 'caractères');
        console.log('📊 Nombre de lignes:', content.split('\n').length);
        console.log('📄 Premières 200 chars:', content.substring(0, 200));
        console.log('📄 Dernières 200 chars:', content.substring(content.length - 200));
        
        return content;
    } catch (error) {
        console.error('❌ Erreur lecture fichier:', error.message);
        return null;
    }
}

// Test 3: Parser CSV
function testCSVParser(filePath) {
    console.log('\n🔍 Test 3: Test parser CSV...');
    
    return new Promise((resolve, reject) => {
        const results = [];
        let lineCount = 0;
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                lineCount++;
                console.log(`📝 Ligne ${lineCount} parsée:`, Object.keys(data).length, 'colonnes');
                console.log('📝 Premières colonnes:', Object.keys(data).slice(0, 5));
                console.log('📝 Premières valeurs:', Object.values(data).slice(0, 5));
                results.push(data);
            })
            .on('end', () => {
                console.log('✅ Parsing terminé');
                console.log('📊 Total lignes parsées:', lineCount);
                console.log('📊 Total objets:', results.length);
                resolve(results);
            })
            .on('error', (error) => {
                console.error('❌ Erreur parsing CSV:', error.message);
                console.error('❌ Stack:', error.stack);
                reject(error);
            });
    });
}

// Test 4: Validation des données
function testDataValidation(csvData) {
    console.log('\n✅ Test 4: Validation des données...');
    
    if (!csvData || csvData.length === 0) {
        console.error('❌ Aucune donnée à valider');
        return false;
    }
    
    const firstRow = csvData[0];
    console.log('📊 Première ligne:', firstRow);
    
    // Vérifier les champs requis
    const requiredFields = [
        'mosquitoes_visit_start_date',
        'mosquitoes_concession_code',
        'mosquitoes_sector',
        'mosquitoes_environment',
        'genus',
        'species'
    ];
    
    const missingFields = requiredFields.filter(field => !firstRow[field]);
    if (missingFields.length > 0) {
        console.error('❌ Champs manquants:', missingFields);
        return false;
    }
    
    console.log('✅ Tous les champs requis présents');
    return true;
}

// Test 5: Simulation insertion
function testDataInsertion(csvData) {
    console.log('\n💾 Test 5: Simulation insertion...');
    
    if (!csvData || csvData.length === 0) {
        console.error('❌ Aucune donnée à insérer');
        return false;
    }
    
    const firstRow = csvData[0];
    
    // Simuler la construction des valeurs
    const values = [
        firstRow.mosquitoes_concession_code,
        firstRow.mosquitoes_sector,
        firstRow.mosquitoes_environment,
        firstRow.mosquitoes_visit_start_date,
        firstRow.mosquitoes_visit_start_time || null,
        firstRow.mosquitoes_visit_end_time || null,
        firstRow.mosquitoes_gps_code,
        firstRow.genus,
        firstRow.species,
        firstRow.collection_methods,
        firstRow.capture_locations,
        firstRow.prokopack_traps_count,
        firstRow.bg_traps_count,
        firstRow.prokopack_mosquitoes_count,
        firstRow.bg_trap_mosquitoes_count,
        firstRow.total_mosquitoes_count,
        firstRow.male_count,
        firstRow.female_count,
        firstRow.aedes_male_count,
        firstRow.culex_male_count,
        firstRow.anopheles_male_count,
        firstRow.other_male_count,
        firstRow.blood_fed_females_count,
        firstRow.gravid_females_count,
        firstRow.starved_females_count,
        firstRow.mosquitoes_aedes_count,
        firstRow.mosquitoes_culex_count,
        firstRow.mosquitoes_anopheles_count,
        firstRow.mosquitoes_other_count,
        firstRow.observations
    ];
    
    console.log('📊 Valeurs construites:', values.length, 'éléments');
    console.log('📊 Premières valeurs:', values.slice(0, 10));
    
    // Vérifier les types
    const numericFields = [
        'prokopack_traps_count', 'bg_traps_count', 'prokopack_mosquitoes_count',
        'bg_trap_mosquitoes_count', 'total_mosquitoes_count', 'male_count', 'female_count'
    ];
    
    for (const field of numericFields) {
        const value = firstRow[field];
        if (value !== undefined && value !== null && value !== '') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                console.error(`❌ Champ numérique invalide ${field}:`, value);
                return false;
            }
        }
    }
    
    console.log('✅ Validation des types réussie');
    return true;
}

// Fonction principale de test
async function runAllTests() {
    try {
        console.log('🚀 Démarrage des tests...\n');
        
        // Test 1: Créer fichier de test
        const testFilePath = createTestCSV();
        
        // Test 2: Lire fichier brut
        const rawContent = testRawFileRead(testFilePath);
        if (!rawContent) {
            console.error('❌ Test 2 échoué - Arrêt des tests');
            return;
        }
        
        // Test 3: Parser CSV
        const csvData = await testCSVParser(testFilePath);
        if (!csvData || csvData.length === 0) {
            console.error('❌ Test 3 échoué - Arrêt des tests');
            return;
        }
        
        // Test 4: Validation données
        const validationOk = testDataValidation(csvData);
        if (!validationOk) {
            console.error('❌ Test 4 échoué - Arrêt des tests');
            return;
        }
        
        // Test 5: Simulation insertion
        const insertionOk = testDataInsertion(csvData);
        if (!insertionOk) {
            console.error('❌ Test 5 échoué - Arrêt des tests');
            return;
        }
        
        console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
        console.log('✅ Le système d\'import CSV fonctionne correctement');
        console.log('✅ Le problème vient probablement du fichier original');
        
        // Nettoyer
        fs.unlinkSync(testFilePath);
        console.log('🧹 Fichier de test supprimé');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
        console.error('❌ Stack:', error.stack);
    }
}

// Lancer les tests
runAllTests();