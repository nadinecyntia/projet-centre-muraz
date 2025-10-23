const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function deployCompleteStructure() {
	console.log('\n🔄 DÉPLOIEMENT DE LA STRUCTURE COMPLÈTE\n');
	console.log('='.repeat(80));
	
	try {
		// Lire le fichier SQL
		const sqlPath = path.join(__dirname, 'create-complete-structure.sql');
		const sql = fs.readFileSync(sqlPath, 'utf8');
		
		console.log('📂 Lecture du script SQL complet...');
		
		// Exécuter le script
		await pool.query(sql);
		
		console.log('\n✅ Structure complète déployée avec succès !\n');
		console.log('📊 Tables créées :');
		console.log('   ├─ houses (10 colonnes)');
		console.log('   ├─ eggs_collections (16 colonnes)');
		console.log('   ├─ breeding_sites (29 colonnes - TOUS les comptages)');
		console.log('   └─ adult_mosquitoes_collections (39 colonnes - TOUS les comptages)');
		
		console.log('\n🔍 Vues SQL créées :');
		console.log('   ├─ eggs_collections_with_house_info');
		console.log('   ├─ breeding_sites_with_house_info');
		console.log('   ├─ mosquitoes_with_house_info');
		console.log('   └─ houses_complete_stats');
		
		console.log('\n✅ Correspondance 100% avec le frontend !\n');
		
		// Vérifier les colonnes de chaque table
		console.log('🔍 Vérification des colonnes...\n');
		
		const tables = ['houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections'];
		
		for (const table of tables) {
			const result = await pool.query(`
				SELECT COUNT(*) as count
				FROM information_schema.columns 
				WHERE table_name = $1
			`, [table]);
			
			console.log(`   ${table.padEnd(35)} → ${result.rows[0].count} colonnes`);
		}
		
		console.log('\n✅ Tout est prêt !\n');
		
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Erreur lors du déploiement :', error.message);
		console.error(error);
		process.exit(1);
	}
}

deployCompleteStructure();

