const { pool } = require('../config/database');

async function generateDataWithGenres() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Génération de données de test avec genres de moustiques...');
        
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
                // Convertir la période en date
                const [moisStr, anneeStr] = periode.split(' ');
                const moisIndex = {
                    'Janvier': 0, 'Février': 1, 'Mars': 2, 'Avril': 3,
                    'Mai': 4, 'Juin': 5, 'Juillet': 6, 'Août': 7,
                    'Septembre': 8, 'Octobre': 9, 'Novembre': 10, 'Décembre': 11
                }[moisStr];
                const annee = parseInt(anneeStr);
                const date = new Date(annee, moisIndex, 15); // 15ème du mois
                
                // 1. Household visits
                const householdResult = await client.query(`
                    INSERT INTO household_visits (
                        investigator_name, concession_code, house_code, 
                        visit_start_date, sector, environment, gps_code,
                        household_size, number_of_beds, head_contact
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    RETURNING id
                `, [
                    `Enquêteur_${secteur}`, `CONC_${secteur}`, `HOUSE_${secteur}`,
                    date, secteur, 'urban', '11.180729 -4.3616',
                    Math.floor(Math.random() * 10) + 3, Math.floor(Math.random() * 5) + 2, `Contact_${secteur}`
                ]);
                
                const householdId = householdResult.rows[0].id;
                
                // 2. Breeding sites avec genres de larves
                const totalSites = Math.floor(Math.random() * 50) + 20;
                const positiveSites = Math.floor(totalSites * 0.4);
                const negativeSites = totalSites - positiveSites;
                
                const larvaeCount = Math.floor(Math.random() * 200) + 100;
                const aedesLarvae = Math.floor(larvaeCount * 0.35);
                const culexLarvae = Math.floor(larvaeCount * 0.3);
                const anophelesLarvae = Math.floor(larvaeCount * 0.2);
                const otherLarvae = Math.max(0, larvaeCount - (aedesLarvae + culexLarvae + anophelesLarvae));
                
                const nymphsCount = Math.floor(Math.random() * 100) + 50;
                const aedesNymphs = Math.floor(nymphsCount * 0.35);
                const culexNymphs = Math.floor(nymphsCount * 0.3);
                const anophelesNymphs = Math.floor(nymphsCount * 0.2);
                const otherNymphs = Math.max(0, nymphsCount - (aedesNymphs + culexNymphs + anophelesNymphs));
                
                await client.query(`
                    INSERT INTO breeding_sites (
                        household_visit_id, total_sites, positive_sites, negative_sites,
                        larvae_count, larvae_genus, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count,
                        nymphs_count, nymphs_genus, aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count,
                        site_types, site_classes, observations
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                `, [
                    householdId, totalSites, positiveSites, negativeSites,
                    larvaeCount, ['aedes', 'culex', 'anopheles'], aedesLarvae, culexLarvae, anophelesLarvae, otherLarvae,
                    nymphsCount, ['aedes', 'culex', 'anopheles'], aedesNymphs, culexNymphs, anophelesNymphs, otherNymphs,
                    ['pneu', 'bidon', 'bassin'], ['ordures ménagères', 'ustensiles abandonnés'], 'Observation gîtes'
                ]);
                
                // 3. Eggs collection
                const eggsCount = Math.floor(Math.random() * 200) + 100;
                
                await client.query(`
                    INSERT INTO eggs_collection (
                        household_visit_id, nest_number, nest_code, pass_order,
                        eggs_count, observations
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    householdId, `NEST_${secteur}`, `CODE_${secteur}`, 'PASS_1',
                    eggsCount, 'Observation œufs'
                ]);
                
                // 4. Adult mosquitoes avec genres
                const totalMosquitoes = Math.floor(Math.random() * 200) + 100;
                const prokopackCount = Math.floor(totalMosquitoes * 0.4);
                const bgTrapCount = totalMosquitoes - prokopackCount;
                const maleCount = Math.floor(totalMosquitoes * 0.45);
                const femaleCount = totalMosquitoes - maleCount;
                
                // Répartition par genre (exemple)
                const aedesCount = Math.floor(totalMosquitoes * 0.4);
                const culexCount = Math.floor(totalMosquitoes * 0.35);
                const anophelesCount = Math.floor(totalMosquitoes * 0.2);
                const autreCount = totalMosquitoes - aedesCount - culexCount - anophelesCount;
                
                // Déterminer les genres présents
                const genres = [];
                const species = [];
                if (aedesCount > 0) {
                    genres.push('aedes');
                    species.push('aedes_aegypti');
                }
                if (culexCount > 0) {
                    genres.push('culex');
                    species.push('culex');
                }
                if (anophelesCount > 0) {
                    genres.push('anopheles');
                    species.push('anopheles');
                }
                if (autreCount > 0) {
                    genres.push('autre');
                    species.push('autre');
                }
                
                await client.query(`
                    INSERT INTO adult_mosquitoes (
                        household_visit_id, genus, species, collection_methods,
                        prokopack_traps_count, bg_traps_count, capture_locations,
                        prokopack_mosquitoes_count, bg_trap_mosquitoes_count, total_mosquitoes_count,
                        male_count, female_count, blood_fed_females_count, gravid_females_count, starved_females_count,
                        observations
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    householdId, genres, species, ['prokopack', 'bg_trap'],
                    Math.floor(Math.random() * 10) + 5, Math.floor(Math.random() * 10) + 5, ['interieur', 'exterieur'],
                    prokopackCount, bgTrapCount, totalMosquitoes,
                    maleCount, femaleCount, Math.floor(femaleCount * 0.3), Math.floor(femaleCount * 0.4), Math.floor(femaleCount * 0.3),
                    'Observation moustiques adultes'
                ]);
                
                totalRecords += 4;
                
                console.log(`✅ ${secteur} - ${periode}: ${totalSites} gîtes, ${eggsCount} œufs, ${totalMosquitoes} moustiques (${genres.join(', ')})`);
            }
        }
        
        console.log(`🎉 Génération terminée: ${totalRecords} enregistrements créés`);
        console.log('📊 Données de test avec genres générées');
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

generateDataWithGenres();
