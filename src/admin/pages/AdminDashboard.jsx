import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Users, Stethoscope, CalendarCheck2, TrendingUp,
    TrendingDown, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, IndianRupee, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { cn } from '@/lib/utils';
import { useAdmin } from '../context/AdminContext.jsx';
import { fetchDashboardStats, fetchDoctors, fetchAppointments } from '@/lib/adminApi.js';
import { format } from 'date-fns';
import Skeleton from 'react-loading-skeleton';

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
    const [feeNotifications, setFeeNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeeNote, setSelectedFeeNote] = useState(null);

    useEffect(() => {
        Promise.all([
            fetchDashboardStats(),
            fetchDoctors(),
            fetchAppointments(),
            supabase
                .from('admin_notifications')
                .select('*')
                .eq('type', 'fee_change_request')
                .order('created_at', { ascending: false })
                .limit(10)
                .then(({ data }) => data || []),
        ])
            .then(([s, doctors, appointments, feeNotes]) => {
                setStats(s);
                setPendingDoctors(doctors.filter(d => d.status === 'Pending').slice(0, 4));
                setRecentAppointments(appointments.slice(0, 6));
                setFeeNotifications(feeNotes);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const markFeeNoteRead = async (id) => {
        await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
        setFeeNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

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
                <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening on Upchar Health today.</p>
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
                    {loading ? <Skeleton height={100} borderRadius={16} /> : (
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
                    )}
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
                    {loading ? <Skeleton count={3} height={50} className="mb-2" borderRadius={12} /> : (
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
                    )}
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800">Recent Appointments</h2>
                        <a href="/admin/appointments" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            View all <ArrowUpRight size={11} />
                        </a>
                    </div>
                    {loading ? <Skeleton count={4} height={50} className="mb-2" borderRadius={12} /> : (
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
                    )}
                </div>
            </div>
            {/* Fee Change Notifications */}
            {feeNotifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <IndianRupee size={16} className="text-amber-500" />
                            Fee Change Requests
                            {feeNotifications.some(n => !n.is_read) && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    {feeNotifications.filter(n => !n.is_read).length} new
                                </span>
                            )}
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {feeNotifications.map(note => (
                            <button
                                key={note.id}
                                onClick={() => setSelectedFeeNote(note)}
                                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                                    note.is_read
                                        ? 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                        : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                                }`}
                            >
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <IndianRupee size={14} className="text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{note.from_name}</p>
                                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{note.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {note.created_at
                                            ? new Date(note.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                            : ''}
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 mt-1">Click to read →</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Fee Note Detail Modal */}
            {selectedFeeNote && (
                <div
                    className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedFeeNote(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 p-6 border-b border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                                    <IndianRupee size={18} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Fee Change Request</p>
                                    <p className="font-bold text-slate-800 text-base leading-tight mt-0.5">
                                        {selectedFeeNote.from_name || 'Doctor'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFeeNote(null)}
                                className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shrink-0"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                            {selectedFeeNote.created_at && (
                                <span>
                                    <span className="font-semibold text-slate-600">Requested at:</span>{' '}
                                    {new Date(selectedFeeNote.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Full Message</p>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedFeeNote.message || '(No message)'}
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex justify-end">
                            <button
                                onClick={() => setSelectedFeeNote(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
