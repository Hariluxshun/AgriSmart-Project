const express = require('express');
const { 
    createTask, 
    getTasks, 
    updateTaskStatus,
    updateTask,
    deleteTask,
    createEmployee,
    getEmployees
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Task routes
router.route('/tasks')
    .post(createTask)
    .get(getTasks);

router.route('/tasks/:id')
    .put(updateTask)
    .delete(deleteTask);

router.put('/tasks/:id/status', updateTaskStatus);

// Employee routes
router.route('/employees')
    .post(createEmployee)
    .get(getEmployees);

module.exports = router;