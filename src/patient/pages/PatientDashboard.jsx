/**
 * PatientDashboard.jsx
 * ─────────────────────────────────────────────────
 * Main dashboard for authenticated patients.
 * Features: profile photo upload, quick actions, profile info card,
 *           upcoming appointments banner with queue numbers.
 * ─────────────────────────────────────────────────
 */

import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Calendar, FileText, Pill,
    MapPin, ChevronRight, Activity, Camera, Loader2,
    Hash, Clock, CalendarCheck2, Stethoscope, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { uploadAvatar } from '@/lib/uploadImage.js';
import { supabase } from '@/lib/supabase.js';
import ChangePasswordModal from '@/components/ChangePasswordModal.jsx';

// ── Quick action cards shown on the dashboard ─────
const QUICK_ACTIONS = [
    { icon: Calendar, label: 'Book Appointment', desc: 'Schedule with a doctor', color: 'from-blue-500 to-indigo-500', href: '/doctors' },
    { icon: FileText, label: 'Medical Records', desc: 'View your health history', color: 'from-violet-500 to-purple-500', href: '/records' },
    { icon: Pill, label: 'Prescriptions', desc: 'Your current medications', color: 'from-orange-500 to-amber-500', href: '/records' },
    { icon: MapPin, label: 'Find Nearby', desc: 'Hospitals & clinics', color: 'from-emerald-500 to-teal-500', href: '/hospitals' },
];

/* ── Format date helper ── */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function isToday(dateStr) {
    return dateStr === new Date().toISOString().split('T')[0];
}
function isFuture(dateStr) {
    return dateStr >= new Date().toISOString().split('T')[0];
}

/* ── Appointment Banner Card ── */
function AppointmentBannerCard({ appt, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className="flex-shrink-0 w-72 sm:w-80 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-teal-500/30 relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />

            <div className="relative z-10">
                {/* Queue badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Stethoscope size={11} /> In-Clinic
                    </span>
                    <div className="flex items-center gap-1.5 bg-white text-teal-600 font-extrabold text-sm px-3 py-1 rounded-full shadow-sm">
                        <Hash size={13} />
                        <span>Queue #{appt.queue_number ?? '—'}</span>
                    </div>
                </div>

                {/* Doctor name */}
                <p className="text-white font-bold text-base leading-tight line-clamp-1 mb-3">
                    {appt.doctor_name || 'Doctor'}
                </p>
                {appt.specialization && (
                    <p className="text-white/70 text-xs mb-3 -mt-2">{appt.specialization}</p>
                )}

                {/* Date & Time — DB stores date as timestamptz */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white text-xs">
                        <CalendarCheck2 size={13} className="text-white/70" />
                        <span className="font-medium">
                            {appt.date && isToday(appt.date.split('T')[0]) ? '🗓 Today' : formatDate(appt.date ? appt.date.split('T')[0] : '')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-white text-xs">
                        <Clock size={13} className="text-white/70" />
                        <span className="font-medium">{appt.time_slot}</span>
                    </div>
                </div>

                {/* Status pill */}
                <div className="mt-4">
                    <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize">
                        ✓ {appt.status || 'Confirmed'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Appointments Banner Section ── */
function AppointmentsBanner({ patientId }) {
    const [appointments, setAppointments] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!patientId) return;
        const today = new Date().toISOString().split('T')[0];

        // 'date' is a timestamptz — compare from start of today
        const todayStart = new Date(today + 'T00:00:00').toISOString();

        supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .gte('date', todayStart)
            .order('date', { ascending: true })
            .order('queue_number', { ascending: true })
            .limit(10)
            .then(({ data, error }) => {
                if (!error && data) setAppointments(data);
                setLoadingAppts(false);
            });
    }, [patientId]);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
        }
    };

    if (loadingAppts) {
        return (
            <div className="mb-8">
                <h2 className="text-base font-semibold text-slate-700 mb-4">Upcoming Appointments</h2>
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <Loader2 size={18} className="animate-spin text-teal-500" />
                    <span className="text-sm text-slate-500">Loading appointments…</span>
                </div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="mb-8">
                <h2 className="text-base font-semibold text-slate-700 mb-4">Upcoming Appointments</h2>
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                    <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No upcoming appointments</p>
                    <p className="text-xs text-slate-400 mt-1">Book with a doctor to see your appointments here.</p>
                    <Link
                        to="/doctors"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition"
                    >
                        <Calendar size={13} /> Book Appointment
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-700">Upcoming Appointments</h2>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => scroll('left')}
                        className="h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition"
                    >
                        <ChevronLeft size={15} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition"
                    >
                        <ChevronRightIcon size={15} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {appointments.map((appt, i) => (
                    <AppointmentBannerCard key={appt.id} appt={appt} index={i} />
                ))}
            </div>
        </div>
    );
}

/* ── Main Dashboard ─────────────────────────────── */
export default function PatientDashboard() {
    const { patient, loading, signOut, updateProfile } = usePatient();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [changePwOpen, setChangePwOpen] = useState(false);

    /**
     * handleAvatarChange
     * Uploads the selected image to Supabase Storage and saves
     * the public URL to public.profiles.avatar_url.
     */
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarError('');
        setUploadingAvatar(true);
        try {
            const url = await uploadAvatar(file, patient.id);
            await updateProfile({ avatar_url: url });
        } catch (err) {
            setAvatarError(err.message || 'Upload failed. Try again.');
        } finally {
            setUploadingAvatar(false);
            // Reset input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Show spinner while session is being restored from Supabase
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            </div>
        );
    }

    // Redirect unauthenticated users to login
    if (!patient) {
        navigate('/patient/login', { replace: true });
        return null;
    }

    // Get initials for avatar fallback
    const initials = patient.full_name
        ? patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'P';

    return (
        <>
            <div className="space-y-8">

                {/* ── Welcome hero ──────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl shadow-emerald-500/20"
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar with upload button */}
                        <div className="relative flex-shrink-0">
                            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                {patient.avatar_url
                                    ? <img src={patient.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    : initials
                                }
                            </div>
                            {/* Camera button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                title="Change profile photo"
                                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md hover:bg-emerald-50 transition disabled:opacity-60"
                            >
                                {uploadingAvatar
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Camera size={13} />
                                }
                            </button>
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div>
                            <p className="text-white/70 text-sm">Welcome back,</p>
                            <h1 className="text-2xl font-bold">{patient.full_name || 'Patient'}</h1>
                            <p className="text-white/70 text-sm mt-0.5">{patient.email}</p>
                        </div>
                    </div>

                    {/* Upload error */}
                    {avatarError && (
                        <p className="mt-3 text-xs text-red-100 bg-white/10 rounded-lg px-3 py-2">
                            ⚠ {avatarError}
                        </p>
                    )}

                    {/* Health summary pills */}
                    <div className="flex flex-wrap gap-2 mt-5">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                            <Activity size={12} /> Status: {patient.status ?? 'Active'}
                        </span>
                        {patient.phone && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                                📱 {patient.phone}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                            <User size={12} /> Patient Account
                        </span>
                    </div>
                </motion.div>

                {/* ── Upcoming Appointments Banner ─── */}
                <AppointmentsBanner patientId={patient.id} />

                {/* ── Quick actions grid ────────────── */}
                <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {QUICK_ACTIONS.map(({ icon: Icon, label, desc, color, href }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.35 }}
                        >
                            <Link
                                to={href}
                                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
                                    <Icon size={22} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">{label}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* ── Profile info card ─────────────── */}
                <h2 className="text-base font-semibold text-slate-700 mb-4">Your Profile</h2>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Full Name', value: patient.full_name || '—' },
                            { label: 'Email', value: patient.email },
                            { label: 'Phone', value: patient.phone || '—' },
                            { label: 'Account Type', value: 'Patient' },
                            { label: 'Status', value: patient.status ?? 'Active' },
                            { label: 'Member Since', value: patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">{label}</p>
                                <p className="text-sm font-medium text-slate-800">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Change photo hint */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Click the camera icon on your avatar to change your profile photo.
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 transition font-medium disabled:opacity-50"
                        >
                            {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                        </button>
                    </div>
                </motion.div>
            </div>
            <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
        </>
    );
}
