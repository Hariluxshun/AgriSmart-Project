const express = require('express');
const { 
    createLabor, 
    getLaborers, 
    getLabor, 
    markAttendance,
    updateLabor, 
    deleteLabor,
    payLabor
} = require('../controllers/laborController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
    .post(createLabor)
    .get(getLaborers);

router.route('/:id')
    .get(getLabor)
    .put(updateLabor)
    .delete(deleteLabor);

router.post('/:id/attendance', markAttendance);
router.post('/:id/pay', payLabor);

module.exports = router;