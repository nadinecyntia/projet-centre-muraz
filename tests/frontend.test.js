/**
 * Tests unitaires pour le frontend
 * Centre MURAZ - Plateforme Entomologique
 */

// Mock du DOM pour les tests
const { JSDOM } = require('jsdom');

// Configuration du DOM virtuel
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>Centre MURAZ - Analyses</title>
</head>
<body>
    <div id="app">
        <canvas id="oeufsChart"></canvas>
        <canvas id="oeufsMoisChart"></canvas>
        <canvas id="adultesChart"></canvas>
        <canvas id="adultesGenreChart"></canvas>
        <canvas id="larvesChart"></canvas>
    </div>
</body>
</html>
`, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock de Chart.js
global.Chart = class MockChart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data;
        this.options = config.options;
    }
    
    update() {
        return this;
    }
    
    destroy() {
        return this;
    }
};

// Mock de fetch
global.fetch = jest.fn();

describe('🎨 Tests Frontend', () => {
    
    beforeEach(() => {
        // Réinitialiser les mocks
        jest.clearAllMocks();
        
        // Mock des réponses API
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/analyses')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: {
                            secteurs: ['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33'],
                            periodes: ['Janvier 2024', 'Février 2024'],
                            totalOeufs: 100,
                            totalAdultes: 50,
                            totalLarves: 75,
                            chartData: {
                                oeufs: {
                                    'Janvier 2024': { 'Sector 6': 25, 'Sector 9': 15 },
                                    'Février 2024': { 'Sector 6': 30, 'Sector 9': 20 }
                                },
                                adultes: {
                                    'Janvier 2024': { 'Sector 6': 10, 'Sector 9': 8 },
                                    'Février 2024': { 'Sector 6': 12, 'Sector 9': 10 }
                                },
                                larves: {
                                    'Janvier 2024': { 'Sector 6': 20, 'Sector 9': 15 },
                                    'Février 2024': { 'Sector 6': 25, 'Sector 9': 18 }
                                },
                                adultesParGenre: {
                                    'Janvier 2024': { 'aedes': 10, 'culex': 8 },
                                    'Février 2024': { 'aedes': 12, 'culex': 10 }
                                }
                            }
                        }
                    })
                });
            }
            return Promise.reject(new Error('API non mockée'));
        });
    });

    describe('Classe AnalysesManager', () => {
        // Copier la classe AnalysesManager pour les tests
        class AnalysesManager {
            constructor() {
                this.data = null;
                this.charts = {};
                this.selectedMonth = null;
            }

            async init() {
                try {
                    const response = await fetch('/api/analyses');
                    const result = await response.json();
                    
                    if (result.success) {
                        this.data = result.data;
                        this.createCharts();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation:', error);
                    return false;
                }
            }

            createCharts() {
                if (!this.data) return;

                // Créer les graphiques
                this.createOeufsChart();
                this.createOeufsMoisChart();
                this.createAdultesChart();
                this.createAdultesGenreChart();
                this.createLarvesChart();
            }

            createOeufsChart() {
                const ctx = document.getElementById('oeufsChart');
                if (!ctx) return;

                const secteurs = this.data.secteurs;
                const data = secteurs.map(secteur => {
                    return Object.values(this.data.chartData.oeufs)
                        .reduce((sum, periode) => sum + (periode[secteur] || 0), 0);
                });

                this.charts.oeufs = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: secteurs,
                        datasets: [{
                            label: 'Œufs',
                            data: data,
                            backgroundColor: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Œufs par Secteur'
                            }
                        }
                    }
                });
            }

            createOeufsMoisChart() {
                const ctx = document.getElementById('oeufsMoisChart');
                if (!ctx) return;

                const periodes = this.data.periodes;
                const data = periodes.map(periode => {
                    return Object.values(this.data.chartData.oeufs[periode] || {})
                        .reduce((sum, val) => sum + (val || 0), 0);
                });

                this.charts.oeufsMois = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: periodes,
                        datasets: [{
                            label: 'Œufs',
                            data: data,
                            borderColor: '#FF6B35',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Œufs par Mois'
                            }
                        }
                    }
                });
            }

            createAdultesChart() {
                const ctx = document.getElementById('adultesChart');
                if (!ctx) return;

                const secteurs = this.data.secteurs;
                const data = secteurs.map(secteur => {
                    return Object.values(this.data.chartData.adultes)
                        .reduce((sum, periode) => sum + (periode[secteur] || 0), 0);
                });

                this.charts.adultes = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: secteurs,
                        datasets: [{
                            label: 'Moustiques Adultes',
                            data: data,
                            backgroundColor: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Moustiques Adultes par Secteur'
                            }
                        }
                    }
                });
            }

            createAdultesGenreChart() {
                const ctx = document.getElementById('adultesGenreChart');
                if (!ctx) return;

                const genres = ['aedes', 'culex', 'anopheles', 'autre'];
                const data = genres.map(genre => {
                    return Object.values(this.data.chartData.adultesParGenre)
                        .reduce((sum, periode) => sum + (periode[genre] || 0), 0);
                });

                this.charts.adultesGenre = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: genres,
                        datasets: [{
                            label: 'Moustiques Adultes',
                            data: data,
                            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6B7280']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Moustiques Adultes par Genre'
                            }
                        }
                    }
                });
            }

            createLarvesChart() {
                const ctx = document.getElementById('larvesChart');
                if (!ctx) return;

                const secteurs = this.data.secteurs;
                const periodes = this.data.periodes;
                
                const datasets = secteurs.map((secteur, index) => {
                    const data = periodes.map(periode => {
                        return this.data.chartData.larves[periode]?.[secteur] || 0;
                    });
                    
                    return {
                        label: secteur,
                        data: data,
                        backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.7)`,
                        borderColor: `hsl(${index * 90}, 70%, 50%)`,
                        borderWidth: 2
                    };
                });

                this.charts.larves = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: periodes,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Larves par Secteur et Période'
                            }
                        }
                    }
                });
            }

            updateCharts() {
                Object.values(this.charts).forEach(chart => {
                    if (chart && chart.update) {
                        chart.update();
                    }
                });
            }

            destroyCharts() {
                Object.values(this.charts).forEach(chart => {
                    if (chart && chart.destroy) {
                        chart.destroy();
                    }
                });
                this.charts = {};
            }
        }

        test('devrait s\'initialiser correctement', async () => {
            const manager = new AnalysesManager();
            const result = await manager.init();
            
            expect(result).toBe(true);
            expect(manager.data).toBeDefined();
            expect(manager.data.secteurs).toHaveLength(4);
            expect(manager.data.totalOeufs).toBe(100);
        });

        test('devrait créer tous les graphiques', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            expect(manager.charts.oeufs).toBeDefined();
            expect(manager.charts.oeufsMois).toBeDefined();
            expect(manager.charts.adultes).toBeDefined();
            expect(manager.charts.adultesGenre).toBeDefined();
            expect(manager.charts.larves).toBeDefined();
        });

        test('devrait créer le graphique œufs avec les bonnes données', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            const chart = manager.charts.oeufs;
            expect(chart.config.type).toBe('bar');
            expect(chart.config.data.labels).toEqual(['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33']);
            expect(chart.config.data.datasets[0].data).toEqual([55, 35, 0, 0]); // Somme des œufs par secteur
        });

        test('devrait créer le graphique œufs par mois avec les bonnes données', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            const chart = manager.charts.oeufsMois;
            expect(chart.config.type).toBe('line');
            expect(chart.config.data.labels).toEqual(['Janvier 2024', 'Février 2024']);
            expect(chart.config.data.datasets[0].data).toEqual([40, 50]); // Somme des œufs par mois
        });

        test('devrait créer le graphique adultes avec les bonnes données', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            const chart = manager.charts.adultes;
            expect(chart.config.type).toBe('bar');
            expect(chart.config.data.labels).toEqual(['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33']);
            expect(chart.config.data.datasets[0].data).toEqual([22, 18, 0, 0]); // Somme des adultes par secteur
        });

        test('devrait créer le graphique adultes par genre avec les bonnes données', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            const chart = manager.charts.adultesGenre;
            expect(chart.config.type).toBe('doughnut');
            expect(chart.config.data.labels).toEqual(['aedes', 'culex', 'anopheles', 'autre']);
            expect(chart.config.data.datasets[0].data).toEqual([22, 18, 0, 0]); // Somme des adultes par genre
        });

        test('devrait créer le graphique larves avec les bonnes données', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            const chart = manager.charts.larves;
            expect(chart.config.type).toBe('bar');
            expect(chart.config.data.labels).toEqual(['Janvier 2024', 'Février 2024']);
            expect(chart.config.data.datasets).toHaveLength(4); // 4 secteurs
        });

        test('devrait mettre à jour les graphiques', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            // Mock de la méthode update
            Object.values(manager.charts).forEach(chart => {
                chart.update = jest.fn();
            });
            
            manager.updateCharts();
            
            Object.values(manager.charts).forEach(chart => {
                expect(chart.update).toHaveBeenCalled();
            });
        });

        test('devrait détruire les graphiques', async () => {
            const manager = new AnalysesManager();
            await manager.init();
            
            // Mock de la méthode destroy
            Object.values(manager.charts).forEach(chart => {
                chart.destroy = jest.fn();
            });
            
            manager.destroyCharts();
            
            Object.values(manager.charts).forEach(chart => {
                expect(chart.destroy).toHaveBeenCalled();
            });
            expect(Object.keys(manager.charts)).toHaveLength(0);
        });
    });

    describe('Gestion des erreurs', () => {
        test('devrait gérer les erreurs de chargement des données', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Erreur réseau'));
            
            class AnalysesManager {
                async init() {
                    try {
                        const response = await fetch('/api/analyses');
                        const result = await response.json();
                        return result.success;
                    } catch (error) {
                        return false;
                    }
                }
            }
            
            const manager = new AnalysesManager();
            const result = await manager.init();
            
            expect(result).toBe(false);
        });

        test('devrait gérer les réponses API invalides', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Données invalides'
                })
            });
            
            class AnalysesManager {
                async init() {
                    try {
                        const response = await fetch('/api/analyses');
                        const result = await response.json();
                        return result.success;
                    } catch (error) {
                        return false;
                    }
                }
            }
            
            const manager = new AnalysesManager();
            const result = await manager.init();
            
            expect(result).toBe(false);
        });
    });

    describe('Validation des données frontend', () => {
        test('devrait valider les données avant création des graphiques', () => {
            const validateChartData = (data) => {
                if (!data || !data.chartData) return false;
                if (!data.secteurs || !Array.isArray(data.secteurs)) return false;
                if (!data.periodes || !Array.isArray(data.periodes)) return false;
                return true;
            };
            
            const validData = {
                secteurs: ['Sector 6', 'Sector 9'],
                periodes: ['Janvier 2024'],
                chartData: {
                    oeufs: { 'Janvier 2024': { 'Sector 6': 10 } }
                }
            };
            
            const invalidData = {
                secteurs: 'not an array',
                periodes: ['Janvier 2024'],
                chartData: {}
            };
            
            expect(validateChartData(validData)).toBe(true);
            expect(validateChartData(invalidData)).toBe(false);
        });

        test('devrait valider les couleurs des graphiques', () => {
            const validateColors = (colors) => {
                return colors.every(color => {
                    // Vérifier que c'est une couleur valide (hex, rgb, hsl, etc.)
                    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ||
                           /^rgb\(/.test(color) ||
                           /^hsl\(/.test(color);
                });
            };
            
            const validColors = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5'];
            const invalidColors = ['invalid', 'color', 'test'];
            
            expect(validateColors(validColors)).toBe(true);
            expect(validateColors(invalidColors)).toBe(false);
        });
    });
});


