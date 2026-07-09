import { useEffect, useMemo, useState } from 'react';
import { Users, Phone, Calendar, FileText, Loader2, History, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';
import PatientHistoryModal from '@/components/dashboard/PatientHistoryModal';

const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getInitials = (name) => {
    const safe = (name || '').trim();
    if (!safe) return 'P';
    return safe.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export default function DoctorPatients() {
    const { doctorRecord } = useDoctor();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, patient: null });

    const doctorId = doctorRecord?.id;

    useEffect(() => {
        if (!doctorId) {
            setPatients([]);
            setLoading(false);
            return;
        }

        const fetchPatients = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor_id', doctorId)
                    .neq('status', 'Cancelled')
                    .order('date', { ascending: false })
                    .limit(500);

                if (error) throw error;

                const patientMap = new Map();

                for (const apt of data || []) {
                    const patientName = apt.patient_name || apt.patientName || apt.patient || 'Patient';
                    const patientPhone = apt.patient_phone || apt.patientPhone || '';
                    const patientAge = apt.patient_age ?? apt.patientAge ?? null;
                    const condition =
                        apt.diagnosis ||
                        apt.issue ||
                        apt.specialization ||
                        apt.condition ||
                        'Consultation';

                    // Prefer stable keys when available
                    const stableId = apt.patient_id || apt.patientId || null;
                    const mapKey = stableId
                        ? `pat:${stableId}`
                        : patientPhone
                            ? `phone:${patientPhone}`
                            : `name:${patientName}`;

                    const dateMsRaw = apt.date ? new Date(apt.date).getTime() : 0;
                    const dateMs = Number.isNaN(dateMsRaw) ? 0 : dateMsRaw;

                    const existing = patientMap.get(mapKey);
                    if (!existing) {
                        patientMap.set(mapKey, {
                            id: stableId || mapKey,
                            patientId: stableId || null,
                            name: patientName,
                            phone: patientPhone,
                            age: patientAge,
                            condition,
                            visits: 1,
                            lastVisitMs: dateMs,
                            lastVisitRaw: apt.date || null,
                        });
                        continue;
                    }

                    existing.visits += 1;

                    if (dateMs > (existing.lastVisitMs || 0)) {
                        existing.name = patientName;
                        existing.phone = patientPhone;
                        existing.age = patientAge;
                        existing.condition = condition;
                        existing.lastVisitMs = dateMs;
                        existing.lastVisitRaw = apt.date || existing.lastVisitRaw;
                    }
                }

                const next = [...patientMap.values()].sort((a, b) => (b.lastVisitMs || 0) - (a.lastVisitMs || 0));
                const patientIds = next.map(p => p.patientId).filter(Boolean);
                let avatarMap = new Map();

                if (patientIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, avatar_url')
                        .in('id', patientIds);

                    if (profilesError) throw profilesError;
                    avatarMap = new Map((profilesData || []).map(p => [p.id, p]));
                }

                const nextWithAvatars = next.map(p => ({
                    ...p,
                    avatar_url: p.patientId ? (avatarMap.get(p.patientId)?.avatar_url || null) : null,
                }));

                setPatients(nextWithAvatars);
            } catch (error) {
                console.error('Failed to load doctor patients:', error.message);
                setPatients([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [doctorId]);

    const patientCountLabel = useMemo(() => `${patients.length} patients under your care`, [patients.length]);

    if (loading) {
        return (
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Patients</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Loading patients...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['a', 'b', 'c', 'd'].map((sk) => (
                        <div
                            key={sk}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-40" />
                                    <div className="h-3 bg-slate-100 rounded w-28 mt-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800">My Patients</h1>
                <p className="text-sm text-slate-500 mt-0.5">{patientCountLabel}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0 overflow-hidden">
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                                ) : (
                                    getInitials(p.name)
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                                    <span className="text-xs text-slate-400">{p.phone || '—'}</span>
                                </div>
                                <p className="text-xs text-primary font-medium mt-0.5">{p.condition}</p>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Users size={11} />
                                        Age {p.age ?? '-'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Phone size={11} />
                                        {p.phone || '-'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Calendar size={11} />
                                        {formatDate(p.lastVisitRaw)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <FileText size={11} />
                                        {p.visits} visits
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={() => setHistoryModal({ 
                                            isOpen: true, 
                                            patient: { 
                                                name: p.name, 
                                                phone: p.phone, 
                                                id: p.patientId 
                                            } 
                                        })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-100 bg-teal-50 text-teal-700 text-[10px] font-bold hover:bg-teal-100 transition-all"
                                    >
                                        <History size={12} /> View History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <PatientHistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ isOpen: false, patient: null })}
                patientName={historyModal.patient?.name}
                patientPhone={historyModal.patient?.phone}
                patientId={historyModal.patient?.id}
            />
        </div>
    );
}
