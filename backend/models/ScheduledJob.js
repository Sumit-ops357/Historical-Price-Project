const mongoose = require('mongoose');

const scheduledJobSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  network: {
    type: String,
    required: true,
    enum: ['ethereum', 'polygon']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  creationDate: {
    type: Date
  },
  totalDays: {
    type: Number,
    default: 0
  },
  processedDays: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

scheduledJobSchema.index({ token: 1, network: 1 });
scheduledJobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ScheduledJob', scheduledJobSchema); 