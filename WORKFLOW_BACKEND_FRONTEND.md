# 🔄 WORKFLOW BACKEND ↔ FRONTEND
## Logique "Find or Create" pour éviter la redondance

---

## 🎯 PRINCIPE GÉNÉRAL

**L'utilisateur ne change RIEN au frontend** → Les mêmes champs qu'avant
**Le backend normalise intelligemment** → Création automatique des maisons si nécessaire

---

## 🥚 WORKFLOW : Collecte d'ŒUFS

### Frontend (AUCUN CHANGEMENT)
```javascript
// L'utilisateur saisit dans le formulaire :
{
    "eggs_concession_code": "CONC-001",
    "eggs_sector": "Sector 6",
    "eggs_environment": "urban",
    "eggs_gps_code": "12.345678,-1.234567",
    "eggs_visit_start_date": "2025-10-21",
    "nest_number": "NEST-01",
    "nest_code": "N001",
    "pass_order": "1",
    "eggs_count": 50,
    "observations": "Bon état"
}
```

### Backend : Route `/api/collect/eggs` (NOUVELLE LOGIQUE)

```javascript
router.post('/collect/eggs', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const {
            eggs_concession_code,
            eggs_sector,
            eggs_environment,
            eggs_gps_code,
            eggs_visit_start_date,
            nest_number,
            nest_code,
            pass_order,
            eggs_count,
            observations
        } = req.body;
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        let house_id;
        
        // Rechercher si la maison existe déjà
        const houseResult = await client.query(
            `SELECT id FROM houses 
             WHERE concession_code = $1 AND sector = $2`,
            [eggs_concession_code, eggs_sector]
        );
        
        if (houseResult.rows.length > 0) {
            // Maison existe déjà
            house_id = houseResult.rows[0].id;
            console.log(`✅ Maison existante trouvée : ID ${house_id}`);
        } else {
            // Créer la maison automatiquement
            const newHouse = await client.query(
                `INSERT INTO houses (concession_code, sector, environment, gps_coordinates, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING id`,
                [eggs_concession_code, eggs_sector, eggs_environment, eggs_gps_code]
            );
            house_id = newHouse.rows[0].id;
            console.log(`✅ Nouvelle maison créée : ID ${house_id}`);
        }
        
        // ===== ÉTAPE 2 : INSÉRER LA COLLECTE D'ŒUFS =====
        const eggResult = await client.query(
            `INSERT INTO eggs_collections (
                house_id,
                visit_date,
                nest_number,
                nest_code,
                pass_order,
                eggs_count,
                observations,
                status,
                submitted_by,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
            RETURNING id`,
            [
                house_id,
                eggs_visit_start_date,
                nest_number,
                nest_code,
                pass_order,
                eggs_count,
                observations,
                req.session.user.id  // ID de l'utilisateur connecté
            ]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Collecte d\'œufs enregistrée avec succès',
            egg_collection_id: eggResult.rows[0].id,
            house_id: house_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte œufs:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
```

---

## 🦟 WORKFLOW : Collecte de GÎTES LARVAIRES

### Frontend (CHANGEMENT MAJEUR - Interface répétitive)

**Nouvelle interface recommandée :**

```html
<!-- Étape 1 : Informations de la maison -->
<section id="house-info">
    <input name="site_concession_code" placeholder="Code concession">
    <select name="site_sector">...</select>
    <select name="site_environment">...</select>
    <input name="site_gps_code" placeholder="GPS">
    <input name="site_house_code" placeholder="Code maison">
    <input name="site_household_size" type="number">
    <input name="site_sleeping_unit_count" type="number">
    <input name="site_head_contact" placeholder="Contact chef">
    <input name="site_visit_start_date" type="date">
    <input name="site_investigator_name">
</section>

<!-- Étape 2 : Liste des gîtes (répétable) -->
<section id="breeding-sites-list">
    <div class="breeding-site-item" data-site-index="0">
        <select name="site_type">...</select>
        <select name="site_class">...</select>
        <input type="checkbox" name="is_positive">
        <!-- Si positif, afficher ces champs : -->
        <input type="number" name="larvae_count">
        <select name="larvae_genus">...</select>
        <input type="number" name="nymphs_count">
        <select name="nymphs_genus">...</select>
    </div>
    
    <button id="add-site">+ Ajouter un autre gîte</button>
</section>

<button id="submit-all-sites">Envoyer tous les gîtes</button>
```

**Données envoyées au backend :**
```javascript
{
    "house_info": {
        "concession_code": "CONC-001",
        "sector": "Sector 6",
        "environment": "urban",
        "gps_coordinates": "12.345678,-1.234567",
        "house_code": "HOUSE-A",
        "household_size": 5,
        "sleeping_unit_count": 3,
        "head_contact": "Jean Dupont",
        "visit_date": "2025-10-21",
        "investigator_name": "Dr. Martin"
    },
    "sites": [
        {
            "site_number": 1,
            "site_type": "pneu",
            "site_class": "household_waste",
            "is_positive": true,
            "larvae_count": 20,
            "larvae_genus": "aedes",
            "nymphs_count": 5,
            "nymphs_genus": "aedes"
        },
        {
            "site_number": 2,
            "site_type": "bidon",
            "site_class": "abandoned_utensils",
            "is_positive": false
        }
    ]
}
```

### Backend : Route `/api/collect/breeding` (NOUVELLE LOGIQUE)

```javascript
router.post('/collect/breeding', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { house_info, sites } = req.body;
        
        // Validation
        if (!sites || sites.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Au moins un gîte doit être enregistré' 
            });
        }
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        let house_id;
        
        const houseResult = await client.query(
            `SELECT id FROM houses 
             WHERE concession_code = $1 AND sector = $2`,
            [house_info.concession_code, house_info.sector]
        );
        
        if (houseResult.rows.length > 0) {
            house_id = houseResult.rows[0].id;
            
            // ===== ÉTAPE 1B : UPDATE HOUSE DETAILS =====
            // Mettre à jour les détails optionnels (house_code, household_size, etc.)
            await client.query(
                `UPDATE houses SET
                    house_code = COALESCE($1, house_code),
                    household_size = COALESCE($2, household_size),
                    sleeping_unit_count = COALESCE($3, sleeping_unit_count),
                    head_contact = COALESCE($4, head_contact),
                    updated_at = NOW()
                 WHERE id = $5`,
                [
                    house_info.house_code,
                    house_info.household_size,
                    house_info.sleeping_unit_count,
                    house_info.head_contact,
                    house_id
                ]
            );
            console.log(`✅ Maison ${house_id} mise à jour avec les détails`);
        } else {
            // Créer la maison avec tous les détails
            const newHouse = await client.query(
                `INSERT INTO houses (
                    concession_code, sector, environment, gps_coordinates,
                    house_code, household_size, sleeping_unit_count, head_contact,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING id`,
                [
                    house_info.concession_code,
                    house_info.sector,
                    house_info.environment,
                    house_info.gps_coordinates,
                    house_info.house_code,
                    house_info.household_size,
                    house_info.sleeping_unit_count,
                    house_info.head_contact
                ]
            );
            house_id = newHouse.rows[0].id;
            console.log(`✅ Nouvelle maison créée : ID ${house_id}`);
        }
        
        // ===== ÉTAPE 2 : INSÉRER TOUS LES GÎTES =====
        const insertedSites = [];
        
        for (const site of sites) {
            const siteResult = await client.query(
                `INSERT INTO breeding_sites (
                    house_id,
                    visit_date,
                    investigator_name,
                    site_number,
                    site_type,
                    site_class,
                    is_positive,
                    larvae_count,
                    larvae_genus,
                    nymphs_count,
                    nymphs_genus,
                    observations,
                    status,
                    submitted_by,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13, NOW())
                RETURNING id`,
                [
                    house_id,
                    house_info.visit_date,
                    house_info.investigator_name,
                    site.site_number,
                    site.site_type,
                    site.site_class,
                    site.is_positive,
                    site.larvae_count || 0,
                    site.larvae_genus || null,
                    site.nymphs_count || 0,
                    site.nymphs_genus || null,
                    site.observations || null,
                    req.session.user.id
                ]
            );
            
            insertedSites.push(siteResult.rows[0].id);
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: `${sites.length} gîte(s) larvaire(s) enregistré(s) avec succès`,
            house_id: house_id,
            site_ids: insertedSites
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte gîtes:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
```

---

## 🦟 WORKFLOW : Collecte de MOUSTIQUES ADULTES

### Frontend (CHANGEMENT MAJEUR - Interface en 2 étapes)

**Interface recommandée :**

```html
<!-- Étape 1 : Informations de la collecte -->
<section id="collection-info">
    <input name="mosquitoes_concession_code">
    <select name="mosquitoes_sector">...</select>
    <select name="mosquitoes_environment">...</select>
    <input name="mosquitoes_gps_code">
    <input name="mosquitoes_visit_start_date" type="date">
    <input name="mosquitoes_visit_start_time" type="time">
    <input name="mosquitoes_visit_end_time" type="time">
    <select name="collection_method">
        <option value="prokopack">Prokopack</option>
        <option value="bg_trap">BG-Trap</option>
    </select>
    <select name="capture_location">
        <option value="interior">Intérieur</option>
        <option value="exterior">Extérieur</option>
    </select>
    <input name="traps_count" type="number" value="1">
</section>

<!-- Étape 2 : Liste des spécimens (répétable) -->
<section id="specimens-list">
    <div class="specimen-item" data-specimen-index="0">
        <select name="genus">...</select>
        <select name="species">...</select>
        <select name="sex">
            <option value="male">Mâle</option>
            <option value="female">Femelle</option>
        </select>
        <!-- Si femelle, afficher : -->
        <select name="physiological_state">
            <option value="blood_fed">Gorgée de sang</option>
            <option value="gravid">Gravide</option>
            <option value="starved">À jeun</option>
        </select>
        <input type="number" name="count" value="1" placeholder="Nombre">
    </div>
    
    <button id="add-specimen">+ Ajouter un autre groupe</button>
</section>

<button id="submit-collection">Envoyer cette collecte</button>
```

**Données envoyées :**
```javascript
{
    "collection_info": {
        "concession_code": "CONC-001",
        "sector": "Sector 6",
        "environment": "urban",
        "gps_coordinates": "12.345678,-1.234567",
        "visit_date": "2025-10-21",
        "visit_start_time": "08:00",
        "visit_end_time": "09:30",
        "collection_method": "prokopack",
        "capture_location": "interior",
        "traps_count": 2,
        "investigator_name": "Dr. Martin"
    },
    "specimens": [
        {
            "genus": "aedes",
            "species": "aedes_aegypti",
            "sex": "female",
            "physiological_state": "blood_fed",
            "count": 5
        },
        {
            "genus": "aedes",
            "species": "aedes_aegypti",
            "sex": "male",
            "count": 3
        }
    ]
}
```

### Backend : Route `/api/collect/mosquitoes` (NOUVELLE LOGIQUE)

```javascript
router.post('/collect/mosquitoes', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { collection_info, specimens } = req.body;
        
        // ===== ÉTAPE 1 : FIND OR CREATE HOUSE =====
        let house_id;
        
        const houseResult = await client.query(
            `SELECT id FROM houses 
             WHERE concession_code = $1 AND sector = $2`,
            [collection_info.concession_code, collection_info.sector]
        );
        
        if (houseResult.rows.length > 0) {
            house_id = houseResult.rows[0].id;
        } else {
            const newHouse = await client.query(
                `INSERT INTO houses (concession_code, sector, environment, gps_coordinates, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING id`,
                [
                    collection_info.concession_code,
                    collection_info.sector,
                    collection_info.environment,
                    collection_info.gps_coordinates
                ]
            );
            house_id = newHouse.rows[0].id;
        }
        
        // ===== ÉTAPE 2 : INSÉRER LA COLLECTE =====
        const collectionResult = await client.query(
            `INSERT INTO adult_mosquitoes_collections (
                house_id,
                visit_date,
                visit_start_time,
                visit_end_time,
                investigator_name,
                collection_method,
                capture_location,
                traps_count,
                status,
                submitted_by,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW())
            RETURNING id`,
            [
                house_id,
                collection_info.visit_date,
                collection_info.visit_start_time,
                collection_info.visit_end_time,
                collection_info.investigator_name,
                collection_info.collection_method,
                collection_info.capture_location,
                collection_info.traps_count || 1,
                req.session.user.id
            ]
        );
        
        const collection_id = collectionResult.rows[0].id;
        
        // ===== ÉTAPE 3 : INSÉRER TOUS LES SPÉCIMENS =====
        const insertedSpecimens = [];
        
        if (specimens && specimens.length > 0) {
            for (const specimen of specimens) {
                const specimenResult = await client.query(
                    `INSERT INTO mosquito_specimens (
                        collection_id,
                        genus,
                        species,
                        sex,
                        physiological_state,
                        count,
                        observations,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    RETURNING id`,
                    [
                        collection_id,
                        specimen.genus,
                        specimen.species,
                        specimen.sex,
                        specimen.physiological_state || null,
                        specimen.count || 1,
                        specimen.observations || null
                    ]
                );
                
                insertedSpecimens.push(specimenResult.rows[0].id);
            }
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: `Collecte enregistrée avec ${specimens.length} groupe(s) de spécimens`,
            house_id: house_id,
            collection_id: collection_id,
            specimen_ids: insertedSpecimens
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur collecte moustiques:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
```

---

## 📊 RÉCUPÉRER LES TOTAUX CALCULÉS

### Endpoint : GET `/api/breeding/summary/:house_id/:visit_date`

```javascript
router.get('/breeding/summary/:house_id/:visit_date', async (req, res) => {
    try {
        const { house_id, visit_date } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM breeding_sites_summary
             WHERE house_id = $1 AND visit_date = $2`,
            [house_id, visit_date]
        );
        
        if (result.rows.length > 0) {
            res.json({
                success: true,
                summary: result.rows[0]
            });
        } else {
            res.json({
                success: true,
                summary: null,
                message: 'Aucun résumé disponible pour cette maison/date'
            });
        }
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### Endpoint : GET `/api/mosquitoes/summary/:collection_id`

```javascript
router.get('/mosquitoes/summary/:collection_id', async (req, res) => {
    try {
        const { collection_id } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM adult_mosquitoes_summary
             WHERE collection_id = $1`,
            [collection_id]
        );
        
        if (result.rows.length > 0) {
            res.json({
                success: true,
                summary: result.rows[0]
            });
        } else {
            res.json({
                success: true,
                summary: null,
                message: 'Aucun résumé disponible pour cette collecte'
            });
        }
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## ✅ RÉSUMÉ DES AVANTAGES

### Pour `eggs_collections`
- ✅ **Frontend** : AUCUN CHANGEMENT - formulaire identique
- ✅ **Backend** : Normalisation automatique via "Find or Create"
- ✅ **Base de données** : Pas de redondance

### Pour `breeding_sites`
- ✅ **Frontend** : Interface répétitive pour saisir plusieurs gîtes
- ✅ **Backend** : Insertion multiple + calculs automatiques
- ✅ **Résultats** : Vue `breeding_sites_summary` avec tous les totaux calculés
- ❌ **Plus de saisie manuelle** de totaux (total_sites_count, positive_sites_count, etc.)

### Pour `adult_mosquitoes_collections`
- ✅ **Frontend** : Interface en 2 étapes (collecte + spécimens)
- ✅ **Backend** : Insertion de la collecte + spécimens multiples
- ✅ **Résultats** : Vue `adult_mosquitoes_summary` avec tous les totaux calculés
- ❌ **Plus de saisie manuelle** de totaux (male_count, female_count, aedes_count, etc.)

---

## 🚀 PROCHAINE ÉTAPE

Validez cette approche, puis nous pourrons :
1. Créer les scripts SQL pour les nouvelles tables
2. Adapter le fichier `api-collect.js`
3. Créer les nouveaux formulaires frontend (pour breeding et mosquitoes)

