const express = require('express');
const { 
    createTransaction, 
    getTransactions, 
    getProfitLoss,
    updateTransaction, 
    deleteTransaction 
} = require('../controllers/financeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Profit/Loss summary
router.get('/profit-loss', getProfitLoss);

// Transaction CRUD
router.route('/transactions')
    .post(createTransaction)
    .get(getTransactions);

router.route('/transactions/:id')
    .put(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;