const { pool } = require('../config/database');

// Middleware d'authentification de base
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // Si c'est une requête API, retourner JSON (utiliser originalUrl car le routeur est monté sous /api)
        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié',
                message: 'Veuillez vous connecter'
            });
        }
        // Sinon rediriger vers login
        return res.redirect('/login');
    }
    next();
};

// Middleware pour vérifier le rôle SUPER_ADMIN
const requireSuperAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // Si c'est une requête API, retourner JSON (utiliser originalUrl)
        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié',
                message: 'Veuillez vous connecter'
            });
        }
        return res.redirect('/login');
    }
    
    if (req.session.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Accès refusé',
            message: 'Vous devez être Super Administrateur pour accéder à cette ressource'
        });
    }
    next();
};

// Middleware pour vérifier le rôle VIEWER
const requireViewer = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // Si c'est une requête API, retourner JSON (utiliser originalUrl)
        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié',
                message: 'Veuillez vous connecter'
            });
        }
        return res.redirect('/login');
    }
    
    if (!['SUPER_ADMIN', 'VIEWER'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Accès refusé',
            message: 'Vous n\'avez pas les permissions nécessaires'
        });
    }
    next();
};

// Middleware pour vérifier le rôle INVESTIGATOR (accès collecte uniquement)
const requireInvestigator = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // Si c'est une requête API, retourner JSON (utiliser originalUrl)
        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: 'Non authentifié',
                message: 'Veuillez vous connecter'
            });
        }
        return res.redirect('/login');
    }
    if (!['SUPER_ADMIN', 'INVESTIGATOR'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Accès refusé',
            message: 'Vous n\'avez pas les permissions nécessaires'
        });
    }
    next();
};

// Fonction pour vérifier l'authentification via API
const checkAuthAPI = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            error: 'Non authentifié',
            message: 'Veuillez vous connecter'
        });
    }
    next();
};

// Fonction pour obtenir les informations utilisateur
const getUserInfo = (req) => {
    return req.session ? req.session.user : null;
};


module.exports = {
    requireAuth,
    requireSuperAdmin,
    requireViewer,
    requireInvestigator,
    checkAuthAPI,
    getUserInfo
};
