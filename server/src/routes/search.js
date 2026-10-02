const express = require('express');
const router = express.Router();
const { searchLabs } = require('../controllers/searchController');

// GET /api/search?search_query=...&pincode=...
router.get('/search', searchLabs);

// GET /api/health
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
