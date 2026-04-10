const Land = require('../models/Land');

// Create land
const createLand = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const land = await Land.create(req.body);
    res.status(201).json(land);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all lands for logged in farmer
const getLands = async (req, res) => {
  try {
    const lands = await Land.find({ farmer: req.user.id });
    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single land
const getLand = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) return res.status(404).json({ message: 'Land not found' });
    if (land.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(land);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update land
const updateLand = async (req, res) => {
  try {
    let land = await Land.findById(req.params.id);
    if (!land) return res.status(404).json({ message: 'Land not found' });
    if (land.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    land = await Land.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(land);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete land (soft delete - mark as sold)
const deleteLand = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) return res.status(404).json({ message: 'Land not found' });
    if (land.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    land.status = 'sold';
    await land.save();
    res.json({ message: 'Land marked as sold' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLand, getLands, getLand, updateLand, deleteLand };