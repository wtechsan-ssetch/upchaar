import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, CalendarDays, Clock3, IndianRupee, Users, ChevronRight, AlertCircle, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';
import { cn } from '@/lib/utils';
import DoctorAppointmentsModal from '@/components/dashboard/DoctorAppointmentsModal';
import Skeleton from 'react-loading-skeleton';

const parseClinics = (clinicValue) => {
    if (!clinicValue) return [];
    return [...new Set(
        clinicValue
            .split(/\r?\n|,|;/)
            .map(item => item.trim())
            .filter(Boolean)
    )];
};
const normalizeDay = (day) => (day || '').slice(0, 3).toLowerCase();

const parseTimeMinutes = (timeValue) => {
    const [hours = '0', minutes = '0'] = String(timeValue || '00:00').split(':');
    return Number(hours) * 60 + Number(minutes);
};

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
    const [linkedOrgs, setLinkedOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgForAppointments, setSelectedOrgForAppointments] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const availableDays = doctor?.availableDays || doctorRecord?.available_days || FIXED_AVAILABLE_DAYS;
    const hoursFrom = doctor?.hoursFrom || doctorRecord?.hours_from || FIXED_HOURS_FROM;
    const hoursTo = doctor?.hoursTo || doctorRecord?.hours_to || FIXED_HOURS_TO;

    const canStartConsultation = () => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = parseTimeMinutes(hoursFrom);
        const endMinutes = parseTimeMinutes(hoursTo);
        const allowedDay = !availableDays.length || availableDays.some(day => normalizeDay(day) === normalizeDay(currentDay));
        return allowedDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    const handleStart = async (appointmentId) => {
        if (!canStartConsultation()) {
            window.alert(`You can start in ${buildWaitMessage(availableDays, hoursFrom, hoursTo)}.`);
            return;
        }

        setUpdatingId(appointmentId);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'In-Progress', started_at: new Date().toISOString() })
                .eq('id', appointmentId);

            if (error) throw error;

            setAppointments(prev => prev.map(apt => (
                apt.id === appointmentId ? { ...apt, status: 'In-Progress', started_at: new Date().toISOString() } : apt
            )));
            window.alert('Consultation started successfully!');
        } catch (error) {
            console.error('Failed to start consultation:', error.message);
            window.alert('Failed to start consultation. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    };

    const canEndConsultation = () => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = parseTimeMinutes(hoursTo);
        const allowedDay = !availableDays.length || availableDays.some(day => normalizeDay(day) === normalizeDay(currentDay));
        return allowedDay && currentMinutes >= endMinutes;
    };

    const handleEnd = async (appointmentId) => {
        if (!canEndConsultation()) {
            window.alert(`You can end the consultation at ${hoursTo}.`);
            return;
        }

        setUpdatingId(appointmentId);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'Completed', ended_at: new Date().toISOString() })
                .eq('id', appointmentId);

            if (error) throw error;

            setAppointments(prev => prev.map(apt => (
                apt.id === appointmentId ? { ...apt, status: 'Completed', ended_at: new Date().toISOString() } : apt
            )));
            window.alert('Consultation ended successfully!');
        } catch (error) {
            console.error('Failed to end consultation:', error.message);
            window.alert('Failed to end consultation. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        if (!doctorRecord?.id) {
            setAppointments([]);
            setLinkedOrgs([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch appointments
                const { data: aptData, error: aptError } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor_id', doctorRecord.id)
                    .order('date', { ascending: true })
                    .order('time_slot', { ascending: true });

                if (aptError) throw aptError;
                setAppointments(aptData || []);

                // 2. Fetch linked organizations
                const { data: staffLinks, error: staffError } = await supabase
                    .from('staff_links')
                    .select('*, organization:organization_id(id, full_name, clinics(*), medicals(*))')
                    .eq('doctor_id', doctorRecord.id);

                if (staffError) throw staffError;

                const orgs = (staffLinks || []).map(link => {
                    const profile = link.organization;
                    if (!profile) return null;

                    // A profile can have one clinic or one medical store
                    const orgDetails = (profile.clinics && profile.clinics[0]) || (profile.medicals && profile.medicals[0]);
                    
                    if (!orgDetails) return null;

                    return {
                        ...orgDetails,
                        id: orgDetails.id, // Entry ID for timetables
                        profile_id: profile.id, // Profile ID for appointments
                        type: link.organization_type,
                        displayName: orgDetails.name || profile.full_name
                    };
                }).filter(Boolean);

                setLinkedOrgs(orgs);

            } catch (error) {
                console.error('Failed to load dashboard data:', error.message);
                setAppointments([]);
                setLinkedOrgs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [doctorRecord?.id]);

    const clinics = useMemo(() => parseClinics(doctorRecord?.clinic_name || doctor?.clinicName), [doctorRecord?.clinic_name, doctor?.clinicName]);
    const today = new Date().toISOString().slice(0, 10);
    const todayAppointments = useMemo(() => appointments.filter(item => String(item.date || '').slice(0, 10) === today), [appointments, today]);

    const statCards = useMemo(() => [
        { label: 'Linked Organizations', value: linkedOrgs.length || 0, icon: Building2, tone: 'text-teal-600 bg-teal-50' },
        { label: 'Today Appointments', value: todayAppointments.length, icon: CalendarDays, tone: 'text-blue-600 bg-blue-50' },
        { label: 'Completed Today', value: todayAppointments.filter(item => item.status === 'Completed').length, icon: Clock3, tone: 'text-emerald-600 bg-emerald-50' },
        { label: 'Total Revenue', value: `Rs. ${(doctorRecord?.total_revenue || doctor?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, tone: 'text-amber-600 bg-amber-50' },
    ], [linkedOrgs.length, todayAppointments, doctorRecord?.total_revenue, doctor?.totalRevenue]);

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
                appointments: relatedAppointments,
            };
        });
    }, [appointments, clinics, today]);

    const [selectedClinic, setSelectedClinic] = useState(null);

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

            <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Secret Key</p>
                        <p className="text-lg font-mono font-bold text-teal-700">{doctorRecord?.secret_key || '—'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-medium text-slate-500 max-w-[200px]">Share this key with medical centers or clinics to link your profile with them.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} height={120} borderRadius={24} />
                    ))
                ) : (
                    statCards.map(card => (
                        <div key={card.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                            <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center mb-4', card.tone)}>
                                <card.icon size={20} />
                            </div>
                            <p className="text-sm text-slate-500">{card.label}</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">My Clinics / Medicals</h2>
                        <p className="text-sm text-slate-500 mt-1">Click a clinic to see booked patients right here.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton height={180} borderRadius={24} />
                        <Skeleton height={180} borderRadius={24} />
                    </div>
                ) : clinicCards.length === 0 ? (
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
                                onClick={() => setSelectedClinic(clinic)}
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

            <Skeleton name="appointments" loading={loading}>
                <div className="text-sm text-slate-400">Appointments ready.</div>
            </Skeleton>

            {/* Integrated Appointment Management Modal */}
            <DoctorAppointmentsModal
                isOpen={!!selectedOrgForAppointments}
                onClose={() => setSelectedOrgForAppointments(null)}
                doctor={doctorRecord}
                orgId={selectedOrgForAppointments?.id}
                orgProfileId={selectedOrgForAppointments?.profile_id}
            />
        </div>
    );
}
