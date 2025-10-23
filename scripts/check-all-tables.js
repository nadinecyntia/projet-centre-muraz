const {pool} = require('../config/database');

async function checkAllTables() {
	try {
		const tables = ['houses', 'eggs_collections', 'breeding_sites', 'adult_mosquitoes_collections', 'mosquito_specimens'];
		
		for (const table of tables) {
			const result = await pool.query(`
				SELECT column_name, data_type, is_nullable 
				FROM information_schema.columns 
				WHERE table_name = $1 
				ORDER BY ordinal_position
			`, [table]);
			
			console.log(`\n${'='.repeat(80)}`);
			console.log(`📊 TABLE: ${table.toUpperCase()}`);
			console.log('='.repeat(80));
			
			if (result.rows.length === 0) {
				console.log('❌ TABLE N\'EXISTE PAS\n');
				continue;
			}
			
			result.rows.forEach(c => {
				console.log(`${c.column_name.padEnd(30)} │ ${c.data_type.padEnd(25)} │ ${c.is_nullable}`);
			});
			console.log(`\nTotal: ${result.rows.length} colonnes\n`);
		}
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Erreur:', error.message);
		process.exit(1);
	}
}

checkAllTables();

