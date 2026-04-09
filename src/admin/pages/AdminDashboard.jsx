import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Users, Stethoscope, CalendarCheck2, TrendingUp,
    TrendingDown, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '../context/AdminContext.jsx';
import { fetchDashboardStats, fetchDoctors, fetchAppointments } from '@/lib/adminApi.js';
import { format } from 'date-fns';
import { Skeleton } from 'boneyard-js/react';

const STATUS_PIE_COLORS = {
    Completed: '#10b981',
    Pending: '#f59e0b',
    Cancelled: '#ef4444',
    Confirmed: '#3b82f6',
};

const STATUS_CONFIG = {
    Completed: { icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-600' },
    Pending: { icon: Clock, cls: 'bg-amber-50 text-amber-600' },
    Cancelled: { icon: XCircle, cls: 'bg-red-50 text-red-500' },
};

const StatCard = React.memo(function StatCard({ icon: Icon, label, value, sub, trend, color }) {
    const isPositive = trend >= 0;
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', color)}>
                    <Icon size={20} className="text-white" />
                </div>
                <span className={cn('flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full', isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')}>
                    {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(trend)}%
                </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    );
});

export default function AdminDashboard() {
    const { admin } = useAdmin();
    const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAppointments: 0, platformRevenue: 0 });
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchDashboardStats(), fetchDoctors(), fetchAppointments()])
            .then(([s, doctors, appointments]) => {
                setStats(s);
                setPendingDoctors(doctors.filter(d => d.status === 'Pending').slice(0, 4));
                setRecentAppointments(appointments.slice(0, 6));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Build pie data from real appointments
    const statusPie = useMemo(() => {
        const counts = { Completed: 0, Pending: 0, Cancelled: 0 };
        recentAppointments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
        return Object.entries(counts).map(([name, value]) => ({ name, value, color: STATUS_PIE_COLORS[name] }));
    }, [recentAppointments]);

    // Compute greeting directly so it always reflects current time, since useMemo could make it stale
    const h = new Date().getHours();
    const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const greeting = `Good ${timeOfDay}, ${admin?.name?.split(' ')[0]} 👋`;

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {greeting}
                </h1>
                <p className="text-sm text-slate-500 mt-1">Here's what's happening on Upchaar Health today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Stethoscope} label="Total Doctors" value={loading ? '…' : stats.totalDoctors}
                    sub={`${pendingDoctors.length} pending review`} trend={12} color="bg-gradient-to-br from-primary to-teal-400" />
                <StatCard icon={Users} label="Total Patients" value={loading ? '…' : stats.totalPatients}
                    sub="Active users" trend={8} color="bg-gradient-to-br from-blue-500 to-blue-400" />
                <StatCard icon={CalendarCheck2} label="Appointments" value={loading ? '…' : stats.totalAppointments}
                    sub="All time" trend={-3} color="bg-gradient-to-br from-violet-500 to-purple-400" />
                <StatCard icon={TrendingUp} label="Platform Revenue" value={loading ? '…' : `₹${((stats.platformRevenue || 0) / 1000).toFixed(1)}K`}
                    sub="10% commission" trend={15} color="bg-gradient-to-br from-amber-500 to-orange-400" />
            </div>

            {/* Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="font-semibold text-slate-800 mb-4">Appointment Status Overview</h2>
                    <Skeleton name="appointment-overview" loading={loading}>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries({ Completed: '#10b981', Pending: '#f59e0b', Cancelled: '#ef4444' }).map(([label, color]) => {
                                const count = recentAppointments.filter(a => a.status === label).length;
                                return (
                                    <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                                        <div className="h-3 w-3 rounded-full mx-auto mb-2" style={{ background: color }} />
                                        <p className="text-2xl font-bold text-slate-800">{count}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Skeleton>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="font-semibold text-slate-800 mb-4">Appointment Status</h2>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={statusPie} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                                {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                        {statusPie.map(s => (
                            <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                                    <span className="text-slate-600">{s.name}</span>
                                </div>
                                <span className="font-semibold text-slate-700">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pending Doctor Applications */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800">Pending Applications</h2>
                        <a href="/admin/doctors" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            View all <ArrowUpRight size={11} />
                        </a>
                    </div>
                    <Skeleton name="pending-doctors" loading={loading}>
                        <div className="space-y-3">
                            {pendingDoctors.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No pending applications</p>
                            ) : pendingDoctors.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                        {(doc.full_name || doc.fullName || '?').replace('Dr. ', '')[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{doc.full_name || doc.fullName}</p>
                                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                                        <AlertCircle size={10} /> Pending
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Skeleton>
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800">Recent Appointments</h2>
                        <a href="/admin/appointments" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            View all <ArrowUpRight size={11} />
                        </a>
                    </div>
                    <Skeleton name="recent-appointments" loading={loading}>
                        <div className="space-y-3">
                            {recentAppointments.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No appointments yet</p>
                            ) : recentAppointments.map(apt => {
                                const { icon: Icon, cls } = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
                                return (
                                    <div key={apt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', cls)}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{apt.patient_name || apt.patientName}</p>
                                            <p className="text-xs text-slate-500">{apt.doctor_name || apt.doctorName} · {apt.specialization}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-slate-700">₹{apt.fee}</p>
                                            <p className="text-[10px] text-slate-400">{apt.date ? format(new Date(apt.date), 'dd MMM') : ''}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Skeleton>
                </div>
            </div>
        </div>
    );
}
