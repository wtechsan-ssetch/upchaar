import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';

const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const normalizeMedicines = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        // Handle JSON arrays stored as strings
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
            } catch {
                // fall through to splitting
            }
        }
        return trimmed
            .split(/[,;\n]+/)
            .map(s => s.trim())
            .filter(Boolean);
    }
    return [String(value)];
};

export default function DoctorPrescriptions() {
    const { doctorRecord } = useDoctor();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const doctorId = doctorRecord?.id;

    useEffect(() => {
        if (!doctorId) {
            setPrescriptions([]);
            setLoading(false);
            return;
        }

        const fetchPrescriptions = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('doctor_id', doctorId)
                    .eq('status', 'Completed')
                    .order('date', { ascending: false })
                    .limit(200);

                if (error) throw error;

                const next = (data || []).map((apt) => {
                    const patient = apt.patient_name || apt.patientName || apt.patient || 'Patient';
                    const diagnosis =
                        apt.diagnosis ||
                        apt.issue ||
                        apt.specialization ||
                        apt.condition ||
                        '-';

                    // Try a few likely column names (since the UI mock used: medicines[], followUp, diagnosis)
                    const medicinesRaw =
                        apt.medicines ??
                        apt.medicine_list ??
                        apt.medicine_list_json ??
                        apt.prescription_medicines ??
                        apt.prescribed_medicines ??
                        null;

                    const followUpRaw =
                        apt.follow_up ??
                        apt.follow_up_date ??
                        apt.followUp ??
                        apt.followup ??
                        null;

                    return {
                        id: `RX-${apt.id}`,
                        rawId: apt.id,
                        patient,
                        date: formatDate(apt.date),
                        diagnosis,
                        medicines: normalizeMedicines(medicinesRaw),
                        followUp: followUpRaw ? formatDate(followUpRaw) : '-',
                    };
                });

                setPrescriptions(next);
            } catch (error) {
                console.error('Failed to load doctor prescriptions:', error.message);
                setPrescriptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [doctorId]);

    const prescriptionCountLabel = useMemo(() => {
        return `${prescriptions.length} prescriptions issued`;
    }, [prescriptions.length]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Prescriptions</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading prescriptions...' : prescriptionCountLabel}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all">
                    <Plus size={16} /> New Prescription
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['a', 'b', 'c', 'd'].map((sk) => (
                        <div
                            key={sk}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="h-4 w-44 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-3 w-28 bg-slate-100 rounded mt-2 animate-pulse" />
                                </div>
                                <Loader2 size={14} className="animate-spin text-slate-300" />
                            </div>
                            <div className="h-16 w-full bg-teal-50 rounded-xl animate-pulse" />
                            <div className="mt-4 h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
                            <div className="mt-4 h-4 w-56 bg-slate-100 rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : prescriptions.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
                    No prescriptions found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.map((rx, i) => (
                        <motion.div
                            key={rx.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-slate-800">{rx.patient}</p>
                                    <p className="text-xs text-slate-400">{rx.id} · {rx.date}</p>
                                </div>
                                <Link 
                                    to={`/prescription/${rx.rawId}`}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all"
                                >
                                    <Eye size={14} />
                                </Link>
                            </div>
                            <div className="mb-3 p-3 rounded-xl bg-teal-50">
                                <p className="text-xs font-semibold text-teal-700 mb-1">Diagnosis</p>
                                <p className="text-xs text-teal-600">{rx.diagnosis}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">Medicines</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {rx.medicines.length ? (
                                        rx.medicines.map((m) => (
                                            <span
                                                key={m}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium"
                                            >
                                                {m}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <ClipboardList size={11} />
                                <span>Follow-up: <span className="font-semibold text-slate-700">{rx.followUp}</span></span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
