const TokenPrice = require('../models/TokenPrice');

/**
 * Interpolate price between two known price points
 * @param {number} targetTimestamp - The timestamp we want to find price for
 * @param {number} beforeTimestamp - Timestamp of price before target
 * @param {number} beforePrice - Price at beforeTimestamp
 * @param {number} afterTimestamp - Timestamp of price after target
 * @param {number} afterPrice - Price at afterTimestamp
 * @returns {number} - Interpolated price
 */
function interpolatePrice(targetTimestamp, beforeTimestamp, beforePrice, afterTimestamp, afterPrice) {
  if (beforeTimestamp === afterTimestamp) {
    return beforePrice;
  }
  
  const ratio = (targetTimestamp - beforeTimestamp) / (afterTimestamp - beforeTimestamp);
  return beforePrice + (afterPrice - beforePrice) * ratio;
}

/**
 * Find the nearest price points for interpolation
 * @param {string} token - Token address
 * @param {string} network - Network (ethereum/polygon)
 * @param {number} targetTimestamp - Target timestamp
 * @returns {Object} - Object with before and after price points
 */
async function findNearestPrices(token, network, targetTimestamp) {
  // Find the closest price before the target timestamp
  const beforePrice = await TokenPrice.findOne({
    token,
    network,
    timestamp: { $lte: targetTimestamp }
  }).sort({ timestamp: -1 });

  // Find the closest price after the target timestamp
  const afterPrice = await TokenPrice.findOne({
    token,
    network,
    timestamp: { $gte: targetTimestamp }
  }).sort({ timestamp: 1 });

  return {
    before: beforePrice,
    after: afterPrice
  };
}

/**
 * Get interpolated price for a specific timestamp
 * @param {string} token - Token address
 * @param {string} network - Network (ethereum/polygon)
 * @param {number} timestamp - Target timestamp
 * @returns {Object} - Price data with source information
 */
async function getInterpolatedPrice(token, network, timestamp) {
  const nearestPrices = await findNearestPrices(token, network, timestamp);
  
  // If we have both before and after prices, interpolate
  if (nearestPrices.before && nearestPrices.after) {
    const interpolatedPrice = interpolatePrice(
      timestamp,
      nearestPrices.before.timestamp,
      nearestPrices.before.price,
      nearestPrices.after.timestamp,
      nearestPrices.after.price
    );
    
    return {
      price: interpolatedPrice,
      source: 'interpolated',
      beforePrice: nearestPrices.before,
      afterPrice: nearestPrices.after
    };
  }
  
  // If we only have one price point, use it
  if (nearestPrices.before) {
    return {
      price: nearestPrices.before.price,
      source: 'interpolated',
      beforePrice: nearestPrices.before,
      afterPrice: null
    };
  }
  
  if (nearestPrices.after) {
    return {
      price: nearestPrices.after.price,
      source: 'interpolated',
      beforePrice: null,
      afterPrice: nearestPrices.after
    };
  }
  
  // No price data available
  return null;
}

module.exports = {
  interpolatePrice,
  findNearestPrices,
  getInterpolatedPrice
}; 