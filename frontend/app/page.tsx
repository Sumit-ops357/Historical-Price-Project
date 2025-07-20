'use client';

import { useState, useEffect } from 'react';
import { usePriceOracleStore } from '../lib/store';
import { format } from 'date-fns';
import { Search, Calendar, Database, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [timestamp, setTimestamp] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const {
    priceData,
    jobStatus,
    loading,
    error,
    fetchPrice,
    scheduleHistory,
    getJobStatus,
    clearError,
    clearPriceData
  } = usePriceOracleStore();

  // Convert date to timestamp when selected
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setTimestamp(Math.floor(date.getTime() / 1000).toString());
    }
  }, [selectedDate]);

  // Poll job status if job is processing
  useEffect(() => {
    if (jobStatus && (jobStatus.status === 'pending' || jobStatus.status === 'processing')) {
      const interval = setInterval(() => {
        getJobStatus(jobStatus.jobId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobStatus, getJobStatus]);

  const handleFetchPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress || !network || !timestamp) {
      return;
    }
    await fetchPrice(tokenAddress, network, parseInt(timestamp));
  };

  const handleScheduleHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress || !network) {
      return;
    }
    await scheduleHistory(tokenAddress, network);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cache':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'alchemy':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'interpolated':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'cache':
        return 'Cached';
      case 'alchemy':
        return 'Alchemy API';
      case 'interpolated':
        return 'Interpolated';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Historical Token Price Oracle
            </h1>
            <p className="text-lg text-gray-600">
              Get historical token prices with interpolation engine
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Price Lookup Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Search className="w-6 h-6 mr-2" />
                Price Lookup
              </h2>
              
              <form onSubmit={handleFetchPrice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Get Price
                    </>
                  )}
                </button>
              </form>

              {/* Price Result */}
              {priceData && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        {getSourceIcon(priceData.source)}
                        <span className="ml-2 text-sm text-gray-600">
                          {getSourceText(priceData.source)}
                        </span>
                        {priceData.cached && (
                          <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            Cached
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${priceData.price.toFixed(6)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(priceData.timestamp * 1000), 'PPP p')}
                      </div>
                    </div>
                  </div>
                  
                  {priceData.interpolation && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-xs text-gray-600">
                        Interpolated from:
                        <div className="mt-1">
                          Before: ${priceData.interpolation.beforePrice?.price?.toFixed(6)} 
                          ({format(new Date(priceData.interpolation.beforePrice?.timestamp * 1000), 'PP')})
                        </div>
                        <div>
                          After: ${priceData.interpolation.afterPrice?.price?.toFixed(6)} 
                          ({format(new Date(priceData.interpolation.afterPrice?.timestamp * 1000), 'PP')})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Schedule History Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                Schedule Full History
              </h2>
              
              <form onSubmit={handleScheduleHistory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Full History
                    </>
                  )}
                </button>
              </form>

              {/* Job Status */}
              {jobStatus && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(jobStatus.status)}
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Job Status: {jobStatus.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {jobStatus.processedDays}/{jobStatus.totalDays} days
                    </span>
                  </div>
                  
                  {jobStatus.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${jobStatus.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    Progress: {jobStatus.progress}%
                  </div>
                  
                  {jobStatus.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {jobStatus.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Example Tokens */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Example Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">USDC (Ethereum)</div>
                <div className="text-sm text-gray-600">0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">UNI (Polygon)</div>
                <div className="text-sm text-gray-600">0xb33EaAd8d922B1083446DC5fE05e5A9C3C3C3C3C</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 