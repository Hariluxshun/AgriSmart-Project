const mongoose = require('mongoose');

const laborSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  contactNumber: String,
  address: String,
  role: {
    type: String,
    required: true,
    enum: ['field_worker', 'equipment_operator', 'supervisor', 'harvester', 'general']
  },
  dailyRate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'holiday'],
      default: 'present'
    },
    hoursWorked: Number,
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  }],
  paymentHistory: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    description: String,
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  }],
  joinDate: {
    type: Date,
    default: Date.now
  },
  landId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land'
  }
});

module.exports = mongoose.model('Labor', laborSchema);