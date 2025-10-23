# 📊 STRUCTURE FINALE COMPLÈTE - 100% FRONTEND

**Date:** 22 octobre 2025  
**Status:** ✅ Complète et déployée

---

## 🏠 TABLE: HOUSES (11 colonnes)

**Utilisée par:** Les 3 formulaires  
**Principe:** 1 ligne = 1 maison physique (réutilisée)

| Colonne | Frontend | Nullable | Commentaire |
|---------|----------|----------|-------------|
| id | - | NON | Clé primaire auto |
| **concession_code** | ✅ Tous | NON | Code unique de la concession |
| **sector** | ✅ Tous | NON | Secteur géographique |
| **environment** | ✅ Tous | NON | urban/rural/semi_urban |
| gps_coordinates | ✅ Tous | Oui | Format: "lat,lng" |
| house_code | ✅ Gîtes | Oui | Code spécifique maison |
| household_size | ✅ Gîtes | Oui | Taille du ménage |
| sleeping_unit_count | ✅ Gîtes | Oui | Unités de couchage |
| head_contact | ✅ Gîtes | Oui | Contact chef de ménage |
| created_at | - | Oui | Auto |
| updated_at | - | Oui | Auto |

---

## 🥚 TABLE: EGGS_COLLECTIONS (16 colonnes)

**Formulaire:** Œufs uniquement  
**Principe:** 1 ligne = 1 visite pour collecter des œufs

| Colonne | Frontend | Nullable | Commentaire |
|---------|----------|----------|-------------|
| id | - | NON | Clé primaire |
| **house_id** | - | NON | → houses(id) |
| **visit_date** | eggs_visit_start_date | NON | Date de visite |
| investigator_name | - | Oui | Nom enquêteur |
| **nest_number** | ✅ | Oui | Numéro du nid |
| **nest_code** | ✅ | Oui | Code du nid |
| **pass_order** | ✅ | Oui | Ordre de passage |
| **eggs_count** | ✅ | NON | Nombre d'œufs |
| observations | ✅ | Oui | Observations |
| status | - | Oui | pending/approved/rejected |
| validated_by | - | Oui | → users(id) |
| validated_at | - | Oui | Date validation |
| validation_notes | - | Oui | Notes validation |
| submitted_by | - | Oui | → users(id) |
| created_at | - | Oui | Auto |
| updated_at | - | Oui | Auto |

---

## 🐛 TABLE: BREEDING_SITES (27 colonnes)

**Formulaire:** Gîtes larvaires  
**Principe:** 1 ligne = 1 visite avec TOUS les comptages agrégés

| Colonne | Frontend | Nullable | Commentaire |
|---------|----------|----------|-------------|
| id | - | NON | Clé primaire |
| **house_id** | - | NON | → houses(id) |
| **visit_date** | ✅ | NON | Date de visite |
| **investigator_name** | ✅ | NON | Nom enquêteur |
| visit_start_time | ✅ | Oui | Heure début |
| visit_end_time | ✅ | Oui | Heure fin |
| **total_sites_count** | ✅ | Oui | Total de gîtes |
| **positive_sites_count** | ✅ | Oui | Gîtes positifs |
| **negative_sites_count** | ✅ | Oui | Gîtes négatifs |
| **aedes_larvae_count** | ✅ | Oui | Larves Aedes |
| **culex_larvae_count** | ✅ | Oui | Larves Culex |
| **anopheles_larvae_count** | ✅ | Oui | Larves Anopheles |
| **other_larvae_count** | ✅ | Oui | Autres larves |
| **larvae_count** | ✅ | Oui | Total larves |
| **aedes_nymphs_count** | ✅ | Oui | Nymphes Aedes |
| **culex_nymphs_count** | ✅ | Oui | Nymphes Culex |
| **anopheles_nymphs_count** | ✅ | Oui | Nymphes Anopheles |
| **other_nymphs_count** | ✅ | Oui | Autres nymphes |
| **nymphs_count** | ✅ | Oui | Total nymphes |
| observations | ✅ | Oui | Observations |
| status | - | Oui | pending/approved/rejected |
| validated_by | - | Oui | → users(id) |
| validated_at | - | Oui | Date validation |
| validation_notes | - | Oui | Notes validation |
| submitted_by | - | Oui | → users(id) |
| created_at | - | Oui | Auto |
| updated_at | - | Oui | Auto |

---

## 🦟 TABLE: ADULT_MOSQUITOES_COLLECTIONS (34 colonnes)

**Formulaire:** Moustiques adultes  
**Principe:** 1 ligne = 1 visite avec TOUS les comptages agrégés

| Colonne | Frontend | Nullable | Commentaire |
|---------|----------|----------|-------------|
| id | - | NON | Clé primaire |
| **house_id** | - | NON | → houses(id) |
| **visit_date** | ✅ | NON | Date de visite |
| **visit_start_time** | ✅ | NON | Heure début |
| **visit_end_time** | ✅ | NON | Heure fin |
| investigator_name | - | Oui | Nom enquêteur |
| **collection_methods** | ✅ | Oui | Méthodes utilisées |
| **capture_locations** | ✅ | Oui | Lieux de capture |
| **prokopack_traps_count** | ✅ | Oui | Nb pièges prokopack |
| **bg_traps_count** | ✅ | Oui | Nb pièges BG |
| **prokopack_mosquitoes_count** | ✅ | Oui | Moustiques prokopack |
| **bg_trap_mosquitoes_count** | ✅ | Oui | Moustiques BG trap |
| **total_mosquitoes_count** | ✅ | Oui | TOTAL général |
| **male_count** | ✅ | Oui | Total mâles |
| **female_count** | ✅ | Oui | Total femelles |
| **aedes_male_count** | ✅ | Oui | Mâles Aedes |
| **culex_male_count** | ✅ | Oui | Mâles Culex |
| **anopheles_male_count** | ✅ | Oui | Mâles Anopheles |
| **other_male_count** | ✅ | Oui | Autres mâles |
| **blood_fed_females_count** | ✅ | Oui | Femelles gorgées |
| **gravid_females_count** | ✅ | Oui | Femelles gravides |
| **starved_females_count** | ✅ | Oui | Femelles à jeun |
| **mosquitoes_aedes_count** | ✅ | Oui | Total Aedes (M+F) |
| **mosquitoes_culex_count** | ✅ | Oui | Total Culex (M+F) |
| **mosquitoes_anopheles_count** | ✅ | Oui | Total Anopheles (M+F) |
| **mosquitoes_other_count** | ✅ | Oui | Autres (M+F) |
| observations | ✅ | Oui | Observations |
| status | - | Oui | pending/approved/rejected |
| validated_by | - | Oui | → users(id) |
| validated_at | - | Oui | Date validation |
| validation_notes | - | Oui | Notes validation |
| submitted_by | - | Oui | → users(id) |
| created_at | - | Oui | Auto |
| updated_at | - | Oui | Auto |

---

## 🔍 VUES SQL (4 vues)

### 1. `eggs_collections_with_house_info`
Joint les collectes d'œufs avec les infos complètes de la maison

### 2. `breeding_sites_with_house_info`
Joint les gîtes avec les infos de la maison

### 3. `mosquitoes_with_house_info`
Joint les moustiques avec les infos de la maison

### 4. `houses_complete_stats`
Statistiques globales par maison (visites, totaux)

---

## ✅ RÉCAPITULATIF

### Correspondance Frontend → Base de données

| Formulaire | Champs frontend | Colonnes BDD | Status |
|------------|-----------------|--------------|--------|
| **Œufs** | 10 champs | 16 colonnes | ✅ 100% |
| **Gîtes** | 26 champs | 27 colonnes | ✅ 100% |
| **Moustiques** | 28 champs | 34 colonnes | ✅ 100% |

### Principe de fonctionnement

```
VISITE 1 (Janvier) → Maison A
└─ Formulaire ŒUFS → Crée maison + enregistre œufs

VISITE 2 (Mars) → Maison A (même maison !)
└─ Formulaire GÎTES → Réutilise maison + enregistre gîtes

VISITE 3 (Mai) → Maison B (nouvelle maison)
└─ Formulaire MOUSTIQUES → Crée maison + enregistre moustiques
```

### Points importants

1. **Table HOUSES** = maisons physiques réutilisées
2. **Champs NULL** = normal (selon le type de collecte)
3. **Tous les comptages** sont dans les tables de collecte
4. **Pas de normalisation excessive** = structure simple et efficace
5. **Correspondance 100%** avec le frontend

---

## 🚀 PROCHAINE ÉTAPE

**Backend à adapter :**
- Routes `/api/collect/eggs`
- Routes `/api/collect/breeding`
- Routes `/api/collect/mosquitoes`

Pour qu'ils acceptent et enregistrent **TOUS** les champs du frontend.


