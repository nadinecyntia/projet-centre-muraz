const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Vérifier/normaliser le schéma de la table users
async function ensureUsersSchema() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
        await pool.query(`DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name='users' AND constraint_name='users_role_check'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN','VIEWER','INVESTIGATOR'));
            END IF;
        END $$;`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);`);
    } catch (e) {
        console.error('❌ ensureUsersSchema:', e);
        throw e;
    }
}

// Initialiser le schéma au chargement du module (best-effort)
ensureUsersSchema().catch(()=>{});

// Toutes les routes ici nécessitent SUPER_ADMIN
router.use(requireAuth);
router.use(requireSuperAdmin);

// Lister les utilisateurs
router.get('/users', async (req, res) => {
    try {
        await ensureUsersSchema();
        const result = await pool.query(`
            SELECT id, username, email, role, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ Liste utilisateurs:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs', error: error.message, code: error.code });
    }
});

// Créer un utilisateur
router.post('/users', async (req, res) => {
    try {
        await ensureUsersSchema();
        const { username, email, password, role } = req.body || {};
        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'username, email, password, role requis' });
        }
        if (!['SUPER_ADMIN','VIEWER','INVESTIGATOR'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rôle invalide' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        let result;
        try {
            result = await pool.query(`
                INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id, username, email, role, created_at, updated_at
            `, [username, email, passwordHash, role]);
        } catch (err) {
            if (err.code === '23505') {
                // violation contrainte unique
                return res.status(409).json({ success: false, message: 'Username ou email déjà utilisé' });
            }
            throw err;
        }
        res.json({ success: true, data: result.rows[0], message: 'Utilisateur créé' });
    } catch (error) {
        console.error('❌ Création utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création', error: error.message, code: error.code });
    }
});

// Mettre à jour un utilisateur
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password, role } = req.body || {};
        const fields = [];
        const values = [];
        let idx = 1;
        if (username) { fields.push(`username = $${idx++}`); values.push(username); }
        if (email) { fields.push(`email = $${idx++}`); values.push(email); }
        if (role) { fields.push(`role = $${idx++}`); values.push(role); }
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            fields.push(`password_hash = $${idx++}`); values.push(passwordHash);
        }
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun champ à mettre à jour' });
        }
        fields.push(`updated_at = NOW()`);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, created_at, updated_at`;
        values.push(userId);
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        res.json({ success: true, data: result.rows[0], message: 'Utilisateur mis à jour' });
    } catch (error) {
        console.error('❌ Mise à jour utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
    }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('❌ Suppression utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression', error: error.message });
    }
});

module.exports = router;


