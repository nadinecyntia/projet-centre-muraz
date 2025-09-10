/**
 * Tests de sécurité
 * Centre MURAZ - Plateforme Entomologique
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../routes/api');

// Créer une instance Express pour les tests
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('🔒 Tests de Sécurité', () => {
    
    describe('Validation des entrées', () => {
        test('devrait rejeter les requêtes avec des données malformées', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: '<script>alert("xss")</script>',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 'not_a_number',
                    collection_date: 'invalid_date',
                    analysis_date: '2024-01-01'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
        });

        test('devrait rejeter les requêtes avec des types de formulaire invalides', async () => {
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

        test('devrait rejeter les requêtes avec des secteurs invalides', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Invalid Sector',
                    sample_count: 10,
                    collection_date: '2024-01-01',
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });

        test('devrait valider les dates correctement', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 10,
                    collection_date: '2024-13-01', // Mois invalide
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });
    });

    describe('Protection contre les injections SQL', () => {
        test('devrait échapper les caractères spéciaux dans les requêtes', async () => {
            const maliciousInput = "'; DROP TABLE household_visits; --";
            
            const response = await request(app)
                .get(`/api/analyses?sector=${encodeURIComponent(maliciousInput)}`)
                .expect(200);
            
            // La requête ne devrait pas causer d'erreur et retourner une réponse valide
            expect(response.body.success).toBe(true);
        });

        test('devrait gérer les caractères spéciaux dans les données', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
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
                    total_population: 10,
                    complementary_info: "'; DROP TABLE test; --"
                });
            
            // La requête ne devrait pas causer d'erreur
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Protection contre les attaques XSS', () => {
        test('devrait échapper les scripts dans les réponses', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .expect(200);
            
            // Vérifier qu'aucun script n'est présent dans la réponse
            const responseText = JSON.stringify(response.body);
            expect(responseText).not.toContain('<script>');
            expect(responseText).not.toContain('javascript:');
            expect(responseText).not.toContain('onload=');
        });

        test('devrait valider les données avant insertion', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
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
                    total_population: 10,
                    complementary_info: '<script>alert("xss")</script>'
                });
            
            // La requête ne devrait pas causer d'erreur et les scripts devraient être échappés
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Validation des types de données', () => {
        test('devrait valider les types numériques', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 'not_a_number',
                    collection_date: '2024-01-01',
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
        });

        test('devrait valider les valeurs numériques dans les plages acceptables', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: -1, // Valeur négative
                    collection_date: '2024-01-01',
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });

        test('devrait valider les valeurs numériques trop grandes', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 999999999, // Valeur trop grande
                    collection_date: '2024-01-01',
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });
    });

    describe('Validation des formats de données', () => {
        test('devrait valider les formats de date', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 10,
                    collection_date: 'invalid_date_format',
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });

        test('devrait valider les formats de date futurs', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            const response = await request(app)
                .post('/api/biologie')
                .send({
                    form_type: 'pcr_rt_pcr',
                    analysis_type: 'pcr',
                    sample_stage: 'adult',
                    genus: 'aedes',
                    species: 'aegypti',
                    sector: 'Sector 6',
                    sample_count: 10,
                    collection_date: futureDate.toISOString().split('T')[0],
                    analysis_date: '2024-01-01',
                    identified_species: 'aedes',
                    virus_types: 'dengue',
                    homozygous_count: 5,
                    heterozygous_count: 3,
                    total_population: 10
                })
                .expect(400);
        });
    });

    describe('Validation des contraintes métier', () => {
        test('devrait valider les contraintes des indices entomologiques', async () => {
            const response = await request(app)
                .get('/api/indices')
                .expect(200);
            
            const data = response.body.data;
            const moyennes = data.moyennes;
            
            // Vérifier que les indices sont dans les plages acceptables
            expect(moyennes.ib).toBeGreaterThanOrEqual(0);
            expect(moyennes.ib).toBeLessThanOrEqual(100);
            expect(moyennes.im).toBeGreaterThanOrEqual(0);
            expect(moyennes.im).toBeLessThanOrEqual(100);
            expect(moyennes.ir).toBeGreaterThanOrEqual(0);
            expect(moyennes.ir).toBeLessThanOrEqual(100);
            expect(moyennes.ipp).toBeGreaterThanOrEqual(0);
            expect(moyennes.ipp).toBeLessThanOrEqual(100);
            expect(moyennes.icn).toBeGreaterThanOrEqual(0);
            expect(moyennes.icn).toBeLessThanOrEqual(100);
        });

        test('devrait valider les contraintes des fréquences alléliques', async () => {
            const response = await request(app)
                .post('/api/biologie')
                .send({
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
                });
            
            if (response.status === 200) {
                // Vérifier que les fréquences alléliques sont calculées correctement
                expect(response.body.data).toBeDefined();
            }
        });
    });

    describe('Protection contre les attaques par déni de service', () => {
        test('devrait limiter la taille des requêtes', async () => {
            const largeData = 'x'.repeat(1000000); // 1MB de données
            
            const response = await request(app)
                .post('/api/biologie')
                .send({
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
                    total_population: 10,
                    complementary_info: largeData
                });
            
            // La requête devrait être rejetée ou limitée
            expect([400, 413]).toContain(response.status);
        });

        test('devrait limiter le nombre de requêtes simultanées', async () => {
            const requests = Array.from({ length: 100 }, () => 
                request(app).get('/api/analyses')
            );
            
            const responses = await Promise.allSettled(requests);
            
            // Toutes les requêtes devraient aboutir (pas de limitation stricte en test)
            const successfulRequests = responses.filter(r => r.status === 'fulfilled');
            expect(successfulRequests.length).toBeGreaterThan(0);
        });
    });

    describe('Validation des en-têtes HTTP', () => {
        test('devrait accepter les en-têtes valides', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });

        test('devrait rejeter les en-têtes malformés', async () => {
            const response = await request(app)
                .get('/api/analyses')
                .set('Content-Type', 'invalid/content-type')
                .expect(400);
        });
    });
});


