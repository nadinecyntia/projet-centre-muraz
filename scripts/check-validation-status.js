const { pool } = require('../config/database');

async function checkStatus() {
    try {
        console.log('📊 Vérification du statut des données...\n');
        
        // Breeding sites
        const breeding = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM breeding_sites 
            GROUP BY status
        `);
        console.log('🏠 Breeding Sites:');
        breeding.rows.forEach(row => {
            console.log(`   ${row.status || 'NULL'}: ${row.count}`);
        });
        
        const breedingApproved = await pool.query(`
            SELECT COUNT(*) as total 
            FROM breeding_sites 
            WHERE status = 'approved'
        `);
        console.log(`   ✅ Total approved: ${breedingApproved.rows[0].total}\n`);
        
        // Eggs
        const eggs = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM eggs_collections 
            GROUP BY status
        `);
        console.log('🥚 Eggs Collections:');
        eggs.rows.forEach(row => {
            console.log(`   ${row.status || 'NULL'}: ${row.count}`);
        });
        
        // Mosquitoes
        const mosquitoes = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM adult_mosquitoes_collections 
            GROUP BY status
        `);
        console.log('\n🦟 Mosquitoes Collections:');
        mosquitoes.rows.forEach(row => {
            console.log(`   ${row.status || 'NULL'}: ${row.count}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

checkStatus();


