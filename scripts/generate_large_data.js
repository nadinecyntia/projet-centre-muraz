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

async function generateLargeData() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Génération de données volumineuses pour tester les échelles adaptatives...');
        
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
                // Générer des données avec de grandes valeurs pour déclencher les échelles
                
                // 1. Household visits (visites domiciliaires)
                const totalHouses = Math.floor(Math.random() * 500) + 1000; // 1000-1500
                const visitedHouses = Math.floor(totalHouses * 0.8);
                const positiveHouses = Math.floor(visitedHouses * 0.3);
                
                await client.query(`
                    INSERT INTO household_visits (secteur, periode, date, total_houses, visited_houses, positive_houses)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [secteur, periode, new Date(), totalHouses, visitedHouses, positiveHouses]);
                
                // 2. Breeding sites (gîtes larvaires) - valeurs très grandes pour déclencher k/M
                const totalSites = Math.floor(Math.random() * 5000) + 15000; // 15000-20000
                const positiveSites = Math.floor(totalSites * 0.4);
                const negativeSites = totalSites - positiveSites;
                
                await client.query(`
                    INSERT INTO breeding_sites (secteur, periode, date, total_sites, positive_sites, negative_sites)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [secteur, periode, new Date(), totalSites, positiveSites, negativeSites]);
                
                // 3. Eggs collection (œufs) - valeurs très grandes
                const eggsCount = Math.floor(Math.random() * 100000) + 500000; // 500k-600k
                
                await client.query(`
                    INSERT INTO eggs_collection (secteur, periode, date, eggs_count)
                    VALUES ($1, $2, $3, $4)
                `, [secteur, periode, new Date(), eggsCount]);
                
                // 4. Adult mosquitoes (moustiques adultes) - valeurs très grandes
                const totalMosquitoes = Math.floor(Math.random() * 50000) + 100000; // 100k-150k
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
        
        console.log(`🎉 Génération terminée: ${totalRecords} enregistrements créés`);
        console.log('📊 Données avec de grandes valeurs pour tester les échelles k et M');
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

generateLargeData();
