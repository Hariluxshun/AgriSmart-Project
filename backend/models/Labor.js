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
  joinDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Labor', laborSchema);