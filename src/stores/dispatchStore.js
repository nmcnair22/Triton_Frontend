import { defineStore } from 'pinia';
import { ApiService } from '@/service/ApiService';
import { formatISO } from 'date-fns';

export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    // Loading states
    loading: {
      volumeStats: false,
      revenueStats: false,
      dashboardData: false
    },
    
    // Error states
    errors: {
      volumeStats: null,
      revenueStats: null,
      dashboardData: null
    },
    
    // Date range filter
    dateRange: {
      startDate: null,
      endDate: null
    },
    
    // Key metrics (initialized to zero)
    totalDispatches: 0,
    totalRevenue: 0,
    averageMargin: 0,
    completionRate: 0,
    
    // Previous period metrics for comparison
    previousPeriod: {
      totalDispatches: 0,
      totalRevenue: 0,
      averageMargin: 0,
      completionRate: 0
    }
  }),
  
  getters: {
    // Calculate percentage changes for KPI indicators
    dispatchCountChange: (state) => {
      if (!state.previousPeriod.totalDispatches) return 0;
      return ((state.totalDispatches - state.previousPeriod.totalDispatches) / state.previousPeriod.totalDispatches) * 100;
    },
    
    revenueChange: (state) => {
      if (!state.previousPeriod.totalRevenue) return 0;
      return ((state.totalRevenue - state.previousPeriod.totalRevenue) / state.previousPeriod.totalRevenue) * 100;
    },
    
    marginChange: (state) => {
      if (!state.previousPeriod.averageMargin) return 0;
      return state.averageMargin - state.previousPeriod.averageMargin;
    },
    
    completionRateChange: (state) => {
      if (!state.previousPeriod.completionRate) return 0;
      return state.completionRate - state.previousPeriod.completionRate;
    }
  },
  
  actions: {
    // Set date range for filtering dashboard data
    setDateRange(startDate, endDate) {
      if (startDate && endDate) {
        this.dateRange.startDate = startDate instanceof Date ? startDate : new Date(startDate);
        this.dateRange.endDate = endDate instanceof Date ? endDate : new Date(endDate);
        console.log('Date range set:', this.dateRange);
      } else {
        console.error('Invalid date range provided:', { startDate, endDate });
      }
    },
    
    // Fetch all dashboard data
    async fetchDashboardData() {
      this.loading.dashboardData = true;
      this.errors.dashboardData = null;
      
      try {
        // Use Promise.all to fetch data concurrently
        await Promise.all([
          this.fetchVolumeStats(),
          this.fetchRevenueStatistics()
        ]);
        console.log('All dashboard data loaded');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        this.errors.dashboardData = 'Failed to load dashboard data';
      } finally {
        this.loading.dashboardData = false;
      }
    },
    
    // Fetch volume statistics
    async fetchVolumeStats() {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        console.error('Date range not set');
        return;
      }
      
      this.loading.volumeStats = true;
      this.errors.volumeStats = null;
      
      try {
        // Placeholder for API call - will be implemented later
        console.log('Fetching volume stats for date range:', this.dateRange);
        
        // Mock data for development
        this.totalDispatches = 245;
        this.previousPeriod.totalDispatches = 210;
        this.completionRate = 89.5;
        this.previousPeriod.completionRate = 82.7;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error('Error fetching volume stats:', error);
        this.errors.volumeStats = 'Failed to load volume statistics';
      } finally {
        this.loading.volumeStats = false;
      }
    },
    
    // Fetch revenue statistics
    async fetchRevenueStatistics() {
      if (!this.dateRange.startDate || !this.dateRange.endDate) {
        console.error('Date range not set');
        return;
      }
      
      this.loading.revenueStats = true;
      this.errors.revenueStats = null;
      
      try {
        // Placeholder for API call - will be implemented later
        console.log('Fetching revenue stats for date range:', this.dateRange);
        
        // Mock data for development
        this.totalRevenue = 138500;
        this.previousPeriod.totalRevenue = 120400;
        this.averageMargin = 24.8;
        this.previousPeriod.averageMargin = 23.5;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));
      } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        this.errors.revenueStats = 'Failed to load revenue statistics';
      } finally {
        this.loading.revenueStats = false;
      }
    }
  }
}); 