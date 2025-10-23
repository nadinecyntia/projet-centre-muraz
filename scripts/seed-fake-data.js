/**
 * =============================================================================
 * Script de Génération de Données Fictives - Structure Normalisée
 * =============================================================================
 * Génère des données fictives réalistes pour tester les graphiques d'analyses
 */

const { pool } = require('../config/database');

// Configuration
const CONFIG = {
    nbHouses: 50,           // Nombre de maisons
    nbMonths: 6,            // Nombre de mois de données
    secteurs: ['Secteur 1', 'Secteur 2', 'Secteur 3', 'Secteur 4'],
    environments: ['urban', 'rural'],
    investigateurs: ['Dr. Kouadio', 'Dr. Diabaté', 'Dr. Traoré', 'Dr. Sanogo', 'Dr. Koné'],
    sitesTypes: ['pneu', 'bidon', 'bassin', 'plate', 'box', 'table', 'canari', 'kettle', 'tomato_box', 'bucket', 'water_trough', 'gutter', 'chair', 'pot', 'other'],
    siteClasses: ['household waste', 'abandoned utensils', 'car wrecks', 'construction equipment', 'breeding utensils', 'other']
};

/**
 * Génère une date aléatoire dans les N derniers mois
 */
function randomDate(monthsAgo) {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
    return date.toISOString().split('T')[0];
}

/**
 * Génère des coordonnées GPS aléatoires (Burkina Faso)
 */
function randomGPS() {
    const lat = (12 + Math.random() * 2).toFixed(6);  // 12-14°N
    const lon = (-2 + Math.random() * 2).toFixed(6);  // -2 à 0°E
    return `${lat},${lon}`;
}

/**
 * Sélectionne un élément aléatoire d'un tableau
 */
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sélectionne plusieurs éléments aléatoires d'un tableau
 */
function randomChoices(arr, count = null) {
    const n = count || randomInt(1, Math.min(3, arr.length));
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

/**
 * Génère un nombre aléatoire entre min et max
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère des maisons fictives
 */
async function createHouses(client) {
    console.log('\n📍 Création des maisons...');
    
    const houses = [];
    
    for (let i = 1; i <= CONFIG.nbHouses; i++) {
        const sector = randomChoice(CONFIG.secteurs);
        const environment = randomChoice(CONFIG.environments);
        const gpsCoordinates = randomGPS();
        const concessionCode = `C${String(i).padStart(3, '0')}`;
        const houseCode = `H${String(i).padStart(3, '0')}`;
        
        const result = await client.query(
            `INSERT INTO houses (concession_code, house_code, sector, environment, gps_coordinates, household_size, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id`,
            [concessionCode, houseCode, sector, environment, gpsCoordinates, randomInt(3, 10)]
        );
        
        houses.push({
            id: result.rows[0].id,
            concessionCode,
            sector,
            environment
        });
    }
    
    console.log(`✅ ${houses.length} maisons créées`);
    return houses;
}

/**
 * Génère des collectes d'œufs fictives
 */
async function createEggsCollections(client, houses) {
    console.log('\n🥚 Création des collectes d\'œufs...');
    
    let count = 0;
    
    for (let month = 0; month < CONFIG.nbMonths; month++) {
        // 60% des maisons par mois
        const housesThisMonth = houses.filter(() => Math.random() > 0.4);
        
        for (const house of housesThisMonth) {
            const visitDate = randomDate(month);
            const investigator = randomChoice(CONFIG.investigateurs);
            const eggsCount = randomInt(10, 150);
            
            await client.query(
                `INSERT INTO eggs_collections (house_id, visit_date, investigator_name, nest_number, nest_code, pass_order, eggs_count, observations, status, validated_by, validated_at, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', NULL, NOW(), NOW(), NOW())`,
                [
                    house.id,
                    visitDate,
                    investigator,
                    randomInt(1, 5),
                    `NEST${randomInt(1, 100)}`,
                    randomInt(1, 3),
                    eggsCount,
                    Math.random() > 0.7 ? 'RAS' : null
                ]
            );
            
            count++;
        }
    }
    
    console.log(`✅ ${count} collectes d'œufs créées`);
}

/**
 * Génère des gîtes larvaires fictifs
 */
async function createBreedingSites(client, houses) {
    console.log('\n🦟 Création des gîtes larvaires...');
    
    let count = 0;
    
    for (let month = 0; month < CONFIG.nbMonths; month++) {
        // 70% des maisons par mois
        const housesThisMonth = houses.filter(() => Math.random() > 0.3);
        
        for (const house of housesThisMonth) {
            const visitDate = randomDate(month);
            const investigator = randomChoice(CONFIG.investigateurs);
            
            // 2-5 gîtes par maison
            const nbSites = randomInt(2, 5);
            
            for (let s = 0; s < nbSites; s++) {
                const siteState = Math.random() > 0.3 ? 'positive' : 'negative';
                
                const aedesLarvae = siteState === 'positive' ? randomInt(0, 30) : 0;
                const culexLarvae = siteState === 'positive' ? randomInt(0, 40) : 0;
                const anophelesLarvae = siteState === 'positive' ? randomInt(0, 20) : 0;
                const otherLarvae = siteState === 'positive' ? randomInt(0, 10) : 0;
                const larvaeCount = aedesLarvae + culexLarvae + anophelesLarvae + otherLarvae;
                
                const aedesNymphs = siteState === 'positive' ? randomInt(0, 15) : 0;
                const culexNymphs = siteState === 'positive' ? randomInt(0, 20) : 0;
                const anophelesNymphs = siteState === 'positive' ? randomInt(0, 10) : 0;
                const otherNymphs = siteState === 'positive' ? randomInt(0, 5) : 0;
                const nymphsCount = aedesNymphs + culexNymphs + anophelesNymphs + otherNymphs;
                
                // Générer sites_types et site_classes aléatoires
                const sitesTypes = randomChoices(CONFIG.sitesTypes);
                const siteClasses = randomChoices(CONFIG.siteClasses);

                await client.query(
                    `INSERT INTO breeding_sites (
                        house_id, visit_date, investigator_name, sites_types, site_classes, site_state,
                        aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count, larvae_count,
                        aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count, nymphs_count,
                        observations, status, validated_by, validated_at, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'approved', NULL, NOW(), NOW(), NOW())`,
                    [
                        house.id, visitDate, investigator, sitesTypes, siteClasses, siteState,
                        aedesLarvae, culexLarvae, anophelesLarvae, otherLarvae, larvaeCount,
                        aedesNymphs, culexNymphs, anophelesNymphs, otherNymphs, nymphsCount,
                        Math.random() > 0.8 ? 'Gîte naturel' : null
                    ]
                );
                
                count++;
            }
        }
    }
    
    console.log(`✅ ${count} gîtes larvaires créés`);
}

/**
 * Génère des collectes de moustiques adultes fictives
 * IMPORTANT : 1 ligne = 1 combinaison (méthode × location)
 * Pour une collecte complète : 4 lignes par maison
 */
async function createMosquitoesCollections(client, houses) {
    console.log('\n🦟 Création des collectes de moustiques adultes...');
    
    let count = 0;
    
    // Définir les combinaisons méthode × location
    const combinations = [
        { method: 'prokopack', location: 'interior', trapField: 'prokopack', mosquitoField: 'prokopack' },
        { method: 'prokopack', location: 'exterior', trapField: 'prokopack', mosquitoField: 'prokopack' },
        { method: 'bg_trap', location: 'interior', trapField: 'bg', mosquitoField: 'bg_trap' },
        { method: 'bg_trap', location: 'exterior', trapField: 'bg', mosquitoField: 'bg_trap' }
    ];
    
    for (let month = 0; month < CONFIG.nbMonths; month++) {
        // 50% des maisons par mois
        const housesThisMonth = houses.filter(() => Math.random() > 0.5);
        
        for (const house of housesThisMonth) {
            const visitDate = randomDate(month);
            const investigator = randomChoice(CONFIG.investigateurs);
            
            // Décider si on fait une collecte complète (4 lignes) ou partielle (1-3 lignes)
            const isFullCollection = Math.random() > 0.3; // 70% de collectes complètes
            const selectedCombinations = isFullCollection 
                ? combinations 
                : randomChoices(combinations, randomInt(1, 3));
            
            // Créer une ligne pour chaque combinaison
            for (const combo of selectedCombinations) {
                // Comptages pour cette combinaison spécifique
                const maleCount = randomInt(3, 25);
                const femaleCount = randomInt(5, 40);
                const totalMosquitoes = maleCount + femaleCount;
                
                // Répartition par genre (mâles)
                const aedesMale = randomInt(0, maleCount);
                const culexMale = randomInt(0, maleCount - aedesMale);
                const anophelesMale = randomInt(0, maleCount - aedesMale - culexMale);
                const otherMale = maleCount - aedesMale - culexMale - anophelesMale;
                
                // États physiologiques (femelles)
                const bloodFedFemales = randomInt(0, Math.floor(femaleCount * 0.4));
                const gravidFemales = randomInt(0, Math.floor(femaleCount * 0.3));
                const starvedFemales = femaleCount - bloodFedFemales - gravidFemales;
                
                // Répartition totale par genre
                const aedesTotal = aedesMale + randomInt(0, femaleCount);
                const culexTotal = culexMale + randomInt(0, femaleCount - aedesTotal + aedesMale);
                const anophelesTotal = anophelesMale + randomInt(0, femaleCount - aedesTotal - culexTotal + aedesMale + culexMale);
                const otherTotal = totalMosquitoes - aedesTotal - culexTotal - anophelesTotal;
                
                // Nombre de pièges pour cette méthode/location
                const trapsCount = randomInt(1, 3);
                
                await client.query(
                    `INSERT INTO adult_mosquitoes_collections (
                        house_id, visit_date, visit_start_time, visit_end_time, investigator_name,
                        collection_methods, capture_locations,
                        prokopack_traps_count, bg_traps_count,
                        prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                        total_mosquitoes_count, male_count, female_count,
                        aedes_male_count, culex_male_count, anopheles_male_count, other_male_count,
                        blood_fed_females_count, gravid_females_count, starved_females_count,
                        mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
                        observations, status, validated_by, validated_at, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                        'approved', NULL, NOW(), NOW(), NOW()
                    )`,
                    [
                        house.id, 
                        visitDate, 
                        '08:00:00', 
                        '12:00:00', 
                        investigator,
                        combo.method,  // ✅ UNE SEULE méthode
                        combo.location,  // ✅ UN SEUL lieu
                        combo.method === 'prokopack' ? trapsCount : 0,  // Pièges prokopack
                        combo.method === 'bg_trap' ? trapsCount : 0,  // Pièges BG
                        combo.method === 'prokopack' ? totalMosquitoes : 0,  // Moustiques prokopack
                        combo.method === 'bg_trap' ? totalMosquitoes : 0,  // Moustiques BG
                        totalMosquitoes, 
                        maleCount, 
                        femaleCount,
                        aedesMale, 
                        culexMale, 
                        anophelesMale, 
                        otherMale,
                        bloodFedFemales, 
                        gravidFemales, 
                        starvedFemales,
                        aedesTotal, 
                        culexTotal, 
                        anophelesTotal, 
                        otherTotal,
                        isFullCollection ? 'Collecte complète' : `${combo.method} ${combo.location}`
                    ]
                );
                
                count++;
            }
        }
    }
    
    console.log(`✅ ${count} collectes de moustiques adultes créées (plusieurs lignes par maison)`);
}

/**
 * Script principal
 */
async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║     🎲 GÉNÉRATION DE DONNÉES FICTIVES - STRUCTURE NORMALISÉE     ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Supprimer les données existantes
        console.log('\n🗑️  Suppression des données existantes...');
        await client.query('DELETE FROM eggs_collections');
        await client.query('DELETE FROM breeding_sites');
        await client.query('DELETE FROM adult_mosquitoes_collections');
        await client.query('DELETE FROM houses');
        console.log('✅ Données existantes supprimées');
        
        // Créer les nouvelles données
        const houses = await createHouses(client);
        await createEggsCollections(client, houses);
        await createBreedingSites(client, houses);
        await createMosquitoesCollections(client, houses);
        
        await client.query('COMMIT');
        
        console.log('\n╔════════════════════════════════════════════════════════════════════╗');
        console.log('║               ✅ DONNÉES FICTIVES CRÉÉES AVEC SUCCÈS ✅           ║');
        console.log('╚════════════════════════════════════════════════════════════════════╝');
        
        console.log('\n📊 RÉSUMÉ :');
        console.log(`  • ${CONFIG.nbHouses} maisons`);
        console.log(`  • ${CONFIG.nbMonths} mois de données`);
        console.log(`  • ${CONFIG.secteurs.length} secteurs`);
        console.log(`  • ${CONFIG.investigateurs.length} investigateurs`);
        
        console.log('\n🚀 Testez maintenant :');
        console.log('   http://localhost:3000/analyses.html\n');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur lors de la génération des données:', error);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

// Exécution
main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});

