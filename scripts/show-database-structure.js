const { pool } = require('../config/database');

async function showDatabaseStructure() {
	console.log('\n📊 STRUCTURE ACTUELLE DE LA BASE DE DONNÉES\n');
	console.log('='.repeat(80));

	try {
		// 1. LISTER TOUTES LES TABLES
		console.log('\n🗂️  TABLES EXISTANTES :\n');
		const tablesQuery = `
			SELECT 
				table_name,
				(SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
			FROM information_schema.tables t
			WHERE table_schema = 'public' 
			AND table_type = 'BASE TABLE'
			ORDER BY table_name;
		`;
		const tablesResult = await pool.query(tablesQuery);
		
		console.log('┌─────────────────────────────────────┬──────────────┐');
		console.log('│ Table                               │ Nb Colonnes  │');
		console.log('├─────────────────────────────────────┼──────────────┤');
		tablesResult.rows.forEach(row => {
			console.log(`│ ${row.table_name.padEnd(35)} │ ${String(row.column_count).padStart(12)} │`);
		});
		console.log('└─────────────────────────────────────┴──────────────┘');

		// 2. DÉTAIL DE CHAQUE TABLE
		console.log('\n\n📋 DÉTAIL DES TABLES :\n');
		
		for (const table of tablesResult.rows) {
			console.log('─'.repeat(80));
			console.log(`\n🔹 TABLE: ${table.table_name.toUpperCase()}`);
			console.log('─'.repeat(80));
			
			// Colonnes de la table
			const columnsQuery = `
				SELECT 
					column_name,
					data_type,
					character_maximum_length,
					is_nullable,
					column_default
				FROM information_schema.columns
				WHERE table_name = $1
				ORDER BY ordinal_position;
			`;
			const columnsResult = await pool.query(columnsQuery, [table.table_name]);
			
			console.log('\nColonnes :');
			console.log('┌────────────────────────────────┬─────────────────────┬──────────┬─────────────────────┐');
			console.log('│ Nom                            │ Type                │ Nullable │ Défaut              │');
			console.log('├────────────────────────────────┼─────────────────────┼──────────┼─────────────────────┤');
			
			columnsResult.rows.forEach(col => {
				let type = col.data_type;
				if (col.character_maximum_length) {
					type += `(${col.character_maximum_length})`;
				}
				const nullable = col.is_nullable === 'YES' ? 'Oui' : 'Non';
				const defaultVal = col.column_default ? col.column_default.substring(0, 19) : '-';
				
				console.log(`│ ${col.column_name.padEnd(30)} │ ${type.padEnd(19)} │ ${nullable.padEnd(8)} │ ${defaultVal.padEnd(19)} │`);
			});
			console.log('└────────────────────────────────┴─────────────────────┴──────────┴─────────────────────┘');

			// Contraintes de clé étrangère
			const fkQuery = `
				SELECT
					tc.constraint_name,
					kcu.column_name,
					ccu.table_name AS foreign_table_name,
					ccu.column_name AS foreign_column_name
				FROM information_schema.table_constraints AS tc
				JOIN information_schema.key_column_usage AS kcu
					ON tc.constraint_name = kcu.constraint_name
					AND tc.table_schema = kcu.table_schema
				JOIN information_schema.constraint_column_usage AS ccu
					ON ccu.constraint_name = tc.constraint_name
					AND ccu.table_schema = tc.table_schema
				WHERE tc.constraint_type = 'FOREIGN KEY'
				AND tc.table_name = $1;
			`;
			const fkResult = await pool.query(fkQuery, [table.table_name]);
			
			if (fkResult.rows.length > 0) {
				console.log('\nClés étrangères :');
				fkResult.rows.forEach(fk => {
					console.log(`  → ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
				});
			}

			// Index
			const indexQuery = `
				SELECT 
					indexname,
					indexdef
				FROM pg_indexes
				WHERE tablename = $1
				AND schemaname = 'public';
			`;
			const indexResult = await pool.query(indexQuery, [table.table_name]);
			
			if (indexResult.rows.length > 0) {
				console.log('\nIndex :');
				indexResult.rows.forEach(idx => {
					console.log(`  🔑 ${idx.indexname}`);
				});
			}

			// Nombre de lignes
			const countQuery = `SELECT COUNT(*) as count FROM ${table.table_name}`;
			const countResult = await pool.query(countQuery);
			console.log(`\n📊 Nombre de lignes : ${countResult.rows[0].count}`);
		}

		// 3. LISTER TOUTES LES VUES
		console.log('\n\n' + '='.repeat(80));
		console.log('\n🔍 VUES SQL EXISTANTES :\n');
		const viewsQuery = `
			SELECT 
				table_name as view_name,
				view_definition
			FROM information_schema.views
			WHERE table_schema = 'public'
			ORDER BY table_name;
		`;
		const viewsResult = await pool.query(viewsQuery);
		
		if (viewsResult.rows.length > 0) {
			console.log('┌─────────────────────────────────────┐');
			console.log('│ Vues SQL                            │');
			console.log('├─────────────────────────────────────┤');
			viewsResult.rows.forEach(row => {
				console.log(`│ ${row.view_name.padEnd(35)} │`);
			});
			console.log('└─────────────────────────────────────┘');

			// Détail de chaque vue
			console.log('\n\n📋 DÉTAIL DES VUES :\n');
			
			for (const view of viewsResult.rows) {
				console.log('─'.repeat(80));
				console.log(`\n🔹 VUE: ${view.view_name.toUpperCase()}`);
				console.log('─'.repeat(80));
				
				// Colonnes de la vue
				const viewColumnsQuery = `
					SELECT 
						column_name,
						data_type
					FROM information_schema.columns
					WHERE table_name = $1
					ORDER BY ordinal_position;
				`;
				const viewColumnsResult = await pool.query(viewColumnsQuery, [view.view_name]);
				
				console.log('\nColonnes :');
				console.log('┌────────────────────────────────┬─────────────────────┐');
				console.log('│ Nom                            │ Type                │');
				console.log('├────────────────────────────────┼─────────────────────┤');
				
				viewColumnsResult.rows.forEach(col => {
					console.log(`│ ${col.column_name.padEnd(30)} │ ${col.data_type.padEnd(19)} │`);
				});
				console.log('└────────────────────────────────┴─────────────────────┘');

				// Nombre de lignes
				const countQuery = `SELECT COUNT(*) as count FROM ${view.view_name}`;
				try {
					const countResult = await pool.query(countQuery);
					console.log(`\n📊 Nombre de lignes : ${countResult.rows[0].count}`);
				} catch (e) {
					console.log('\n⚠️  Impossible de compter les lignes');
				}
			}
		} else {
			console.log('❌ Aucune vue SQL trouvée');
		}

		// 4. RÉSUMÉ
		console.log('\n\n' + '='.repeat(80));
		console.log('\n📈 RÉSUMÉ :\n');
		console.log(`  Tables : ${tablesResult.rows.length}`);
		console.log(`  Vues   : ${viewsResult.rows.length}`);
		
		console.log('\n✅ Analyse terminée !\n');

	} catch (error) {
		console.error('❌ Erreur :', error.message);
		console.error(error);
	} finally {
		process.exit(0);
	}
}

showDatabaseStructure();

