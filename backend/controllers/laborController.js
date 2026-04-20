const Labor = require('../models/Labor');
const Transaction = require('../models/Transaction');

const createLabor = async (req, res) => {
  try {
    req.body.farmer = req.user.id;
    const labor = await Labor.create(req.body);
    res.status(201).json(labor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLaborers = async (req, res) => {
  try {
    const laborers = await Labor.find({ farmer: req.user.id });
    
    // Separate active and inactive
    const active = laborers.filter(l => l.status === 'active');
    const inactive = laborers.filter(l => l.status === 'inactive');
    
    res.json({ active, inactive, all: laborers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLabor = async (req, res) => {
  try {
    const labor = await Labor.findById(req.params.id);
    if (!labor) return res.status(404).json({ message: 'Labor not found' });
    if (labor.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Calculate monthly summary
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAttendance = labor.attendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const summary = {
      present: monthlyAttendance.filter(a => a.status === 'present').length,
      absent: monthlyAttendance.filter(a => a.status === 'absent').length,
      halfDay: monthlyAttendance.filter(a => a.status === 'half-day').length,
      totalDays: monthlyAttendance.length,
      estimatedPay: monthlyAttendance.reduce((sum, a) => {
        if (a.status === 'present') return sum + labor.dailyRate;
        if (a.status === 'half-day') return sum + (labor.dailyRate / 2);
        return sum;
      }, 0)
    };
    
    res.json({ ...labor._doc, monthlySummary: summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const labor = await Labor.findById(req.params.id);
    if (!labor) return res.status(404).json({ message: 'Labor not found' });
    
    const { date, status, hoursWorked, taskId } = req.body;
    
    // Check if already marked for this date
    const existingIndex = labor.attendance.findIndex(a => 
      new Date(a.date).toDateString() === new Date(date).toDateString()
    );
    
    if (existingIndex >= 0) {
      labor.attendance[existingIndex] = { date, status, hoursWorked, taskId };
    } else {
      labor.attendance.push({ date, status, hoursWorked, taskId });
    }
    
    await labor.save();
    res.json(labor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLabor = async (req, res) => {
  try {
    const labor = await Labor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(labor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLabor = async (req, res) => {
  try {
    const labor = await Labor.findById(req.params.id);
    if (!labor) return res.status(404).json({ message: 'Labor not found' });
    if (labor.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Labor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Labor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payLabor = async (req, res) => {
  try {
    const labor = await Labor.findById(req.params.id);
    if (!labor) return res.status(404).json({ message: 'Labor not found' });
    if (labor.farmer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { amount, description, source } = req.body;
    
    // Create an expense transaction natively in the Finance module
    const transaction = await Transaction.create({
       farmer: req.user.id,
       type: 'expense',
       category: 'labor',
       amount: amount,
       description: `Labor Wage - ${labor.name} - ${description || 'Cash Payment'}`,
    });

    // Push into labor records
    labor.paymentHistory.push({
       date: new Date(),
       amount: amount,
       description: description || 'Cash Wage',
       transactionId: transaction._id
    });

    await labor.save();
    res.json(labor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLabor, getLaborers, getLabor, markAttendance, updateLabor, deleteLabor, payLabor };