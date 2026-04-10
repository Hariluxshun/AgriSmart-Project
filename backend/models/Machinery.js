const mongoose = require('mongoose');

const machinerySchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  purchasePrice: Number,
  warrantyExpiry: Date,
  status: {
    type: String,
    enum: ['available', 'in-use', 'under-repair', 'decommissioned'],
    default: 'available'
  },
  maintenanceHistory: [{
    date: Date,
    description: String,
    cost: Number,
    nextDueDate: Date
  }],
  lastMaintenanceDate: Date,
  nextMaintenanceDue: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Machinery', machinerySchema);