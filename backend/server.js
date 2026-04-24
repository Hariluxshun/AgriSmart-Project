const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const landRoutes = require('./routes/landRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const machineryRoutes = require('./routes/machineryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const financeRoutes = require('./routes/financeRoutes');
const laborRoutes = require('./routes/laborRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/lands', landRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/labor', laborRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'AgriSmart API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      lands: '/api/lands',
      inventory: '/api/inventory',
      machinery: '/api/machinery',
      tasks: '/api/tasks',
      finance: '/api/finance',
      labor: '/api/labor'
    }
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:');
    console.error('Reason:', err.message);
    if (err.message.includes('27017')) {
      console.log('💡 TIP: Port 27017 might be blocked or your IP is not whitelisted in MongoDB Atlas.');
    }
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});