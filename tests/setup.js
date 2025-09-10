/**
 * Configuration globale des tests
 * Centre MURAZ - Plateforme Entomologique
 */

// Configuration de l'environnement de test
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'centre_muraz_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Configuration des timeouts
jest.setTimeout(30000);

// Mock des modules externes
jest.mock('axios');

// Configuration des logs pour les tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    // Supprimer les logs en mode test pour la clarté
    console.log = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    // Restaurer les logs
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});

// Configuration des données de test
global.testData = {
    sectors: ['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33'],
    environments: ['urban', 'rural'],
    months: [
        'Janvier 2024', 'Février 2024', 'Mars 2024', 'Avril 2024',
        'Mai 2024', 'Juin 2024', 'Juillet 2024', 'Août 2024',
        'Septembre 2024', 'Octobre 2024', 'Novembre 2024', 'Décembre 2024'
    ],
    genres: ['aedes', 'culex', 'anopheles', 'autre']
};

// Fonctions utilitaires pour les tests
global.createTestData = (type, count = 10) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        switch (type) {
            case 'household_visits':
                data.push({
                    id: i + 1,
                    investigator_name: `Investigateur ${i + 1}`,
                    concession_code: `CONC${i + 1}`,
                    house_code: `HOUSE${i + 1}`,
                    visit_start_date: new Date(2024, i % 12, (i % 28) + 1),
                    sector: global.testData.sectors[i % 4],
                    environment: global.testData.environments[i % 2],
                    household_size: Math.floor(Math.random() * 10) + 1,
                    number_of_beds: Math.floor(Math.random() * 5) + 1
                });
                break;
            case 'eggs_collection':
                data.push({
                    id: i + 1,
                    household_visit_id: i + 1,
                    nest_number: i + 1,
                    nest_code: `NEST${i + 1}`,
                    eggs_count: Math.floor(Math.random() * 100) + 1,
                    observations: `Observation ${i + 1}`
                });
                break;
            case 'breeding_sites':
                data.push({
                    id: i + 1,
                    household_visit_id: i + 1,
                    total_sites: Math.floor(Math.random() * 20) + 1,
                    positive_sites: Math.floor(Math.random() * 10),
                    negative_sites: Math.floor(Math.random() * 10),
                    larvae_count: Math.floor(Math.random() * 50) + 1,
                    nymphs_count: Math.floor(Math.random() * 20)
                });
                break;
            case 'adult_mosquitoes':
                data.push({
                    id: i + 1,
                    household_visit_id: i + 1,
                    genus: global.testData.genres[i % 4],
                    species: `species_${i + 1}`,
                    total_mosquitoes_count: Math.floor(Math.random() * 50) + 1,
                    male_count: Math.floor(Math.random() * 25),
                    female_count: Math.floor(Math.random() * 25),
                    bg_traps_count: Math.floor(Math.random() * 5) + 1,
                    bg_trap_mosquitoes_count: Math.floor(Math.random() * 20),
                    prokopack_traps_count: Math.floor(Math.random() * 3) + 1,
                    prokopack_mosquitoes_count: Math.floor(Math.random() * 15)
                });
                break;
        }
    }
    return data;
};

// Fonction pour nettoyer la base de données de test
global.cleanTestDatabase = async (pool) => {
    try {
        await pool.query('DELETE FROM adult_mosquitoes');
        await pool.query('DELETE FROM eggs_collection');
        await pool.query('DELETE FROM breeding_sites');
        await pool.query('DELETE FROM household_visits');
        await pool.query('DELETE FROM infos_communes');
        await pool.query('DELETE FROM analyses_pcr');
        await pool.query('DELETE FROM analyses_bioessai');
        await pool.query('DELETE FROM analyses_repas_sanguin');
    } catch (error) {
        console.error('Erreur lors du nettoyage de la base de test:', error);
    }
};

// Fonction pour insérer des données de test
global.insertTestData = async (pool, data) => {
    try {
        for (const item of data) {
            const table = Object.keys(item)[0];
            const values = Object.values(item)[0];
            
            const columns = Object.keys(values).join(', ');
            const placeholders = Object.keys(values).map((_, i) => `$${i + 1}`).join(', ');
            const valuesArray = Object.values(values);
            
            await pool.query(
                `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
                valuesArray
            );
        }
    } catch (error) {
        console.error('Erreur lors de l\'insertion des données de test:', error);
    }
};

console.log('🧪 Configuration des tests initialisée');


