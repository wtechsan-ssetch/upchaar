import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';

const STATUS_STYLE = {
    Confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-600 border-amber-200',
    Cancelled: 'bg-red-50 text-red-500 border-red-200',
    Completed: 'bg-blue-50 text-blue-600 border-blue-200',
    'In-Progress': 'bg-violet-50 text-violet-600 border-violet-200',
    Scheduled: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function DoctorAppointments() {
    const { doctorRecord } = useDoctor();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (!doctorRecord?.id) {
            setAppointments([]);
            setLoading(false);
            return;
        }

        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor_id', doctorRecord.id)
                    .order('date', { ascending: true })
                    .order('time_slot', { ascending: true });

                if (error) throw error;
                setAppointments(data || []);
            } catch (error) {
                console.error('Failed to load doctor appointments:', error.message);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [doctorRecord?.id]);

    const updateAppointmentStatus = async (appointmentId, nextStatus) => {
        setUpdatingId(appointmentId);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: nextStatus })
                .eq('id', appointmentId);

            if (error) throw error;

            setAppointments(prev => prev.map(apt => (
                apt.id === appointmentId ? { ...apt, status: nextStatus } : apt
            )));
        } catch (error) {
            console.error(`Failed to update appointment status to ${nextStatus}:`, error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = useMemo(() => appointments.filter(a => {
        const patientName = a.patient_name || a.patientName || a.patient || '';
        const matchFilter = filter === 'All' || a.status === filter;
        const matchSearch = !search || patientName.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    }), [appointments, filter, search]);

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Appointments</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{appointments.length} total appointments</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        placeholder="Search patient..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 w-56"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Pending', 'Confirmed', 'In-Progress', 'Scheduled', 'Completed', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-medium border transition',
                                filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30'
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {['Patient', 'Age', 'Issue', 'Date & Time', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Loading appointments...
                                    </span>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                                    No appointments found
                                </td>
                            </tr>
                        ) : filtered.map((apt, i) => (
                            <motion.tr
                                key={apt.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="hover:bg-slate-50/70 transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-slate-800">{apt.patient_name || apt.patientName || apt.patient || 'Patient'}</p>
                                        <p className="text-xs text-slate-400">{apt.patient_phone || '-'}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{apt.patient_age ? `${apt.patient_age} yrs` : '-'}</td>
                                <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate text-xs">{apt.issue || apt.specialization || 'Consultation'}</td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-700 font-medium text-xs">{formatDate(apt.date)}</p>
                                    <p className="text-slate-400 text-xs flex items-center gap-1"><Clock size={10} /> {apt.time_slot || '-'}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', STATUS_STYLE[apt.status] || STATUS_STYLE.Scheduled)}>{apt.status}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            disabled={updatingId === apt.id || apt.status === 'Confirmed' || apt.status === 'Completed'}
                                            onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Confirm appointment"
                                        >
                                            {updatingId === apt.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={updatingId === apt.id || apt.status === 'Cancelled' || apt.status === 'Completed'}
                                            onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Cancel appointment"
                                        >
                                            {updatingId === apt.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
