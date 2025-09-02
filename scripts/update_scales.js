const fs = require('fs');
const path = require('path');

// Fonction pour mettre à jour les seuils dans un fichier
function updateScalesInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remplacer tous les seuils de 1000 à 100
        const updatedContent = content.replace(/value >= 1000/g, 'value >= 100');
        
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ ${filePath} mis à jour`);
        
    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error);
    }
}

// Mettre à jour les fichiers
console.log('🔄 Mise à jour des seuils des échelles adaptatives...');

updateScalesInFile('public/js/analyses.js');
updateScalesInFile('public/js/indices.js');

console.log('🎉 Mise à jour terminée !');
console.log('📊 Les échelles se déclenchent maintenant à partir de 100 au lieu de 1000');
