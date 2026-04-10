const express = require('express');
const { 
    createAsset, 
    getAssets, 
    getAsset, 
    updateAsset, 
    deleteAsset 
} = require('../controllers/machineryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
    .post(createAsset)
    .get(getAssets);

router.route('/:id')
    .get(getAsset)
    .put(updateAsset)
    .delete(deleteAsset);

module.exports = router;