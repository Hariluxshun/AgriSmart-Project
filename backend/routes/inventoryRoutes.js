const express = require('express');
const { 
    createItem, 
    getItems, 
    getItem, 
    updateItem, 
    deleteItem 
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
    .post(createItem)
    .get(getItems);

router.route('/:id')
    .get(getItem)
    .put(updateItem)
    .delete(deleteItem);

module.exports = router;