const { Pool } = require('pg');

// Configuration directe pour le script
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'centre_muraz_arbovirose',
    password: 'Cyntia-26',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Données de référence basées sur les formulaires
const SECTORS = ['Sector 6', 'Sector 9', 'Sector 22', 'Sector 26', 'Sector 33'];
const ENVIRONMENTS = ['urban', 'rural'];
const GENUS_OPTIONS = ['aedes', 'culex', 'anopheles', 'other'];
const SPECIES_OPTIONS = ['aedes_aegypti', 'other_aedes', 'culex', 'anopheles', 'other'];
const COLLECTION_METHODS = ['prokopack', 'bg_trap', 'other'];
const CAPTURE_LOCATIONS = ['interior', 'exterior'];
const SITES_TYPES = ['pneu', 'bidon', 'bassin', 'plate', 'box', 'table', 'canari', 'kettle', 'tomato box', 'bucket', 'water trough', 'gutter', 'chair', 'pot', 'other'];
const SITE_CLASSES = ['household waste', 'abandoned utensils', 'car wrecks', 'construction equipment', 'breeding utensils', 'other'];

// Fonction pour générer des données aléatoires réalistes
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomDate(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function generateGPS() {
    // Coordonnées approximatives pour Bobo-Dioulasso, Burkina Faso
    const lat = 11.1773 + (Math.random() - 0.5) * 0.1; // ±0.05 degrés
    const lng = -4.2979 + (Math.random() - 0.5) * 0.1; // ±0.05 degrés
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

async function fillEggsCollectionTable() {
    console.log('🥚 Remplissage de eggs_collection_new...');
    
    const eggsData = [];
    for (let i = 1; i <= 50; i++) {
        const visitDate = getRandomDate('2024-01-01', '2024-12-31');
        
        eggsData.push({
            eggs_visit_start_date: visitDate.toISOString().split('T')[0],
            eggs_concession_code: `CONC${String(i).padStart(3, '0')}`,
            eggs_sector: getRandomElement(SECTORS),
            eggs_environment: getRandomElement(ENVIRONMENTS),
            eggs_gps_code: generateGPS(),
            nest_number: Math.floor(Math.random() * 20) + 1,
            nest_code: `NEST${String(i).padStart(3, '0')}`,
            pass_order: Math.floor(Math.random() * 5) + 1,
            eggs_count: Math.floor(Math.random() * 200) + 1,
            observations: `Observation ${i}: Nid trouvé dans ${getRandomElement(SITES_TYPES)}`
        });
    }
    
    for (const data of eggsData) {
        await pool.query(`
            INSERT INTO eggs_collection_new (
                eggs_visit_start_date, eggs_concession_code, eggs_sector, 
                eggs_environment, eggs_gps_code, nest_number, nest_code, 
                pass_order, eggs_count, observations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            data.eggs_visit_start_date, data.eggs_concession_code, data.eggs_sector,
            data.eggs_environment, data.eggs_gps_code, data.nest_number, data.nest_code,
            data.pass_order, data.eggs_count, data.observations
        ]);
    }
    
    console.log(`✅ ${eggsData.length} enregistrements ajoutés à eggs_collection_new`);
}

async function fillBreedingSitesTable() {
    console.log('🏠 Remplissage de breeding_sites_new...');
    
    const breedingData = [];
    for (let i = 1; i <= 50; i++) {
        const visitDate = getRandomDate('2024-01-01', '2024-12-31');
        const larvaeGenus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const nymphsGenus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const sitesTypes = getRandomElements(SITES_TYPES, Math.floor(Math.random() * 4) + 1);
        const siteClasses = getRandomElements(SITE_CLASSES, Math.floor(Math.random() * 3) + 1);
        
        breedingData.push({
            site_investigator_name: `Investigateur ${i}`,
            site_concession_code: `CONC${String(i).padStart(3, '0')}`,
            site_house_code: `HOUSE${String(i).padStart(3, '0')}`,
            site_visit_start_date: visitDate.toISOString().split('T')[0],
            site_sector: getRandomElement(SECTORS),
            site_environment: getRandomElement(ENVIRONMENTS),
            site_gps_code: generateGPS(),
            total_sites_count: Math.floor(Math.random() * 20) + 1,
            positive_sites_count: Math.floor(Math.random() * 10) + 1,
            negative_sites_count: Math.floor(Math.random() * 15) + 1,
            larvae_genus: larvaeGenus,
            nymphs_genus: nymphsGenus,
            larvae_count: Math.floor(Math.random() * 100) + 1,
            aedes_larvae_count: larvaeGenus.includes('aedes') ? Math.floor(Math.random() * 50) + 1 : 0,
            culex_larvae_count: larvaeGenus.includes('culex') ? Math.floor(Math.random() * 50) + 1 : 0,
            anopheles_larvae_count: larvaeGenus.includes('anopheles') ? Math.floor(Math.random() * 50) + 1 : 0,
            other_larvae_count: larvaeGenus.includes('other') ? Math.floor(Math.random() * 30) + 1 : 0,
            nymphs_count: Math.floor(Math.random() * 80) + 1,
            aedes_nymphs_count: nymphsGenus.includes('aedes') ? Math.floor(Math.random() * 40) + 1 : 0,
            culex_nymphs_count: nymphsGenus.includes('culex') ? Math.floor(Math.random() * 40) + 1 : 0,
            anopheles_nymphs_count: nymphsGenus.includes('anopheles') ? Math.floor(Math.random() * 40) + 1 : 0,
            other_nymphs_count: nymphsGenus.includes('other') ? Math.floor(Math.random() * 25) + 1 : 0,
            sites_types: sitesTypes,
            site_classes: siteClasses,
            observations: `Observation ${i}: Sites trouvés dans ${sitesTypes.join(', ')}`
        });
    }
    
    for (const data of breedingData) {
        await pool.query(`
            INSERT INTO breeding_sites_new (
                site_investigator_name, site_concession_code, site_house_code, 
                site_visit_start_date, site_sector, site_environment, site_gps_code,
                total_sites_count, positive_sites_count, negative_sites_count,
                larvae_genus, nymphs_genus, larvae_count, aedes_larvae_count,
                culex_larvae_count, anopheles_larvae_count, other_larvae_count,
                nymphs_count, aedes_nymphs_count, culex_nymphs_count,
                anopheles_nymphs_count, other_nymphs_count, sites_types,
                site_classes, observations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        `, [
            data.site_investigator_name, data.site_concession_code, data.site_house_code,
            data.site_visit_start_date, data.site_sector, data.site_environment, data.site_gps_code,
            data.total_sites_count, data.positive_sites_count, data.negative_sites_count,
            data.larvae_genus, data.nymphs_genus, data.larvae_count, data.aedes_larvae_count,
            data.culex_larvae_count, data.anopheles_larvae_count, data.other_larvae_count,
            data.nymphs_count, data.aedes_nymphs_count, data.culex_nymphs_count,
            data.anopheles_nymphs_count, data.other_nymphs_count, data.sites_types,
            data.site_classes, data.observations
        ]);
    }
    
    console.log(`✅ ${breedingData.length} enregistrements ajoutés à breeding_sites_new`);
}

async function fillAdultMosquitoesTable() {
    console.log('🦟 Remplissage de adult_mosquitoes_new...');
    
    const mosquitoesData = [];
    for (let i = 1; i <= 50; i++) {
        const visitDate = getRandomDate('2024-01-01', '2024-12-31');
        const genus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const species = getRandomElements(SPECIES_OPTIONS, Math.floor(Math.random() * 3) + 1);
        
        mosquitoesData.push({
            mosquitoes_visit_start_date: visitDate.toISOString().split('T')[0],
            mosquitoes_concession_code: `CONC${String(i).padStart(3, '0')}`,
            mosquitoes_sector: getRandomElement(SECTORS),
            mosquitoes_environment: getRandomElement(ENVIRONMENTS),
            mosquitoes_gps_code: generateGPS(),
            genus: genus,
            species: species,
            collection_methods: getRandomElement(COLLECTION_METHODS),
            capture_locations: getRandomElement(CAPTURE_LOCATIONS),
            prokopack_traps_count: Math.floor(Math.random() * 10) + 1,
            bg_traps_count: Math.floor(Math.random() * 5) + 1,
            prokopack_mosquitoes_count: Math.floor(Math.random() * 50) + 1,
            bg_trap_mosquitoes_count: Math.floor(Math.random() * 30) + 1,
            total_mosquitoes_count: Math.floor(Math.random() * 80) + 1,
            male_count: Math.floor(Math.random() * 40) + 1,
            aedes_male_count: genus.includes('aedes') ? Math.floor(Math.random() * 20) + 1 : 0,
            culex_male_count: genus.includes('culex') ? Math.floor(Math.random() * 20) + 1 : 0,
            anopheles_male_count: genus.includes('anopheles') ? Math.floor(Math.random() * 20) + 1 : 0,
            other_male_count: genus.includes('other') ? Math.floor(Math.random() * 15) + 1 : 0,
            female_count: Math.floor(Math.random() * 40) + 1,
            blood_fed_females_count: Math.floor(Math.random() * 20) + 1,
            gravid_females_count: Math.floor(Math.random() * 15) + 1,
            starved_females_count: Math.floor(Math.random() * 10) + 1,
            mosquitoes_aedes_count: genus.includes('aedes') ? Math.floor(Math.random() * 30) + 1 : 0,
            mosquitoes_culex_count: genus.includes('culex') ? Math.floor(Math.random() * 30) + 1 : 0,
            mosquitoes_anopheles_count: genus.includes('anopheles') ? Math.floor(Math.random() * 30) + 1 : 0,
            mosquitoes_other_count: genus.includes('other') ? Math.floor(Math.random() * 20) + 1 : 0,
            observations: `Observation ${i}: Capture avec ${getRandomElement(COLLECTION_METHODS)}`
        });
    }
    
    for (const data of mosquitoesData) {
        await pool.query(`
            INSERT INTO adult_mosquitoes_new (
                mosquitoes_concession_code, mosquitoes_sector, mosquitoes_environment,
                mosquitoes_visit_start_date, mosquitoes_visit_start_time, mosquitoes_visit_end_time,
                mosquitoes_gps_code, genus, species,
                collection_methods, capture_locations, prokopack_traps_count,
                bg_traps_count, prokopack_mosquitoes_count, bg_trap_mosquitoes_count,
                total_mosquitoes_count, male_count, female_count, aedes_male_count, 
                culex_male_count, anopheles_male_count, other_male_count,
                blood_fed_females_count, gravid_females_count, starved_females_count,
                mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count,
                mosquitoes_other_count, observations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        `, [
            data.mosquitoes_concession_code, data.mosquitoes_sector, data.mosquitoes_environment,
            data.mosquitoes_visit_start_date, '08:00', '10:00',
            data.mosquitoes_gps_code, data.genus, data.species,
            data.collection_methods, data.capture_locations, data.prokopack_traps_count,
            data.bg_traps_count, data.prokopack_mosquitoes_count, data.bg_trap_mosquitoes_count,
            data.total_mosquitoes_count, data.male_count, data.female_count, data.aedes_male_count,
            data.culex_male_count, data.anopheles_male_count, data.other_male_count,
            data.blood_fed_females_count, data.gravid_females_count, data.starved_females_count,
            data.mosquitoes_aedes_count, data.mosquitoes_culex_count, data.mosquitoes_anopheles_count,
            data.mosquitoes_other_count, data.observations
        ]);
    }
    
    console.log(`✅ ${mosquitoesData.length} enregistrements ajoutés à adult_mosquitoes_new`);
}

async function fillAllTables() {
    try {
        console.log('🚀 Début du remplissage des tables de données...');
        
        await fillEggsCollectionTable();
        await fillBreedingSitesTable();
        await fillAdultMosquitoesTable();
        
        console.log('🎉 Toutes les tables ont été remplies avec succès !');
        
        // Vérification finale
        console.log('\n🔍 Vérification des données :');
        
        const eggsCount = await pool.query('SELECT COUNT(*) FROM eggs_collection_new');
        console.log(`eggs_collection_new: ${eggsCount.rows[0].count} enregistrements`);
        
        const breedingCount = await pool.query('SELECT COUNT(*) FROM breeding_sites_new');
        console.log(`breeding_sites_new: ${breedingCount.rows[0].count} enregistrements`);
        
        const mosquitoesCount = await pool.query('SELECT COUNT(*) FROM adult_mosquitoes_new');
        console.log(`adult_mosquitoes_new: ${mosquitoesCount.rows[0].count} enregistrements`);
        
    } catch (error) {
        console.error('❌ Erreur lors du remplissage des tables:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fillAllTables();
