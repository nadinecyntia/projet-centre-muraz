const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'centre_muraz',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function restoreTestDataFixed() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Restauration des données de test avec la structure correcte...');
        
        // Vider les tables existantes
        await client.query('TRUNCATE TABLE household_visits, breeding_sites, eggs_collection, adult_mosquitoes RESTART IDENTITY CASCADE');
        console.log('✅ Tables vidées');
        
        const secteurs = ['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33'];
        const mois = [
            'Janvier 2024', 'Février 2024', 'Mars 2024', 'Avril 2024', 
            'Mai 2024', 'Juin 2024', 'Juillet 2024', 'Août 2024',
            'Septembre 2024', 'Octobre 2024', 'Novembre 2024', 'Décembre 2024'
        ];
        
        let totalRecords = 0;
        
        for (const secteur of secteurs) {
            for (const periode of mois) {
                // 1. Household visits (visites domiciliaires) - d'abord
                const totalHouses = Math.floor(Math.random() * 50) + 20; // 20-70
                const visitedHouses = Math.floor(totalHouses * 0.8);
                const positiveHouses = Math.floor(visitedHouses * 0.3);
                
                const householdResult = await client.query(`
                    INSERT INTO household_visits (secteur, periode, date, total_houses, visited_houses, positive_houses)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                `, [secteur, periode, new Date(), totalHouses, visitedHouses, positiveHouses]);
                
                const householdId = householdResult.rows[0].id;
                
                // 2. Breeding sites (gîtes larvaires) - lié à household_visit
                const totalSites = Math.floor(Math.random() * 50) + 20; // 20-70
                const positiveSites = Math.floor(totalSites * 0.4);
                const negativeSites = totalSites - positiveSites;
                
                await client.query(`
                    INSERT INTO breeding_sites (household_visit_id, total_sites, positive_sites, negative_sites, larvae_count, nymphs_count)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [householdId, totalSites, positiveSites, negativeSites, Math.floor(Math.random() * 100) + 20, Math.floor(Math.random() * 50) + 10]);
                
                // 3. Eggs collection (œufs)
                const eggsCount = Math.floor(Math.random() * 100) + 20; // 20-120
                
                await client.query(`
                    INSERT INTO eggs_collection (secteur, periode, date, eggs_count)
                    VALUES ($1, $2, $3, $4)
                `, [secteur, periode, new Date(), eggsCount]);
                
                // 4. Adult mosquitoes (moustiques adultes)
                const totalMosquitoes = Math.floor(Math.random() * 100) + 20; // 20-120
                const prokopackCount = Math.floor(totalMosquitoes * 0.4);
                const bgTrapCount = totalMosquitoes - prokopackCount;
                
                await client.query(`
                    INSERT INTO adult_mosquitoes (secteur, periode, date, total_mosquitoes_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [secteur, periode, new Date(), totalMosquitoes, prokopackCount, bgTrapCount]);
                
                totalRecords += 4;
                
                console.log(`✅ ${secteur} - ${periode}: ${totalHouses} maisons, ${totalSites} gîtes, ${eggsCount} œufs, ${totalMosquitoes} moustiques`);
            }
        }
        
        console.log(`🎉 Restauration terminée: ${totalRecords} enregistrements créés`);
        console.log('📊 Données de test restaurées avec la structure correcte');
        
    } catch (error) {
        console.error('❌ Erreur lors de la restauration:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

restoreTestDataFixed();
