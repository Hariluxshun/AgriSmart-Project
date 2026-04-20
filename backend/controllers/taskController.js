const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Inventory = require('../models/Inventory');

const createTask = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ farmer: req.user.id })
      .populate('assignedTo', 'name role')
      .populate('landId', 'name location');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const previousStatus = task.status;
    task.status = req.body.status;
    if (req.body.status === 'completed') {
      task.completedAt = new Date();

      if (previousStatus !== 'completed' && task.materialsUsed && task.materialsUsed.length > 0) {
        for (let material of task.materialsUsed) {
          const inventoryItem = await Inventory.findById(material.inventoryId);
          if (inventoryItem) {
            inventoryItem.quantity -= material.quantity;
            await inventoryItem.save();
          }
        }
      }
    }
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee CRUD
const createEmployee = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ farmer: req.user.id });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTaskStatus, updateTask, deleteTask, createEmployee, getEmployees };