import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, Loader2, Play, Square, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';
import { cn } from '@/lib/utils';

const normalizeDay = (day) => (day || '').slice(0, 3).toLowerCase();

const parseTimeMinutes = (timeValue) => {
    const [hours = '0', minutes = '0'] = String(timeValue || '00:00').split(':');
    return Number(hours) * 60 + Number(minutes);
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const FIXED_AVAILABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FIXED_CHECK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FIXED_HOURS_FROM = '09:00';
const FIXED_HOURS_TO = '20:00';

const buildWaitMessage = (availableDays, hoursFrom, hoursTo) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTimeMinutes(hoursFrom);
    const endMinutes = parseTimeMinutes(hoursTo);
    const safeDays = availableDays?.length ? availableDays : [currentDay];
    const orderedDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (safeDays.some(day => normalizeDay(day) === normalizeDay(currentDay)) && currentMinutes < startMinutes) {
        const minutesLeft = startMinutes - currentMinutes;
        const hrs = Math.floor(minutesLeft / 60);
        const mins = minutesLeft % 60;
        return hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
    }

    if (safeDays.some(day => normalizeDay(day) === normalizeDay(currentDay)) && currentMinutes >= endMinutes) {
        const nextDay = safeDays.find(day => normalizeDay(day) !== normalizeDay(currentDay)) || safeDays[0];
        return `${nextDay} at ${hoursFrom}`;
    }

    const todayIndex = orderedDays.findIndex(day => normalizeDay(day) === normalizeDay(currentDay));
    const nextDay = [...safeDays]
        .sort((a, b) => orderedDays.findIndex(day => normalizeDay(day) === normalizeDay(a)) - orderedDays.findIndex(day => normalizeDay(day) === normalizeDay(b)))
        .find(day => orderedDays.findIndex(item => normalizeDay(item) === normalizeDay(day)) >= todayIndex)
        || safeDays[0];

    return `${nextDay} at ${hoursFrom}`;
};

export default function DoctorClinicPatients() {
    const navigate = useNavigate();
    const { clinicName: rawClinicName } = useParams();
    const clinicName = decodeURIComponent(rawClinicName || '');
    const { doctorRecord, doctor } = useDoctor();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const availableDays = FIXED_CHECK_DAYS;
    const hoursFrom = FIXED_HOURS_FROM;
    const hoursTo = FIXED_HOURS_TO;

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
                console.error('Failed to load clinic appointments:', error.message);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [doctorRecord?.id]);

    const clinicAppointments = useMemo(() => {
        if (!clinicName) return appointments;

        const normalizedClinic = clinicName.trim().toLowerCase();
        const taggedAppointments = appointments.filter(apt => apt.clinic_name);

        if (taggedAppointments.length === 0) {
            return appointments;
        }

        const matchedAppointments = appointments.filter(apt => {
            const appointmentClinic = String(apt.clinic_name || '').trim().toLowerCase();
            return appointmentClinic === normalizedClinic || appointmentClinic.includes(normalizedClinic);
        });

        return matchedAppointments.length > 0 ? matchedAppointments : appointments;
    }, [appointments, clinicName]);

    const showingFallbackAppointments = useMemo(() => {
        if (!clinicName) return false;
        const taggedAppointments = appointments.filter(apt => apt.clinic_name);
        if (taggedAppointments.length === 0 && appointments.length > 0) return true;
        return taggedAppointments.length > 0 && clinicAppointments.length === appointments.length;
    }, [appointments, clinicAppointments.length, clinicName]);

    const canStartConsultation = () => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = parseTimeMinutes(hoursFrom);
        const endMinutes = parseTimeMinutes(hoursTo);
        const allowedDay = !availableDays.length || availableDays.some(day => normalizeDay(day) === normalizeDay(currentDay));
        return allowedDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    const canEndConsultation = () => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = parseTimeMinutes(hoursTo);
        const allowedDay = !availableDays.length || availableDays.some(day => normalizeDay(day) === normalizeDay(currentDay));
        return allowedDay && currentMinutes >= endMinutes;
    };

    const updateStatus = async (appointmentId, nextStatus, timeField) => {
        setUpdatingId(appointmentId);
        try {
            const payload = { status: nextStatus };
            if (timeField) payload[timeField] = new Date().toISOString();

            const { error } = await supabase
                .from('appointments')
                .update(payload)
                .eq('id', appointmentId);

            if (error) throw error;

            setAppointments(prev => prev.map(apt => (
                apt.id === appointmentId ? { ...apt, ...payload } : apt
            )));
        } catch (error) {
            console.error(`Failed to update consultation status to ${nextStatus}:`, error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStart = (appointmentId) => {
        if (!canStartConsultation()) {
            window.alert(`You can start in ${buildWaitMessage(availableDays, hoursFrom, hoursTo)}.`);
            return;
        }
        updateStatus(appointmentId, 'In-Progress', 'started_at');
    };

    const handleEnd = (appointmentId) => {
        if (!canEndConsultation()) {
            window.alert(`You can end the consultation at ${hoursTo}.`);
            return;
        }
        updateStatus(appointmentId, 'Completed', 'ended_at');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/doctor/dashboard')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-3">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">{clinicName || 'Clinic Patients'}</h1>
                    <p className="text-sm text-slate-500 mt-1">Start works only during your registered start day/time. End works only at your registered end time.</p>
                    {showingFallbackAppointments && (
                        <p className="text-xs text-amber-600 mt-2">
                            Showing all booked patients for this doctor because clinic-specific booking data is not available on existing appointments yet.
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <Users className="text-teal-600" size={18} />
                        <div>
                            <p className="text-sm text-slate-500">Booked Patients</p>
                            <p className="text-2xl font-bold text-slate-800">{clinicAppointments.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="text-blue-600" size={18} />
                        <div>
                            <p className="text-sm text-slate-500">Available Days</p>
                            <p className="text-lg font-bold text-slate-800">{FIXED_AVAILABLE_DAYS.join(', ')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <Clock3 className="text-amber-600" size={18} />
                        <div>
                            <p className="text-sm text-slate-500">Consultation Time</p>
                            <p className="text-lg font-bold text-slate-800">{hoursFrom} - {hoursTo}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Patient', 'Date', 'Time', 'Issue', 'Status', 'Actions'].map(header => (
                                    <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading patients...
                                        </span>
                                    </td>
                                </tr>
                            ) : clinicAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                                        No patients booked for this clinic yet.
                                    </td>
                                </tr>
                            ) : clinicAppointments.map(apt => (
                                <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-800">{apt.patient_name || apt.patient || 'Patient'}</p>
                                            <p className="text-xs text-slate-400">{apt.patient_phone || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(apt.date)}</td>
                                    <td className="px-4 py-3 text-slate-600">{apt.time_slot || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{apt.issue || 'Consultation'}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                            apt.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                apt.status === 'In-Progress' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                                                    apt.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        )}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={updatingId === apt.id || ['In-Progress', 'Completed', 'Cancelled'].includes(apt.status)}
                                                onClick={() => handleStart(apt.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition"
                                            >
                                                {updatingId === apt.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                                                Start
                                            </button>
                                            <button
                                                type="button"
                                                disabled={updatingId === apt.id || apt.status !== 'In-Progress'}
                                                onClick={() => handleEnd(apt.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition"
                                            >
                                                {updatingId === apt.id ? <Loader2 size={13} className="animate-spin" /> : <Square size={13} />}
                                                End
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
