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
const COLLECTION_METHODS = ['prokopack', 'bg_trap'];
const CAPTURE_LOCATIONS = ['interior', 'exterior'];
const SITES_TYPES = ['pneu', 'bidon', 'bassin', 'plate', 'box', 'table', 'canari', 'kettle', 'tomato_box', 'bucket', 'water_trough', 'gutter', 'chair', 'pot', 'other'];
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

// =====================================================
// FONCTION POUR GÉNÉRER DES DONNÉES COHÉRENTES
// =====================================================

function generateCoherentMosquitoData(houseId, visitDate, concessionCode, sector, environment) {
    const data = [];
    
    // Générer les 4 lignes par maison (Prokopack int/ext + BG Trap int/ext)
    const combinations = [
        { method: 'prokopack', location: 'interior' },
        { method: 'prokopack', location: 'exterior' },
        { method: 'bg_trap', location: 'interior' },
        { method: 'bg_trap', location: 'exterior' }
    ];
    
    combinations.forEach((combo, index) => {
        // Générer des genres et espèces cohérents
        const genus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const species = getRandomElements(SPECIES_OPTIONS, Math.floor(Math.random() * 3) + 1);
        
        // Générer des compteurs cohérents
        const totalMosquitoes = Math.floor(Math.random() * 50) + 1;
        const maleCount = Math.floor(totalMosquitoes * (0.3 + Math.random() * 0.4)); // 30-70% mâles
        const femaleCount = totalMosquitoes - maleCount;
        
        // Générer des compteurs par genre cohérents
        const aedesCount = genus.includes('aedes') ? Math.floor(totalMosquitoes * (0.2 + Math.random() * 0.6)) : 0;
        const culexCount = genus.includes('culex') ? Math.floor(totalMosquitoes * (0.2 + Math.random() * 0.6)) : 0;
        const anophelesCount = genus.includes('anopheles') ? Math.floor(totalMosquitoes * (0.2 + Math.random() * 0.6)) : 0;
        const otherCount = genus.includes('other') ? Math.floor(totalMosquitoes * (0.1 + Math.random() * 0.3)) : 0;
        
        // Ajuster pour que la somme soit cohérente
        const totalByGenus = aedesCount + culexCount + anophelesCount + otherCount;
        if (totalByGenus !== totalMosquitoes) {
            // Ajuster le plus grand compteur
            const maxCount = Math.max(aedesCount, culexCount, anophelesCount, otherCount);
            if (aedesCount === maxCount) aedesCount = totalMosquitoes - culexCount - anophelesCount - otherCount;
            else if (culexCount === maxCount) culexCount = totalMosquitoes - aedesCount - anophelesCount - otherCount;
            else if (anophelesCount === maxCount) anophelesCount = totalMosquitoes - aedesCount - culexCount - otherCount;
            else otherCount = totalMosquitoes - aedesCount - culexCount - anophelesCount;
        }
        
        // Générer des compteurs par sexe cohérents
        const aedesMaleCount = genus.includes('aedes') ? Math.floor(aedesCount * (0.3 + Math.random() * 0.4)) : 0;
        const culexMaleCount = genus.includes('culex') ? Math.floor(culexCount * (0.3 + Math.random() * 0.4)) : 0;
        const anophelesMaleCount = genus.includes('anopheles') ? Math.floor(anophelesCount * (0.3 + Math.random() * 0.4)) : 0;
        const otherMaleCount = genus.includes('other') ? Math.floor(otherCount * (0.3 + Math.random() * 0.4)) : 0;
        
        // Générer des états physiologiques cohérents
        const bloodFedFemales = Math.floor(femaleCount * (0.1 + Math.random() * 0.3)); // 10-40%
        const gravidFemales = Math.floor(femaleCount * (0.1 + Math.random() * 0.2)); // 10-30%
        const starvedFemales = Math.floor(femaleCount * (0.05 + Math.random() * 0.15)); // 5-20%
        
        // Générer des compteurs de pièges
        const trapsCount = combo.method === 'prokopack' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2) + 1;
        const mosquitoesCount = combo.method === 'prokopack' ? Math.floor(totalMosquitoes * 0.6) : Math.floor(totalMosquitoes * 0.4);
        
        data.push({
            mosquitoes_concession_code: concessionCode,
            mosquitoes_sector: sector,
            mosquitoes_environment: environment,
            mosquitoes_visit_start_date: visitDate,
            mosquitoes_visit_start_time: '08:00',
            mosquitoes_visit_end_time: '10:00',
            mosquitoes_gps_code: generateGPS(),
            genus: genus,
            species: species,
            collection_methods: combo.method,
            capture_locations: combo.location,
            prokopack_traps_count: combo.method === 'prokopack' ? trapsCount : 0,
            bg_traps_count: combo.method === 'bg_trap' ? trapsCount : 0,
            prokopack_mosquitoes_count: combo.method === 'prokopack' ? mosquitoesCount : 0,
            bg_trap_mosquitoes_count: combo.method === 'bg_trap' ? mosquitoesCount : 0,
            total_mosquitoes_count: totalMosquitoes,
            male_count: maleCount,
            female_count: femaleCount,
            aedes_male_count: aedesMaleCount,
            culex_male_count: culexMaleCount,
            anopheles_male_count: anophelesMaleCount,
            other_male_count: otherMaleCount,
            blood_fed_females_count: bloodFedFemales,
            gravid_females_count: gravidFemales,
            starved_females_count: starvedFemales,
            mosquitoes_aedes_count: aedesCount,
            mosquitoes_culex_count: culexCount,
            mosquitoes_anopheles_count: anophelesCount,
            mosquitoes_other_count: otherCount,
            observations: `Observation ${houseId}: Capture ${combo.method} ${combo.location}`
        });
    });
    
    return data;
}

function generateCoherentBreedingData(houseId, visitDate, concessionCode, sector, environment) {
    const data = [];
    
    // Générer plusieurs gîtes par maison (2-5 gîtes)
    const numberOfSites = Math.floor(Math.random() * 4) + 2;
    
    for (let siteIndex = 0; siteIndex < numberOfSites; siteIndex++) {
        // Générer des types et classes de sites cohérents
        const sitesTypes = getRandomElements(SITES_TYPES, Math.floor(Math.random() * 3) + 1);
        const siteClasses = getRandomElements(SITE_CLASSES, Math.floor(Math.random() * 2) + 1);
        
        // Générer des compteurs cohérents
        const totalSites = Math.floor(Math.random() * 10) + 1;
        const positiveSites = Math.floor(totalSites * (0.2 + Math.random() * 0.6)); // 20-80% positifs
        const negativeSites = totalSites - positiveSites;
        
        // Générer des larves cohérentes
        const larvaeGenus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const larvaeCount = Math.floor(Math.random() * 100) + 1;
        
        const aedesLarvaeCount = larvaeGenus.includes('aedes') ? Math.floor(larvaeCount * (0.2 + Math.random() * 0.6)) : 0;
        const culexLarvaeCount = larvaeGenus.includes('culex') ? Math.floor(larvaeCount * (0.2 + Math.random() * 0.6)) : 0;
        const anophelesLarvaeCount = larvaeGenus.includes('anopheles') ? Math.floor(larvaeCount * (0.2 + Math.random() * 0.6)) : 0;
        const otherLarvaeCount = larvaeGenus.includes('other') ? Math.floor(larvaeCount * (0.1 + Math.random() * 0.3)) : 0;
        
        // Ajuster pour cohérence
        const totalLarvaeByGenus = aedesLarvaeCount + culexLarvaeCount + anophelesLarvaeCount + otherLarvaeCount;
        if (totalLarvaeByGenus !== larvaeCount) {
            const adjustment = larvaeCount - totalLarvaeByGenus;
            if (aedesLarvaeCount > 0) aedesLarvaeCount += adjustment;
            else if (culexLarvaeCount > 0) culexLarvaeCount += adjustment;
            else if (anophelesLarvaeCount > 0) anophelesLarvaeCount += adjustment;
            else otherLarvaeCount += adjustment;
        }
        
        // Générer des nymphes cohérentes
        const nymphsGenus = getRandomElements(GENUS_OPTIONS, Math.floor(Math.random() * 3) + 1);
        const nymphsCount = Math.floor(larvaeCount * (0.3 + Math.random() * 0.4)); // 30-70% des larves
        
        const aedesNymphsCount = nymphsGenus.includes('aedes') ? Math.floor(nymphsCount * (0.2 + Math.random() * 0.6)) : 0;
        const culexNymphsCount = nymphsGenus.includes('culex') ? Math.floor(nymphsCount * (0.2 + Math.random() * 0.6)) : 0;
        const anophelesNymphsCount = nymphsGenus.includes('anopheles') ? Math.floor(nymphsCount * (0.2 + Math.random() * 0.6)) : 0;
        const otherNymphsCount = nymphsGenus.includes('other') ? Math.floor(nymphsCount * (0.1 + Math.random() * 0.3)) : 0;
        
        // Ajuster pour cohérence
        const totalNymphsByGenus = aedesNymphsCount + culexNymphsCount + anophelesNymphsCount + otherNymphsCount;
        if (totalNymphsByGenus !== nymphsCount) {
            const adjustment = nymphsCount - totalNymphsByGenus;
            if (aedesNymphsCount > 0) aedesNymphsCount += adjustment;
            else if (culexNymphsCount > 0) culexNymphsCount += adjustment;
            else if (anophelesNymphsCount > 0) anophelesNymphsCount += adjustment;
            else otherNymphsCount += adjustment;
        }
        
        data.push({
            site_investigator_name: `Investigateur ${houseId}`,
            site_concession_code: concessionCode,
            site_house_code: `HOUSE${String(houseId).padStart(3, '0')}`,
            site_visit_start_date: visitDate,
            site_sector: sector,
            site_environment: environment,
            site_gps_code: generateGPS(),
            total_sites_count: totalSites,
            positive_sites_count: positiveSites,
            negative_sites_count: negativeSites,
            larvae_genus: larvaeGenus,
            nymphs_genus: nymphsGenus,
            larvae_count: larvaeCount,
            aedes_larvae_count: aedesLarvaeCount,
            culex_larvae_count: culexLarvaeCount,
            anopheles_larvae_count: anophelesLarvaeCount,
            other_larvae_count: otherLarvaeCount,
            nymphs_count: nymphsCount,
            aedes_nymphs_count: aedesNymphsCount,
            culex_nymphs_count: culexNymphsCount,
            anopheles_nymphs_count: anophelesNymphsCount,
            other_nymphs_count: otherNymphsCount,
            sites_types: sitesTypes,
            site_classes: siteClasses,
            observations: `Observation ${houseId}: Site ${siteIndex + 1} - ${sitesTypes.join(', ')}`
        });
    }
    
    return data;
}

function generateCoherentEggData(houseId, visitDate, concessionCode, sector, environment) {
    // Générer 1 ligne par maison
    return {
        eggs_visit_start_date: visitDate,
        eggs_concession_code: concessionCode,
        eggs_sector: sector,
        eggs_environment: environment,
        eggs_gps_code: generateGPS(),
        nest_number: Math.floor(Math.random() * 20) + 1,
        nest_code: `NEST${String(houseId).padStart(3, '0')}`,
        pass_order: Math.floor(Math.random() * 5) + 1,
        eggs_count: Math.floor(Math.random() * 200) + 1,
        observations: `Observation ${houseId}: Nid trouvé dans ${getRandomElement(SITES_TYPES)}`
    };
}

// =====================================================
// FONCTIONS DE REMPLISSAGE CORRIGÉES
// =====================================================

async function fillEggsCollectionTable() {
    console.log('🥚 Remplissage de eggs_collection_new...');
    
    const eggsData = [];
    for (let i = 1; i <= 50; i++) {
        const visitDate = getRandomDate('2024-01-01', '2024-12-31');
        const concessionCode = `CONC${String(i).padStart(3, '0')}`;
        const sector = getRandomElement(SECTORS);
        const environment = getRandomElement(ENVIRONMENTS);
        
        eggsData.push(generateCoherentEggData(i, visitDate.toISOString().split('T')[0], concessionCode, sector, environment));
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
        const concessionCode = `CONC${String(i).padStart(3, '0')}`;
        const sector = getRandomElement(SECTORS);
        const environment = getRandomElement(ENVIRONMENTS);
        
        const houseData = generateCoherentBreedingData(i, visitDate.toISOString().split('T')[0], concessionCode, sector, environment);
        breedingData.push(...houseData);
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
        const concessionCode = `CONC${String(i).padStart(3, '0')}`;
        const sector = getRandomElement(SECTORS);
        const environment = getRandomElement(ENVIRONMENTS);
        
        const houseData = generateCoherentMosquitoData(i, visitDate.toISOString().split('T')[0], concessionCode, sector, environment);
        mosquitoesData.push(...houseData);
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
            data.mosquitoes_visit_start_date, data.mosquitoes_visit_start_time, data.mosquitoes_visit_end_time,
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
        
        // Vérification de cohérence
        console.log('\n🔍 Vérification de cohérence :');
        
        const coherenceCheck = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN total_mosquitoes_count = male_count + female_count THEN 1 END) as coherent_sex_counts,
                COUNT(CASE WHEN total_mosquitoes_count = mosquitoes_aedes_count + mosquitoes_culex_count + mosquitoes_anopheles_count + mosquitoes_other_count THEN 1 END) as coherent_genus_counts
            FROM adult_mosquitoes_new
        `);
        
        console.log(`Cohérence des comptes par sexe: ${coherenceCheck.rows[0].coherent_sex_counts}/${coherenceCheck.rows[0].total_records}`);
        console.log(`Cohérence des comptes par genre: ${coherenceCheck.rows[0].coherent_genus_counts}/${coherenceCheck.rows[0].total_records}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du remplissage des tables:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fillAllTables();







