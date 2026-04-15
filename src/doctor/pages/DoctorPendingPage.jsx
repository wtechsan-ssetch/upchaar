/**
 * DoctorPendingPage.jsx
 * ─────────────────────────────────────────────────
 * Shown when a doctor has registered (or logged in)
 * but their application has NOT yet been approved by
 * the super admin. Status is still 'Pending'.
 * ─────────────────────────────────────────────────
 */

import { motion } from 'framer-motion';
import { Stethoscope, Clock, LogOut, XCircle, RefreshCw } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext.jsx';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';

export default function DoctorPendingPage() {
    const { logout, doctorRecord } = useDoctor();
    const navigate = useNavigate();

    const isRejected = doctorRecord?.status === 'Rejected';
    const rejectReason = doctorRecord?.rejection_reason || doctorRecord?.rejectionReason;

    const handleTryAgain = async () => {
        if (doctorRecord?.id) {
            // Delete from pending_doctors 
            await supabase.from('pending_doctors').delete().eq('id', doctorRecord.id);
            // Optionally delete from profiles to avoid user already exists during retry
            await supabase.from('profiles').delete().eq('id', doctorRecord.profile_id);
        }
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-6">
            {/* Ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-100/60 border border-white p-10 text-center"
            >
                {/* Logo mark */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-teal-400/30 blur-xl animate-pulse" />
                        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-teal-500/30">
                            <Stethoscope size={36} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Brand */}
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-teal-600 mb-2">
                    Upchaar Health
                </p>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-slate-800 leading-snug mb-4">
                    Welcome to Upchaar Health!
                </h1>

                {isRejected ? (
                    <>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 shadow-sm">
                            <div className="flex justify-center mb-4">
                                <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-200">
                                    <XCircle size={14} />
                                    Application Rejected
                                </span>
                            </div>
                            <p className="text-slate-700 text-base leading-relaxed font-medium">
                                Unfortunately, your application has been rejected.
                            </p>
                            {rejectReason && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-red-100 text-left">
                                    <p className="text-xs font-bold text-red-600 mb-1">Message from Admin:</p>
                                    <p className="text-sm text-slate-600 italic">"{rejectReason}"</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 mb-8">
                            <button
                                onClick={handleTryAgain}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold shadow-md shadow-red-500/20 hover:shadow-lg hover:from-red-600 hover:to-rose-600 transition-all"
                            >
                                <RefreshCw size={18} />
                                Try to Register Again
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 mb-8 shadow-sm">
                            <div className="flex justify-center mb-4">
                                <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-amber-200">
                                    <Clock size={12} className="animate-pulse" />
                                    Verification in Progress
                                </span>
                            </div>
                            <p className="text-slate-700 text-base leading-relaxed">
                                We are verifying your details. We will connect with you shortly.
                            </p>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                                Thanks for choosing us — welcome to the new era of healthcare. Our team typically reviews applications within <span className="font-semibold text-teal-600">2–3 business days</span>.
                            </p>
                        </div>

                        {/* Decorative steps */}
                        <div className="flex items-start justify-center gap-6 mb-8 text-xs text-slate-500">
                            {[
                                { step: '01', label: 'Application\nSubmitted', done: true },
                                { step: '02', label: 'Under\nReview', active: true },
                                { step: '03', label: 'Account\nActivated', done: false },
                            ].map(({ step, label, done, active }) => (
                                <div key={step} className="flex flex-col items-center gap-1.5">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                                        ${done ? 'bg-teal-500 border-teal-500 text-white' : active ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                        {step}
                                    </div>
                                    <span className="text-center whitespace-pre-line leading-4">{label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Sign out */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                    <LogOut size={15} />
                    Sign out
                </button>
            </motion.div>
        </div>
    );
}
