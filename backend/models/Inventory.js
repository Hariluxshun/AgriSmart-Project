const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['seed', 'fertilizer', 'pesticide', 'herbicide', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'kg'
  },
  reorderPoint: {
    type: Number,
    default: 10
  },
  expiryDate: Date,
  batchNumber: String,
  status: {
    type: String,
    enum: ['active', 'expired', 'write-off'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);