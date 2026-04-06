import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2, CalendarDays, Clock3, IndianRupee, Users, ChevronRight, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';
import { cn } from '@/lib/utils';

const parseClinics = (clinicValue) => {
    if (!clinicValue) return [];
    return [...new Set(
        clinicValue
            .split(/\r?\n|,|;/)
            .map(item => item.trim())
            .filter(Boolean)
    )];
};

const FIXED_AVAILABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FIXED_HOURS_FROM = '09:00';
const FIXED_HOURS_TO = '20:00';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { doctor, doctorRecord } = useDoctor();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const clinics = useMemo(() => parseClinics(doctorRecord?.clinic_name || doctor?.clinicName), [doctorRecord?.clinic_name, doctor?.clinicName]);
    const today = new Date().toISOString().slice(0, 10);
    const todayAppointments = appointments.filter(item => String(item.date || '').slice(0, 10) === today);

    const clinicCards = useMemo(() => {
        if (!clinics.length) return [];

        return clinics.map(clinicName => {
            const relatedAppointments = appointments.filter(apt => {
                if (!apt.clinic_name) return clinics.length === 1;
                return apt.clinic_name === clinicName || String(apt.clinic_name).includes(clinicName);
            });

            return {
                clinicName,
                totalPatients: relatedAppointments.length,
                todayPatients: relatedAppointments.filter(apt => String(apt.date || '').slice(0, 10) === today).length,
                upcoming: relatedAppointments.find(apt => String(apt.date || '').slice(0, 10) >= today) || null,
            };
        });
    }, [appointments, clinics, today]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
                <p className="text-sm text-slate-500">
                    View your registered clinics, today&apos;s patients, and consultation activity.
                </p>
            </div>

            {doctorRecord?.status === 'Pending' && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm"
                >
                    <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-amber-800 text-sm tracking-tight">Account pending approval</p>
                        <p className="text-xs text-amber-700/80 mt-0.5 font-medium">The admin team will review your profile shortly.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Registered Clinics', value: clinics.length || 0, icon: Building2, tone: 'text-teal-600 bg-teal-50' },
                    { label: 'Today Appointments', value: todayAppointments.length, icon: CalendarDays, tone: 'text-blue-600 bg-blue-50' },
                    { label: 'Completed Today', value: todayAppointments.filter(item => item.status === 'Completed').length, icon: Clock3, tone: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Total Revenue', value: `Rs. ${(doctorRecord?.total_revenue || doctor?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, tone: 'text-amber-600 bg-amber-50' },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                        <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center mb-4', card.tone)}>
                            <card.icon size={20} />
                        </div>
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">My Clinics / Medicals</h2>
                            <p className="text-sm text-slate-500 mt-1">Click a clinic to see booked patients and start consultations.</p>
                        </div>
                    </div>

                    {clinicCards.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                            <Building2 size={28} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-medium text-slate-500">No clinic added yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Add your clinic name and timing from the profile page.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clinicCards.map((clinic, index) => (
                                <motion.button
                                    key={clinic.clinicName}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    onClick={() => navigate(`/doctor/clinics/${encodeURIComponent(clinic.clinicName)}`)}
                                    className="text-left rounded-3xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all p-5"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                            <Building2 size={20} />
                                        </div>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 text-base">{clinic.clinicName}</h3>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600">
                                            {clinic.totalPatients} total patients
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-xs font-medium text-teal-700">
                                            {clinic.todayPatients} today
                                        </span>
                                    </div>
                                    {clinic.upcoming && (
                                        <p className="mt-4 text-xs text-slate-500">
                                            Next booking: {clinic.upcoming.patient_name || clinic.upcoming.patient || 'Patient'} on {formatDate(clinic.upcoming.date)} at {clinic.upcoming.time_slot || '-'}
                                        </p>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-bold text-slate-800 text-lg mb-4">Consultation Window</h2>
                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Available Days</span>
                                <span className="font-semibold text-slate-800">{FIXED_AVAILABLE_DAYS.join(', ')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Start Time</span>
                                <span className="font-semibold text-slate-800">{FIXED_HOURS_FROM}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>End Time</span>
                                <span className="font-semibold text-slate-800">{FIXED_HOURS_TO}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Users size={18} className="text-teal-300" />
                            <h2 className="font-bold text-lg">Patient Snapshot</h2>
                        </div>
                        <p className="text-sm text-slate-300">All booked patients for your selected clinic will appear on the clinic page with Start and End consultation controls.</p>
                        <button
                            onClick={() => clinics[0] && navigate(`/doctor/clinics/${encodeURIComponent(clinics[0])}`)}
                            disabled={!clinics[0]}
                            className="mt-5 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-sm font-semibold transition"
                        >
                            Open Patient List
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="text-sm text-slate-400">Loading appointments...</div>
            )}
        </div>
    );
}
