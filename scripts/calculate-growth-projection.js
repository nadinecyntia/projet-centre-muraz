// Projection de croissance pour 10-20 ans

const currentData = {
    eggs: 8086,
    mosquitoes: 7681,
    breeding: 2,
    totalRecords: 15769,
    dbSizeMB: 15
};

// Estimation : 500-1000 nouveaux enregistrements par mois (selon activité)
const monthlyGrowth = {
    conservative: 500,  // Croissance modérée
    moderate: 750,      // Croissance moyenne
    high: 1000          // Croissance élevée
};

function projectGrowth(years, monthlyIncrease) {
    const months = years * 12;
    const newRecords = months * monthlyIncrease;
    const totalRecords = currentData.totalRecords + newRecords;
    
    // Estimation réaliste : ~5-10 KB par enregistrement
    // (avec index, relations houses, métadonnées PostgreSQL, vues, etc.)
    // Conservons 5 KB par enregistrement pour être prudent
    const kbPerRecord = 5;
    const estimatedSizeMB = (totalRecords * kbPerRecord) / 1024; // KB to MB
    const estimatedSizeGB = estimatedSizeMB / 1024;
    
    return {
        years,
        months,
        newRecords,
        totalRecords,
        estimatedSizeMB: Math.round(estimatedSizeMB),
        estimatedSizeGB: Math.round(estimatedSizeGB * 100) / 100
    };
}

console.log('📊 PROJECTION DE CROISSANCE - PLATEFORME CENTRE MURAZ\n');
console.log('📈 Situation actuelle:');
console.log(`   - Enregistrements: ${currentData.totalRecords.toLocaleString()}`);
console.log(`   - Taille DB: ${currentData.dbSizeMB} MB\n`);

console.log('🔮 PROJECTION SUR 10 ANS (croissance modérée: 500/mois):');
const proj10Moderate = projectGrowth(10, monthlyGrowth.conservative);
console.log(`   - Nouveaux enregistrements: ${proj10Moderate.newRecords.toLocaleString()}`);
console.log(`   - Total enregistrements: ${proj10Moderate.totalRecords.toLocaleString()}`);
console.log(`   - Taille DB estimée: ~${proj10Moderate.estimatedSizeGB} GB\n`);

console.log('🔮 PROJECTION SUR 10 ANS (croissance moyenne: 750/mois):');
const proj10Average = projectGrowth(10, monthlyGrowth.moderate);
console.log(`   - Nouveaux enregistrements: ${proj10Average.newRecords.toLocaleString()}`);
console.log(`   - Total enregistrements: ${proj10Average.totalRecords.toLocaleString()}`);
console.log(`   - Taille DB estimée: ~${proj10Average.estimatedSizeGB} GB\n`);

console.log('🔮 PROJECTION SUR 20 ANS (croissance moyenne: 750/mois):');
const proj20Average = projectGrowth(20, monthlyGrowth.moderate);
console.log(`   - Nouveaux enregistrements: ${proj20Average.newRecords.toLocaleString()}`);
console.log(`   - Total enregistrements: ${proj20Average.totalRecords.toLocaleString()}`);
console.log(`   - Taille DB estimée: ~${proj20Average.estimatedSizeGB} GB\n`);

console.log('💾 RECOMMANDATIONS RAM (PostgreSQL):');
console.log('   - Base < 1 GB: 4-8 GB RAM');
console.log('   - Base 1-5 GB: 8-16 GB RAM');
console.log('   - Base 5-20 GB: 16-32 GB RAM');
console.log('   - Base 20-50 GB: 32-48 GB RAM');
console.log('   - Base > 50 GB: 48+ GB RAM\n');

console.log('📦 RECOMMANDATIONS STOCKAGE:');
console.log('   - Base de données: estimée ci-dessus');
console.log('   - Logs: +20-30%');
console.log('   - Sauvegardes: x2-3 (quotidiennes)');
console.log('   - Système: ~10-20 GB');
console.log('   - Marge: +30-50%');

