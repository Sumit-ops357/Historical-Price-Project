const storageService = require('../services/storageService');
const priceService = require('../services/priceService');
const { format, eachDayOfInterval } = require('date-fns');

// Simple in-memory job queue (main queue used when BullMQ/Redis unavailable)
const jobs = new Map();

// Function to add price history job
const addPriceHistoryJob = async (token, network, creationDate) => {
  try {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create job record in database or memory
    await storageService.createScheduledJob(token, network, jobId, creationDate);
    
    // Store job in memory
    jobs.set(jobId, {
      token,
      network,
      creationDate,
      status: 'pending',
      progress: 0
    });
    
    console.log(`Added price history job for ${token} with job ID: ${jobId}`);
    
    // Start processing the job
    processJob(jobId);
    
    return { id: jobId };
  } catch (error) {
    console.error('Error adding price history job:', error);
    throw error;
  }
};

// Process job function
const processJob = async (jobId) => {
  const job = jobs.get(jobId);
  if (!job) return;
  
  try {
    console.log(`Processing price history for token: ${job.token} on ${job.network}`);
    
    // Update job status to processing
    await storageService.updateScheduledJob(jobId, {
      status: 'processing',
      startedAt: new Date()
    });
    
    // Generate daily timestamps from creation date to today
    const startDate = new Date(job.creationDate);
    const endDate = new Date();
    
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    const totalDays = dates.length;
    
    console.log(`Fetching ${totalDays} days of price data for ${job.token}`);
    
    // Update total days in job record
    await storageService.updateScheduledJob(jobId, { totalDays });
    
    let processedDays = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Process dates in batches
    const batchSize = 10;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      
      // Process batch
      for (const date of batch) {
        try {
          // Check if price already exists
          const existingPrice = await priceService.getPriceFromDatabase(job.token, job.network, date);
          if (existingPrice) {
            console.log(`Price already exists for ${format(date, 'yyyy-MM-dd')}`);
            successCount++;
          } else {
            // Fetch price from Alchemy
            const price = await priceService.getTokenPriceFromAlchemy(job.token, job.network, date);
            
            if (price !== null) {
              // Store in database
              await priceService.storePrice(job.token, job.network, date, price, 'alchemy');
              console.log(`Stored price for ${format(date, 'yyyy-MM-dd')}: ${price}`);
              successCount++;
            } else {
              console.log(`No price available for ${format(date, 'yyyy-MM-dd')}`);
              errorCount++;
            }
          }
          
          processedDays++;
          
          // Update job progress
          await storageService.updateScheduledJob(jobId, {
            processedDays,
            status: processedDays < totalDays ? 'processing' : 'completed'
          });
          
        } catch (error) {
          console.error(`Error processing ${format(date, 'yyyy-MM-dd')}:`, error.message);
          errorCount++;
          processedDays++;
        }
      }
      
      // Add delay between batches
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update final job status
    await storageService.updateScheduledJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      processedDays: totalDays
    });
    
    console.log(`Price history fetch completed for ${job.token}`);
    console.log(`Total: ${totalDays}, Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error(`Error processing price history for ${job.token}:`, error);
    
    // Update job status to failed
    await storageService.updateScheduledJob(jobId, {
      status: 'failed',
      error: error.message
    });
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
  addPriceHistoryJob,
  getJobStatus
};