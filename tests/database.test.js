/**
 * Tests unitaires pour la base de données
 * Centre MURAZ - Plateforme Entomologique
 */

const { pool } = require('../config/database');

describe('🗄️ Tests Base de Données', () => {
    
    beforeAll(async () => {
        // Attendre que la connexion soit établie
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        // Fermer la connexion après tous les tests
        await pool.end();
    });

    describe('Connexion à la base de données', () => {
        test('devrait se connecter à PostgreSQL', async () => {
            const client = await pool.connect();
            expect(client).toBeDefined();
            expect(client.release).toBeInstanceOf(Function);
            client.release();
        });

        test('devrait exécuter une requête simple', async () => {
            const result = await pool.query('SELECT NOW() as current_time');
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].current_time).toBeInstanceOf(Date);
        });

        test('devrait gérer les erreurs de requête', async () => {
            await expect(pool.query('SELECT * FROM table_inexistante'))
                .rejects.toThrow();
        });
    });

    describe('Structure des tables', () => {
        test('devrait avoir la table household_visits', async () => {
            const result = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'household_visits'
            `);
            expect(result.rows).toHaveLength(1);
        });

        test('devrait avoir la table eggs_collection', async () => {
            const result = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'eggs_collection'
            `);
            expect(result.rows).toHaveLength(1);
        });

        test('devrait avoir la table breeding_sites', async () => {
            const result = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'breeding_sites'
            `);
            expect(result.rows).toHaveLength(1);
        });

        test('devrait avoir la table adult_mosquitoes', async () => {
            const result = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'adult_mosquitoes'
            `);
            expect(result.rows).toHaveLength(1);
        });

        test('devrait avoir les bonnes colonnes dans household_visits', async () => {
            const result = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'household_visits'
                ORDER BY ordinal_position
            `);
            
            const expectedColumns = [
                'id', 'investigator_name', 'concession_code', 'house_code',
                'visit_start_date', 'visit_end_date', 'sector', 'environment',
                'gps_code', 'household_size', 'number_of_beds', 'head_contact'
            ];
            
            const actualColumns = result.rows.map(row => row.column_name);
            expectedColumns.forEach(column => {
                expect(actualColumns).toContain(column);
            });
        });
    });

    describe('Contraintes et clés étrangères', () => {
        test('devrait avoir des clés étrangères correctes', async () => {
            const result = await pool.query(`
                SELECT 
                    tc.table_name, 
                    tc.constraint_type, 
                    kcu.column_name,
                    ccu.table_name AS foreign_table,
                    ccu.column_name AS foreign_column
                FROM information_schema.table_constraints AS tc
                LEFT JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                LEFT JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name IN ('eggs_collection', 'breeding_sites', 'adult_mosquitoes')
            `);
            
            expect(result.rows.length).toBeGreaterThan(0);
            
            // Vérifier que les FK pointent vers household_visits
            const fkToHouseholdVisits = result.rows.filter(row => 
                row.foreign_table === 'household_visits' && 
                row.foreign_column === 'id'
            );
            expect(fkToHouseholdVisits.length).toBeGreaterThan(0);
        });

        test('devrait avoir des contraintes de validation', async () => {
            const result = await pool.query(`
                SELECT constraint_name, check_clause
                FROM information_schema.check_constraints
                WHERE constraint_name LIKE '%check%'
            `);
            
            expect(result.rows.length).toBeGreaterThan(0);
        });
    });

    describe('Index de performance', () => {
        test('devrait avoir des index sur les colonnes importantes', async () => {
            const result = await pool.query(`
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename IN ('household_visits', 'eggs_collection', 'breeding_sites', 'adult_mosquitoes')
                ORDER BY tablename, indexname
            `);
            
            expect(result.rows.length).toBeGreaterThan(0);
            
            // Vérifier qu'il y a des index sur les colonnes de jointure
            const indexDefs = result.rows.map(row => row.indexdef);
            const hasHouseholdVisitIdIndex = indexDefs.some(def => 
                def.includes('household_visit_id')
            );
            expect(hasHouseholdVisitIdIndex).toBe(true);
        });
    });

    describe('Données de test', () => {
        beforeEach(async () => {
            await global.cleanTestDatabase(pool);
        });

        test('devrait insérer des données de test', async () => {
            const testData = global.createTestData('household_visits', 5);
            
            for (const data of testData) {
                const columns = Object.keys(data).join(', ');
                const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(data);
                
                await pool.query(
                    `INSERT INTO household_visits (${columns}) VALUES (${placeholders})`,
                    values
                );
            }
            
            const result = await pool.query('SELECT COUNT(*) FROM household_visits');
            expect(parseInt(result.rows[0].count)).toBe(5);
        });

        test('devrait insérer des données avec relations', async () => {
            // Insérer une visite
            const visitResult = await pool.query(`
                INSERT INTO household_visits 
                (investigator_name, concession_code, house_code, visit_start_date, sector, environment)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, ['Test Investigator', 'TEST001', 'HOUSE001', new Date(), 'Sector 6', 'urban']);
            
            const visitId = visitResult.rows[0].id;
            
            // Insérer des œufs liés
            await pool.query(`
                INSERT INTO eggs_collection 
                (household_visit_id, nest_number, nest_code, eggs_count)
                VALUES ($1, $2, $3, $4)
            `, [visitId, 1, 'NEST001', 25]);
            
            // Vérifier la relation
            const result = await pool.query(`
                SELECT hv.id, ec.eggs_count
                FROM household_visits hv
                INNER JOIN eggs_collection ec ON hv.id = ec.household_visit_id
                WHERE hv.id = $1
            `, [visitId]);
            
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].eggs_count).toBe(25);
        });
    });

    describe('Performance des requêtes', () => {
        test('devrait exécuter une requête complexe rapidement', async () => {
            const startTime = Date.now();
            
            const result = await pool.query(`
                SELECT 
                    hv.sector,
                    COUNT(ec.id) as eggs_count,
                    COUNT(bs.id) as breeding_sites_count,
                    COUNT(am.id) as adult_mosquitoes_count
                FROM household_visits hv
                LEFT JOIN eggs_collection ec ON hv.id = ec.household_visit_id
                LEFT JOIN breeding_sites bs ON hv.id = bs.household_visit_id
                LEFT JOIN adult_mosquitoes am ON hv.id = am.household_visit_id
                GROUP BY hv.sector
            `);
            
            const endTime = Date.now();
            const executionTime = endTime - startTime;
            
            expect(result.rows).toBeDefined();
            expect(executionTime).toBeLessThan(5000); // Moins de 5 secondes
        });
    });
});


