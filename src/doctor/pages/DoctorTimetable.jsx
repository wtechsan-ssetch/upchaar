/**
 * DoctorTimetable.jsx
 * ─────────────────────────────────────────────────────────────
 * Allows doctors to manage clinic-specific timetables with
 * support for multiple time slots per day per linked clinic.
 * Changes sync automatically to the medical/patient dashboards.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useDoctor } from '../context/DoctorContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Clock, Plus, Trash2, Save, Building2,
    CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
    RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_COLORS = {
    Monday:    'bg-blue-50 text-blue-700 border-blue-200',
    Tuesday:   'bg-violet-50 text-violet-700 border-violet-200',
    Wednesday: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Thursday:  'bg-amber-50 text-amber-700 border-amber-200',
    Friday:    'bg-rose-50 text-rose-700 border-rose-200',
    Saturday:  'bg-orange-50 text-orange-700 border-orange-200',
    Sunday:    'bg-slate-50 text-slate-600 border-slate-200',
};

const EMPTY_SLOT = { day: 'Monday', time_from: '09:00', time_to: '13:00', notes: '' };

/* ── Toast ───────────────────────────────────────────── */
function Toast({ toast }) {
    if (!toast) return null;
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2 ${
                        toast.type === 'success'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    {toast.msg}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ── Slot Row ────────────────────────────────────────── */
function SlotRow({ slot, onChange, onDelete, saving, isNew }) {
    return (
        <motion.div
            initial={isNew ? { opacity: 0, y: -8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group"
        >
            {/* Day selector */}
            <div className="relative">
                <select
                    value={slot.day}
                    onChange={e => onChange({ ...slot, day: e.target.value })}
                    className={`appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${DAY_COLORS[slot.day]}`}
                >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Time From */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <Clock size={13} className="text-slate-400" />
                <input
                    type="time"
                    value={slot.time_from}
                    onChange={e => onChange({ ...slot, time_from: e.target.value })}
                    className="bg-transparent focus:outline-none text-slate-700 font-medium w-24"
                />
            </div>

            <span className="text-slate-400 text-xs font-bold">TO</span>

            {/* Time To */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <Clock size={13} className="text-slate-400" />
                <input
                    type="time"
                    value={slot.time_to}
                    onChange={e => onChange({ ...slot, time_to: e.target.value })}
                    className="bg-transparent focus:outline-none text-slate-700 font-medium w-24"
                />
            </div>

            {/* Notes (optional) */}
            <input
                type="text"
                value={slot.notes || ''}
                onChange={e => onChange({ ...slot, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600"
            />

            {/* Active Toggle */}
            <button
                onClick={() => onChange({ ...slot, is_active: !slot.is_active })}
                title={slot.is_active ? 'Active – click to deactivate' : 'Inactive – click to activate'}
                className="text-slate-400 hover:text-teal-500 transition-colors"
            >
                {slot.is_active !== false
                    ? <ToggleRight size={22} className="text-teal-500" />
                    : <ToggleLeft size={22} />}
            </button>

            {/* Delete */}
            <button
                onClick={onDelete}
                disabled={saving}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    );
}

/* ── Clinic Card ─────────────────────────────────────── */
function ClinicCard({ org, doctorId, showToast }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [expanded, setExpanded] = useState(true);

    /* Fetch existing timetable rows */
    useEffect(() => {
        setLoading(true);
        supabase
            .from('doctor_timetables')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('org_id', org.id)
            .order('day')
            .order('time_from')
            .then(({ data }) => {
                setSlots(data || []);
                setLoading(false);
            });
    }, [doctorId, org.id]);

    const handleChange = (idx, updated) => {
        setSlots(prev => prev.map((s, i) => i === idx ? updated : s));
        setDirty(true);
    };

    const handleAddSlot = () => {
        setSlots(prev => [...prev, { 
            ...EMPTY_SLOT, 
            id: crypto.randomUUID(), 
            _isNew: true, 
            _localId: Date.now() 
        }]);
        setDirty(true);
        setExpanded(true);
    };

    const handleDelete = async (idx) => {
        const slot = slots[idx];
        if (slot.id) {
            // Persisted – delete from DB
            await supabase.from('doctor_timetables').delete().eq('id', slot.id);
        }
        setSlots(prev => prev.filter((_, i) => i !== idx));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const toUpsert = slots.map((item) => {
                const { _isNew, _localId, ...s } = item;
                return {
                    ...s,
                    doctor_id: doctorId,
                    org_id: org.id,
                    org_type: org.type,
                    org_name: org.name,
                };
            });

            const { error } = await supabase
                .from('doctor_timetables')
                .upsert(toUpsert)
                .select();

            if (error) throw error;

            // Refresh from DB to get real IDs
            const { data: fresh } = await supabase
                .from('doctor_timetables')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('org_id', org.id)
                .order('day')
                .order('time_from');

            setSlots(fresh || []);
            setDirty(false);
            showToast('Timetable saved!', 'success');
        } catch (err) {
            showToast(err.message || 'Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
            {/* Card Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20">
                        <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{org.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">{org.type} · {org.address || 'No address'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {dirty && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                            Unsaved
                        </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">{slots.length} slot{slots.length !== 1 ? 's' : ''}</span>
                    {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Slots */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-3 border-t border-slate-50 pt-4">
                            {loading ? (
                                <Skeleton count={2} height={52} borderRadius={16} />
                            ) : slots.length === 0 ? (
                                <div className="text-center py-6 text-slate-400">
                                    <CalendarDays size={28} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">No time slots set for this clinic.</p>
                                    <p className="text-xs mt-1">Click "Add Slot" to create your first schedule.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {slots.map((slot, idx) => (
                                        <SlotRow
                                            key={slot.id || slot._localId}
                                            slot={slot}
                                            isNew={!!slot._isNew}
                                            onChange={updated => handleChange(idx, updated)}
                                            onDelete={() => handleDelete(idx)}
                                            saving={saving}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    onClick={handleAddSlot}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 transition-all"
                                >
                                    <Plus size={15} /> Add More Slot
                                </button>

                                {dirty && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-md shadow-teal-500/25 hover:opacity-90 disabled:opacity-60 transition-all ml-auto"
                                    >
                                        {saving
                                            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                                            : <><Save size={14} /> Save Timetable</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── Main Page ───────────────────────────────────────── */
export default function DoctorTimetable() {
    const { doctorRecord } = useDoctor();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToast({ id, msg, type });
        setTimeout(() => setToast(t => t?.id === id ? null : t), 3500);
    }, []);

    /* Fetch linked clinics/medicals */
    useEffect(() => {
        if (!doctorRecord?.id) return;
        setLoading(true);

        supabase
            .from('staff_links')
            .select('organization_id, organization_type')
            .eq('doctor_id', doctorRecord.id)
            .then(async ({ data: links, error }) => {
                if (error || !links?.length) {
                    setOrgs([]);
                    setLoading(false);
                    return;
                }

                // Fetch org details from both medicals and clinics tables
                const orgPromises = links.map(async (link) => {
                    const table = link.organization_type === 'medical' ? 'medicals' : 'clinics';
                    const { data } = await supabase
                        .from(table)
                        .select('id, name, address, city, state')
                        .eq('profile_id', link.organization_id)
                        .maybeSingle();
                    return data ? { ...data, type: link.organization_type } : null;
                });

                const results = (await Promise.all(orgPromises)).filter(Boolean);
                setOrgs(results);
                setLoading(false);
            });
    }, [doctorRecord?.id]);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="text-teal-500" size={26} />
                        Timetable Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Set your availability for each linked clinic or medical center.
                        Multiple slots per day are supported.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Info Bar */}
            <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                <CheckCircle size={18} className="text-teal-500 mt-0.5 shrink-0" />
                <div className="text-sm text-teal-700">
                    <p className="font-semibold">Changes sync automatically</p>
                    <p className="mt-0.5 text-teal-600/80 text-xs">
                        Your timetable is visible to patients on the booking page and to
                        the medical/clinic admin on their dashboard.
                    </p>
                </div>
            </div>

            {/* Clinic Cards */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} height={120} borderRadius={24} />)}
                </div>
            ) : orgs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                    <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600">No linked clinics or medical centers</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Ask your clinic/medical admin to link you using your secret key, or
                        use the profile page to update your clinic information.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {orgs.map(org => (
                        <ClinicCard
                            key={org.id}
                            org={org}
                            doctorId={doctorRecord.id}
                            showToast={showToast}
                        />
                    ))}
                </div>
            )}

            <Toast toast={toast} />
        </div>
    );
}
