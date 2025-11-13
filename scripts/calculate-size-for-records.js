// Calcul de la taille pour 30 000 enregistrements

const realData = {
    eggs: {
        avgSizeKB: 0.17,  // KB par enregistrement
        percentage: 0.5   // 50% des enregistrements sont des eggs
    },
    mosquitoes: {
        avgSizeKB: 0.26,  // KB par enregistrement
        percentage: 0.5   // 50% des enregistrements sont des mosquitoes
    },
    breeding: {
        avgSizeKB: 40.00, // KB par enregistrement (mais très peu nombreux)
        percentage: 0.0   // Négligeable
    }
};

function calculateSize(numRecords, mix = 'balanced') {
    let totalSizeKB = 0;
    
    if (mix === 'balanced') {
        // 50% eggs, 50% mosquitoes
        const eggsCount = Math.floor(numRecords * 0.5);
        const mosquitoesCount = numRecords - eggsCount;
        
        totalSizeKB = (eggsCount * realData.eggs.avgSizeKB) + 
                     (mosquitoesCount * realData.mosquitoes.avgSizeKB);
        
        console.log(`📊 Mix équilibré (50% eggs, 50% mosquitoes):`);
        console.log(`   - Eggs: ${eggsCount.toLocaleString()} × ${realData.eggs.avgSizeKB} KB = ${(eggsCount * realData.eggs.avgSizeKB).toFixed(2)} KB`);
        console.log(`   - Mosquitoes: ${mosquitoesCount.toLocaleString()} × ${realData.mosquitoes.avgSizeKB} KB = ${(mosquitoesCount * realData.mosquitoes.avgSizeKB).toFixed(2)} KB`);
    } else if (mix === 'eggs-only') {
        totalSizeKB = numRecords * realData.eggs.avgSizeKB;
        console.log(`📊 100% Eggs:`);
        console.log(`   - ${numRecords.toLocaleString()} × ${realData.eggs.avgSizeKB} KB`);
    } else if (mix === 'mosquitoes-only') {
        totalSizeKB = numRecords * realData.mosquitoes.avgSizeKB;
        console.log(`📊 100% Mosquitoes:`);
        console.log(`   - ${numRecords.toLocaleString()} × ${realData.mosquitoes.avgSizeKB} KB`);
    }
    
    const totalSizeMB = totalSizeKB / 1024;
    const totalSizeGB = totalSizeMB / 1024;
    
    // Ajouter ~30% pour les index PostgreSQL (basé sur l'analyse réelle)
    const sizeWithIndexesMB = totalSizeMB * 1.3;
    const sizeWithIndexesGB = sizeWithIndexesMB / 1024;
    
    console.log(`\n💾 TAILLE DES DONNÉES:`);
    console.log(`   - Données pures: ${totalSizeKB.toFixed(2)} KB (${totalSizeMB.toFixed(2)} MB)`);
    console.log(`   - Avec index PostgreSQL (+30%): ${(totalSizeKB * 1.3).toFixed(2)} KB (${sizeWithIndexesMB.toFixed(2)} MB)`);
    console.log(`   - En GB: ${sizeWithIndexesGB.toFixed(3)} GB\n`);
    
    return {
        dataKB: totalSizeKB,
        dataMB: totalSizeMB,
        dataGB: totalSizeGB,
        withIndexesMB: sizeWithIndexesMB,
        withIndexesGB: sizeWithIndexesGB
    };
}

console.log('='.repeat(60));
console.log('📊 CALCUL DE TAILLE POUR 30 000 ENREGISTREMENTS');
console.log('='.repeat(60));
console.log('');

const numRecords = 30000;

console.log(`🎯 SCÉNARIO 1: Mix équilibré (réaliste)`);
const balanced = calculateSize(numRecords, 'balanced');

console.log(`🎯 SCÉNARIO 2: 100% Eggs (cas minimal)`);
const eggsOnly = calculateSize(numRecords, 'eggs-only');

console.log(`🎯 SCÉNARIO 3: 100% Mosquitoes (cas maximal)`);
const mosquitoesOnly = calculateSize(numRecords, 'mosquitoes-only');

console.log('='.repeat(60));
console.log('📈 RÉSUMÉ COMPARATIF:');
console.log('='.repeat(60));
console.log(`Mix équilibré:     ${balanced.withIndexesMB.toFixed(2)} MB (${balanced.withIndexesGB.toFixed(3)} GB)`);
console.log(`100% Eggs:         ${eggsOnly.withIndexesMB.toFixed(2)} MB (${eggsOnly.withIndexesGB.toFixed(3)} GB)`);
console.log(`100% Mosquitoes:   ${mosquitoesOnly.withIndexesMB.toFixed(2)} MB (${mosquitoesOnly.withIndexesGB.toFixed(3)} GB)`);
console.log('');

console.log('💡 COMPARAISON:');
const currentRecords = 15769; // eggs + mosquitoes + breeding actuels
const currentSizeMB = 15; // Taille totale actuelle de la base
const currentAvgMBPerRecord = currentSizeMB / currentRecords;

console.log(`   - Situation actuelle: ${currentRecords.toLocaleString()} enregistrements = ~${currentSizeMB} MB`);
console.log(`   - Taille moyenne actuelle: ~${currentAvgMBPerRecord.toFixed(4)} MB/enregistrement`);
console.log(`   - 30 000 nouveaux enregistrements: +${balanced.withIndexesMB.toFixed(2)} MB`);
console.log(`   - Si on DOUBLE les enregistrements (30 000 total): ~${(balanced.withIndexesMB * 2).toFixed(2)} MB\n`);

console.log('📦 ESPACE DISQUE NÉCESSAIRE POUR 30 000 ENREGISTREMENTS:');
console.log(`   - Base de données (données + index): ${balanced.withIndexesMB.toFixed(2)} MB`);
console.log(`   - Sauvegardes quotidiennes (30 jours, compression 3:1): ~${(balanced.withIndexesMB * 10).toFixed(2)} MB`);
console.log(`   - Total approximatif: ~${(balanced.withIndexesMB * 11).toFixed(2)} MB (~${(balanced.withIndexesMB * 11 / 1024).toFixed(3)} GB)\n`);

console.log('📊 CONTEXTE:');
console.log(`   - Pour référence: 15 769 enregistrements = ~15 MB (inclut toutes les tables)`);
console.log(`   - 30 000 enregistrements de collecte (eggs + mosquitoes) = ~${balanced.withIndexesMB.toFixed(2)} MB`);
console.log(`   - Multiplicateur: ${(balanced.withIndexesMB / currentSizeMB).toFixed(2)}x par rapport à la taille actuelle`);

