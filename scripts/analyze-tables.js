// =====================================================
// ANALYSE STRUCTURE DES TABLES DE COLLECTE
// Centre MURAZ - Architecture base de données
// =====================================================

const { pool } = require('../config/database');

async function analyzeTable(tableName) {
    const client = await pool.connect();
    try {
        console.log(`\n=== ${tableName.toUpperCase()} ===`);
        
        // Structure des colonnes
        const columnsQuery = `
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default,
                character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `;
        
        const columns = await client.query(columnsQuery, [tableName]);
        
        console.log('📋 COLONNES:');
        columns.rows.forEach(col => {
            let def = `${col.column_name}: ${col.data_type}`;
            if (col.character_maximum_length) def += `(${col.character_maximum_length})`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            console.log(`  ${def}`);
        });
        
        // Contraintes
        const constraintsQuery = `
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = $1
            ORDER BY tc.constraint_type, tc.constraint_name
        `;
        
        const constraints = await client.query(constraintsQuery, [tableName]);
        
        if (constraints.rows.length > 0) {
            console.log('\n🔒 CONTRAINTES:');
            constraints.rows.forEach(con => {
                if (con.constraint_type === 'FOREIGN KEY') {
                    console.log(`  ${con.constraint_name}: ${con.column_name} → ${con.foreign_table_name}.${con.foreign_column_name}`);
                } else {
                    console.log(`  ${con.constraint_name}: ${con.constraint_type} (${con.column_name})`);
                }
            });
        }
        
        // Index
        const indexesQuery = `
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE tablename = $1
            ORDER BY indexname
        `;
        
        const indexes = await client.query(indexesQuery, [tableName]);
        
        if (indexes.rows.length > 0) {
            console.log('\n📊 INDEX:');
            indexes.rows.forEach(idx => {
                console.log(`  ${idx.indexname}: ${idx.indexdef}`);
            });
        }
        
        // Comptage des données
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const count = await client.query(countQuery);
        console.log(`\n📈 DONNÉES: ${count.rows[0].count} enregistrements`);
        
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🔍 ANALYSE ARCHITECTURE BASE DE DONNÉES - CENTRE MURAZ');
    console.log('=====================================================');
    
    try {
        await analyzeTable('eggs_collection_new');
        await analyzeTable('breeding_sites_new');
        await analyzeTable('adult_mosquitoes_new');
        
        console.log('\n✅ Analyse terminée');
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error.message);
    } finally {
        process.exit(0);
    }
}

main();
// ANALYSE STRUCTURE DES TABLES DE COLLECTE
// Centre MURAZ - Architecture base de données
// =====================================================

const { pool } = require('../config/database');

async function analyzeTable(tableName) {
    const client = await pool.connect();
    try {
        console.log(`\n=== ${tableName.toUpperCase()} ===`);
        
        // Structure des colonnes
        const columnsQuery = `
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default,
                character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `;
        
        const columns = await client.query(columnsQuery, [tableName]);
        
        console.log('📋 COLONNES:');
        columns.rows.forEach(col => {
            let def = `${col.column_name}: ${col.data_type}`;
            if (col.character_maximum_length) def += `(${col.character_maximum_length})`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            console.log(`  ${def}`);
        });
        
        // Contraintes
        const constraintsQuery = `
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = $1
            ORDER BY tc.constraint_type, tc.constraint_name
        `;
        
        const constraints = await client.query(constraintsQuery, [tableName]);
        
        if (constraints.rows.length > 0) {
            console.log('\n🔒 CONTRAINTES:');
            constraints.rows.forEach(con => {
                if (con.constraint_type === 'FOREIGN KEY') {
                    console.log(`  ${con.constraint_name}: ${con.column_name} → ${con.foreign_table_name}.${con.foreign_column_name}`);
                } else {
                    console.log(`  ${con.constraint_name}: ${con.constraint_type} (${con.column_name})`);
                }
            });
        }
        
        // Index
        const indexesQuery = `
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE tablename = $1
            ORDER BY indexname
        `;
        
        const indexes = await client.query(indexesQuery, [tableName]);
        
        if (indexes.rows.length > 0) {
            console.log('\n📊 INDEX:');
            indexes.rows.forEach(idx => {
                console.log(`  ${idx.indexname}: ${idx.indexdef}`);
            });
        }
        
        // Comptage des données
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const count = await client.query(countQuery);
        console.log(`\n📈 DONNÉES: ${count.rows[0].count} enregistrements`);
        
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🔍 ANALYSE ARCHITECTURE BASE DE DONNÉES - CENTRE MURAZ');
    console.log('=====================================================');
    
    try {
        await analyzeTable('eggs_collection_new');
        await analyzeTable('breeding_sites_new');
        await analyzeTable('adult_mosquitoes_new');
        
        console.log('\n✅ Analyse terminée');
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error.message);
    } finally {
        process.exit(0);
    }
}

main();


