/**
 * LoginPage.jsx  (src/auth/LoginPage.jsx)
 * ─────────────────────────────────────────────────
 * Single unified login / register page for ALL profile types.
 *
 * Sign Up flow:
 *   1. Validates form
 *   2. Calls signUp() → seeds DB (profiles + role tables) → signs user OUT
 *   3. Redirects to /login with a success banner asking user to sign in
 *
 * Sign In flow:
 *   1. Calls signIn() → checks Supabase Auth + profiles DB row
 *   2. patient   → navigate("/")              (Landing page)
 *   3. doctor    → navigate("/doctor/dashboard")
 *   4. others    → navigate(getDashboardPath(profile))
 *
 * Session is stored in a cookie with 1-hour expiry (see supabase.js).
 * ─────────────────────────────────────────────────
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';
import {
    Heart, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
    User, Phone, ChevronDown, Building2,
    Pill, HospitalIcon, Users, CheckCircle2
} from 'lucide-react';

// ── Profile type options shown in the Sign Up dropdown ──
const PROFILE_TYPES = [
    { value: 'patient', label: 'Patient', icon: Users, desc: 'Book appointments, manage records' },
    { value: 'clinic', label: 'Clinic', icon: Building2, desc: 'Register your clinic' },
    { value: 'medical', label: 'Medical Store', icon: Pill, desc: 'List medicines & supplies' },
    { value: 'hospital', label: 'Hospital', icon: HospitalIcon, desc: 'Register your hospital' },
];

// Tab: 'signin' | 'signup'
export default function LoginPage() {
    const { signIn, signUp, getDashboardPath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Default to sign-up tab if navigated from /register
    const defaultTab = location.pathname === '/register' ? 'signup' : 'signin';
    const [tab, setTab] = useState(defaultTab);

    // Success message passed via router state (after signup redirect)
    const successMsg = location.state?.successMsg || '';

    // ── Sign In form ──────────────────────────────
    const [signInForm, setSignInForm] = useState({ email: '', password: '' });
    const [showSignInPass, setShowSignInPass] = useState(false);

    // ── Sign Up form ──────────────────────────────
    const [signUpForm, setSignUpForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        profileType: 'patient',
    });
    const [showSignUpPass, setShowSignUpPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    // ── Shared state ──────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(successMsg);

    // ── Helpers ───────────────────────────────────
    const handleSignInChange = e => setSignInForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleSignUpChange = e => setSignUpForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const selectedType = PROFILE_TYPES.find(t => t.value === signUpForm.profileType);

    /**
     * handleSignIn
     * 1. Calls signIn() — checks Supabase Auth + profiles DB
     * 2. Redirects based on role:
     *    patient → /
     *    doctor  → /doctor/dashboard
     *    others  → getDashboardPath(profile)
     */
    const handleSignIn = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const { profile } = await signIn(signInForm.email, signInForm.password);

            const redirectMap = {
                patient: '/',
                doctor: '/doctor/dashboard',
            };

            const destination = redirectMap[profile.profile_type] ?? getDashboardPath(profile);
            navigate(destination, { replace: true });
        } catch (err) {
            console.error('[LoginPage] Sign In Error:', err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    /**
     * handleSignUp
     * 1. Validates form inputs
     * 2. Calls signUp() — creates Auth user + seeds DB + signs user out
     * 3. Shows success modal, then switches to sign-in tab
     */
    const handleSignUp = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (signUpForm.password !== signUpForm.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (signUpForm.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!isStrongPassword(signUpForm.password)) {
            setError(PASSWORD_RULE_MESSAGE);
            return;
        }

        setLoading(true);
        try {
            await signUp({
                fullName: signUpForm.fullName,
                email: signUpForm.email,
                phone: signUpForm.phone,
                password: signUpForm.password,
                profileType: signUpForm.profileType,
            });

            // Show success modal
            setShowSuccessModal(true);

            // Redirect to sign in tab after 2 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
                setTab('signin');
                setSuccess(`🎉 Account created! Please sign in${signUpForm.profileType === 'doctor' ? ' — your account will be activated after admin review.' : '.'}`);
                setSignUpForm({
                    fullName: '', email: '', phone: '', password: '', confirmPassword: '', profileType: 'patient'
                });
            }, 2000);

        } catch (err) {
            console.error('[LoginPage] Sign Up Error:', err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">

            {/* Ambient background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative w-full max-w-md"
            >
                {/* ── Card ───────────────────────── */}
                <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-900/10 border border-white/60 overflow-hidden">

                    {/* Brand banner */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-8 pt-8 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                                <Heart size={22} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Sanjiwani Health</p>
                                <h1 className="text-white font-bold text-xl">
                                    {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
                                </h1>
                            </div>
                        </div>
                        <p className="text-white/75 text-sm">
                            {tab === 'signin'
                                ? 'Sign in to access your health dashboard.'
                                : 'Join Sanjiwani Health — choose your account type.'}
                        </p>
                    </div>

                    {/* ── Tabs ──────────────────────────── */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        {[
                            { id: 'signin', label: 'Sign In' },
                            { id: 'signup', label: 'Sign Up' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
                                className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === t.id
                                    ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="px-8 py-7">

                        {/* Success alert */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                                >
                                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        {/* ══════════════════════════════════
                            SIGN IN TAB
                            ══════════════════════════════════ */}
                        {tab === 'signin' && (
                            <form onSubmit={handleSignIn} className="space-y-4">

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="email" type="email" required
                                            value={signInForm.email}
                                            onChange={handleSignInChange}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="password" type={showSignInPass ? 'text' : 'password'} required
                                            value={signInForm.password}
                                            onChange={handleSignInChange}
                                            placeholder="Enter your password"
                                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                        />
                                        <button type="button" onClick={() => setShowSignInPass(s => !s)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showSignInPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
                                </button>

                                <p className="text-center text-sm text-slate-500 mt-1">
                                    Don't have an account?{' '}
                                    <button type="button" onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
                                        className="text-teal-600 font-semibold hover:underline">
                                        Sign Up
                                    </button>
                                </p>
                            </form>
                        )}

                        {/* ══════════════════════════════════
                            SIGN UP TAB
                            ══════════════════════════════════ */}
                        {tab === 'signup' && (
                            <form onSubmit={handleSignUp} className="space-y-4">

                                {/* Account type selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">I am a…</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTypeDropdown(s => !s)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 hover:border-teal-400 transition focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                                        >
                                            <span className="flex items-center gap-2">
                                                {selectedType && <selectedType.icon size={15} className="text-teal-500" />}
                                                <span className="font-medium">{selectedType?.label}</span>
                                                <span className="text-slate-400 text-xs hidden sm:inline">— {selectedType?.desc}</span>
                                            </span>
                                            <ChevronDown size={15} className={`text-slate-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown */}
                                        <AnimatePresence>
                                            {showTypeDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-150 shadow-xl"
                                                >
                                                    {PROFILE_TYPES.map(t => (
                                                        <button
                                                            key={t.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setSignUpForm(f => ({ ...f, profileType: t.value }));
                                                                setShowTypeDropdown(false);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-teal-50 transition text-left first:rounded-t-xl last:rounded-b-xl ${signUpForm.profileType === t.value ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                                                                }`}
                                                        >
                                                            <t.icon size={16} className="text-teal-500 flex-shrink-0" />
                                                            <div>
                                                                <p className="font-semibold">{t.label}</p>
                                                                <p className="text-xs text-slate-400">{t.desc}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="fullName" type="text" required
                                            value={signUpForm.fullName}
                                            onChange={handleSignUpChange}
                                            placeholder="Your full name"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="email" type="email" required
                                            value={signUpForm.email}
                                            onChange={handleSignUpChange}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                                        Phone <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="phone" type="tel"
                                            value={signUpForm.phone}
                                            onChange={handleSignUpChange}
                                            placeholder="+91 98765 43210"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Password row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                name="password" type={showSignUpPass ? 'text' : 'password'} required minLength={6}
                                                value={signUpForm.password}
                                                onChange={handleSignUpChange}
                                                placeholder="Min 6 chars"
                                                className="w-full pl-9 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                            />
                                            <button type="button" onClick={() => setShowSignUpPass(s => !s)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {showSignUpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Confirm</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                name="confirmPassword" type={showConfirmPass ? 'text' : 'password'} required
                                                value={signUpForm.confirmPassword}
                                                onChange={handleSignUpChange}
                                                placeholder="Re-enter"
                                                className="w-full pl-9 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400"
                                            />
                                            <button type="button" onClick={() => setShowConfirmPass(s => !s)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>



                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                                >
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
                                </button>

                                <p className="text-center text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <button type="button" onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}
                                        className="text-teal-600 font-semibold hover:underline">
                                        Sign In
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* Back link */}
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Sanjiwani Health</Link>
                </p>
            </motion.div>

            {/* Success Modal Overlay */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-900/20 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-emerald-100"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Account Created!</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                {signUpForm.profileType === 'doctor'
                                    ? 'Your doctor account was created successfully and is pending admin approval.'
                                    : 'Your account was created successfully.'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-teal-600 font-medium text-sm">
                                <Loader2 size={16} className="animate-spin" />
                                Redirecting to Sign In...
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
