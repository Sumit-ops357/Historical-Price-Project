const express = require('express');
const router = express.Router();
const alchemy = require('../config/alchemy');
const Transaction = require('../models/Transaction');

// Get transaction by hash
router.get('/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    // First check if we have it in our database
    let transaction = await Transaction.findOne({ hash });
    
    if (!transaction) {
      // If not in database, fetch from Alchemy
      const tx = await alchemy.core.getTransaction(hash);
      
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Add to queue for processing
      await addTransactionToQueue(hash);
      
      return res.json({
        message: 'Transaction found, processing in background',
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        status: 'processing'
      });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transactions by address
router.get('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const transactions = await Transaction.find({
      $or: [
        { from: address.toLowerCase() },
        { to: address.toLowerCase() }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments({
      $or: [
        { from: address.toLowerCase() },
        { to: address.toLowerCase() }
      ]
    });
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest transactions
router.get('/transactions/latest', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching latest transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const confirmedTransactions = await Transaction.countDocuments({ status: 'confirmed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    
    // Get transactions from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentTransactions = await Transaction.countDocuments({
      timestamp: { $gte: yesterday }
    });
    
    res.json({
      total: totalTransactions,
      confirmed: confirmedTransactions,
      pending: pendingTransactions,
      last24Hours: recentTransactions
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process transaction manually
router.post('/transaction/process', async (req, res) => {
  try {
    const { hash } = req.body;
    
    if (!hash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }
    
    res.json({
      message: 'Transaction processing endpoint (placeholder)',
      hash
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 