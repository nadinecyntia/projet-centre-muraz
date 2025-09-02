const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { getUserInfo } = require('../middleware/auth');

class AuthController {
    // Connexion utilisateur
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validation des données
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Données manquantes',
                    message: 'Nom d\'utilisateur et mot de passe requis'
                });
            }
            
            // Vérifier les identifiants dans la base
            const result = await pool.query(
                'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
                [username]
            );
            
            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Identifiants incorrects',
                    message: 'Nom d\'utilisateur ou mot de passe incorrect'
                });
            }
            
            const user = result.rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Identifiants incorrects',
                    message: 'Nom d\'utilisateur ou mot de passe incorrect'
                });
            }
            
            // Créer la session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };
            
            // Déterminer la page de redirection selon le rôle
            let redirectUrl = '/analyses'; // Par défaut
            if (user.role === 'SUPER_ADMIN') {
                redirectUrl = '/admin';
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                redirect: redirectUrl,
                message: 'Connexion réussie'
            });
            
        } catch (error) {
            console.error('Erreur de connexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Une erreur est survenue lors de la connexion'
            });
        }
    }
    
    // Déconnexion utilisateur
    async logout(req, res) {
        try {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Erreur de déconnexion',
                        message: 'Erreur lors de la destruction de la session'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Déconnexion réussie'
                });
            });
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Une erreur est survenue lors de la déconnexion'
            });
        }
    }
    
    // Obtenir les informations de l'utilisateur connecté
    async getUserInfo(req, res) {
        try {
            const user = getUserInfo(req);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié',
                    message: 'Aucun utilisateur connecté'
                });
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
            
        } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la récupération des informations utilisateur'
            });
        }
    }
    
    // Vérifier le statut d'authentification
    async checkAuth(req, res) {
        try {
            const user = getUserInfo(req);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: 'Non authentifié'
                });
            }
            
            res.json({
                success: true,
                authenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
            
        } catch (error) {
            console.error('Erreur vérification auth:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la vérification d\'authentification'
            });
        }
    }
}

module.exports = new AuthController();
