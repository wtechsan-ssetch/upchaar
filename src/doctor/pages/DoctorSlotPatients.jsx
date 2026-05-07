import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';
import {
    ArrowLeft, CalendarDays, Clock, Phone, Stethoscope,
    CheckCircle, XCircle, FileText, Users, Bell, ChevronDown, ChevronUp, Lock, Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/* ── constants ──────────────────────────────── */
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes in ms
const LOCK_STORAGE_KEY = 'doctor_apt_locks';

const STATUS_COLORS = {
    Confirmed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending:      'bg-amber-50  text-amber-700  border-amber-200',
    Completed:    'bg-blue-50   text-blue-700   border-blue-200',
    Cancelled:    'bg-red-50    text-red-700    border-red-200',
    Scheduled:    'bg-slate-50  text-slate-700  border-slate-200',
    'In-Progress':'bg-purple-50 text-purple-700 border-purple-200',
};

const getCanonicalStatus = (status) => {
    const n = String(status || '').trim().toLowerCase();
    if (n === 'confirmed')  return 'Confirmed';
    if (n === 'pending')    return 'Pending';
    if (n === 'completed')  return 'Completed';
    if (n === 'cancelled' || n === 'canceled') return 'Cancelled';
    if (n === 'in-progress' || n === 'in progress') return 'In-Progress';
    if (n === 'scheduled')  return 'Scheduled';
    return status;
};

const toMinutes = (t) => {
    if (!t) return 0;
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let [, h, m, p] = match;
    h = parseInt(h); m = parseInt(m);
    if (p) {
        if (p.toUpperCase() === 'PM' && h < 12) h += 12;
        if (p.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return h * 60 + m;
};

/* ── CountdownTimer sub-component ──────────── */
// Shows MM:SS countdown, calls onExpire when it hits 0
function CountdownTimer({ lockedAt, onExpire }) {
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, LOCK_DURATION_MS - (Date.now() - lockedAt))
    );

    useEffect(() => {
        if (remaining <= 0) { onExpire(); return; }
        const id = setInterval(() => {
            const r = Math.max(0, LOCK_DURATION_MS - (Date.now() - lockedAt));
            setRemaining(r);
            if (r <= 0) { clearInterval(id); onExpire(); }
        }, 500);
        return () => clearInterval(id);
    }, [lockedAt, onExpire]);

    const totalSec = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    const pct = (remaining / LOCK_DURATION_MS) * 100;

    return (
        <div className="flex items-center gap-2">
            {/* Circular progress ring */}
            <div className="relative h-8 w-8 shrink-0">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                        cx="16" cy="16" r="13" fill="none"
                        stroke={pct > 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 13}`}
                        strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
                    />
                </svg>
                <Timer size={11} className="absolute inset-0 m-auto text-slate-500" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">
                    Change window
                </p>
                <p className={`text-sm font-black tabular-nums leading-tight ${
                    pct <= 40 ? 'text-red-500' : 'text-amber-600'
                }`}>
                    {mm}:{ss}
                </p>
            </div>
        </div>
    );
}

/* ── Main page ──────────────────────────────── */
export default function DoctorSlotPatients() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const doctorId     = params.get('doctorId');
    const orgId        = params.get('orgId');
    const orgProfileId = params.get('orgProfileId');
    const dateStr      = params.get('date');
    const timeFrom     = params.get('timeFrom');
    const timeTo       = params.get('timeTo');
    const orgName      = params.get('orgName') || 'Clinic';

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [updatingId, setUpdatingId]     = useState(null);
    const [expandedId, setExpandedId]     = useState(null);

    // ── Restore lock state from localStorage on mount (survive refresh/navigation) ──
    const [lockedMap, setLockedMap] = useState(() => {
        try {
            const raw = localStorage.getItem(LOCK_STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            const now = Date.now();
            // Drop entries that already expired while page was away
            const valid = {};
            Object.entries(parsed).forEach(([id, entry]) => {
                if (now - entry.lockedAt < LOCK_DURATION_MS) {
                    valid[id] = entry;
                }
            });
            return valid;
        } catch {
            return {};
        }
    });

    // Sync lockedMap → localStorage whenever it changes
    useEffect(() => {
        try {
            if (Object.keys(lockedMap).length === 0) {
                localStorage.removeItem(LOCK_STORAGE_KEY);
            } else {
                localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockedMap));
            }
        } catch { /* ignore quota errors */ }
    }, [lockedMap]);

    const [prescriptionAptId, setPrescriptionAptId] = useState(null);
    const [diagnosisText, setDiagnosisText]           = useState('');
    const [prescriptionText, setPrescriptionText]     = useState('');
    const [savingRx, setSavingRx]                     = useState(false);

    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── Fetch appointments ── */
    const fetchAppointments = useCallback(async () => {
        if (!doctorId || !dateStr || !timeFrom || !timeTo) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('date', dateStr);

            if (orgId && orgProfileId && orgId !== orgProfileId) {
                query = query.or(`organization_id.eq.${orgId},organization_id.eq.${orgProfileId}`);
            } else if (orgId) {
                query = query.eq('organization_id', orgId);
            } else if (orgProfileId) {
                query = query.eq('organization_id', orgProfileId);
            }

            const { data, error } = await query.order('queue_number', { ascending: true });
            if (error) throw error;

            const rangeStart = toMinutes(timeFrom);
            const rangeEnd   = toMinutes(timeTo);
            const filtered   = (data || []).filter(apt => {
                const t = toMinutes(apt.time_slot);
                return t >= rangeStart && t < rangeEnd;
            });
            setAppointments(filtered);
        } catch (err) {
            console.error('Error fetching appointments:', err.message);
        } finally {
            setLoading(false);
        }
    }, [doctorId, dateStr, timeFrom, timeTo, orgId, orgProfileId]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    /* ── Status update with 2-min lock ── */
    const updateStatus = async (aptId, newStatus) => {
        setUpdatingId(aptId);
        try {
            const apt = appointments.find(a => a.id === aptId);
            const isCurrentlyCompleted = apt?.status === 'Completed';
            
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', aptId);
            if (error) throw error;

            // Handle Revenue Updates
            if (newStatus === 'Completed' && !isCurrentlyCompleted && apt?.fee) {
                const { data: docData } = await supabase.from('doctors').select('total_revenue').eq('id', doctorId).single();
                if (docData) {
                    const newRev = (docData.total_revenue || 0) + Number(apt.fee);
                    await supabase.from('doctors').update({ total_revenue: newRev }).eq('id', doctorId);
                }
            } else if (newStatus === 'Cancelled' && isCurrentlyCompleted && apt?.fee) {
                // If they undo a completion within the 2 min window, revert the revenue
                const { data: docData } = await supabase.from('doctors').select('total_revenue').eq('id', doctorId).single();
                if (docData) {
                    const newRev = Math.max(0, (docData.total_revenue || 0) - Number(apt.fee));
                    await supabase.from('doctors').update({ total_revenue: newRev }).eq('id', doctorId);
                }
            }

            // Update local status immediately
            setAppointments(prev =>
                prev.map(a => a.id === aptId ? { ...a, status: newStatus } : a)
            );

            // Start 2-minute lock window
            setLockedMap(prev => ({
                ...prev,
                [aptId]: { lockedAt: Date.now(), status: newStatus },
            }));

            showToast(`Marked as ${newStatus} — you have 2 min to change this`);
        } catch (err) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    /* Called when the timer expires — remove the lock entry so buttons disappear */
    const handleLockExpired = useCallback((aptId) => {
        setLockedMap(prev => {
            const next = { ...prev };
            delete next[aptId];
            // Also clean localStorage immediately
            try {
                if (Object.keys(next).length === 0) {
                    localStorage.removeItem(LOCK_STORAGE_KEY);
                } else {
                    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(next));
                }
            } catch { /* ignore */ }
            return next;
        });
    }, []);

    /* ── Notify ── */
    const handleNotify = async (apt) => {
        setUpdatingId(apt.id);
        try {
            await new Promise(r => setTimeout(r, 700));
            showToast(`Notified ${apt.patient_name || apt.patient}`);
        } finally {
            setUpdatingId(null);
        }
    };

    /* ── Prescription ── */
    const openPrescription = (apt) => {
        setPrescriptionAptId(apt.id);
        setDiagnosisText(apt.diagnosis || '');
        setPrescriptionText((apt.medicines || []).join('\n'));
        setExpandedId(apt.id);
    };

    const savePrescription = async () => {
        if (!diagnosisText && !prescriptionText) return;
        setSavingRx(true);
        try {
            const apt = appointments.find(a => a.id === prescriptionAptId);
            const isCurrentlyCompleted = apt?.status === 'Completed';

            const { error } = await supabase
                .from('appointments')
                .update({
                    diagnosis: diagnosisText,
                    medicines: prescriptionText.split('\n').filter(Boolean),
                    status: 'Completed',
                })
                .eq('id', prescriptionAptId);
            if (error) throw error;

            if (!isCurrentlyCompleted && apt?.fee) {
                const { data: docData } = await supabase.from('doctors').select('total_revenue').eq('id', doctorId).single();
                if (docData) {
                    const newRev = (docData.total_revenue || 0) + Number(apt.fee);
                    await supabase.from('doctors').update({ total_revenue: newRev }).eq('id', doctorId);
                }
            }

            setPrescriptionAptId(null);
            setDiagnosisText('');
            setPrescriptionText('');
            fetchAppointments();
            showToast('Prescription saved & consultation completed!');
        } catch (err) {
            showToast('Failed to save prescription', 'error');
        } finally {
            setSavingRx(false);
        }
    };

    const formattedDate = dateStr ? (() => {
        try { return format(parseISO(dateStr), 'EEE, dd MMM yyyy'); }
        catch { return dateStr; }
    })() : '';

    return (
        <div className="space-y-4 max-w-3xl mx-auto pb-10">

            {/* ── Page header ─────────────────────────────── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="h-9 w-9 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-500 hover:text-teal-600 flex items-center justify-center transition-all shadow-sm"
                >
                    <ArrowLeft size={17} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-slate-800 text-lg leading-tight truncate">{orgName}</h1>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={11} /> {timeFrom} – {timeTo}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><CalendarDays size={11} /> {formattedDate}</span>
                    </p>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                    {loading ? '…' : `${appointments.length} patients`}
                </span>
            </div>

            {/* ── Patient list ─────────────────────────────── */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} height={88} borderRadius={20} />)}
                </div>
            ) : appointments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="h-16 w-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                        <Users size={28} className="text-teal-400" />
                    </div>
                    <p className="font-bold text-slate-600">No patients booked</p>
                    <p className="text-sm text-slate-400 mt-1">No one has booked in this time slot yet.</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((apt, index) => {
                        const status     = getCanonicalStatus(apt.status);
                        const isExpanded = expandedId === apt.id;
                        const isUpdating = updatingId === apt.id;

                        // Lock state for this appointment
                        const lock         = lockedMap[apt.id];
                        const isLocked     = !!lock;               // within 2-min window
                        const lockedStatus = lock?.status ?? null; // the status just set

                        // Terminal lock: status is Completed/Cancelled AND the 2-min window has closed.
                        // This must be computed BEFORE canComplete/canCancel so we can gate them.
                        const isTerminalLocked =
                            (status === 'Completed' || status === 'Cancelled') && !isLocked;

                        // During the 2-min window  → show only the OPPOSITE action (undo).
                        // After the window expires  → isTerminalLocked = true → both hidden.
                        // Otherwise (no lock yet)   → show whichever actions still make sense.
                        const canComplete = !isTerminalLocked && (
                            isLocked ? lockedStatus === 'Cancelled' : status !== 'Completed'
                        );
                        const canCancel = !isTerminalLocked && (
                            isLocked ? lockedStatus === 'Completed' : status !== 'Cancelled'
                        );

                        return (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                                    isExpanded
                                        ? 'border-teal-300 shadow-md ring-1 ring-teal-300/20'
                                        : 'border-slate-200 shadow-sm hover:border-slate-300'
                                }`}
                            >
                                {/* Card header */}
                                <div
                                    className="p-4 flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                                >
                                    {/* Queue badge */}
                                    <div className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/60 flex items-center justify-center">
                                        <span className="text-sm font-black text-teal-700">
                                            #{apt.queue_number || (index + 1)}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate">
                                            {apt.patient_name || apt.patient || 'Patient'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                                            {apt.patient_phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={11} className="text-teal-500" />
                                                    {apt.patient_phone}
                                                </span>
                                            )}
                                            {apt.time_slot && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} className="text-teal-500" />
                                                    {apt.time_slot}
                                                </span>
                                            )}
                                            {apt.issue && (
                                                <span className="flex items-center gap-1 max-w-[160px]">
                                                    <Stethoscope size={11} className="text-teal-500 shrink-0" />
                                                    <span className="truncate">{apt.issue}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status + chevron */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status] || STATUS_COLORS.Scheduled}`}>
                                            {isTerminalLocked && <Lock size={9} />}
                                            {status}
                                        </span>
                                        {isExpanded
                                            ? <ChevronUp size={15} className="text-teal-500" />
                                            : <ChevronDown size={15} className="text-slate-400" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded actions */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3">

                                                {/* ── 2-min lock timer banner ── */}
                                                <AnimatePresence>
                                                    {isLocked && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6 }}
                                                            className="flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
                                                        >
                                                            <CountdownTimer
                                                                lockedAt={lock.lockedAt}
                                                                onExpire={() => handleLockExpired(apt.id)}
                                                            />
                                                            <p className="text-[11px] text-amber-700 font-medium text-right leading-tight">
                                                                Status set to <strong>{lockedStatus}</strong>.<br/>
                                                                You can still change it now.
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* ── Locked permanently banner ── */}
                                                {isTerminalLocked && (
                                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                        <Lock size={13} className="text-slate-400 shrink-0" />
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            This appointment is <strong className="text-slate-700">{status}</strong> and cannot be changed.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* ── Action buttons ── */}
                                                <div className="flex flex-wrap gap-2 pt-0.5">

                                                    {/* Complete button — visible if can complete */}
                                                    {canComplete && (
                                                        <button
                                                            onClick={() => updateStatus(apt.id, 'Completed')}
                                                            disabled={isUpdating}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
                                                        >
                                                            <CheckCircle size={13} />
                                                            {isLocked ? 'Change to Complete' : 'Complete'}
                                                        </button>
                                                    )}

                                                    {/* Cancel button — visible if can cancel */}
                                                    {canCancel && (
                                                        <button
                                                            onClick={() => updateStatus(apt.id, 'Cancelled')}
                                                            disabled={isUpdating}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            <XCircle size={13} />
                                                            {isLocked ? 'Change to Cancel' : 'Cancel'}
                                                        </button>
                                                    )}

                                                    {/* Notify & Prescription — always visible */}
                                                    <button
                                                        onClick={() => handleNotify(apt)}
                                                        disabled={isUpdating}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        <Bell size={13} /> Notify Next
                                                    </button>
                                                    <button
                                                        onClick={() => openPrescription(apt)}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all"
                                                    >
                                                        <FileText size={13} /> Write Prescription
                                                    </button>
                                                </div>

                                                {/* ── Prescription form ── */}
                                                <AnimatePresence>
                                                    {prescriptionAptId === apt.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 6 }}
                                                            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm"
                                                        >
                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                Prescription — {apt.patient_name || apt.patient}
                                                            </p>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Diagnosis</label>
                                                                <input
                                                                    value={diagnosisText}
                                                                    onChange={e => setDiagnosisText(e.target.value)}
                                                                    placeholder="e.g. Viral fever"
                                                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                                    Medicines <span className="normal-case font-normal">(one per line)</span>
                                                                </label>
                                                                <textarea
                                                                    value={prescriptionText}
                                                                    onChange={e => setPrescriptionText(e.target.value)}
                                                                    placeholder={"Paracetamol 500mg - 1-0-1\nAmoxicillin 250mg - after food"}
                                                                    rows={4}
                                                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all resize-none"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-1">
                                                                <button
                                                                    onClick={() => setPrescriptionAptId(null)}
                                                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={savePrescription}
                                                                    disabled={savingRx}
                                                                    className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
                                                                >
                                                                    {savingRx ? 'Saving…' : 'Save & Complete'}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white flex items-center gap-2 ${
                            toast.type === 'error' ? 'bg-red-500' : 'bg-teal-600'
                        }`}
                    >
                        {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
