const express = require('express');
const app = express();
app.use(express.json());

// Simple test route without any middleware
app.post('/test', (req, res) => {
  res.json({ message: 'Working!', data: req.body });
});

app.listen(5000, () => {
  console.log('Test server on port 5001');
});