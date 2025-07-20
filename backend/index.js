const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import configurations and routes
const { connectDB } = require('./config/database');
const blockchainRoutes = require('./routes/blockchain');
const priceOracleRoutes = require('./routes/priceOracle');

// Import queue workers (but don't start them here to avoid conflicts)
// const { worker: priceHistoryWorker } = require('./queues/priceHistoryQueue');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/price-oracle', priceOracleRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Historical Token Price Oracle API Server is running!',
    endpoints: {
      health: '/health',
      blockchain: '/api/blockchain',
      priceOracle: '/api/price-oracle',
      price: '/api/price-oracle/price?token=...&network=...&timestamp=...',
      schedule: '/api/price-oracle/schedule',
      jobs: '/api/price-oracle/jobs/:jobId',
      stats: '/api/price-oracle/stats'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`API documentation available at http://localhost:${PORT}/`);
});

module.exports = app; 