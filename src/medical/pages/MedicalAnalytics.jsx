import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Doughnut } from 'react-chartjs-2';
import ReactECharts from 'echarts-for-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartJSTooltip, 
  Legend as ChartJSLegend 
} from 'chart.js';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';
import { useAnalyticsStore } from '../context/analyticsStore';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Filter
} from 'lucide-react';
import _ from 'lodash';

// Register Chart.js components
ChartJS.register(ArcElement, ChartJSTooltip, ChartJSLegend);

const MedicalAnalytics = ({ orgId }) => {
  const { dateRange, setDateRange, data, loading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    if (orgId) {
      fetchAnalytics(orgId);
    }
  }, [orgId, fetchAnalytics]);

  const trends = useMemo(() => data.trends, [data.trends]);
  const distribution = useMemo(() => data.distribution, [data.distribution]);
  const stats = useMemo(() => data.stats, [data.stats]);

  const eChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
      {
        name: 'Efficiency',
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.25, '#FF6E76'],
              [0.5, '#FDDD60'],
              [0.75, '#58D9F9'],
              [1, '#7CFFB2']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: -60,
          formatter: function (value) {
            if (value === 87.5) return 'Good';
            if (value === 62.5) return 'Average';
            if (value === 37.5) return 'Fair';
            if (value === 12.5) return 'Poor';
            return '';
          }
        },
        title: {
          offsetCenter: [0, '-20%'],
          fontSize: 20
        },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: 'auto'
        },
        data: [{ value: stats.efficiency || 0, name: 'Service Rate' }]
      }
    ]
  };

  // ── UI Components ───────────────────────────────────────────────────

  const StatCard = ({ title, value, icon: Icon, trend, color }) => {
    const colorClasses = {
      indigo: 'bg-indigo-50 text-indigo-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      rose: 'bg-rose-50 text-rose-600',
      amber: 'bg-amber-50 text-amber-600',
    };

    const statusClasses = {
      emerald: 'bg-emerald-50 text-emerald-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      amber: 'bg-amber-50 text-amber-600',
      rose: 'bg-rose-50 text-rose-600',
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-50 text-slate-600'} group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </motion.div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Medical Intelligence</h1>
          <p className="text-slate-500 mt-1">Real-time performance analytics and patient insights</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                dateRange === range 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {_.capitalize(range)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} trend={12} color="indigo" />
        <StatCard title="Today's Apps" value={stats.todayAppointments} icon={Calendar} trend={5} color="emerald" />
        <StatCard title="Total Revenue" value={`Rs. ${stats.revenue.toLocaleString()}`} icon={TrendingUp} trend={8} color="rose" />
        <StatCard title="Avg. Wait Time" value={`${stats.avgWaitTime} min`} icon={Clock} trend={-15} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Trends (Recharts) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Patient Volume Trends</h2>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Patients</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Apps</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                <Area type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department Distribution (Chart.js) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Patient Distribution</h2>
          <div className="h-[250px] flex items-center justify-center">
            {distribution?.labels?.length > 0 ? (
              <Doughnut 
                data={distribution} 
                options={{
                  cutout: '75%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 11 }
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">pie_chart_off</span>
                <p className="text-xs">No data available</p>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Top Dept</span>
              <span className="font-semibold text-slate-800">Cardiology</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[35%]" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Efficiency (ECharts) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Service Efficiency</h2>
          <p className="text-xs text-slate-400 mb-4">Real-time throughput measurement</p>
          <div className="h-[250px]">
            <ReactECharts option={eChartsOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </motion.div>

        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Recent Medical Activity</h2>
            <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {(data.activities || []).length > 0 ? (
              data.activities.map((activity, i) => {
                const bgClass = {
                  emerald: 'bg-emerald-50',
                  indigo: 'bg-indigo-50',
                  amber: 'bg-amber-50',
                  rose: 'bg-rose-50',
                }[activity.color] || 'bg-slate-50';
                const textClass = {
                  emerald: 'text-emerald-600',
                  indigo: 'text-indigo-600',
                  amber: 'text-amber-600',
                  rose: 'text-rose-600',
                }[activity.color] || 'text-slate-600';

                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${textClass} font-bold`}>
                        {activity.user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{activity.user}</p>
                        <p className="text-xs text-slate-500">{activity.type} • {activity.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${bgClass} ${textClass}`}>
                      {activity.status}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                <p className="text-sm">No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalAnalytics;
