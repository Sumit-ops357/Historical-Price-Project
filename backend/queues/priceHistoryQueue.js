const { Queue, Worker } = require('bullmq');
const { redis } = require('../config/redis');
const priceService = require('../services/priceService');
const storageService = require('../services/storageService');
const { format, addDays, eachDayOfInterval } = require('date-fns');

// Create queue for price history processing
const priceHistoryQueue = new Queue('price-history-fetch', {
  connection: redis
});

// Worker to process price history jobs
const worker = new Worker('price-history-fetch', async (job) => {
  const { token, network, creationDate } = job.data;
  
  try {
    console.log(`Processing price history for token: ${token} on ${network}`);
    
    // Update job status to processing
    await storageService.updateScheduledJob(job.id, {
      status: 'processing',
      startedAt: new Date()
    });
    
    // Generate daily timestamps from creation date to today
    const startDate = new Date(creationDate);
    const endDate = new Date();
    
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    const totalDays = dates.length;
    
    console.log(`Fetching ${totalDays} days of price data for ${token}`);
    
    // Update total days in job record
    await storageService.updateScheduledJob(job.id, { totalDays });
    
    let processedDays = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Process dates in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (date) => {
        try {
          // Check if price already exists
          const existingPrice = await priceService.getPriceFromDatabase(token, network, date);
          if (existingPrice) {
            console.log(`Price already exists for ${format(date, 'yyyy-MM-dd')}`);
            return { success: true, skipped: true };
          }
          
          // Fetch price from Alchemy
          const price = await priceService.getTokenPriceFromAlchemy(token, network, date);
          
          if (price !== null) {
            // Store in database
            await priceService.storePrice(token, network, date, price, 'alchemy');
            console.log(`Stored price for ${format(date, 'yyyy-MM-dd')}: ${price}`);
            return { success: true, price };
          } else {
            console.log(`No price available for ${format(date, 'yyyy-MM-dd')}`);
            return { success: false, noData: true };
          }
        } catch (error) {
          console.error(`Error processing ${format(date, 'yyyy-MM-dd')}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update progress
      processedDays += batch.length;
      const successfulResults = batchResults.filter(r => r.success);
      const errorResults = batchResults.filter(r => !r.success);
      
      successCount += successfulResults.length;
      errorCount += errorResults.length;
      
      // Update job progress
      await storageService.updateScheduledJob(job.id, {
        processedDays,
        status: processedDays < totalDays ? 'processing' : 'completed'
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Update final job status
    await storageService.updateScheduledJob(job.id, {
      status: 'completed',
      completedAt: new Date(),
      processedDays: totalDays
    });
    
    console.log(`Price history fetch completed for ${token}`);
    console.log(`Total: ${totalDays}, Success: ${successCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      totalDays,
      successCount,
      errorCount,
      token,
      network
    };
    
  } catch (error) {
    console.error(`Error processing price history for ${token}:`, error);
    
    // Update job status to failed
    await storageService.updateScheduledJob(job.id, {
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}, {
  connection: redis,
  concurrency: 2 // Process 2 jobs concurrently
});

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Price history job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Price history job ${job.id} failed:`, err);
});

// Function to add price history job to queue
const addPriceHistoryJob = async (token, network, creationDate) => {
  try {
    const job = await priceHistoryQueue.add('fetch-price-history', {
      token,
      network,
      creationDate: creationDate.toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    });
    
    // Create job record in database or memory
    await storageService.createScheduledJob(token, network, job.id, creationDate);
    
    console.log(`Added price history job for ${token} with job ID: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Error adding price history job to queue:', error);
    throw error;
  }
};

// Function to get job status
const getJobStatus = async (jobId) => {
  try {
    const jobRecord = await storageService.getScheduledJob(jobId);
    if (!jobRecord) {
      return null;
    }
    
    const progress = jobRecord.totalDays > 0 
      ? (jobRecord.processedDays / jobRecord.totalDays) * 100 
      : 0;
    
    return {
      jobId,
      status: jobRecord.status,
      progress: Math.round(progress),
      totalDays: jobRecord.totalDays,
      processedDays: jobRecord.processedDays,
      error: jobRecord.error,
      startedAt: jobRecord.startedAt,
      completedAt: jobRecord.completedAt
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    return null;
  }
};

module.exports = {
  priceHistoryQueue,
  worker,
  addPriceHistoryJob,
  getJobStatus
}; 