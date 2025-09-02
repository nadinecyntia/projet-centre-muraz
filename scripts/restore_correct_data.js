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

async function restoreCorrectData() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Restauration des données avec la structure correcte...');
        
        // Vider les tables
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
                // 1. Household visits (visites domiciliaires)
                const householdResult = await client.query(`
                    INSERT INTO household_visits (investigator_name, concession_code, house_code, visit_start_date, visit_end_date, sector, environment, gps_code, household_size, number_of_beds, head_contact)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
                `, [
                    'Investigator Test',
                    'CONC001',
                    'HOUSE001',
                    new Date(), 
                    new Date(), 
                    secteur, 
                    'urban',
                    '11.180729 -4.3616',
                    Math.floor(Math.random() * 10) + 1,
                    Math.floor(Math.random() * 5) + 1,
                    'Test Contact'
                ]);
                
                const householdId = householdResult.rows[0].id;
                
                // 2. Breeding sites (gîtes larvaires) - avec contraintes respectées
                const totalSites = Math.floor(Math.random() * 50) + 20; // 20-70
                const positiveSites = Math.floor(totalSites * 0.4);
                const negativeSites = totalSites - positiveSites;
                const positiveContainers = Math.floor(positiveSites * 0.8);
                const negativeContainers = Math.floor(negativeSites * 0.8);
                
                // Calculer les compteurs de larves avec contraintes respectées
                const larvaeCount = Math.floor(Math.random() * 100) + 20;
                const aedesLarvaeCount = Math.floor(larvaeCount * 0.4);
                const culexLarvaeCount = Math.floor(larvaeCount * 0.3);
                const anophelesLarvaeCount = larvaeCount - aedesLarvaeCount - culexLarvaeCount;
                
                // Calculer les compteurs de nymphes avec contraintes respectées
                const nymphsCount = Math.floor(Math.random() * 50) + 10;
                const aedesNymphsCount = Math.floor(nymphsCount * 0.4);
                const culexNymphsCount = Math.floor(nymphsCount * 0.3);
                const anophelesNymphsCount = nymphsCount - aedesNymphsCount - culexNymphsCount;
                
                await client.query(`
                    INSERT INTO breeding_sites (household_visit_id, total_sites, positive_sites, negative_sites, positive_containers, negative_containers, larvae_count, larvae_genus, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, nymphs_count, nymphs_genus, aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, site_types, site_classes, observations)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                `, [
                    householdId, 
                    totalSites, 
                    positiveSites, 
                    negativeSites,
                    positiveContainers,
                    negativeContainers,
                    larvaeCount,
                    ['aedes', 'culex', 'anopheles'],
                    aedesLarvaeCount,
                    culexLarvaeCount,
                    anophelesLarvaeCount,
                    nymphsCount,
                    ['aedes', 'culex', 'anopheles'],
                    aedesNymphsCount,
                    culexNymphsCount,
                    anophelesNymphsCount,
                    ['pneu', 'bidon', 'bassin'],
                    ['ordures ménagères', 'ustensiles abandonnés'],
                    'Test observation'
                ]);
                
                // 3. Eggs collection (œufs)
                const eggsCount = Math.floor(Math.random() * 100) + 20; // 20-120
                
                await client.query(`
                    INSERT INTO eggs_collection (household_visit_id, nest_number, nest_code, pass_order, eggs_count, observations)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    householdId, 
                    Math.floor(Math.random() * 10) + 1,
                    'NEST001',
                    Math.floor(Math.random() * 5) + 1,
                    eggsCount,
                    'Test observation'
                ]);
                
                // 4. Adult mosquitoes (moustiques adultes)
                const totalMosquitoes = Math.floor(Math.random() * 100) + 20; // 20-120
                const prokopackCount = Math.floor(totalMosquitoes * 0.4);
                const bgTrapCount = totalMosquitoes - prokopackCount;
                const maleCount = Math.floor(totalMosquitoes * 0.4);
                const femaleCount = totalMosquitoes - maleCount;
                
                await client.query(`
                    INSERT INTO adult_mosquitoes (household_visit_id, genus, species, collection_methods, prokopack_traps_count, bg_traps_count, capture_locations, prokopack_mosquitoes_count, bg_trap_mosquitoes_count, total_mosquitoes_count, male_count, female_count, blood_fed_females_count, gravid_females_count, starved_females_count, observations)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    householdId,
                    ['aedes', 'culex', 'anopheles'],
                    ['aedes_aegypti', 'autre_aedes', 'culex', 'anopheles'],
                    ['prokopack', 'bg_trap'],
                    1,
                    1,
                    ['interieur', 'exterieur'],
                    prokopackCount,
                    bgTrapCount,
                    totalMosquitoes,
                    maleCount,
                    femaleCount,
                    Math.floor(femaleCount * 0.3),
                    Math.floor(femaleCount * 0.4),
                    Math.floor(femaleCount * 0.3),
                    'Test observation'
                ]);
                
                totalRecords += 4;
                
                console.log(`✅ ${secteur} - ${periode}: ${totalSites} gîtes, ${eggsCount} œufs, ${totalMosquitoes} moustiques`);
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

restoreCorrectData();
