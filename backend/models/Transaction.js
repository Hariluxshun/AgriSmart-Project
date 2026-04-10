const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['seed', 'fertilizer', 'labor', 'fuel', 'repair', 'harvest_sale', 'equipment', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: String,
  date: {
    type: Date,
    default: Date.now
  },
  receipt: String,  // URL to uploaded receipt image
  landId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land'
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);