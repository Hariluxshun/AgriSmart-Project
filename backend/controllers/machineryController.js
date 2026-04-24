const Machinery = require('../models/Machinery');

const createAsset = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const asset = await Machinery.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssets = async (req, res) => {
  try {
    const assets = await Machinery.find({ farmer: req.user.id }).populate('landId', 'location');
    
    // Group by status for dashboard
    const dashboard = {
      available: assets.filter(a => a.status === 'available'),
      underRepair: assets.filter(a => a.status === 'under-repair'),
      inUse: assets.filter(a => a.status === 'in-use'),
      all: assets
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAsset = async (req, res) => {
  try {
    const asset = await Machinery.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAsset = async (req, res) => {
  try {
    let asset = await Machinery.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // If adding maintenance record
    if (req.body.maintenanceRecord) {
      asset.maintenanceHistory.push(req.body.maintenanceRecord);
      asset.lastMaintenanceDate = req.body.maintenanceRecord.date;
      asset.nextMaintenanceDue = req.body.maintenanceRecord.nextDueDate;
      await asset.save();
      return res.json(asset);
    }
    
    asset = await Machinery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const asset = await Machinery.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Machinery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAsset, getAssets, getAsset, updateAsset, deleteAsset };