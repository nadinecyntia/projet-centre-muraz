const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool } = require('./config/database');
const apiRoutes = require('./routes/api');
const authController = require('./controllers/authController');
const { requireAuth, requireSuperAdmin, requireViewer } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Configuration des sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'centre-muraz-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Middleware pour parser le JSON et les formulaires
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware d'authentification
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    next();
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Les middlewares d'authentification sont importés depuis middleware/auth.js

// Routes d'authentification
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/user', authController.getUserInfo);
app.get('/api/auth/check', authController.checkAuth);

// Routes API
app.use('/api', apiRoutes);

// Route de login
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect(req.session.user.role === 'SUPER_ADMIN' ? '/admin' : '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route principale (Page d'accueil) - Accessible à tous
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour la page Biologie Moléculaire - SUPER_ADMIN uniquement
app.get('/biologie-moleculaire', requireAuth, requireSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'biologie-moleculaire.html'));
});

// Route pour la page Analyses - Tous les utilisateurs connectés
app.get('/analyses', requireAuth, requireViewer, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analyses.html'));
});

// Route pour la page Administration - SUPER_ADMIN uniquement
app.get('/admin', requireAuth, requireSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route pour la page Indices - Tous les utilisateurs connectés
app.get('/indices', requireAuth, requireViewer, (req, res) => {
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

// Route de test pour les échelles adaptatives
app.get('/test-echelle', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-echelle.html'));
});

// Route de test simple pour les échelles adaptatives
app.get('/test-echelle-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-echelle-simple.html'));
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
