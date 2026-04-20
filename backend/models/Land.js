const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  gpsCoordinates: {
    lat: Number,
    lng: Number
  },
  mapLink: {
    type: String
  },
  size: {
    value: Number,
    unit: { type: String, default: 'acres' }
  },
  soilDetails: {
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number
  },
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'silty', 'peat', 'chalk', 'loam', 'other'],
    default: 'other'
  },
  cropHistory: [{
    season: String,
    crop: String,
    yield: String,
    datePlanted: Date,
    dateHarvested: Date,
    notes: String
  }],
  soilTestHistory: [{
    date: Date,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number
  }],
  status: {
    type: String,
    enum: ['active', 'sold', 'fallow'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Land', landSchema);