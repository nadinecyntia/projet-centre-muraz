const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Toutes les routes obsolètes ont été supprimées et remplacées par des routes spécialisées :
// - /api/analyses -> routes/api-analyses.js
// - /api/biologie -> routes/api-biologie.js  
// - /api/indices -> routes/api-indices.js
// - /api/validation -> routes/api-validation.js
// - /api/users -> routes/api-users.js
// - /api/collect -> routes/api-collect.js
// - /api/csv -> routes/api-csv.js

module.exports = router;