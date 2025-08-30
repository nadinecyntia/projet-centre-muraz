const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool } = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Middleware pour parser le JSON et les formulaires
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api', apiRoutes);

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour la page Biologie Moléculaire
app.get('/biologie-moleculaire', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'biologie-moleculaire.html'));
});

// Route pour la page Analyses
app.get('/analyses', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analyses.html'));
});

// Route pour la page Administration
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route pour la page Indices
app.get('/indices', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indices.html'));
});

// Route de test pour la navigation
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Route de test pour la page d'accueil simple
app.get('/index-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index-simple.html'));
});

// Route de test pour la navigation (nouveau fichier)
app.get('/test-nav', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-nav.html'));
});

// Route de test pour la page d'accueil sans CSS/JS
app.get('/index-no-css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index-no-css.html'));
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log('🚀 Serveur Centre MURAZ démarré sur le port', PORT);
    console.log('📊 Plateforme de surveillance des arboviroses active');
    console.log('🌐 Accédez à votre plateforme:', `http://localhost:${PORT}`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt gracieux du serveur...');
    await pool.end();
    process.exit(0);
});

module.exports = app;
