// =====================================================
// SYSTÈME DE TRADUCTION ROBUSTE ET ÉLÉGANT
// Version: 2025-01-15-17-50
// =====================================================

console.log('🌍 CHARGEMENT SYSTÈME DE TRADUCTION ROBUSTE');

// Traductions directes
const translations = {
    fr: {
        'page_title': 'Centre MURAZ - Plateforme de Surveillance Arboviroses',
        'main_title': 'Centre MURAZ',
        'subtitle': 'Surveillance Arboviroses',
        'navigation.home': 'Accueil',
        'navigation.login': 'Connexion',
        'navigation.admin': 'Administration',
        'navigation.analyses': 'Analyses',
        'navigation.indices': 'Indices',
        'navigation.users': 'Utilisateurs',
        'navigation.collect': 'Collecte',
        'navigation.logout': 'Déconnexion',
        'presentation_title': 'Projet de surveillance des données d\'arbovirose du Centre Muraz',
        'cards.entomological_surveillance.title': 'Surveillance Entomologique',
        'cards.entomological_surveillance.description': 'Collecte et analyse des données sur les populations de moustiques vecteurs d\'arboviroses dans différents secteurs.',
        'cards.entomological_surveillance.status': 'Actif',
        'cards.molecular_biology.title': 'Biologie Moléculaire',
        'cards.molecular_biology.description': 'Tests PCR et RT-PCR pour l\'identification et la caractérisation des virus d\'arboviroses dans les échantillons collectés.',
        'cards.molecular_biology.status': 'Avancé',
        'cards.biochemistry.title': 'Biochimie',
        'cards.biochemistry.description': 'Analyses biochimiques pour l\'étude des protéines et enzymes impliquées dans les mécanismes de résistance aux insecticides.',
        'cards.biochemistry.status': 'Recherche',
        'cards.bioassays.title': 'Bioessais',
        'cards.bioassays.description': 'Tests de sensibilité aux insecticides pour évaluer la résistance vectorielle.',
        'cards.bioassays.status': 'Tests',
        'navigation.home': 'Accueil',
        'navigation.login': 'Connexion',
        'navigation.logout': 'Déconnexion',
        'navigation.analyses': 'Analyses',
        'navigation.indices': 'Indices',
        'navigation.collect': 'Collecte',
        'navigation.biologie': 'Biologie Moléculaire',
        'navigation.admin': 'Administration',
        'navigation.users': 'Utilisateurs',
        'footer.copyright': '© 2025 Centre MURAZ - Plateforme de Surveillance Arboviroses',
        'images.logo_alt': 'Logo Centre MURAZ',
        'images.carousel_1_alt': 'Centre MURAZ - Surveillance Entomologique',
        'images.carousel_2_alt': 'Centre MURAZ - Recherche et Analyse',
        'images.carousel_3_alt': 'Centre MURAZ - Innovation Technologique',
        // Traductions Analyses
        'analyses.page_title': 'Analyses Entomologiques - Centre MURAZ',
        'analyses.header.title': 'Centre MURAZ',
        'analyses.header.subtitle': 'Surveillance Arboviroses',
        'analyses.images.logo_alt': 'Logo Centre MURAZ',
        'analyses.theme.indicator': 'Thème: Couleurs légères',
        'analyses.sections.eggs': 'Section Œufs',
        'analyses.sections.larvae': 'Section Larves',
        'analyses.sections.mosquitoes': 'Section Moustiques',
        'analyses.sections.research': 'Section Recherche',
        'analyses.controls.year_label': 'Année des données:',
        'analyses.controls.current_year': 'Année en cours',
        'analyses.controls.environment_label': 'Milieu:',
        'analyses.controls.all_environments': 'Tous les milieux',
        'analyses.controls.urban': 'Urbain',
        'analyses.controls.rural': 'Rural',
        'analyses.controls.archived_data': 'Données archivées',
        'analyses.controls.filter_sector': 'Filtrer par secteur:',
        'analyses.controls.all_sectors': 'Tous les secteurs',
        'analyses.controls.filter_month': 'Filtrer par mois:',
        'analyses.controls.all_months': 'Tous les mois',
        'analyses.charts.eggs_sector_month.title': 'Nombre d\'œufs par secteur et par mois',
        'analyses.charts.eggs_sector_month.description': 'Répartition des œufs collectés par secteur et période',
        'analyses.charts.eggs_evolution.title': 'Évolution du nombre total d\'œufs collectés',
        'analyses.charts.eggs_evolution.description': 'Courbe temporelle des œufs collectés dans l\'année',
        'analyses.charts.eggs_month_environment.title': 'Nombre d\'œufs par mois et par milieu',
        'analyses.charts.eggs_month_environment.description': 'Répartition des œufs collectés par mois selon le milieu (urbain/rural)',
        'analyses.charts.larvae_sector.title': 'Nombre total de larves et nymphes par mois par secteur',
        'analyses.charts.larvae_sector.description': 'Répartition des larves et nymphes par secteur et par mois',
        'analyses.charts.sites_sector_month.title': 'Nombre de gîtes par secteur par mois',
        'analyses.charts.sites_sector_month.description': 'Répartition du nombre total de gîtes inspectés par secteur et par mois',
        'analyses.charts.adults_density.title': 'Courbe du nombre total ou densité/an',
        'analyses.charts.adults_density.description': 'Évolution temporelle des moustiques adultes',
        'analyses.charts.adults_sector.title': 'Densité par secteur par mois',
        'analyses.charts.adults_sector.description': 'Histogramme de la densité par secteur et période',
        'analyses.charts.adults_genus.title': 'Densité par genre',
        'analyses.charts.adults_genus.description': 'Répartition des moustiques par genre',
        'analyses.charts.aedes_sector_month.title': 'Nombre d\'Aedes par secteur et par mois',
        'analyses.charts.aedes_sector_month.description': 'Répartition des moustiques Aedes par secteur et par mois',
        'analyses.charts.site_type_environment.title': 'Quantité par classe de gîtes selon le milieu',
        'analyses.charts.site_type_environment.description': 'Répartition des éléments par classe de gîtes en fonction du milieu (urbain/rural)',
        'analyses.charts.aedes_method_location.title': 'Nombre d\'Aedes par méthode de collecte et lieu de capture',
        'analyses.charts.aedes_method_location.description': 'Répartition des Aedes selon la méthode de collecte (prokopack/bg_trap) et le lieu (intérieur/extérieur)',
        'analyses.chart_labels.total_eggs': 'Total œufs collectés',
        'analyses.chart_labels.months': 'Mois',
        'analyses.chart_labels.eggs_count': 'Nombre d\'œufs',
        'analyses.chart_labels.larvae_count': 'Nombre de larves + nymphes',
        'analyses.chart_labels.sites_count': 'Nombre de gîtes',
        'analyses.chart_labels.aedes_count': 'Nombre d\'Aedes',
        'analyses.chart_labels.urban': 'Urbain',
        'analyses.chart_labels.rural': 'Rural',
        'analyses.chart_labels.milieu': 'Milieu',
        'analyses.chart_labels.capture_location': 'Lieu de capture',
        'analyses.tooltips.eggs': 'œufs',
        'analyses.tooltips.larvae': 'larves + nymphes',
        'analyses.tooltips.sites': 'gîtes',
        'analyses.tooltips.aedes': 'Aedes',
        
        // Traductions Indices
        'indices.page_title': 'Indices Entomologiques - Centre MURAZ',
        'indices.images.logo_alt': 'Logo Centre MURAZ',
        'indices.header.title': 'Centre MURAZ',
        'indices.header.subtitle': 'Surveillance Arboviroses',
        'indices.main.title': 'Indices Entomologiques Mensuels',
        'indices.main.description': 'Calcul automatique des indices de surveillance entomologique par mois',
        'indices.controls.year_label': 'Année des données',
        'indices.controls.current_year': 'Année en cours',
        'indices.controls.archive_message': 'Affichage des <strong>données archivées</strong> pour l\'année',
        'indices.controls.month_label': 'Sélectionner le mois pour afficher les indices :',
        'indices.controls.choose_month': 'Choisir un mois...',
        'indices.controls.month_note': 'Les indices sont calculés par mois individuel',
        'indices.breteau_index': 'Indice de Breteau (IB)',
        'indices.breteau_description': 'Mesure la densité des gîtes par rapport aux habitations',
        'indices.house_index': 'Indice de Maison (IM)',
        'indices.house_description': 'Mesure la proportion de maisons infectées',
        'indices.container_index': 'Indice de Récipient (IR)',
        'indices.container_description': 'Mesure la proportion de récipients à risque',
        'indices.pupae_index': 'Indice de Positivité Pondoire',
        'indices.pupae_description': 'Mesure l\'efficacité des pièges',
        'indices.nymphal_index': 'Indice de Colonisation Nymphale',
        'indices.nymphal_description': 'Mesure l\'infestation des maisons',
        'indices.adult_bg_index': 'Indice Adultes par Piège BG',
        'indices.adult_bg_description': 'Mesure la densité des moustiques adultes',
        'indices.adult_prokopack_index': 'Indice Adultes par Piège Prokopack',
        'indices.adult_prokopack_description': 'Mesure la densité des moustiques adultes (Prokopack)',
        'indices.calculated_result': 'Résultat calculé',
        'indices.table.title': 'Données des Indices Mensuels',
        'indices.table.description': 'Vue détaillée de tous les indices entomologiques par mois (moyennes globales)',
        'indices.table.lines_per_page': 'Lignes par page :',
        'indices.table.display_info': 'Affichage de',
        'indices.table.to': 'à',
        'indices.table.of': 'sur',
        'indices.table.entries': 'entrées',
        'indices.table.headers.period': 'Période',
        'indices.table.headers.ib': 'IB (%)',
        'indices.table.headers.im': 'IM (%)',
        'indices.table.headers.ir': 'IR (%)',
        'indices.table.headers.ipp': 'IPP (%)',
        'indices.table.headers.icn': 'ICN (%)',
        'indices.table.headers.iap_bg': 'IAP BG',
        'indices.table.headers.iap_prokopack': 'IAP Prokopack',
        'indices.pagination.first': 'Première',
        'indices.pagination.page': 'Page',
        'indices.pagination.of': 'sur',
        'indices.pagination.last': 'Dernière',
        'indices.months.january': 'Janvier',
        'indices.months.february': 'Février',
        'indices.months.march': 'Mars',
        'indices.months.april': 'Avril',
        'indices.months.may': 'Mai',
        'indices.months.june': 'Juin',
        'indices.months.july': 'Juillet',
        'indices.months.august': 'Août',
        'indices.months.september': 'Septembre',
        'indices.months.october': 'Octobre',
        'indices.months.november': 'Novembre',
        'indices.months.december': 'Décembre',
        'indices.units.mosquitoes': 'moustiques',
        'indices.units.percent': '%',
        
        // Traductions Biologie Moléculaire
        'biologie.page_title': 'Biologie Moléculaire - Centre Muraz',
        'biologie.images.logo_alt': 'Logo Centre MURAZ',
        'biologie.header.title': 'Centre MURAZ',
        'biologie.header.subtitle': 'Surveillance Arboviroses',
        'biologie.dashboard.total_analyses': 'Total Analyses',
        'biologie.dashboard.pcr_analyses': 'Analyses PCR/RT-PCR',
        'biologie.dashboard.bioessai_analyses': 'Analyses Bioessai',
        'biologie.dashboard.blood_meal_analyses': 'Analyses Repas Sanguin',
        'biologie.filters.title': 'Filtres de Recherche',
        'biologie.filters.analysis_type': 'Type d\'Analyse',
        'biologie.filters.all_types': 'Tous les types',
        'biologie.filters.pcr': 'PCR',
        'biologie.filters.rt_pcr': 'RT-PCR',
        'biologie.filters.bioessai': 'Bioessai',
        'biologie.filters.blood_meal': 'Origine Repas Sanguin',
        'biologie.filters.year': 'Année',
        'biologie.filters.current_year': 'Année en cours',
        'biologie.filters.archived_data': 'Données archivées',
        'biologie.filters.sector': 'Secteur',
        'biologie.filters.all_sectors': 'Tous les secteurs',
        'biologie.filters.start_date': 'Date de début',
        'biologie.filters.end_date': 'Date de fin',
        'biologie.filters.apply': 'Appliquer les filtres',
        'biologie.filters.reset': 'Réinitialiser',
        'biologie.table.title': 'Données des Analyses',
        'biologie.table.export_csv': 'Exporter CSV',
        'biologie.table.refresh': 'Actualiser',
        'biologie.tabs.all_analyses': 'Toutes les Analyses',
        'biologie.tabs.pcr': 'PCR/RT-PCR',
        'biologie.tabs.bioessai': 'Bioessai',
        'biologie.tabs.blood_meal': 'Repas Sanguin',
        'biologie.table.headers.type': 'Type',
        'biologie.table.headers.sector': 'Secteur',
        'biologie.table.headers.samples': 'Échantillons',
        'biologie.table.headers.analysis_date': 'Date Analyse',
        'biologie.table.headers.details': 'Détails',
        'biologie.table.headers.actions': 'Actions',
        'biologie.table.action_view': 'Voir',
        'biologie.pagination.displaying': 'Affichage de',
        'biologie.pagination.to': 'à',
        'biologie.pagination.of': 'sur',
        'biologie.pagination.results': 'résultats',
        'biologie.loading.message': 'Chargement des données...',
        'biologie.modal.title': 'Détails de l\'Analyse',
        'biologie.modal.general_info': 'Informations Générales',
        'biologie.modal.analysis_results': 'Résultats de l\'Analyse',
        'biologie.modal.labels.identifier': 'Identifiant',
        'biologie.modal.labels.analysis_type': 'Type d\'analyse',
        'biologie.modal.labels.stage': 'Stade',
        'biologie.modal.labels.genus': 'Genre',
        'biologie.modal.labels.species': 'Espèce',
        'biologie.modal.labels.sector': 'Secteur',
        'biologie.modal.labels.samples': 'Échantillons',
        'biologie.modal.labels.collection_date': 'Date de collecte',
        'biologie.modal.labels.analysis_date': 'Date d\'analyse',
        'biologie.modal.labels.information': 'Informations',
        'biologie.modal.labels.allelic_frequency_a': 'Fréquence allélique A',
        'biologie.modal.labels.allelic_frequency_a_prime': 'Fréquence allélique A\'',
        'biologie.modal.labels.identified_species': 'Espèces identifiées',
        'biologie.modal.labels.virus_types': 'Types de virus',
        'biologie.modal.labels.homozygous': 'Homozygotes',
        'biologie.modal.labels.heterozygous': 'Hétérozygotes',
        'biologie.modal.labels.total_population': 'Population totale',
        'biologie.modal.labels.mortality': 'Mortalité',
        'biologie.modal.labels.survival': 'Survie',
        'biologie.modal.labels.insecticides': 'Insecticides testés',
        'biologie.modal.labels.blood_meal_origins': 'Origines des repas sanguins',
        'biologie.modal.default_values.not_specified': 'Non spécifié',
        'biologie.modal.default_values.none': 'Aucune',
        
        // Traductions Admin
        'admin.page_title': 'Administration - Centre MURAZ',
        'admin.images.logo_alt': 'Logo Centre MURAZ',
        'admin.header.title': 'Centre MURAZ',
        'admin.header.subtitle': 'Surveillance Arboviroses',
        'admin.main.title': 'Tableau de Bord Administrateur',
        'admin.main.subtitle': 'Gestion des données biologiques et entomologiques',
        'admin.collect.title': 'Collecte de Données Entomologiques',
        'admin.collect.description': 'Gérez la collecte et validation des données de terrain',
        'admin.collect.data_collection': 'Collecte de Données',
        'admin.collect.data_description': 'Saisissez les données entomologiques (œufs, gîtes larvaires, moustiques adultes)',
        'admin.collect.start_collection': 'Commencer la Collecte',
        'admin.validation.title': 'Validation des Données',
        'admin.validation.description': 'Validez, approuvez ou rejetez les données soumises par les enquêteurs',
        'admin.validation.validate_data': 'Valider les Données',
        'admin.import.title': 'Import CSV',
        'admin.import.description': 'Importez des données en masse via des fichiers CSV',
        'admin.lab_forms.title': 'Formulaires d\'Analyses Laboratoires',
        'admin.lab_forms.description': 'Sélectionnez le type d\'analyse à effectuer',
        'admin.lab_forms.pcr_title': 'PCR et RT-PCR',
        'admin.lab_forms.pcr_description': 'Analyse des fréquences alléliques et identification virale (Dengue, Chikungunya, Zika, Fièvre jaune)',
        'admin.lab_forms.bioessai_title': 'Bioessai',
        'admin.lab_forms.bioessai_description': 'Tests de résistance aux insecticides et pourcentages de mortalité',
        'admin.lab_forms.blood_meal_title': 'Origine Repas Sanguin',
        'admin.lab_forms.blood_meal_description': 'Identification de l\'origine des repas sanguins (Homme, Poule, Bœuf, Porc, etc.)',
        'admin.buttons.import_data': 'Importer des Données',
        'admin.buttons.fill_form': 'Remplir le Formulaire',
        'admin.buttons.save_pcr': 'Enregistrer l\'Analyse PCR/RT-PCR',
        'admin.buttons.save_blood_meal': 'Enregistrer l\'Analyse Origine Repas Sanguin'
    },
    en: {
        'page_title': 'Centre MURAZ - Arbovirus Surveillance Platform',
        'main_title': 'Centre MURAZ',
        'subtitle': 'Arbovirus Surveillance',
        'navigation.home': 'Home',
        'navigation.login': 'Login',
        'navigation.admin': 'Administration',
        'navigation.analyses': 'Analyses',
        'navigation.indices': 'Indices',
        'navigation.biologie': 'Molecular Biology',
        'navigation.users': 'Users',
        'navigation.collect': 'Collection',
        'navigation.logout': 'Logout',
        'presentation_title': 'Centre Muraz Arbovirus Data Surveillance Project',
        'cards.entomological_surveillance.title': 'Entomological Surveillance',
        'cards.entomological_surveillance.description': 'Collection and analysis of data on arbovirus vector mosquito populations in different sectors.',
        'cards.entomological_surveillance.status': 'Active',
        'cards.molecular_biology.title': 'Molecular Biology',
        'cards.molecular_biology.description': 'PCR and RT-PCR tests for the identification and characterization of arboviruses in collected samples.',
        'cards.molecular_biology.status': 'Advanced',
        'cards.biochemistry.title': 'Biochemistry',
        'cards.biochemistry.description': 'Biochemical analyses for the study of proteins and enzymes involved in insecticide resistance mechanisms.',
        'cards.biochemistry.status': 'Research',
        'cards.bioassays.title': 'Bioassays',
        'cards.bioassays.description': 'Insecticide susceptibility tests to evaluate vector resistance.',
        'cards.bioassays.status': 'Tests',
        'navigation.home': 'Home',
        'navigation.login': 'Login',
        'navigation.logout': 'Logout',
        'navigation.analyses': 'Analyses',
        'navigation.indices': 'Indices',
        'navigation.collect': 'Collection',
        'navigation.biologie': 'Molecular Biology',
        'navigation.admin': 'Administration',
        'navigation.users': 'Users',
        'footer.copyright': '© 2025 Centre MURAZ - Arbovirus Surveillance Platform',
        'images.logo_alt': 'Centre MURAZ Logo',
        'images.carousel_1_alt': 'Centre MURAZ - Entomological Surveillance',
        'images.carousel_2_alt': 'Centre MURAZ - Research and Analysis',
        'images.carousel_3_alt': 'Centre MURAZ - Technological Innovation',
        // Traductions Analyses
        'analyses.page_title': 'Entomological Analyses - Centre MURAZ',
        'analyses.header.title': 'Centre MURAZ',
        'analyses.header.subtitle': 'Arbovirus Surveillance',
        'analyses.images.logo_alt': 'Centre MURAZ Logo',
        'analyses.theme.indicator': 'Theme: Light Colors',
        'analyses.sections.eggs': 'Eggs Section',
        'analyses.sections.larvae': 'Larvae Section',
        'analyses.sections.mosquitoes': 'Mosquitoes Section',
        'analyses.sections.research': 'Research Section',
        'analyses.controls.year_label': 'Data Year:',
        'analyses.controls.current_year': 'Current Year',
        'analyses.controls.environment_label': 'Environment:',
        'analyses.controls.all_environments': 'All Environments',
        'analyses.controls.urban': 'Urban',
        'analyses.controls.rural': 'Rural',
        'analyses.controls.archived_data': 'Archived Data',
        'analyses.controls.filter_sector': 'Filter by Sector:',
        'analyses.controls.all_sectors': 'All Sectors',
        'analyses.controls.filter_month': 'Filter by Month:',
        'analyses.controls.all_months': 'All Months',
        'analyses.charts.eggs_sector_month.title': 'Number of Eggs by Sector and Month',
        'analyses.charts.eggs_sector_month.description': 'Distribution of collected eggs by sector and period',
        'analyses.charts.eggs_evolution.title': 'Evolution of Total Number of Collected Eggs',
        'analyses.charts.eggs_evolution.description': 'Temporal curve of eggs collected during the year',
        'analyses.charts.eggs_month_environment.title': 'Number of Eggs by Month and Environment',
        'analyses.charts.eggs_month_environment.description': 'Distribution of collected eggs by month according to environment (urban/rural)',
        'analyses.charts.larvae_sector.title': 'Total Number of Larvae and Nymphs by Month by Sector',
        'analyses.charts.larvae_sector.description': 'Distribution of larvae and nymphs by sector and month',
        'analyses.charts.sites_sector_month.title': 'Number of Breeding Sites by Sector by Month',
        'analyses.charts.sites_sector_month.description': 'Distribution of total number of inspected breeding sites by sector and month',
        'analyses.charts.adults_density.title': 'Total Number or Density/Year Curve',
        'analyses.charts.adults_density.description': 'Temporal evolution of adult mosquitoes',
        'analyses.charts.adults_sector.title': 'Density by Sector by Month',
        'analyses.charts.adults_sector.description': 'Histogram of density by sector and period',
        'analyses.charts.adults_genus.title': 'Density by Genus',
        'analyses.charts.adults_genus.description': 'Distribution of mosquitoes by genus',
        'analyses.charts.aedes_sector_month.title': 'Number of Aedes by Sector and Month',
        'analyses.charts.aedes_sector_month.description': 'Distribution of Aedes mosquitoes by sector and month',
        'analyses.charts.site_type_environment.title': 'Quantity by Breeding Site Class According to Environment',
        'analyses.charts.site_type_environment.description': 'Distribution of elements by breeding site class according to environment (urban/rural)',
        'analyses.charts.aedes_method_location.title': 'Number of Aedes by Collection Method and Capture Location',
        'analyses.charts.aedes_method_location.description': 'Distribution of Aedes according to collection method (prokopack/bg_trap) and location (interior/exterior)',
        'analyses.chart_labels.total_eggs': 'Total Collected Eggs',
        'analyses.chart_labels.months': 'Months',
        'analyses.chart_labels.eggs_count': 'Number of Eggs',
        'analyses.chart_labels.larvae_count': 'Number of Larvae + Nymphs',
        'analyses.chart_labels.sites_count': 'Number of Sites',
        'analyses.chart_labels.aedes_count': 'Number of Aedes',
        'analyses.chart_labels.urban': 'Urban',
        'analyses.chart_labels.rural': 'Rural',
        'analyses.chart_labels.milieu': 'Environment',
        'analyses.chart_labels.capture_location': 'Capture Location',
        'analyses.tooltips.eggs': 'eggs',
        'analyses.tooltips.larvae': 'larvae + nymphs',
        'analyses.tooltips.sites': 'sites',
        'analyses.tooltips.aedes': 'Aedes',
        
        // Traductions Indices
        'indices.page_title': 'Entomological Indices - Centre MURAZ',
        'indices.images.logo_alt': 'Centre MURAZ Logo',
        'indices.header.title': 'Centre MURAZ',
        'indices.header.subtitle': 'Arbovirus Surveillance',
        'indices.main.title': 'Monthly Entomological Indices',
        'indices.main.description': 'Automatic calculation of entomological surveillance indices by month',
        'indices.controls.year_label': 'Data Year',
        'indices.controls.current_year': 'Current Year',
        'indices.controls.archive_message': 'Displaying <strong>archived data</strong> for year',
        'indices.controls.month_label': 'Select month to display indices:',
        'indices.controls.choose_month': 'Choose a month...',
        'indices.controls.month_note': 'Indices are calculated by individual month',
        'indices.breteau_index': 'Breteau Index (BI)',
        'indices.breteau_description': 'Measures breeding site density relative to houses',
        'indices.house_index': 'House Index (HI)',
        'indices.house_description': 'Measures proportion of infected houses',
        'indices.container_index': 'Container Index (CI)',
        'indices.container_description': 'Measures proportion of risk containers',
        'indices.pupae_index': 'Pupae Positivity Index',
        'indices.pupae_description': 'Measures trap efficiency',
        'indices.nymphal_index': 'Nymphal Colonization Index',
        'indices.nymphal_description': 'Measures house infestation',
        'indices.adult_bg_index': 'Adult Index by BG Trap',
        'indices.adult_bg_description': 'Measures adult mosquito density',
        'indices.adult_prokopack_index': 'Adult Index by Prokopack Trap',
        'indices.adult_prokopack_description': 'Measures adult mosquito density (Prokopack)',
        'indices.calculated_result': 'Calculated result',
        'indices.table.title': 'Monthly Indices Data',
        'indices.table.description': 'Detailed view of all entomological indices by month (global averages)',
        'indices.table.lines_per_page': 'Lines per page:',
        'indices.table.display_info': 'Displaying',
        'indices.table.to': 'to',
        'indices.table.of': 'of',
        'indices.table.entries': 'entries',
        'indices.table.headers.period': 'Period',
        'indices.table.headers.ib': 'BI (%)',
        'indices.table.headers.im': 'HI (%)',
        'indices.table.headers.ir': 'CI (%)',
        'indices.table.headers.ipp': 'PPI (%)',
        'indices.table.headers.icn': 'NCI (%)',
        'indices.table.headers.iap_bg': 'AI BG',
        'indices.table.headers.iap_prokopack': 'AI Prokopack',
        'indices.pagination.first': 'First',
        'indices.pagination.page': 'Page',
        'indices.pagination.of': 'of',
        'indices.pagination.last': 'Last',
        'indices.months.january': 'January',
        'indices.months.february': 'February',
        'indices.months.march': 'March',
        'indices.months.april': 'April',
        'indices.months.may': 'May',
        'indices.months.june': 'June',
        'indices.months.july': 'July',
        'indices.months.august': 'August',
        'indices.months.september': 'September',
        'indices.months.october': 'October',
        'indices.months.november': 'November',
        'indices.months.december': 'December',
        'indices.units.mosquitoes': 'mosquitoes',
        'indices.units.percent': '%',
        
        // Traductions Biologie Moléculaire
        'biologie.page_title': 'Molecular Biology - Centre Muraz',
        'biologie.images.logo_alt': 'Centre MURAZ Logo',
        'biologie.header.title': 'Centre MURAZ',
        'biologie.header.subtitle': 'Arbovirus Surveillance',
        'biologie.dashboard.total_analyses': 'Total Analyses',
        'biologie.dashboard.pcr_analyses': 'PCR/RT-PCR Analyses',
        'biologie.dashboard.bioessai_analyses': 'Bioassay Analyses',
        'biologie.dashboard.blood_meal_analyses': 'Blood Meal Analyses',
        'biologie.filters.title': 'Search Filters',
        'biologie.filters.analysis_type': 'Analysis Type',
        'biologie.filters.all_types': 'All types',
        'biologie.filters.pcr': 'PCR',
        'biologie.filters.rt_pcr': 'RT-PCR',
        'biologie.filters.bioessai': 'Bioassay',
        'biologie.filters.blood_meal': 'Blood Meal Origin',
        'biologie.filters.year': 'Year',
        'biologie.filters.current_year': 'Current Year',
        'biologie.filters.archived_data': 'Archived data',
        'biologie.filters.sector': 'Sector',
        'biologie.filters.all_sectors': 'All sectors',
        'biologie.filters.start_date': 'Start date',
        'biologie.filters.end_date': 'End date',
        'biologie.filters.apply': 'Apply filters',
        'biologie.filters.reset': 'Reset',
        'biologie.table.title': 'Analysis Data',
        'biologie.table.export_csv': 'Export CSV',
        'biologie.table.refresh': 'Refresh',
        'biologie.tabs.all_analyses': 'All Analyses',
        'biologie.tabs.pcr': 'PCR/RT-PCR',
        'biologie.tabs.bioessai': 'Bioassay',
        'biologie.tabs.blood_meal': 'Blood Meal',
        'biologie.table.headers.type': 'Type',
        'biologie.table.headers.sector': 'Sector',
        'biologie.table.headers.samples': 'Samples',
        'biologie.table.headers.analysis_date': 'Analysis Date',
        'biologie.table.headers.details': 'Details',
        'biologie.table.headers.actions': 'Actions',
        'biologie.table.action_view': 'View',
        'biologie.pagination.displaying': 'Displaying',
        'biologie.pagination.to': 'to',
        'biologie.pagination.of': 'of',
        'biologie.pagination.results': 'results',
        'biologie.loading.message': 'Loading data...',
        'biologie.modal.title': 'Analysis Details',
        'biologie.modal.general_info': 'General Information',
        'biologie.modal.analysis_results': 'Analysis Results',
        'biologie.modal.labels.identifier': 'Identifier',
        'biologie.modal.labels.analysis_type': 'Analysis type',
        'biologie.modal.labels.stage': 'Stage',
        'biologie.modal.labels.genus': 'Genus',
        'biologie.modal.labels.species': 'Species',
        'biologie.modal.labels.sector': 'Sector',
        'biologie.modal.labels.samples': 'Samples',
        'biologie.modal.labels.collection_date': 'Collection date',
        'biologie.modal.labels.analysis_date': 'Analysis date',
        'biologie.modal.labels.information': 'Information',
        'biologie.modal.labels.allelic_frequency_a': 'Allelic frequency A',
        'biologie.modal.labels.allelic_frequency_a_prime': 'Allelic frequency A\'',
        'biologie.modal.labels.identified_species': 'Identified species',
        'biologie.modal.labels.virus_types': 'Virus types',
        'biologie.modal.labels.homozygous': 'Homozygous',
        'biologie.modal.labels.heterozygous': 'Heterozygous',
        'biologie.modal.labels.total_population': 'Total population',
        'biologie.modal.labels.mortality': 'Mortality',
        'biologie.modal.labels.survival': 'Survival',
        'biologie.modal.labels.insecticides': 'Tested insecticides',
        'biologie.modal.labels.blood_meal_origins': 'Blood meal origins',
        'biologie.modal.default_values.not_specified': 'Not specified',
        'biologie.modal.default_values.none': 'None',
        
        // Traductions Admin
        'admin.page_title': 'Administration - Centre MURAZ',
        'admin.images.logo_alt': 'Centre MURAZ Logo',
        'admin.header.title': 'Centre MURAZ',
        'admin.header.subtitle': 'Arbovirus Surveillance',
        'admin.main.title': 'Administrator Dashboard',
        'admin.main.subtitle': 'Management of biological and entomological data',
        'admin.collect.title': 'Entomological Data Collection',
        'admin.collect.description': 'Manage field data collection and validation',
        'admin.collect.data_collection': 'Data Collection',
        'admin.collect.data_description': 'Enter entomological data (eggs, larval breeding sites, adult mosquitoes)',
        'admin.collect.start_collection': 'Start Collection',
        'admin.validation.title': 'Data Validation',
        'admin.validation.description': 'Validate, approve or reject data submitted by investigators',
        'admin.validation.validate_data': 'Validate Data',
        'admin.import.title': 'CSV Import',
        'admin.import.description': 'Import data in bulk via CSV files',
        'admin.lab_forms.title': 'Laboratory Analysis Forms',
        'admin.lab_forms.description': 'Select the type of analysis to perform',
        'admin.lab_forms.pcr_title': 'PCR and RT-PCR',
        'admin.lab_forms.pcr_description': 'Analysis of allelic frequencies and viral identification (Dengue, Chikungunya, Zika, Yellow Fever)',
        'admin.lab_forms.bioessai_title': 'Bioassay',
        'admin.lab_forms.bioessai_description': 'Insecticide resistance tests and mortality percentages',
        'admin.lab_forms.blood_meal_title': 'Blood Meal Origin',
        'admin.lab_forms.blood_meal_description': 'Identification of blood meal origins (Human, Chicken, Cattle, Pig, etc.)',
        'admin.buttons.import_data': 'Import Data',
        'admin.buttons.fill_form': 'Fill Form',
        'admin.buttons.save_pcr': 'Save PCR/RT-PCR Analysis',
        'admin.buttons.save_blood_meal': 'Save Blood Meal Origin Analysis'
    }
};

let currentLang = localStorage.getItem('muraz-lang') || 'fr';
let isInitialized = false;

// Fonction de traduction simple
function translate(key) {
    return translations[currentLang][key] || translations.fr[key] || key;
}

// Fonction pour changer la langue
function changeLanguage(lang) {
    console.log(`🔄 Changement de langue: ${currentLang} → ${lang}`);
    currentLang = lang;
    localStorage.setItem('muraz-lang', lang);
    
    applyTranslations();
    updateLanguageSelector();
    
    console.log('✅ Traduction terminée');
}

// Fonction pour appliquer toutes les traductions
function applyTranslations() {
    console.log('🔄 Application des traductions...');
    
    // Traduire tous les éléments avec data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translate(key);
        element.textContent = translation;
    });
    
    // Traduire les attributs alt
    const altElements = document.querySelectorAll('[data-i18n-alt]');
    altElements.forEach(element => {
        const key = element.getAttribute('data-i18n-alt');
        const translation = translate(key);
        element.alt = translation;
    });
    
    // Traduire le titre de la page
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-i18n');
        const translation = translate(key);
        titleElement.textContent = translation;
        document.title = translation;
    }
    
    // Traduire la navigation existante
    translateNavigation();
}

// Fonction pour traduire la navigation existante
function translateNavigation() {
    const navItems = document.querySelectorAll('#main-nav .nav-item span');
    navItems.forEach(item => {
        const text = item.textContent.trim();
        
        if (text === 'Accueil' || text === 'Home') {
            item.textContent = translate('navigation.home');
        } else if (text === 'Connexion' || text === 'Login') {
            item.textContent = translate('navigation.login');
        } else if (text === 'Administration') {
            item.textContent = translate('navigation.admin');
        } else if (text === 'Analyses') {
            item.textContent = translate('navigation.analyses');
        } else if (text === 'Indices') {
            item.textContent = translate('navigation.indices');
        } else if (text === 'Biologie Moléculaire' || text === 'Molecular Biology') {
            item.textContent = translate('navigation.biologie');
        }
    });
}

// Fonction pour créer le sélecteur de langue
function createLanguageSelector() {
    // Supprimer l'ancien sélecteur s'il existe
    const oldSelector = document.getElementById('muraz-language-selector');
    if (oldSelector) {
        oldSelector.remove();
    }
    
    // Créer le nouveau sélecteur
    const selector = document.createElement('div');
    selector.id = 'muraz-language-selector';
    selector.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-left: 12px;';
    
    const frButton = document.createElement('button');
    frButton.textContent = 'FR';
    frButton.style.cssText = `padding: 4px 8px; margin: 0; background: ${currentLang === 'fr' ? '#007bff' : '#f8f9fa'}; color: ${currentLang === 'fr' ? 'white' : 'black'}; border: 1px solid #ccc; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;`;
    frButton.onclick = () => changeLanguage('fr');
    
    const enButton = document.createElement('button');
    enButton.textContent = 'EN';
    enButton.style.cssText = `padding: 4px 8px; margin: 0; background: ${currentLang === 'en' ? '#007bff' : '#f8f9fa'}; color: ${currentLang === 'en' ? 'white' : 'black'}; border: 1px solid #ccc; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;`;
    enButton.onclick = () => changeLanguage('en');
    
    selector.appendChild(frButton);
    selector.appendChild(enButton);
    
    // Ajouter à la navigation - logique adaptative selon la page
    let targetContainer;
    
    // Pour la page analyses, créer un conteneur spécifique à l'extrême droite
    if (window.location.pathname.includes('analyses')) {
        // Chercher le conteneur de droite existant
        const rightContainer = document.querySelector('.flex.items-center.space-x-4');
        if (rightContainer) {
            // Créer un nouveau conteneur pour les boutons de langue à l'extrême droite
            const languageContainer = document.createElement('div');
            languageContainer.className = 'flex items-center space-x-2 ml-auto';
            languageContainer.id = 'language-container';
            
            // Insérer ce conteneur après le conteneur de droite existant
            rightContainer.parentNode.insertBefore(languageContainer, rightContainer.nextSibling);
            targetContainer = languageContainer;
        }
    }
    
    // Fallback vers la navigation principale
    if (!targetContainer) {
        targetContainer = document.querySelector('#main-nav') || document.querySelector('nav');
    }
    
    if (targetContainer) {
        targetContainer.appendChild(selector);
        console.log('✅ Sélecteur ajouté à:', targetContainer.className || targetContainer.id);
    }
}

// Fonction pour mettre à jour le sélecteur
function updateLanguageSelector() {
    const selector = document.getElementById('muraz-language-selector');
    if (selector) {
        const buttons = selector.querySelectorAll('button');
        buttons.forEach(button => {
            const isActive = (button.textContent === 'FR' && currentLang === 'fr') || 
                           (button.textContent === 'EN' && currentLang === 'en');
            button.style.background = isActive ? '#007bff' : '#f8f9fa';
            button.style.color = isActive ? 'white' : 'black';
        });
    }
}

// Observer pour détecter les changements dans la navigation
let navigationObserver = null;

function setupNavigationObserver() {
    const nav = document.querySelector('#main-nav');
    if (!nav) return;
    
    // Créer l'observer
    navigationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Vérifier si des éléments de navigation ont été ajoutés
                const hasNavItems = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === Node.ELEMENT_NODE && 
                    (node.classList.contains('nav-item') || node.querySelector('.nav-item'))
                );
                
                if (hasNavItems) {
                    console.log('🧭 Navigation mise à jour détectée');
                    setTimeout(() => {
                        translateNavigation();
                        if (!document.getElementById('muraz-language-selector')) {
                            createLanguageSelector();
                        }
                    }, 50);
                }
            }
        });
    });
    
    // Observer les changements dans la navigation
    navigationObserver.observe(nav, {
        childList: true,
        subtree: true
    });
    
    console.log('👁️ Observer de navigation configuré');
}

// Fonction d'initialisation
function initializeTranslation() {
    if (isInitialized) return;
    
    console.log('🚀 Initialisation du système de traduction...');
    
    // Appliquer les traductions immédiatement
    applyTranslations();
    
    // Créer le sélecteur de langue
    createLanguageSelector();
    
    // Configurer l'observer de navigation
    setupNavigationObserver();
    
    isInitialized = true;
    console.log('✅ Système de traduction initialisé');
}

// Fonction de test globale
window.testRobustTranslation = function() {
    console.log('🧪 TEST SYSTÈME ROBUSTE');
    console.log('Langue actuelle:', currentLang);
    console.log('Initialisé:', isInitialized);
    console.log('Observer actif:', navigationObserver ? 'Oui' : 'Non');
    
    const elements = document.querySelectorAll('[data-i18n]');
    console.log('Éléments avec data-i18n:', elements.length);
    
    const navItems = document.querySelectorAll('#main-nav .nav-item span');
    console.log('Éléments de navigation:', navItems.length);
    
    const selector = document.getElementById('muraz-language-selector');
    console.log('Sélecteur de langue:', selector ? 'Présent' : 'Absent');
};

// Initialisation immédiate
initializeTranslation();

// Exposer l'interface pour app-modular.js
window.murazI18n = {
    isInitialized: () => isInitialized,
    t: (key, fallback) => translate(key, fallback)
};

console.log('🌍 SYSTÈME ROBUSTE CHARGÉ');
