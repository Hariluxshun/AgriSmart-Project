const Task = require('../models/Task');
const Employee = require('../models/Employee');

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
      .populate('landId', 'location');
    
    // Group by status
    const grouped = {
      pending: tasks.filter(t => t.status === 'pending'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };
    
    res.json(grouped);
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
    
    task.status = req.body.status;
    if (req.body.status === 'completed') {
      task.completedAt = new Date();
    }
    await task.save();
    res.json(task);
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

module.exports = { createTask, getTasks, updateTaskStatus, createEmployee, getEmployees };