const { isDBConnected } = require('../config/database');
const TokenPrice = require('../models/TokenPrice');
const ScheduledJob = require('../models/ScheduledJob');

// In-memory storage fallback
const inMemoryStorage = {
  tokenPrices: new Map(),
  scheduledJobs: new Map(),
  jobCounter: 0
};

// Helper to generate unique key for token prices
const getTokenPriceKey = (token, network, date) => `${token}:${network}:${date.toISOString().split('T')[0]}`;

// Token Price Storage
const storeTokenPrice = async (token, network, date, price, source) => {
  const timestamp = Math.floor(date.getTime() / 1000);
  
  if (isDBConnected()) {
    try {
      await TokenPrice.create({
        token,
        network,
        date,
        price,
        source,
        timestamp
      });
      return true;
    } catch (error) {
      console.log('MongoDB storage failed, using in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  const key = getTokenPriceKey(token, network, date);
  inMemoryStorage.tokenPrices.set(key, {
    token,
    network,
    date,
    price,
    source,
    timestamp
  });
  return true;
};

const getTokenPrice = async (token, network, date) => {
  if (isDBConnected()) {
    try {
      return await TokenPrice.findOne({ token, network, date });
    } catch (error) {
      console.log('MongoDB query failed, checking in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  const key = getTokenPriceKey(token, network, date);
  return inMemoryStorage.tokenPrices.get(key) || null;
};

const getTokenPricesInRange = async (token, network, startDate, endDate) => {
  if (isDBConnected()) {
    try {
      return await TokenPrice.find({
        token,
        network,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } catch (error) {
      console.log('MongoDB query failed, checking in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  const results = [];
  for (const [key, price] of inMemoryStorage.tokenPrices) {
    if (key.startsWith(`${token}:${network}:`) && 
        price.date >= startDate && price.date <= endDate) {
      results.push(price);
    }
  }
  return results.sort((a, b) => a.date - b.date);
};

// Scheduled Job Storage
const createScheduledJob = async (token, network, jobId, creationDate) => {
  if (isDBConnected()) {
    try {
      return await ScheduledJob.create({
        token,
        network,
        jobId,
        status: 'pending',
        creationDate,
        totalDays: 0,
        processedDays: 0
      });
    } catch (error) {
      console.log('MongoDB job creation failed, using in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  const job = {
    token,
    network,
    jobId,
    status: 'pending',
    creationDate,
    totalDays: 0,
    processedDays: 0,
    createdAt: new Date()
  };
  inMemoryStorage.scheduledJobs.set(jobId, job);
  return job;
};

const updateScheduledJob = async (jobId, updates) => {
  if (isDBConnected()) {
    try {
      return await ScheduledJob.findOneAndUpdate({ jobId }, updates, { new: true });
    } catch (error) {
      console.log('MongoDB job update failed, using in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  const job = inMemoryStorage.scheduledJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    inMemoryStorage.scheduledJobs.set(jobId, job);
  }
  return job;
};

const getScheduledJob = async (jobId) => {
  if (isDBConnected()) {
    try {
      return await ScheduledJob.findOne({ jobId });
    } catch (error) {
      console.log('MongoDB job query failed, checking in-memory:', error.message);
    }
  }
  
  // Fallback to in-memory storage
  return inMemoryStorage.scheduledJobs.get(jobId) || null;
};

module.exports = {
  storeTokenPrice,
  getTokenPrice,
  getTokenPricesInRange,
  createScheduledJob,
  updateScheduledJob,
  getScheduledJob
}; 