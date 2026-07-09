import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, ClipboardList, Stethoscope, Phone, User, 
    FileText, ChevronRight, Loader2, History, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';

export default function PatientHistoryModal({ isOpen, onClose, patientName, patientPhone, patientId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // Fetch previous appointments for this patient
                // We search by patient_id if available, or fall back to name+phone
                let query = supabase
                    .from('appointments')
                    .select('*')
                    .order('date', { ascending: false });

                if (patientId) {
                    query = query.eq('patient_id', patientId);
                } else {
                    query = query.eq('patient_name', patientName);
                    if (patientPhone) {
                        query = query.eq('patient_phone', patientPhone);
                    }
                }

                const { data, error } = await query;
                if (error) throw error;
                setHistory(data || []);
            } catch (err) {
                console.error('Error fetching patient history:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isOpen, patientId, patientName, patientPhone]);

    if (!isOpen) return null;

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{patientName}</h3>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Phone size={12} className="text-blue-500" />
                                    {patientPhone || 'No phone provided'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={16} className="text-teal-600" />
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Consultation History</h4>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 size={32} className="text-teal-500 animate-spin mb-4" />
                                <p className="text-sm text-slate-500 font-medium">Fetching records...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <FileText className="mx-auto text-slate-300 mb-3 h-10 w-10" />
                                <p className="text-sm font-bold text-slate-600">No previous records</p>
                                <p className="text-xs text-slate-400 mt-1 px-10">
                                    We couldn't find any past consultations for this patient in our records.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((visit, idx) => (
                                    <div 
                                        key={visit.id} 
                                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-teal-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{formatDate(visit.date)}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{visit.time_slot}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                visit.status === 'Completed' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : visit.status === 'Cancelled'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {visit.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Stethoscope size={14} className="text-teal-600" />
                                                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Diagnosis</span>
                                                </div>
                                                <p className="text-sm text-slate-700">{visit.diagnosis || 'No diagnosis recorded'}</p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ClipboardList size={14} className="text-blue-600" />
                                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Prescription</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {visit.medicines && visit.medicines.length > 0 ? (
                                                        visit.medicines.map((med, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white border border-blue-200 rounded-lg text-[11px] text-blue-700 font-medium">
                                                                {med}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-slate-400">No medicines prescribed</p>
                                                    )}
                                                </div>
                                                {visit.status === 'Completed' && (
                                                    <Link 
                                                        to={`/prescription/${visit.id}`}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors mt-auto"
                                                    >
                                                        <Eye size={10} /> View Full Prescription
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {visit.issue && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reported Issue</p>
                                                <p className="text-xs text-slate-600 italic">"{visit.issue}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-all shadow-md shadow-slate-200"
                        >
                            Close History
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
