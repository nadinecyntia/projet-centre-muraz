/**
 * Tests unitaires pour les APIs
 * Centre MURAZ - Plateforme Entomologique
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../routes/api');

// Créer une instance Express pour les tests
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('🔌 Tests APIs', () => {
    
    describe('API /api/analyses', () => {
        test('devrait retourner les données d\'analyses', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.chartData).toBeDefined();
            expect(response.body.data.chartData.oeufs).toBeDefined();
            expect(response.body.data.chartData.adultes).toBeDefined();
            expect(response.body.data.chartData.larves).toBeDefined();
            expect(response.body.data.chartData.adultesParGenre).toBeDefined();
        });

        test('devrait avoir la structure de données correcte', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .expect(200);
            
            const data = response.body.data;
            
            // Vérifier la structure
            expect(data.secteurs).toBeInstanceOf(Array);
            expect(data.periodes).toBeInstanceOf(Array);
            expect(data.totalOeufs).toBeDefined();
            expect(data.totalAdultes).toBeDefined();
            expect(data.totalLarves).toBeDefined();
            
            // Vérifier les données des graphiques
            expect(data.chartData.oeufs).toBeInstanceOf(Object);
            expect(data.chartData.adultes).toBeInstanceOf(Object);
            expect(data.chartData.larves).toBeInstanceOf(Object);
            expect(data.chartData.adultesParGenre).toBeInstanceOf(Object);
        });

        test('devrait avoir des données cohérentes', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .expect(200);
            
            const data = response.body.data;
            
            // Vérifier que les totaux sont cohérents
            expect(data.totalOeufs).toBeGreaterThanOrEqual(0);
            expect(data.totalAdultes).toBeGreaterThanOrEqual(0);
            expect(data.totalLarves).toBeGreaterThanOrEqual(0);
            
            // Vérifier que les secteurs sont présents
            expect(data.secteurs.length).toBeGreaterThan(0);
            expect(data.periodes.length).toBeGreaterThan(0);
        });
    });

    describe('API /api/analyses/oeufs', () => {
        test('devrait retourner les données œufs par secteur', async () => {
            const response = await request(app)
                .get('/api/analyses/oeufs')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.chartData).toBeDefined();
            expect(response.body.data.chartData.oeufsParSecteur).toBeDefined();
            expect(response.body.data.totalOeufs).toBeDefined();
            expect(response.body.data.secteurs).toBeInstanceOf(Array);
        });

        test('devrait avoir des données par secteur', async () => {
            const response = await request(app)
                .get('/api/analyses/oeufs')
                .expect(200);
            
            const data = response.body.data;
            const secteurs = data.secteurs;
            
            // Vérifier que chaque secteur a des données
            secteurs.forEach(secteur => {
                expect(data.chartData.oeufsParSecteur[secteur]).toBeDefined();
                expect(data.chartData.oeufsParSecteur[secteur]).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('API /api/analyses/oeufs-mois', () => {
        test('devrait retourner les données œufs par mois', async () => {
            const response = await request(app)
                .get('/api/analyses/oeufs-mois')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.chartData).toBeDefined();
            expect(response.body.data.chartData.evolutionParMois).toBeDefined();
            expect(response.body.data.totalOeufs).toBeDefined();
            expect(response.body.data.periodes).toBeInstanceOf(Array);
        });

        test('devrait avoir des données par mois', async () => {
            const response = await request(app)
                .get('/api/analyses/oeufs-mois')
                .expect(200);
            
            const data = response.body.data;
            const periodes = data.periodes;
            
            // Vérifier que chaque période a des données
            periodes.forEach(periode => {
                expect(data.chartData.evolutionParMois[periode]).toBeDefined();
                expect(data.chartData.evolutionParMois[periode]).toBeInstanceOf(Object);
            });
        });
    });

    describe('API /api/indices', () => {
        test('devrait retourner les indices entomologiques', async () => {
            const response = await request(app)
                .get('/api/indices')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.periodes).toBeInstanceOf(Array);
            expect(response.body.data.secteurs).toBeInstanceOf(Array);
            expect(response.body.data.data).toBeInstanceOf(Object);
            expect(response.body.data.moyennes).toBeInstanceOf(Object);
        });

        test('devrait calculer les indices correctement', async () => {
            const response = await request(app)
                .get('/api/indices')
                .expect(200);
            
            const data = response.body.data;
            const moyennes = data.moyennes;
            
            // Vérifier que les indices sont calculés
            expect(moyennes.ib).toBeDefined();
            expect(moyennes.im).toBeDefined();
            expect(moyennes.ir).toBeDefined();
            expect(moyennes.ipp).toBeDefined();
            expect(moyennes.icn).toBeDefined();
            expect(moyennes.iap_bg).toBeDefined();
            expect(moyennes.iap_prokopack).toBeDefined();
            
            // Vérifier que les valeurs sont dans les bonnes plages
            expect(moyennes.ib).toBeGreaterThanOrEqual(0);
            expect(moyennes.im).toBeGreaterThanOrEqual(0);
            expect(moyennes.ir).toBeGreaterThanOrEqual(0);
            expect(moyennes.ipp).toBeGreaterThanOrEqual(0);
            expect(moyennes.icn).toBeGreaterThanOrEqual(0);
            expect(moyennes.iap_bg).toBeGreaterThanOrEqual(0);
            expect(moyennes.iap_prokopack).toBeGreaterThanOrEqual(0);
        });

        test('devrait supporter les filtres de date', async () => {
            const response = await request(app)
                .get('/api/indices?start_date=2024-01-01&end_date=2024-12-31')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        test('devrait supporter le filtre de secteur', async () => {
            const response = await request(app)
                .get('/api/indices?sector=Sector 6')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('API /api/sync-status', () => {
        test('devrait retourner le statut de synchronisation', async () => {
            const response = await request(app)
                .get('/api/sync-status')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.counts).toBeDefined();
            expect(response.body.data.counts.household_visits).toBeDefined();
            expect(response.body.data.counts.breeding_sites).toBeDefined();
            expect(response.body.data.counts.eggs_collection).toBeDefined();
            expect(response.body.data.counts.adult_mosquitoes).toBeDefined();
        });

        test('devrait avoir des comptages cohérents', async () => {
            const response = await request(app)
                .get('/api/sync-status')
                .expect(200);
            
            const counts = response.body.data.counts;
            
            // Vérifier que les comptages sont des nombres positifs
            expect(counts.household_visits).toBeGreaterThanOrEqual(0);
            expect(counts.breeding_sites).toBeGreaterThanOrEqual(0);
            expect(counts.eggs_collection).toBeGreaterThanOrEqual(0);
            expect(counts.adult_mosquitoes).toBeGreaterThanOrEqual(0);
        });
    });

    describe('API /api/test-db', () => {
        test('devrait tester la connexion à la base de données', async () => {
            const response = await request(app)
                .get('/api/test-db')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Base de données accessible');
            expect(response.body.time).toBeDefined();
        });
    });

    describe('Gestion des erreurs', () => {
        test('devrait gérer les erreurs 404', async () => {
            const response = await request(app)
                .get('/api/route-inexistante')
                .expect(404);
        });

        test('devrait gérer les erreurs de validation', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({})
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Type de formulaire invalide');
        });
    });

    describe('Performance des APIs', () => {
        test('devrait répondre rapidement à /api/analyses', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/analyses')
                .expect(200);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            expect(responseTime).toBeLessThan(5000); // Moins de 5 secondes
        });

        test('devrait répondre rapidement à /api/indices', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/indices')
                .expect(200);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            expect(responseTime).toBeLessThan(5000); // Moins de 5 secondes
        });
    });
});


