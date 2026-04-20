const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Labor'
},
  landId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  materialsUsed: [{
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    quantity: Number
  }],
  dueDate: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);