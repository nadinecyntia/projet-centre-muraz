const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool } = require('./config/database');
const apiRoutes = require('./routes/api');
const apiArchiveRoutes = require('./routes/api-archive');
const apiValidationRoutes = require('./routes/api-validation-normalized');
const apiAnalysesRoutes = require('./routes/api-analyses-normalized');
const apiIndicesRoutes = require('./routes/api-indices-normalized');
const apiUsersRoutes = require('./routes/api-users');
const apiBiologieRoutes = require('./routes/api-biologie');
const apiCollectRoutes = require('./routes/api-collect-complete');
const apiCsvRoutes = require('./routes/api-csv');
const apiImportRoutes = require('./routes/api-import-normalized'); // Import CSV/Excel normalisé
const authController = require('./controllers/authController');
const { requireAuth, requireSuperAdmin, requireViewer, requireInvestigator } = require('./middleware/auth');

const app = express();

// Enable HTTP compression for API and static responses
app.use(compression());
const PORT = process.env.PORT || 3000;

// Configuration UTF-8 pour les caractères français
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

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

// Routes API - Ordre spécifique avant général
app.use('/api/archive', apiArchiveRoutes); // Routes d'archivage
app.use('/api/validation', apiValidationRoutes); // Routes de validation activées
app.use('/api/biologie', apiBiologieRoutes); // Routes de biologie moléculaire activées
app.use('/api/csv', apiCsvRoutes); // Routes d'import CSV (ancien système)
app.use('/api/import', apiImportRoutes); // Routes d'import CSV/Excel normalisé (nouveau)
app.use('/api', apiAnalysesRoutes); // Routes d'analyses activées
app.use('/api', apiIndicesRoutes);
app.use('/api', apiUsersRoutes);
app.use('/api', apiCollectRoutes); // Routes de collecte de données
app.use('/api', apiRoutes); // Routes générales en dernier

// Assurer l'existence de la table users (auto-migration légère)
async function ensureUsersTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN','VIEWER','INVESTIGATOR')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Index additionnels au cas où
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
        // Harmoniser le type de colonne role et contrainte d'intégrité
        await pool.query(`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;`);
        await pool.query(`DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name='users' AND constraint_name='users_role_check'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN','VIEWER','INVESTIGATOR'));
            END IF;
        END $$;`);
        // Garantir unicité username/email si table pré-existante
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);`);
        console.log('✅ Table users vérifiée/créée');
    } catch (e) {
        console.error('❌ Échec vérification/creation table users:', e.message);
    }
}

ensureUsersTable();

// Créer l'admin par défaut si manquant
async function ensureDefaultAdmin() {
    try {
        const { rows } = await pool.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
        if (rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW())",
                ['admin', 'admin@example.com', hash, 'SUPER_ADMIN']
            );
            console.log('👤 Utilisateur admin créé (admin/admin123)');
        } else {
            console.log('👤 Utilisateur admin déjà présent');
        }
    } catch (e) {
        console.error('❌ Vérification/creation admin par défaut:', e.message);
    }
}

ensureDefaultAdmin();

// Route de login
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect(req.session.user.role === 'SUPER_ADMIN' ? '/admin' : '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route principale (Page d'accueil) - redirige vers login si non authentifié, sinon vers admin
app.get('/', (req, res) => {
    if (!req.session || !req.session.user) {
        // Servir la page d'accueil publique quand non authentifié
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    // Utilisateur connecté -> admin
    return res.redirect('/admin');
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

// Route pour la page de collecte de données - SANS AUTHENTIFICATION
app.get('/collect', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'collect-v2.html'));
});

// Page gestion utilisateurs (SUPER_ADMIN)
app.get('/admin/users', requireAuth, requireSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-users.html'));
});

// Redirection sécurisée au cas où un lien pointe vers /users
app.get('/users', requireAuth, requireSuperAdmin, (req, res) => {
    res.redirect('/admin/users');
});

// Route pour la page de validation des données en attente - SANS AUTH
app.get('/admin/pending', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-validation.html'));
});

// Route pour la validation par lots - SANS AUTH
app.get('/admin-validation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-validation.html'));
});



// Route pour la page Indices - Tous les utilisateurs connectés
app.get('/indices', requireAuth, requireViewer, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indices.html'));
});


// Route principale pour tester les indices sans authentification


// Routes de test supprimées lors du nettoyage

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
