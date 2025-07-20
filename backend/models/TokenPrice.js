const mongoose = require('mongoose');

const tokenPriceSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  network: {
    type: String,
    required: true,
    enum: ['ethereum', 'polygon'],
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['alchemy', 'interpolated'],
    default: 'alchemy'
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
tokenPriceSchema.index({ token: 1, network: 1, date: 1 }, { unique: true });
tokenPriceSchema.index({ token: 1, network: 1, timestamp: 1 });
tokenPriceSchema.index({ network: 1, date: -1 });

module.exports = mongoose.model('TokenPrice', tokenPriceSchema); 