/**
 * Tests d'intégration end-to-end
 * Centre MURAZ - Plateforme Entomologique
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../routes/api');
const { pool } = require('../config/database');

// Créer une instance Express pour les tests
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('🚀 Tests d\'Intégration End-to-End', () => {
    
    beforeAll(async () => {
        // Attendre que la connexion soit établie
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        // Fermer la connexion après tous les tests
        await pool.end();
    });

    describe('Flux complet de données entomologiques', () => {
        beforeEach(async () => {
            // Nettoyer la base de données avant chaque test
            await global.cleanTestDatabase(pool);
        });

        test('devrait traiter un flux complet de données entomologiques', async () => {
            // 1. Insérer des données de test
            const testData = {
                household_visits: global.createTestData('household_visits', 10),
                eggs_collection: global.createTestData('eggs_collection', 10),
                breeding_sites: global.createTestData('breeding_sites', 10),
                adult_mosquitoes: global.createTestData('adult_mosquitoes', 10)
            };

            // Insérer les visites
            for (const visit of testData.household_visits) {
                const columns = Object.keys(visit).join(', ');
                const placeholders = Object.keys(visit).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(visit);
                
                await pool.query(
                    `INSERT INTO household_visits (${columns}) VALUES (${placeholders})`,
                    values
                );
            }

            // Insérer les œufs
            for (const egg of testData.eggs_collection) {
                const columns = Object.keys(egg).join(', ');
                const placeholders = Object.keys(egg).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(egg);
                
                await pool.query(
                    `INSERT INTO eggs_collection (${columns}) VALUES (${placeholders})`,
                    values
                );
            }

            // Insérer les gîtes
            for (const site of testData.breeding_sites) {
                const columns = Object.keys(site).join(', ');
                const placeholders = Object.keys(site).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(site);
                
                await pool.query(
                    `INSERT INTO breeding_sites (${columns}) VALUES (${placeholders})`,
                    values
                );
            }

            // Insérer les adultes
            for (const adult of testData.adult_mosquitoes) {
                const columns = Object.keys(adult).join(', ');
                const placeholders = Object.keys(adult).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(adult);
                
                await pool.query(
                    `INSERT INTO adult_mosquitoes (${columns}) VALUES (${placeholders})`,
                    values
                );
            }

            // 2. Vérifier que les données sont insérées
            const visitCount = await pool.query('SELECT COUNT(*) FROM household_visits');
            const eggCount = await pool.query('SELECT COUNT(*) FROM eggs_collection');
            const siteCount = await pool.query('SELECT COUNT(*) FROM breeding_sites');
            const adultCount = await pool.query('SELECT COUNT(*) FROM adult_mosquitoes');

            expect(parseInt(visitCount.rows[0].count)).toBe(10);
            expect(parseInt(eggCount.rows[0].count)).toBe(10);
            expect(parseInt(siteCount.rows[0].count)).toBe(10);
            expect(parseInt(adultCount.rows[0].count)).toBe(10);

            // 3. Tester l'API d'analyses
            const analysesResponse = await request(app)
                .get('/api/analyses')
                .expect(200);

            expect(analysesResponse.body.success).toBe(true);
            expect(analysesResponse.body.data.totalOeufs).toBeGreaterThan(0);
            expect(analysesResponse.body.data.totalAdultes).toBeGreaterThan(0);
            expect(analysesResponse.body.data.totalLarves).toBeGreaterThan(0);

            // 4. Tester l'API des indices
            const indicesResponse = await request(app)
                .get('/api/indices')
                .expect(200);

            expect(indicesResponse.body.success).toBe(true);
            expect(indicesResponse.body.data.moyennes).toBeDefined();

            // 5. Tester l'API des œufs par secteur
            const oeufsResponse = await request(app)
                .get('/api/analyses/oeufs')
                .expect(200);

            expect(oeufsResponse.body.success).toBe(true);
            expect(oeufsResponse.body.data.totalOeufs).toBeGreaterThan(0);

            // 6. Tester l'API des œufs par mois
            const oeufsMoisResponse = await request(app)
                .get('/api/analyses/oeufs-mois')
                .expect(200);

            expect(oeufsMoisResponse.body.success).toBe(true);
            expect(oeufsMoisResponse.body.data.totalOeufs).toBeGreaterThan(0);
        });

        test('devrait traiter un flux de données biologiques', async () => {
            // 1. Insérer des données biologiques
            const bioData = {
                form_type: 'pcr_rt_pcr',
                analysis_type: 'pcr',
                sample_stage: 'adult',
                genus: 'aedes',
                species: 'aegypti',
                sector: 'Sector 6',
                sample_count: 10,
                collection_date: '2024-01-01',
                analysis_date: '2024-01-01',
                identified_species: 'aedes',
                virus_types: 'dengue',
                homozygous_count: 5,
                heterozygous_count: 3,
                total_population: 10
            };

            const response = await request(app)
                .post('/api/biologie')
                .send(bioData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.infos_communes_id).toBeDefined();
            expect(response.body.data.specific_table_id).toBeDefined();

            // 2. Vérifier que les données sont insérées
            const infosCount = await pool.query('SELECT COUNT(*) FROM infos_communes');
            const pcrCount = await pool.query('SELECT COUNT(*) FROM analyses_pcr');

            expect(parseInt(infosCount.rows[0].count)).toBe(1);
            expect(parseInt(pcrCount.rows[0].count)).toBe(1);

            // 3. Récupérer les données biologiques
            const getResponse = await request(app)
                .get('/api/biologie')
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data).toHaveLength(1);
            expect(getResponse.body.data[0].analysis_type).toBe('pcr');
        });
    });

    describe('Performance des APIs avec de gros volumes', () => {
        test('devrait gérer efficacement de gros volumes de données', async () => {
            // Nettoyer la base
            await global.cleanTestDatabase(pool);

            // Insérer un grand nombre de données
            const largeDataset = global.createTestData('household_visits', 100);
            
            for (const visit of largeDataset) {
                const columns = Object.keys(visit).join(', ');
                const placeholders = Object.keys(visit).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(visit);
                
                await pool.query(
                    `INSERT INTO household_visits (${columns}) VALUES (${placeholders})`,
                    values
                );
            }

            // Tester la performance de l'API
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/analyses')
                .expect(200);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(responseTime).toBeLessThan(10000); // Moins de 10 secondes
        });

        test('devrait gérer efficacement les requêtes complexes', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/indices')
                .expect(200);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(responseTime).toBeLessThan(5000); // Moins de 5 secondes
        });
    });

    describe('Cohérence des données entre APIs', () => {
        test('devrait maintenir la cohérence entre les APIs', async () => {
            // Récupérer les données de l'API générale
            const analysesResponse = await request(app)
                .get('/api/analyses')
                .expect(200);

            // Récupérer les données de l'API spécifique aux œufs
            const oeufsResponse = await request(app)
                .get('/api/analyses/oeufs')
                .expect(200);

            // Vérifier la cohérence des totaux
            expect(analysesResponse.body.data.totalOeufs).toBe(oeufsResponse.body.data.totalOeufs);
            
            // Vérifier la cohérence des secteurs
            expect(analysesResponse.body.data.secteurs).toEqual(expect.arrayContaining(oeufsResponse.body.data.secteurs));
        });

        test('devrait maintenir la cohérence des indices', async () => {
            const indicesResponse = await request(app)
                .get('/api/indices')
                .expect(200);

            const data = indicesResponse.body.data;
            const moyennes = data.moyennes;

            // Vérifier que les indices sont cohérents
            expect(moyennes.ib).toBeGreaterThanOrEqual(0);
            expect(moyennes.im).toBeGreaterThanOrEqual(0);
            expect(moyennes.ir).toBeGreaterThanOrEqual(0);
            expect(moyennes.ipp).toBeGreaterThanOrEqual(0);
            expect(moyennes.icn).toBeGreaterThanOrEqual(0);
            expect(moyennes.iap_bg).toBeGreaterThanOrEqual(0);
            expect(moyennes.iap_prokopack).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Gestion des erreurs en intégration', () => {
        test('devrait gérer les erreurs de base de données', async () => {
            // Simuler une erreur de base de données en fermant la connexion
            const originalQuery = pool.query;
            pool.query = jest.fn().mockRejectedValue(new Error('Erreur de base de données'));

            const response = await request(app)
                .get('/api/analyses')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Erreur');

            // Restaurer la fonction originale
            pool.query = originalQuery;
        });

        test('devrait gérer les erreurs de validation en intégration', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'invalid_type',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 10,
                    collection_date: '2024-01-01',
                    analysis_date: '2024-01-01'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Type de formulaire invalide');
        });
    });

    describe('Tests de charge', () => {
        test('devrait gérer plusieurs requêtes simultanées', async () => {
            const requests = [
                request(app).get('/api/analyses'),
                request(app).get('/api/indices'),
                request(app).get('/api/analyses/oeufs'),
                request(app).get('/api/analyses/oeufs-mois'),
                request(app).get('/api/sync-status')
            ];

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        test('devrait maintenir la performance sous charge', async () => {
            const startTime = Date.now();
            
            const requests = Array.from({ length: 20 }, () => 
                request(app).get('/api/analyses')
            );

            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            expect(totalTime).toBeLessThan(30000); // Moins de 30 secondes pour 20 requêtes
        });
    });

    describe('Tests de récupération après erreur', () => {
        test('devrait récupérer après une erreur temporaire', async () => {
            // Simuler une erreur temporaire
            const originalQuery = pool.query;
            pool.query = jest.fn()
                .mockRejectedValueOnce(new Error('Erreur temporaire'))
                .mockResolvedValueOnce({ rows: [{ count: '10' }] });

            // Première requête devrait échouer
            const errorResponse = await request(app)
                .get('/api/sync-status')
                .expect(500);

            expect(errorResponse.body.success).toBe(false);

            // Deuxième requête devrait réussir
            const successResponse = await request(app)
                .get('/api/sync-status')
                .expect(200);

            expect(successResponse.body.success).toBe(true);

            // Restaurer la fonction originale
            pool.query = originalQuery;
        });
    });
});


