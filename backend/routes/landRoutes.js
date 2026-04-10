const express = require('express');
const { 
    createLand, 
    getLands, 
    getLand, 
    updateLand, 
    deleteLand 
} = require('../controllers/landController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

router.route('/')
    .post(createLand)
    .get(getLands);

router.route('/:id')
    .get(getLand)
    .put(updateLand)
    .delete(deleteLand);

module.exports = router;