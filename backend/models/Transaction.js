const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  gas: {
    type: String,
    required: true
  },
  gasPrice: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  blockHash: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  network: {
    type: String,
    default: 'ethereum'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ from: 1, timestamp: -1 });
transactionSchema.index({ to: 1, timestamp: -1 });
transactionSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema); 