/**
 * PatientRegister.jsx
 * ─────────────────────────────────────────────────
 * Registration (sign-up) page for new patients.
 *
 * Uses: PatientContext → signUp()
 *
 * On success:
 *  - Creates a Supabase Auth user
 *  - Inserts a row in public.profiles (profile_type='patient')
 *  - Redirects to /patient/dashboard
 *
 * Design: Consistent with the premium clinical aesthetic.
 * ─────────────────────────────────────────────────
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, Phone } from 'lucide-react';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';

export default function PatientRegister() {
    const { signUp } = usePatient();
    const navigate = useNavigate();

    // ── Form state ────────────────────────────────
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    /**
     * handleSubmit
     * Validates passwords match, then calls signUp from PatientContext.
     * Redirects to dashboard on success.
     */
    const handleSubmit = async e => {
        e.preventDefault();
        setError('');

        // Client-side validation: passwords must match
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!isStrongPassword(form.password)) {
            setError(PASSWORD_RULE_MESSAGE);
            return;
        }

        setLoading(true);
        try {
            await signUp({
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password,
            });
            navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 py-10">

            {/* Background ambient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
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
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Heart size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Sanjiwani Health</p>
                                <h1 className="text-white font-bold text-xl">Create Patient Account</h1>
                            </div>
                        </motion.div>
                        <p className="text-white/80 text-sm">Join Sanjiwani Health and take control of your wellness.</p>
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

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        value={form.fullName}
                                        onChange={handleChange}
                                        placeholder="Dr. / Mr. / Ms. Your Name"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="password"
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter your password"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading
                                    ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                                    : 'Create Account'
                                }
                            </button>
                        </form>

                        {/* Login link */}
                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/patient/login" className="text-emerald-600 font-semibold hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back link */}
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Sanjiwani Health</Link>
                </p>
            </motion.div>
        </div>
    );
}
