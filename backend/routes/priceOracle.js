const express = require('express');
const router = express.Router();
const priceService = require('../services/priceService');
const { getInterpolatedPrice } = require('../utils/interpolation');
const { addPriceHistoryJob, getJobStatus } = require('../queues/simpleJobQueue');

// GET /price - Get historical price for a token at a specific timestamp
router.get('/price', async (req, res) => {
  try {
    const { token, network, timestamp } = req.query;
    
    // Validate required parameters
    if (!token || !network || !timestamp) {
      return res.status(400).json({
        error: 'Missing required parameters: token, network, timestamp'
      });
    }

    // Validate network
    if (!['ethereum', 'polygon'].includes(network)) {
      return res.status(400).json({
        error: 'Invalid network. Must be "ethereum" or "polygon"'
      });
    }

    // Convert timestamp to Date
    const targetDate = new Date(parseInt(timestamp) * 1000);
    const cacheKey = `price:${token}:${network}:${timestamp}`;

    // Check Redis cache first
    const cachedPrice = await priceService.getCachedPrice(cacheKey);
    if (cachedPrice) {
      return res.json({
        price: cachedPrice.price,
        source: cachedPrice.source,
        timestamp: parseInt(timestamp),
        cached: true
      });
    }

    // Check database for exact match
    const dbPrice = await priceService.getPriceFromDatabase(token, network, targetDate);
    if (dbPrice) {
      const result = {
        price: dbPrice.price,
        source: dbPrice.source,
        timestamp: parseInt(timestamp)
      };
      
      // Cache the result
      await priceService.cachePrice(cacheKey, result);
      
      return res.json(result);
    }

    // Try to get price from Alchemy
    try {
      const alchemyPrice = await priceService.getTokenPriceFromAlchemy(token, network, targetDate);
      
      if (alchemyPrice !== null) {
        // Store in database
        await priceService.storePrice(token, network, targetDate, alchemyPrice, 'alchemy');
        
        const result = {
          price: alchemyPrice,
          source: 'alchemy',
          timestamp: parseInt(timestamp)
        };
        
        // Cache the result
        await priceService.cachePrice(cacheKey, result);
        
        return res.json(result);
      }
    } catch (error) {
      console.log('Alchemy price fetch failed, trying interpolation:', error.message);
    }

    // If no exact price found, try interpolation
    const interpolatedResult = await getInterpolatedPrice(token, network, parseInt(timestamp));
    
    if (interpolatedResult) {
      const result = {
        price: interpolatedResult.price,
        source: interpolatedResult.source,
        timestamp: parseInt(timestamp),
        interpolation: {
          beforePrice: interpolatedResult.beforePrice,
          afterPrice: interpolatedResult.afterPrice
        }
      };
      
      // Cache the result
      await priceService.cachePrice(cacheKey, result);
      
      return res.json(result);
    }

    // No price data available
    return res.status(404).json({
      error: 'No price data available for the specified token and timestamp'
    });

  } catch (error) {
    console.error('Error in /price endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /schedule - Schedule full history fetch for a token
router.post('/schedule', async (req, res) => {
  try {
    const { token, network } = req.body;
    
    // Validate required parameters
    if (!token || !network) {
      return res.status(400).json({
        error: 'Missing required parameters: token, network'
      });
    }

    // Validate network
    if (!['ethereum', 'polygon'].includes(network)) {
      return res.status(400).json({
        error: 'Invalid network. Must be "ethereum" or "polygon"'
      });
    }

    // Get token creation date
    let creationDate;
    try {
      creationDate = await priceService.getTokenCreationDate(token, network);
      
      // Validate that we got a valid date
      if (!creationDate || isNaN(creationDate.getTime())) {
        console.log('Invalid creation date received, using default');
        creationDate = new Date('2020-01-01T00:00:00.000Z');
      }
    } catch (error) {
      console.log('Error getting creation date, using default:', error.message);
      creationDate = new Date('2020-01-01T00:00:00.000Z');
    }

    // Add job to queue
    const job = await addPriceHistoryJob(token, network, creationDate);
    
    res.json({
      message: 'Price history fetch scheduled successfully',
      jobId: job.id,
      token,
      network,
      creationDate: creationDate.toISOString(),
      status: 'pending'
    });

  } catch (error) {
    console.error('Error in /schedule endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /jobs/:jobId - Get job status
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // This would typically query the job queue or database for job status
    // For now, we'll return a mock response
    res.json({
      jobId,
      status: 'processing',
      progress: 0.5,
      message: 'Fetching historical prices...'
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /stats - Get price statistics
router.get('/stats', async (req, res) => {
  try {
    const { token, network } = req.query;
    
    // This would typically query the database for statistics
    // For now, we'll return a mock response
    res.json({
      totalPrices: 1000,
      dateRange: {
        start: '2023-01-01',
        end: '2024-01-01'
      },
      networks: ['ethereum', 'polygon'],
      tokens: ['0xA0b869...c2d6', '0x1f9840...85d5']
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router; 