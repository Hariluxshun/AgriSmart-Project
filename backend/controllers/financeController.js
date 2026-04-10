const Transaction = require('../models/Transaction');

const createTransaction = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    let query = { farmer: req.user.id };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (type) query.type = type;
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfitLoss = async (req, res) => {
  try {
    const { year, month } = req.query;
    let startDate, endDate;
    
    if (year && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date();
    }
    
    const transactions = await Transaction.find({
      farmer: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      period: { startDate, endDate },
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTransaction, getTransactions, getProfitLoss, updateTransaction, deleteTransaction };