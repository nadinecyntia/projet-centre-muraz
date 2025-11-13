/**
 * =============================================================================
 * Import Page Manager - Page dédiée à l'import de données
 * =============================================================================
 */

class ImportPageManager {
    constructor() {
        this.currentFile = null;
        this.currentType = null;
        this.cachedPreviewData = null;
        this.currentStep = 1;
        this.init();
    }

    init() {
        console.log('📊 ImportPageManager: Initialisation...');
        // Pas de vérification d'auth - l'utilisateur vient de /admin.html qui est déjà protégé
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Type de données
        const dataTypeSelect = document.getElementById('dataType');
        if (dataTypeSelect) {
            dataTypeSelect.addEventListener('change', () => this.onTypeChange());
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Drop zone
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const fileInput = document.getElementById('fileInput');
                    fileInput.files = files;
                    this.handleFileSelect({ target: fileInput });
                }
            });
        }

        // Boutons
        document.getElementById('downloadTemplateBtn')?.addEventListener('click', () => this.downloadTemplate());
        document.getElementById('previewBtn')?.addEventListener('click', () => this.previewFile());
        document.getElementById('backToConfigBtn')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('executeImportBtn')?.addEventListener('click', () => this.executeImport());
        document.getElementById('newImportBtn')?.addEventListener('click', () => this.reset());

        console.log('✅ Event listeners attachés');
    }

    onTypeChange() {
        const dataType = document.getElementById('dataType').value;
        this.currentType = dataType;
        this.updateUI();
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        console.log('📁 Fichier sélectionné:', file.name);

        // Vérifier le type
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const validExtensions = ['.csv', '.xls', '.xlsx'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            alert('❌ Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.');
            e.target.value = '';
            return;
        }

        // Vérifier la taille (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            alert('❌ Fichier trop volumineux. Taille maximale : 10 MB.');
            e.target.value = '';
            return;
        }

        this.currentFile = file;
        this.showFileSelected(file);
        this.updateUI();
    }

    showFileSelected(file) {
        const fileSize = (file.size / 1024).toFixed(2);
        const fileIcon = file.name.endsWith('.csv') ? 'fa-file-csv' : 'fa-file-excel';
        
        const html = `
            <div class="file-selected-badge">
                <i class="fas ${fileIcon}"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize} KB</div>
                </div>
                <button onclick="importManager.removeFile()" class="btn-outline" style="padding: 0.5rem 1rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.getElementById('fileSelected').innerHTML = html;
        document.getElementById('fileSelected').style.display = 'block';
        
        // Cacher la drop zone
        document.getElementById('dropZone').style.display = 'none';
    }

    removeFile() {
        this.currentFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('fileSelected').style.display = 'none';
        document.getElementById('dropZone').style.display = 'flex';
        this.updateUI();
    }

    updateUI() {
        const previewBtn = document.getElementById('previewBtn');
        const canPreview = this.currentFile && this.currentType;
        
        console.log('🔍 UpdateUI - Type:', this.currentType, '| File:', this.currentFile ? this.currentFile.name : 'null', '| Can Preview:', canPreview);
        
        if (previewBtn) {
            previewBtn.disabled = !canPreview;
            if (canPreview) {
                console.log('✅ Bouton Prévisualiser ACTIVÉ');
            } else {
                console.log('❌ Bouton Prévisualiser DÉSACTIVÉ');
            }
        } else {
            console.error('❌ Bouton previewBtn non trouvé !');
        }
    }

    async downloadTemplate() {
        if (!this.currentType) {
            alert('⚠️ Veuillez d\'abord sélectionner un type de données');
            return;
        }

        try {
            const response = await fetch(`/api/import/template/${this.currentType}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `template_${this.currentType}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                console.log('✅ Template téléchargé');
            } else {
                alert('❌ Erreur lors du téléchargement du template');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur lors du téléchargement du template');
        }
    }

    async previewFile() {
        if (!this.currentFile || !this.currentType) {
            alert('⚠️ Veuillez sélectionner un fichier et un type de données');
            return;
        }

        // Afficher le loading
        this.showLoading('preview');

        try {
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('type', this.currentType);

            console.log('📤 Envoi de la requête de prévisualisation...');
            console.log('   Type:', this.currentType);
            console.log('   Fichier:', this.currentFile.name);

            const response = await fetch('/api/import/preview', {
                method: 'POST',
                body: formData
            });

            console.log('📥 Réponse reçue:', response.status);

            const result = await response.json();

            if (result.success) {
                console.log('✅ Prévisualisation réussie');
                this.cachedPreviewData = result.data;
                this.displayPreview(result.data);
                this.goToStep(2);
            } else {
                console.error('❌ Erreur API:', result.message);
                alert('❌ Erreur: ' + result.message);
            }
        } catch (error) {
            console.error('❌ Erreur preview:', error);
            alert('❌ Erreur lors de la prévisualisation: ' + error.message);
        } finally {
            this.hideLoading('preview');
        }
    }

    displayPreview(data) {
        // Afficher les statistiques
        const statsHtml = `
            <div class="stat-card">
                <div class="icon text-blue-600">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="value text-blue-600">${data.totalRows}</div>
                <div class="label">Lignes Totales</div>
            </div>
            <div class="stat-card">
                <div class="icon ${data.isValid ? 'text-green-600' : 'text-yellow-600'}">
                    <i class="fas ${data.isValid ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                </div>
                <div class="value ${data.isValid ? 'text-green-600' : 'text-yellow-600'}">
                    ${data.isValid ? 'Valide' : data.validationErrors.length}
                </div>
                <div class="label">${data.isValid ? 'Toutes les données' : 'Erreurs Détectées'}</div>
            </div>
            <div class="stat-card">
                <div class="icon text-purple-600">
                    <i class="fas fa-columns"></i>
                </div>
                <div class="value text-purple-600">${data.previewRows.length > 0 ? Object.keys(data.previewRows[0]).length : 0}</div>
                <div class="label">Colonnes</div>
            </div>
            <div class="stat-card">
                <div class="icon text-indigo-600">
                    <i class="fas fa-table"></i>
                </div>
                <div class="value text-indigo-600">${data.sheetName || 'Sheet1'}</div>
                <div class="label">Feuille Excel</div>
            </div>
        `;
        
        document.getElementById('previewStats').innerHTML = statsHtml;

        // Afficher les alertes de validation
        let alertsHtml = '';
        
        if (data.isValid) {
            alertsHtml = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle text-2xl"></i>
                    <div>
                        <div class="font-bold">✅ Validation Réussie</div>
                        <div>Toutes les données sont conformes et prêtes à être importées</div>
                    </div>
                </div>
            `;
        } else {
            alertsHtml = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                    <div>
                        <div class="font-bold">⚠️ Erreurs de Validation Détectées</div>
                        <div>${data.validationErrors.length} erreur(s) trouvée(s). Les lignes avec erreurs seront ignorées lors de l'import.</div>
                    </div>
                </div>
                <div class="error-list">
                    ${data.validationErrors.slice(0, 50).map(err => `
                        <div class="error-item">
                            <i class="fas fa-times-circle mr-2"></i>${err}
                        </div>
                    `).join('')}
                    ${data.validationErrors.length > 50 ? `
                        <div class="error-item font-bold">
                            ... et ${data.validationErrors.length - 50} autres erreurs
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        document.getElementById('validationAlerts').innerHTML = alertsHtml;

        // Afficher le tableau
        if (data.previewRows.length > 0) {
            const columns = Object.keys(data.previewRows[0]);
            
            let tableHtml = '<table class="preview-table">';
            tableHtml += '<thead><tr>';
            columns.forEach(col => {
                tableHtml += `<th>${col}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            
            data.previewRows.forEach(row => {
                tableHtml += '<tr>';
                columns.forEach(col => {
                    const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
                    tableHtml += `<td>${value}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</tbody></table>';
            
            if (data.totalRows > 10) {
                tableHtml += `
                    <div class="alert alert-info mt-4">
                        <i class="fas fa-info-circle text-xl"></i>
                        <div>Affichage des 10 premières lignes sur ${data.totalRows} total</div>
                    </div>
                `;
            }
            
            document.getElementById('previewContainer').innerHTML = tableHtml;
        }

        // Activer/désactiver le bouton d'import
        const executeBtn = document.getElementById('executeImportBtn');
        if (executeBtn) {
            // Permettre l'import même s'il y a des erreurs (les lignes avec erreurs seront ignorées)
            executeBtn.disabled = false;
        }
    }

    async executeImport() {
        if (!this.currentFile || !this.currentType) {
            alert('⚠️ Erreur de configuration');
            return;
        }

        if (!confirm('🚀 Voulez-vous vraiment importer ces données ? Cette opération peut prendre quelques minutes.')) {
            return;
        }

        this.goToStep(3);

        try {
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('type', this.currentType);

            const response = await fetch('/api/import/execute', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            this.displayResults(result);
            this.goToStep(4);

        } catch (error) {
            console.error('Erreur import:', error);
            this.displayResults({
                success: false,
                message: 'Erreur lors de l\'import: ' + error.message
            });
            this.goToStep(4);
        }
    }

    displayResults(result) {
        let html = '';

        if (result.success) {
            html = `
                <div class="alert alert-success mb-6">
                    <i class="fas fa-check-circle text-3xl"></i>
                    <div>
                        <div class="text-xl font-bold">🎉 Import Réussi !</div>
                        <div>Les données ont été importées avec succès</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="stat-card">
                        <div class="icon text-green-600">
                            <i class="fas fa-check-double"></i>
                        </div>
                        <div class="value text-green-600">${result.data?.inserted || 0}</div>
                        <div class="label">Lignes Importées</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon text-yellow-600">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="value text-yellow-600">${result.data?.skipped || 0}</div>
                        <div class="label">Lignes Ignorées</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon text-red-600">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="value text-red-600">${result.data?.errors?.length || 0}</div>
                        <div class="label">Erreurs</div>
                    </div>
                </div>

                ${result.data?.errors && result.data.errors.length > 0 ? `
                    <div class="alert alert-warning">
                        <i class="fas fa-info-circle text-xl"></i>
                        <div>
                            <div class="font-bold">Détails des Erreurs</div>
                            <div>Les lignes suivantes n'ont pas pu être importées :</div>
                        </div>
                    </div>
                    <div class="error-list">
                        ${result.data.errors.slice(0, 50).map(err => `
                            <div class="error-item">${err}</div>
                        `).join('')}
                        ${result.data.errors.length > 50 ? `
                            <div class="error-item font-bold">
                                ... et ${result.data.errors.length - 50} autres erreurs
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="alert alert-info mt-6">
                    <i class="fas fa-info-circle text-xl"></i>
                    <div>
                        <div class="font-bold">📋 Prochaines Étapes</div>
                        <div>Les données importées ont le statut "en attente" et nécessitent une validation manuelle dans l'interface d'administration.</div>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="alert alert-error">
                    <i class="fas fa-times-circle text-3xl"></i>
                    <div>
                        <div class="text-xl font-bold">❌ Erreur d'Import</div>
                        <div>${result.message || 'Une erreur est survenue'}</div>
                    </div>
                </div>
            `;
        }

        document.getElementById('resultsContainer').innerHTML = html;
    }

    goToStep(step) {
        this.currentStep = step;

        // Mettre à jour les indicateurs
        document.querySelectorAll('.step').forEach((el, index) => {
            el.classList.remove('active', 'completed');
            
            if (index + 1 < step) {
                el.classList.add('completed');
            } else if (index + 1 === step) {
                el.classList.add('active');
            }
        });

        // Afficher la bonne section
        document.querySelectorAll('.section').forEach((el, index) => {
            el.classList.remove('active');
            if (index + 1 === step) {
                el.classList.add('active');
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    reset() {
        this.currentFile = null;
        this.currentType = null;
        this.cachedPreviewData = null;
        
        document.getElementById('dataType').value = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('fileSelected').style.display = 'none';
        document.getElementById('dropZone').style.display = 'flex';
        
        this.goToStep(1);
        this.updateUI();
    }

    showLoading(type) {
        const previewBtn = document.getElementById('previewBtn');
        if (type === 'preview' && previewBtn) {
            previewBtn.innerHTML = '<div class="spinner"></div><span>Analyse en cours...</span>';
            previewBtn.disabled = true;
        }
    }

    hideLoading(type) {
        const previewBtn = document.getElementById('previewBtn');
        if (type === 'preview' && previewBtn) {
            previewBtn.innerHTML = '<i class="fas fa-eye"></i><span>Prévisualiser les Données</span>';
            previewBtn.disabled = false;
        }
    }
}

// Initialisation globale
let importManager;
document.addEventListener('DOMContentLoaded', () => {
    importManager = new ImportPageManager();
    console.log('✅ Import Page Manager ready');
});

