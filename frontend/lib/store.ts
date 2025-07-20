import { create } from 'zustand';
import axios from 'axios';

interface PriceData {
  price: number;
  source: 'cache' | 'alchemy' | 'interpolated';
  timestamp: number;
  cached?: boolean;
  interpolation?: {
    beforePrice: any;
    afterPrice: any;
  };
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalDays: number;
  processedDays: number;
  error?: string;
}

interface PriceOracleStore {
  // State
  priceData: PriceData | null;
  jobStatus: JobStatus | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPrice: (token: string, network: string, timestamp: number) => Promise<void>;
  scheduleHistory: (token: string, network: string) => Promise<void>;
  getJobStatus: (jobId: string) => Promise<void>;
  clearError: () => void;
  clearPriceData: () => void;
}

export const usePriceOracleStore = create<PriceOracleStore>((set, get) => ({
  // Initial state
  priceData: null,
  jobStatus: null,
  loading: false,
  error: null,

  // Fetch price for a specific timestamp
  fetchPrice: async (token: string, network: string, timestamp: number) => {
    set({ loading: true, error: null });
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/price-oracle/price`, {
        params: {
          token,
          network,
          timestamp
        }
      });
      
      set({ 
        priceData: response.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch price data',
        loading: false 
      });
    }
  },

  // Schedule full history fetch
  scheduleHistory: async (token: string, network: string) => {
    set({ loading: true, error: null });
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/api/price-oracle/schedule`, {
        token,
        network
      });
      
      set({ 
        jobStatus: {
          jobId: response.data.jobId,
          status: 'pending',
          progress: 0,
          totalDays: 0,
          processedDays: 0
        },
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to schedule history fetch',
        loading: false 
      });
    }
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/price-oracle/jobs/${jobId}`);
      
      set({ 
        jobStatus: response.data
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to get job status'
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear price data
  clearPriceData: () => {
    set({ priceData: null });
  }
})); 