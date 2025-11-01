const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('src/public'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Application is healthy', timestamp: new Date() });
});

app.get('/api/data', (req, res) => {
  res.json({
    message: 'Secure Node.js Application',
    features: ['Express Server', 'Security Scans', 'Docker Deployment'],
    version: '1.0.0'
  });
});

app.post('/api/echo', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  res.json({ received: message, timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
