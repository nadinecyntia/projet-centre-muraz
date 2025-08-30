const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const setupNewDatabase = async () => {
    try {
        console.log('🚀 Démarrage de la création de la nouvelle structure de base de données...');
        console.log('📊 Centre MURAZ - Plateforme de Surveillance Arboviroses\n');

        // Lire le script SQL
        const sqlScriptPath = path.join(__dirname, 'create-new-database-structure.sql');
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

        console.log('📖 Lecture du script SQL...');
        
        // Diviser le script en commandes individuelles
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`🔧 Exécution de ${commands.length} commandes SQL...\n`);

        // Exécuter chaque commande
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            // Ignorer les commandes vides ou commentaires
            if (!command || command.startsWith('--') || command.startsWith('/*')) {
                continue;
            }

            try {
                console.log(`⚡ Commande ${i + 1}/${commands.length}...`);
                await pool.query(command);
                console.log(`✅ Commande ${i + 1} exécutée avec succès`);
            } catch (error) {
                // Ignorer les erreurs de tables déjà supprimées
                if (error.message.includes('does not exist') || error.message.includes('already exists')) {
                    console.log(`ℹ️ Commande ${i + 1} : ${error.message}`);
                } else {
                    console.error(`❌ Erreur dans la commande ${i + 1}:`, error.message);
                    throw error;
                }
            }
        }

        console.log('\n🎉 Structure de base de données créée avec succès !');
        console.log('✅ Tables de terrain créées');
        console.log('✅ Table des indices créée');
        console.log('✅ Index et contraintes créés');
        console.log('✅ Données de test insérées');
        console.log('\n🚀 Votre base de données est prête pour :');
        console.log('   • La synchronisation KoboCollect');
        console.log('   • Les calculs d\'indices entomologiques');
        console.log('   • La génération de cartes');
        console.log('   • Les analyses de données');

        // Vérifier que les tables ont été créées
        console.log('\n🔍 Vérification des tables créées...');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('household_visits', 'eggs_collection', 'breeding_sites', 'adult_mosquitoes', 'entomological_indices')
            ORDER BY table_name;
        `;
        
        const tablesResult = await pool.query(tablesQuery);
        console.log('📋 Tables disponibles :');
        tablesResult.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        // Vérifier les données de test
        console.log('\n🔍 Vérification des données de test...');
        const testDataQuery = 'SELECT COUNT(*) as count FROM household_visits;';
        const testDataResult = await pool.query(testDataQuery);
        console.log(`📊 Données de test : ${testDataResult.rows[0].count} enregistrements`);

        console.log('\n🎯 Prochaines étapes :');
        console.log('   1. Configurer la synchronisation KoboCollect');
        console.log('   2. Implémenter les calculs d\'indices');
        console.log('   3. Créer la page d\'affichage des indices');
        console.log('   4. Tester avec des données réelles');

        process.exit(0);

    } catch (error) {
        console.error('\n💥 Erreur lors de la création de la base de données:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    setupNewDatabase();
}

module.exports = { setupNewDatabase };




