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
        setUpdatingId(appointmentId);
        try {
            const apt = appointments.find(a => a.id === appointmentId);
            const isCurrentlyCompleted = apt?.status === 'Completed';
            
            const updateData = { status: 'Completed', ended_at: new Date().toISOString() };

            let { error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', appointmentId);

            if (error?.message?.includes("Could not find the 'ended_at' column")) {
                const { ended_at: _unusedEndedAt, ...fallbackData } = updateData;
                ({ error } = await supabase
                    .from('appointments')
                    .update(fallbackData)
                    .eq('id', appointmentId));
            }

            if (error) throw error;

            if (!isCurrentlyCompleted && apt?.fee) {
                const { data: docData } = await supabase.from('doctors').select('total_revenue').eq('id', doctorRecord.id).single();
                if (docData) {
                    const newRev = (docData.total_revenue || 0) + Number(apt.fee);
                    await supabase.from('doctors').update({ total_revenue: newRev }).eq('id', doctorRecord.id);
                }
            }

            setAppointments(prev => prev.map(a => (
                a.id === appointmentId ? { ...a, ...updateData } : a
            )));
            window.alert('Consultation ended successfully!');
        } catch (error) {
            console.error('Failed to end consultation:', error.message);
            window.alert('Failed to end consultation. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

        setUpdatingId(appointmentId);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'Cancelled' })
                .eq('id', appointmentId);

            if (error) throw error;

            setAppointments(prev => prev.map(apt => (
                apt.id === appointmentId ? { ...apt, status: 'Cancelled' } : apt
            )));
            window.alert('Appointment cancelled successfully!');
        } catch (error) {
            console.error('Failed to cancel appointment:', error.message);
            window.alert('Failed to cancel appointment. Please try again.');
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
                let staffLinks = [];
                try {
                    // Try to find links using both doctor_id and profile_id for compatibility
                    const { data, error } = await supabase
                        .from('staff_links')
                        .select('organization_id, organization_type')
                        .or(`doctor_id.eq.${doctorRecord.id},doctor_id.eq.${doctorRecord.profile_id}`);

                    if (error) {
                        console.error('Error fetching staff links:', error);
                    } else {
                        staffLinks = data || [];
                    }
                } catch (err) {
                    console.error('Unexpected error fetching staff links:', err);
                }

                if (staffLinks.length > 0) {
                    // Filter out any null/undefined IDs and get unique list
                    const orgIds = [...new Set(staffLinks.map(l => l.organization_id).filter(Boolean))];

                    if (orgIds.length > 0) {
                        // Fetch all profiles in one go
                        const { data: profiles, error: profileError } = await supabase
                            .from('profiles')
                            .select('id, full_name, profile_type')
                            .in('id', orgIds);

                        if (profileError) {
                            console.error('Error fetching profiles:', profileError);
                        }

                        const enrichedOrgs = await Promise.all((profiles || []).map(async (profile) => {
                            try {
                                const link = staffLinks.find(l => l.organization_id === profile.id);
                                const table = link?.organization_type === 'medical' ? 'medicals' : 'clinics';

                                // Try to get more details from specialized table
                                const { data: specialized } = await supabase
                                    .from(table)
                                    .select('id, name, address, city, state')
                                    .eq('profile_id', profile.id)
                                    .maybeSingle();

                                return {
                                    id: specialized?.id || profile.id,
                                    profile_id: profile.id,
                                    name: specialized?.name || profile.full_name || 'Unnamed Organization',
                                    displayName: specialized?.name || profile.full_name || 'Unnamed Organization',
                                    type: link?.organization_type || profile.profile_type,
                                    address: specialized?.address,
                                    city: specialized?.city,
                                    state: specialized?.state
                                };
                            } catch (err) {
                                console.error(`Error enriching org ${profile.id}:`, err);
                                return {
                                    id: profile.id,
                                    profile_id: profile.id,
                                    name: profile.full_name || 'Unnamed Organization',
                                    displayName: profile.full_name || 'Unnamed Organization',
                                    type: profile.profile_type
                                };
                            }
                        }));

                        setLinkedOrgs(enrichedOrgs.filter(Boolean));
                    } else {
                        setLinkedOrgs([]);
                    }
                } else {
                    setLinkedOrgs([]);
                }

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

    const orgCards = useMemo(() => {
        if (!linkedOrgs.length) return [];

        return linkedOrgs.map(org => {
            const relatedAppointments = appointments.filter(apt => {
                // Support both legacy organization_id format and new format
                return apt.organization_id === org.id || apt.organization_id === org.profile_id;
            });

            return {
                ...org,
                displayName: org.name || 'Unnamed Organization',
                totalPatients: relatedAppointments.length,
                todayPatients: relatedAppointments.filter(apt => String(apt.date || '').slice(0, 10) === today).length,
                upcoming: relatedAppointments.find(apt => String(apt.date || '').slice(0, 10) >= today) || null,
                appointments: relatedAppointments,
            };
        });
    }, [appointments, linkedOrgs, today]);

    const getClinicName = (apt) => {
        const org = linkedOrgs.find(o => o.id === apt.organization_id || o.profile_id === apt.organization_id);
        return org ? org.name : (apt.clinic_name || 'Main Clinic');
    };

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
                ) : orgCards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <Building2 size={28} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">No linked clinics or medical centers.</p>
                        <p className="text-xs text-slate-400 mt-1">Provide your Secret Key to an admin to get linked.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orgCards.map((org, index) => (
                            <motion.button
                                key={org.id || org.profile_id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                onClick={() => setSelectedOrgForAppointments(org)}
                                className="text-left rounded-3xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                        <Building2 size={20} />
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 text-base">{org.displayName}</h3>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600">
                                        {org.totalPatients} total patients
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-xs font-medium text-teal-700">
                                        {org.todayPatients} today
                                    </span>
                                </div>
                                {org.upcoming && (
                                    <p className="mt-4 text-xs text-slate-500">
                                        Next booking: {org.upcoming.patient_name || org.upcoming.patient || 'Patient'} on {formatDate(org.upcoming.date)} at {org.upcoming.time_slot || '-'}
                                    </p>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Today's Appointments Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">Today&apos;s Appointments</h2>
                        <p className="text-sm text-slate-500 mt-1">Directly manage today&apos;s patient queue.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton height={80} borderRadius={24} />
                        <Skeleton height={80} borderRadius={24} />
                    </div>
                ) : todayAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <CalendarDays size={28} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">No appointments for today.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayAppointments.map((apt) => (
                            <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                                        {apt.queue_number || '#'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{apt.patient_name || apt.patient || 'Patient'}</p>
                                        <p className="text-xs text-slate-500">{apt.time_slot} · {apt.status}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Building2 size={12} className="text-teal-500" />
                                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">{getClinicName(apt)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(apt.status === 'Scheduled' || apt.status === 'Confirmed' || apt.status === 'Pending') ? (
                                        <button
                                            onClick={() => handleStart(apt.id)}
                                            disabled={updatingId === apt.id}
                                            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                                        >
                                            {updatingId === apt.id ? 'Starting...' : 'Start'}
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
                                            {apt.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Integrated Appointment Management Modal */}
            <DoctorAppointmentsModal
                isOpen={!!selectedOrgForAppointments}
                onClose={() => setSelectedOrgForAppointments(null)}
                doctor={doctorRecord}
                orgId={selectedOrgForAppointments?.id}
                orgProfileId={selectedOrgForAppointments?.profile_id}
                orgName={selectedOrgForAppointments?.name}
            />
        </div>
    );
}
