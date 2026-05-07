import { create } from 'zustand';
import { supabase } from '@/lib/supabase.js';
import _ from 'lodash';

export const useAnalyticsStore = create((set, get) => ({
  dateRange: 'month', // 'day', 'week', 'month', 'year'
  setDateRange: (range) => set({ dateRange: range }),
  
  data: {
    trends: [],
    distribution: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0,
      }]
    },
    statuses: [],
    stats: {
      totalPatients: 0,
      todayAppointments: 0,
      revenue: 0,
      avgWaitTime: 0,
    }
  },
  
  setData: (newData) => set((state) => ({ 
    data: { ...state.data, ...newData } 
  })),
  
  loading: false,
  setLoading: (loading) => set({ loading }),

  fetchAnalytics: async (orgId) => {
    if (!orgId) return;
    set({ loading: true });

    try {
      // 1. Fetch Core Stats (Total Patients, Today's Apps, Revenue)
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('fee, date, status, patient_name, type, created_at, patient_id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      const totalAppointments = appData.length;
      const todayAppointments = appData.filter(a => a.date?.startsWith(today)).length;
      const totalRevenue = appData.reduce((sum, a) => sum + (a.fee || 0), 0);
      
      // Calculate Efficiency (Completed / Total)
      const completedApps = appData.filter(a => a.status === 'Completed').length;
      const efficiency = totalAppointments > 0 ? Math.round((completedApps / totalAppointments) * 100) : 0;

      // Extract Recent Activities
      const recentActivities = appData.slice(0, 5).map(a => ({
        type: a.type || 'Appointment',
        user: a.patient_name || 'Unknown Patient',
        time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: a.status,
        color: a.status === 'Completed' ? 'emerald' : a.status === 'Confirmed' ? 'indigo' : 'amber'
      }));

      // Get unique patients
      const patientIds = [...new Set(appData.map(a => a.patient_id))];

      // 2. Fetch Trends (Last 30 days)
      const { data: trends, error: trendError } = await supabase
        .from('appointments')
        .select('date')
        .eq('organization_id', orgId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const trendMap = _.groupBy(trends.map(t => ({
        date: t.date?.split('T')[0]
      })), 'date');

      const formattedTrends = Object.entries(trendMap).map(([date, items]) => ({
        name: date,
        patients: items.length,
        appointments: items.length
      })).sort((a, b) => a.name.localeCompare(b.name));

      // 3. Fetch Department Distribution
      const { data: dist, error: distError } = await supabase
        .from('appointments')
        .select('specialization')
        .eq('organization_id', orgId);

      const distMap = _.countBy(dist, 'specialization');
      const formattedDist = {
        labels: Object.keys(distMap),
        datasets: [{
          data: Object.values(distMap),
          backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'],
          borderWidth: 0,
        }]
      };

      set({
        data: {
          trends: formattedTrends,
          distribution: formattedDist,
          activities: recentActivities,
          stats: {
            totalPatients: patientIds.length,
            todayAppointments,
            revenue: totalRevenue,
            avgWaitTime: 12,
            efficiency: efficiency
          }
        },
        loading: false
      });

    } catch (err) {
      console.error('Analytics fetch error:', err);
      set({ loading: false });
    }
  }
}));
