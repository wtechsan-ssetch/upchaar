/**
 * PatientLogin.jsx
 * ─────────────────────────────────────────────────
 * Sign-in page for patients.
 *
 * Uses: PatientContext → signIn()
 * On success: redirects to /patient/dashboard
 * On failure: shows inline error message
 *
 * Design: Premium "Clean-Clinical" aesthetic,
 * consistent with DoctorLogin and AdminLogin style.
 * ─────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function PatientLogin() {
    const { patient, loading: sessionLoading, signIn } = usePatient();
    const navigate = useNavigate();

    // ── Redirect already-authenticated patients to dashboard ──
    useEffect(() => {
        if (!sessionLoading && patient) {
            navigate('/patient/dashboard', { replace: true });
        }
    }, [patient, sessionLoading, navigate]);

    // ── Form state ────────────────────────────────
    const [form, setForm] = useState({ email: '', password: '' }); // handles both phone & email
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    /**
     * handleSubmit
     * Calls signIn from PatientContext.
     * Navigates to dashboard on success, sets error on failure.
     */
    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(form.email, form.password);
            navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Show spinner while checking session (avoids flashing the login form)
    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">

            {/* Background ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-green-300/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/10 border border-white/60 overflow-hidden">

                    {/* Card header — gradient banner */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-8 pt-10 pb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            {/* Brand icon */}
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Heart size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Upchar Health</p>
                                <h1 className="text-white font-bold text-xl">Patient Portal</h1>
                            </div>
                        </motion.div>
                        <p className="text-white/80 text-sm">Welcome back! Sign in to manage your health.</p>
                    </div>

                    {/* Form body */}
                    <div className="px-8 py-8">

                        {/* Error alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email field */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Email or Phone Number
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="email"
                                        type="text"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com or 9876543210"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="password"
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                                    : 'Sign In'
                                }
                            </button>
                        </form>

                        {/* Registration link */}
                        <p className="mt-6 text-center text-sm text-slate-500">
                            New patient?{' '}
                            <Link to="/patient/register" className="text-emerald-600 font-semibold hover:underline">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back link */}
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Upchar Health</Link>
                </p>
            </motion.div>
        </div>
    );
}
