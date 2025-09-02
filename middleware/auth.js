const { pool } = require('../config/database');

// Middleware d'authentification de base
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Middleware pour vérifier le rôle SUPER_ADMIN
const requireSuperAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
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

// Fonction pour vérifier les permissions
const hasPermission = (user, permission) => {
    if (!user) return false;
    
    const permissions = {
        'SUPER_ADMIN': ['dashboard', 'admin', 'analyses', 'indices', 'biologie', 'sync', 'manage_users'],
        'VIEWER': ['analyses', 'indices']
    };
    
    return permissions[user.role]?.includes(permission) || false;
};

module.exports = {
    requireAuth,
    requireSuperAdmin,
    requireViewer,
    checkAuthAPI,
    getUserInfo,
    hasPermission
};
