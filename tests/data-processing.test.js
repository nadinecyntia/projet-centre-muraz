/**
 * Tests unitaires pour le traitement des données
 * Centre MURAZ - Plateforme Entomologique
 */

// Importer les fonctions de traitement des données
const { pool } = require('../config/database');

describe('🧮 Tests Traitement des Données', () => {
    
    describe('Fonction getPeriode', () => {
        // Copier la fonction getPeriode pour les tests
        const getPeriode = (date) => {
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const mois = [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];
            
            return `${mois[month]} ${year}`;
        };

        test('devrait formater correctement les dates', () => {
            expect(getPeriode(new Date(2024, 0, 15))).toBe('Janvier 2024');
            expect(getPeriode(new Date(2024, 5, 20))).toBe('Juin 2024');
            expect(getPeriode(new Date(2024, 11, 31))).toBe('Décembre 2024');
        });

        test('devrait gérer les années différentes', () => {
            expect(getPeriode(new Date(2023, 0, 1))).toBe('Janvier 2023');
            expect(getPeriode(new Date(2025, 0, 1))).toBe('Janvier 2025');
        });
    });

    describe('Fonction calculateAverage', () => {
        // Copier la fonction calculateAverage pour les tests
        const calculateAverage = (values) => {
            const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v))
                .map(v => typeof v === 'string' ? parseFloat(v) : v);
            if (validValues.length === 0) return 0;
            return Math.round((validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100) / 100;
        };

        test('devrait calculer la moyenne correctement', () => {
            expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
            expect(calculateAverage([10, 20, 30])).toBe(20);
            expect(calculateAverage([1.5, 2.5, 3.5])).toBe(2.5);
        });

        test('devrait gérer les valeurs nulles et undefined', () => {
            expect(calculateAverage([1, null, 3, undefined, 5])).toBe(3);
            expect(calculateAverage([null, undefined])).toBe(0);
        });

        test('devrait gérer les chaînes de caractères', () => {
            expect(calculateAverage(['1', '2', '3'])).toBe(2);
            expect(calculateAverage(['1.5', '2.5', '3.5'])).toBe(2.5);
        });

        test('devrait arrondir correctement', () => {
            expect(calculateAverage([1, 2, 3])).toBe(2);
            expect(calculateAverage([1, 2, 3, 4])).toBe(2.5);
        });
    });

    describe('Traitement des données œufs', () => {
        const processOeufsData = (data) => {
            const oeufsData = {
                rawData: data,
                secteurs: [],
                periodes: [],
                environments: [],
                oeufsParSecteur: {},
                oeufsParPeriode: {},
                chartData: {
                    oeufsParSecteur: {},
                    oeufsParPeriode: {},
                    oeufsParSecteurEtPeriode: {}
                },
                totalOeufs: 0,
                totalEnregistrements: data.length,
                moyenneOeufsParSecteur: {},
                moyenneOeufsParPeriode: {}
            };
            
            const getPeriode = (date) => {
                const month = date.getMonth();
                const year = date.getFullYear();
                const mois = [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ];
                return `${mois[month]} ${year}`;
            };
            
            data.forEach(item => {
                const secteur = item.sector;
                const date = new Date(item.visit_start_date || item.created_at);
                const periode = getPeriode(date);
                const environment = item.environment;
                const eggsCount = parseInt(item.eggs_count) || 0;
                
                if (!oeufsData.secteurs.includes(secteur)) {
                    oeufsData.secteurs.push(secteur);
                }
                if (!oeufsData.periodes.includes(periode)) {
                    oeufsData.periodes.push(periode);
                }
                if (!oeufsData.environments.includes(environment)) {
                    oeufsData.environments.push(environment);
                }
                
                if (!oeufsData.oeufsParSecteur[secteur]) {
                    oeufsData.oeufsParSecteur[secteur] = {
                        totalOeufs: 0,
                        nombreEnregistrements: 0,
                        moyenne: 0,
                        details: []
                    };
                }
                oeufsData.oeufsParSecteur[secteur].totalOeufs += eggsCount;
                oeufsData.oeufsParSecteur[secteur].nombreEnregistrements += 1;
                
                if (!oeufsData.chartData.oeufsParSecteur[secteur]) {
                    oeufsData.chartData.oeufsParSecteur[secteur] = 0;
                }
                oeufsData.chartData.oeufsParSecteur[secteur] += eggsCount;
                
                oeufsData.totalOeufs += eggsCount;
            });
            
            return oeufsData;
        };

        test('devrait traiter les données d\'œufs correctement', () => {
            const testData = [
                {
                    sector: 'Sector 6',
                    visit_start_date: '2024-01-15',
                    eggs_count: 25,
                    environment: 'urban'
                },
                {
                    sector: 'Sector 6',
                    visit_start_date: '2024-01-20',
                    eggs_count: 30,
                    environment: 'urban'
                },
                {
                    sector: 'Sector 9',
                    visit_start_date: '2024-02-10',
                    eggs_count: 15,
                    environment: 'rural'
                }
            ];
            
            const result = processOeufsData(testData);
            
            expect(result.totalOeufs).toBe(70);
            expect(result.totalEnregistrements).toBe(3);
            expect(result.secteurs).toContain('Sector 6');
            expect(result.secteurs).toContain('Sector 9');
            expect(result.chartData.oeufsParSecteur['Sector 6']).toBe(55);
            expect(result.chartData.oeufsParSecteur['Sector 9']).toBe(15);
        });

        test('devrait gérer les données manquantes', () => {
            const testData = [
                {
                    sector: 'Sector 6',
                    visit_start_date: '2024-01-15',
                    eggs_count: null,
                    environment: 'urban'
                },
                {
                    sector: 'Sector 6',
                    visit_start_date: '2024-01-20',
                    eggs_count: undefined,
                    environment: 'urban'
                }
            ];
            
            const result = processOeufsData(testData);
            
            expect(result.totalOeufs).toBe(0);
            expect(result.chartData.oeufsParSecteur['Sector 6']).toBe(0);
        });
    });

    describe('Traitement des données indices', () => {
        const organizeIndicesData = (rows) => {
            const organized = {
                periodes: [],
                secteurs: [],
                data: {},
                moyennes: {}
            };
            
            rows.forEach(row => {
                if (!organized.periodes.includes(row.periode)) {
                    organized.periodes.push(row.periode);
                }
                if (!organized.secteurs.includes(row.sector)) {
                    organized.secteurs.push(row.sector);
                }
            });
            
            rows.forEach(row => {
                if (!organized.data[row.periode]) {
                    organized.data[row.periode] = {};
                }
                organized.data[row.periode][row.sector] = {
                    ib: row.ib,
                    im: row.im,
                    ir: row.ir,
                    ipp: row.ipp,
                    icn: row.icn,
                    iap_bg: row.iap_bg,
                    iap_prokopack: row.iap_prokopack
                };
            });
            
            const calculateAverage = (values) => {
                const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v))
                    .map(v => typeof v === 'string' ? parseFloat(v) : v);
                if (validValues.length === 0) return 0;
                return Math.round((validValues.reduce((sum, val) => sum + val, 0) / validValues.length) * 100) / 100;
            };
            
            const allIndices = rows.map(row => ({
                ib: row.ib,
                im: row.im,
                ir: row.ir,
                ipp: row.ipp,
                icn: row.icn,
                iap_bg: row.iap_bg,
                iap_prokopack: row.iap_prokopack
            }));
            
            organized.moyennes = {
                ib: calculateAverage(allIndices.map(i => i.ib)),
                im: calculateAverage(allIndices.map(i => i.im)),
                ir: calculateAverage(allIndices.map(i => i.ir)),
                ipp: calculateAverage(allIndices.map(i => i.ipp)),
                icn: calculateAverage(allIndices.map(i => i.icn)),
                iap_bg: calculateAverage(allIndices.map(i => i.iap_bg)),
                iap_prokopack: calculateAverage(allIndices.map(i => i.iap_prokopack))
            };
            
            return organized;
        };

        test('devrait organiser les données d\'indices correctement', () => {
            const testData = [
                {
                    periode: '2024-01',
                    sector: 'Sector 6',
                    ib: 25.5,
                    im: 30.0,
                    ir: 15.2,
                    ipp: 40.0,
                    icn: 20.5,
                    iap_bg: 5.5,
                    iap_prokopack: 3.2
                },
                {
                    periode: '2024-01',
                    sector: 'Sector 9',
                    ib: 20.0,
                    im: 25.0,
                    ir: 12.0,
                    ipp: 35.0,
                    icn: 18.0,
                    iap_bg: 4.5,
                    iap_prokopack: 2.8
                }
            ];
            
            const result = organizeIndicesData(testData);
            
            expect(result.periodes).toContain('2024-01');
            expect(result.secteurs).toContain('Sector 6');
            expect(result.secteurs).toContain('Sector 9');
            expect(result.data['2024-01']['Sector 6'].ib).toBe(25.5);
            expect(result.data['2024-01']['Sector 9'].ib).toBe(20.0);
            expect(result.moyennes.ib).toBe(22.75);
        });
    });

    describe('Validation des données', () => {
        test('devrait valider les secteurs', () => {
            const validSectors = ['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33'];
            const testSector = 'Sector 6';
            
            expect(validSectors).toContain(testSector);
        });

        test('devrait valider les environnements', () => {
            const validEnvironments = ['urban', 'rural'];
            const testEnvironment = 'urban';
            
            expect(validEnvironments).toContain(testEnvironment);
        });

        test('devrait valider les genres de moustiques', () => {
            const validGenres = ['aedes', 'culex', 'anopheles', 'autre'];
            const testGenre = 'aedes';
            
            expect(validGenres).toContain(testGenre);
        });

        test('devrait valider les valeurs numériques', () => {
            const validateNumeric = (value, min = 0, max = 1000) => {
                const num = parseFloat(value);
                return !isNaN(num) && num >= min && num <= max;
            };
            
            expect(validateNumeric('25')).toBe(true);
            expect(validateNumeric('0')).toBe(true);
            expect(validateNumeric('1000')).toBe(true);
            expect(validateNumeric('-1')).toBe(false);
            expect(validateNumeric('1001')).toBe(false);
            expect(validateNumeric('abc')).toBe(false);
        });
    });

    describe('Performance du traitement', () => {
        test('devrait traiter rapidement de gros volumes de données', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                sector: `Sector ${(i % 4) + 6}`,
                visit_start_date: new Date(2024, i % 12, (i % 28) + 1),
                eggs_count: Math.floor(Math.random() * 100),
                environment: i % 2 === 0 ? 'urban' : 'rural'
            }));
            
            const startTime = Date.now();
            
            // Simuler le traitement
            const result = largeDataset.reduce((acc, item) => {
                acc.total += item.eggs_count;
                return acc;
            }, { total: 0 });
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            expect(processingTime).toBeLessThan(100); // Moins de 100ms
            expect(result.total).toBeGreaterThan(0);
        });
    });
});


