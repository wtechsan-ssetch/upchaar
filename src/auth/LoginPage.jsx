/**
 * LoginPage.jsx  (src/auth/LoginPage.jsx)
 * ─────────────────────────────────────────────────
 * Unified login / register page for ALL profile types.
 *
 * Sign-Up flow (3 steps):
 *   Step 1 – Fill the registration form
 *   Step 2 – Enter the 6-digit OTP sent to mobile via Twilio Verify
 *   Step 3 – Account created (success modal)
 *
 * Sign-In flow:
 *   Calls signIn() → redirects based on role
 * ─────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';
import { sendOtp, verifyOtp, normalisePhone } from '@/lib/otpService.js';
import { supabase } from '@/lib/supabase.js';
import {
    Heart, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
    User, Phone, ChevronDown, Building2, Activity,
    Pill, HospitalIcon, Users, CheckCircle2, ShieldCheck, RefreshCw
} from 'lucide-react';

// ── Profile type options shown in the Sign Up dropdown ──
const PROFILE_TYPES = [
    { value: 'patient',  label: 'Patient',       icon: Users,         desc: 'Book appointments, manage records' },
    { value: 'clinic',   label: 'Clinic',         icon: Building2,     desc: 'Register your clinic' },
    { value: 'diagnostic', label: 'Diagnostic Centre', icon: Activity, desc: 'Manage tests & reports' },
    { value: 'medical',  label: 'Medical Store',  icon: Pill,          desc: 'List medicines & supplies' },
    { value: 'hospital', label: 'Hospital',       icon: HospitalIcon,  desc: 'Register your hospital' },
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

// Tab: 'signin' | 'signup'
export default function LoginPage() {
    const { signIn, signUp, getDashboardPath } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();

    const defaultTab = location.pathname === '/register' ? 'signup' : 'signin';
    const [tab, setTab] = useState(defaultTab);

    const successMsg = location.state?.successMsg || '';

    // ── Sign In form ──────────────────────────────
    const [signInForm, setSignInForm]     = useState({ email: '', password: '' });
    const [showSignInPass, setShowSignInPass] = useState(false);

    // ── Sign Up form ──────────────────────────────
    const [signUpForm, setSignUpForm] = useState({
        fullName:       '',
        email:          '',
        phone:          '',
        whatsappNumber: '',
        password:       '',
        confirmPassword:'',
        profileType:    'patient',
    });
    const [showSignUpPass,  setShowSignUpPass]  = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    // ── OTP step state ────────────────────────────
    // signupStep: 'form' | 'otp' | 'done'
    const [signupStep,      setSignupStep]      = useState('form');
    const [otp,             setOtp]             = useState(['','','','','','']);
    const [otpPhone,        setOtpPhone]        = useState(''); // normalised E.164
    const [otpError,        setOtpError]        = useState('');
    const [otpLoading,      setOtpLoading]      = useState(false);
    const [resendCooldown,  setResendCooldown]  = useState(0);
    const otpRefs = useRef([]);

    // ── Shared state ──────────────────────────────
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState(successMsg);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ── Helpers ───────────────────────────────────
    const handleSignInChange  = e => setSignInForm(f  => ({ ...f,  [e.target.name]: e.target.value }));
    const handleSignUpChange  = e => setSignUpForm(f  => ({ ...f,  [e.target.name]: e.target.value }));
    const selectedType = PROFILE_TYPES.find(t => t.value === signUpForm.profileType);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(s => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    // ── Sign In ───────────────────────────────────
    const handleSignIn = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const { profile } = await signIn(signInForm.email, signInForm.password);
            const from = location.state?.from;
            const redirectMap = { patient: '/patient/dashboard', doctor: '/doctor/dashboard' };
            navigate(from || (redirectMap[profile.profile_type] ?? getDashboardPath(profile)), { replace: true });
        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Step 1: Validate form & send OTP ─────────
    const handleSendOtp = async e => {
        e.preventDefault();
        setError('');

        // Validate passwords
        if (signUpForm.password !== signUpForm.confirmPassword) { setError('Passwords do not match.'); return; }
        if (signUpForm.password.length < 6)                     { setError('Password must be at least 6 characters.'); return; }
        if (!isStrongPassword(signUpForm.password))             { setError(PASSWORD_RULE_MESSAGE); return; }
        if (!signUpForm.phone.trim())                           { setError('Phone number is required.'); return; }

        setLoading(true);
        try {
            // Check phone uniqueness via RPC (bypasses RLS so anon can check)
            const { data: phoneTaken } = await supabase.rpc('is_phone_taken', { p_phone: signUpForm.phone.trim() });
            if (phoneTaken) throw new Error('This phone number is already registered.');

            if (signUpForm.whatsappNumber.trim()) {
                const { data: waTaken } = await supabase.rpc('is_whatsapp_taken', { p_wa: signUpForm.whatsappNumber.trim() });
                if (waTaken) throw new Error('This WhatsApp number is already registered.');
            }

            // Bypass OTP
            // const e164 = await sendOtp(signUpForm.phone);
            // setOtpPhone(e164);
            // setOtp(['','','','','','']);
            // setOtpError('');
            // setResendCooldown(RESEND_COOLDOWN);
            // setSignupStep('otp');
            
            await signUp({
                fullName:       signUpForm.fullName,
                email:          signUpForm.email,
                phone:          signUpForm.phone,
                whatsappNumber: signUpForm.whatsappNumber,
                password:       signUpForm.password,
                profileType:    signUpForm.profileType,
            });

            setSignupStep('done');
            setShowSuccessModal(true);

            setTimeout(() => {
                setShowSuccessModal(false);
                setTab('signin');
                setSignupStep('form');
                setSuccess(`🎉 Account created! Please sign in${signUpForm.profileType === 'doctor' ? ' — pending admin review.' : '.'}`);
                setSignUpForm({ fullName:'', email:'', phone:'', whatsappNumber:'', password:'', confirmPassword:'', profileType:'patient' });
                setOtp(['','','','','','']);
            }, 2200);

        } catch (err) {
            setError(err.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ── OTP input handlers ────────────────────────
    const handleOtpChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return; // digits only
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = e => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (pasted.length === OTP_LENGTH) {
            setOtp(pasted.split(''));
            otpRefs.current[OTP_LENGTH - 1]?.focus();
        }
        e.preventDefault();
    };

    // ── Resend OTP ────────────────────────────────
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtpError('');
        setOtpLoading(true);
        try {
            await sendOtp(signUpForm.phone);
            setOtp(['','','','','','']);
            setResendCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Step 2: Verify OTP & create account ───────
    const handleVerifyOtp = async e => {
        e.preventDefault();
        const token = otp.join('');
        if (token.length < OTP_LENGTH) { setOtpError('Please enter the complete 6-digit code.'); return; }

        setOtpLoading(true);
        setOtpError('');
        try {
            // Verify OTP — supabase creates a temporary session
            await verifyOtp(otpPhone, token);

            // Sign out the temp OTP session; signUp will create the real account
            await supabase.auth.signOut();

            // Create the actual account
            await signUp({
                fullName:       signUpForm.fullName,
                email:          signUpForm.email,
                phone:          signUpForm.phone,
                whatsappNumber: signUpForm.whatsappNumber,
                password:       signUpForm.password,
                profileType:    signUpForm.profileType,
            });

            setSignupStep('done');
            setShowSuccessModal(true);

            setTimeout(() => {
                setShowSuccessModal(false);
                setTab('signin');
                setSignupStep('form');
                setSuccess(`🎉 Account created! Please sign in${signUpForm.profileType === 'doctor' ? ' — pending admin review.' : '.'}`);
                setSignUpForm({ fullName:'', email:'', phone:'', whatsappNumber:'', password:'', confirmPassword:'', profileType:'patient' });
                setOtp(['','','','','','']);
            }, 2200);

        } catch (err) {
            setOtpError(err.message || 'Verification failed.');
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Common input classes ──────────────────────
    const inputCls = 'w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400';

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">

            {/* Ambient blobs */}
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
                                <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Upchar Health</p>
                                <h1 className="text-white font-bold text-xl">
                                    {tab === 'signin' ? 'Welcome Back' : signupStep === 'otp' ? 'Verify Mobile' : 'Create Account'}
                                </h1>
                            </div>
                        </div>
                        <p className="text-white/75 text-sm">
                            {tab === 'signin'
                                ? 'Sign in to access your health dashboard.'
                                : signupStep === 'otp'
                                    ? `We sent a 6-digit code to ${signUpForm.phone}.`
                                    : 'Join Upchar Health — choose your account type.'}
                        </p>
                    </div>

                    {/* ── Tabs (hidden during OTP step) ── */}
                    {signupStep === 'form' && (
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            {[{ id: 'signin', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTab(t.id); setError(''); setSuccess(''); setSignupStep('form'); }}
                                    className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === t.id
                                        ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* OTP step progress indicator */}
                    {tab === 'signup' && signupStep === 'otp' && (
                        <div className="flex items-center gap-2 px-8 pt-4 pb-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-[10px]">✓</span>
                                <span className="text-teal-600 font-medium">Details</span>
                            </div>
                            <div className="flex-1 h-px bg-teal-200 mx-1" />
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                                <span className="text-teal-600 font-medium">Verify OTP</span>
                            </div>
                            <div className="flex-1 h-px bg-slate-200 mx-1" />
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <span className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center font-bold text-[10px]">3</span>
                                <span>Done</span>
                            </div>
                        </div>
                    )}

                    <div className="px-8 py-7">

                        {/* Success alert */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                                >
                                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /><span>{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ══════════════════════════════════
                            SIGN IN TAB
                        ══════════════════════════════════ */}
                        {tab === 'signin' && (
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Email or Phone Number</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="email" type="text" required
                                            value={signInForm.email} onChange={handleSignInChange}
                                            placeholder="you@example.com or 9876543210"
                                            className={`${inputCls} pl-10 pr-4`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="password" type={showSignInPass ? 'text' : 'password'} required
                                            value={signInForm.password} onChange={handleSignInChange}
                                            placeholder="Enter your password"
                                            className={`${inputCls} pl-10 pr-11`}
                                        />
                                        <button type="button" onClick={() => setShowSignInPass(s => !s)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showSignInPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 size={16} className="animate-spin" />Signing in…</> : 'Sign In'}
                                </button>

                                <p className="text-center text-sm text-slate-500 mt-1">
                                    Don&apos;t have an account?{' '}
                                    <button type="button" onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
                                        className="text-teal-600 font-semibold hover:underline">Sign Up</button>
                                </p>
                            </form>
                        )}

                        {/* ══════════════════════════════════
                            SIGN UP – STEP 1: Registration form
                        ══════════════════════════════════ */}
                        {tab === 'signup' && signupStep === 'form' && (
                            <form onSubmit={handleSendOtp} className="space-y-4">

                                {/* Account type */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">I am a…</label>
                                    <div className="relative">
                                        <button type="button"
                                            onClick={() => setShowTypeDropdown(s => !s)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 hover:border-teal-400 transition focus:outline-none focus:ring-2 focus:ring-teal-400/30">
                                            <span className="flex items-center gap-2">
                                                {selectedType && <selectedType.icon size={15} className="text-teal-500" />}
                                                <span className="font-medium">{selectedType?.label}</span>
                                                <span className="text-slate-400 text-xs hidden sm:inline">— {selectedType?.desc}</span>
                                            </span>
                                            <ChevronDown size={15} className={`text-slate-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showTypeDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                                    className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-150 shadow-xl">
                                                    {PROFILE_TYPES.map(t => (
                                                        <button key={t.value} type="button"
                                                            onClick={() => { setSignUpForm(f => ({ ...f, profileType: t.value })); setShowTypeDropdown(false); }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-teal-50 transition text-left first:rounded-t-xl last:rounded-b-xl ${signUpForm.profileType === t.value ? 'bg-teal-50 text-teal-700' : 'text-slate-700'}`}>
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
                                        <input name="fullName" type="text" required value={signUpForm.fullName} onChange={handleSignUpChange}
                                            placeholder="Your full name" className={`${inputCls} pl-10 pr-4`} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input name="email" type="email" required value={signUpForm.email} onChange={handleSignUpChange}
                                            placeholder="you@example.com" className={`${inputCls} pl-10 pr-4`} />
                                    </div>
                                </div>

                                {/* Phone & WhatsApp */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input name="phone" type="tel" required value={signUpForm.phone} onChange={handleSignUpChange}
                                                placeholder="98765 43210" className={`${inputCls} pl-9 pr-4`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                                            WhatsApp <span className="text-slate-400 font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input name="whatsappNumber" type="tel" value={signUpForm.whatsappNumber} onChange={handleSignUpChange}
                                                placeholder="Optional" className={`${inputCls} pl-9 pr-4`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Password row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input name="password" type={showSignUpPass ? 'text' : 'password'} required minLength={6}
                                                value={signUpForm.password} onChange={handleSignUpChange}
                                                placeholder="Min 6 chars" className={`${inputCls} pl-9 pr-9`} />
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
                                            <input name="confirmPassword" type={showConfirmPass ? 'text' : 'password'} required
                                                value={signUpForm.confirmPassword} onChange={handleSignUpChange}
                                                placeholder="Re-enter" className={`${inputCls} pl-9 pr-9`} />
                                            <button type="button" onClick={() => setShowConfirmPass(s => !s)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                                    {loading
                                        ? <><Loader2 size={16} className="animate-spin" />Creating Account…</>
                                        : <><ShieldCheck size={16} />Create Account</>}
                                </button>

                                <p className="text-center text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <button type="button" onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}
                                        className="text-teal-600 font-semibold hover:underline">Sign In</button>
                                </p>
                            </form>
                        )}

                        {/* ══════════════════════════════════
                            SIGN UP – STEP 2: OTP Verification
                        ══════════════════════════════════ */}
                        {tab === 'signup' && signupStep === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">

                                {/* OTP illustration */}
                                <div className="flex flex-col items-center text-center gap-2 py-2">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-1">
                                        <ShieldCheck size={28} className="text-teal-500" />
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Enter the <span className="font-semibold text-slate-800">6-digit code</span> sent to
                                    </p>
                                    <p className="text-base font-bold text-teal-700 tracking-wide">{signUpForm.phone}</p>
                                </div>

                                {/* OTP boxes */}
                                <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => otpRefs.current[idx] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                                            autoFocus={idx === 0}
                                            className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                                                ${digit
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                    : 'border-slate-200 bg-slate-50 text-slate-800'}
                                                focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25`}
                                            style={{ height: '52px' }}
                                        />
                                    ))}
                                </div>

                                {/* OTP error */}
                                <AnimatePresence>
                                    {otpError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                            <AlertCircle size={15} className="flex-shrink-0" />{otpError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Verify button */}
                                <button type="submit" disabled={otpLoading || otp.join('').length < OTP_LENGTH}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {otpLoading
                                        ? <><Loader2 size={16} className="animate-spin" />Verifying…</>
                                        : <><CheckCircle2 size={16} />Verify & Create Account</>}
                                </button>

                                {/* Resend & back */}
                                <div className="flex items-center justify-between text-sm">
                                    <button type="button"
                                        onClick={() => { setSignupStep('form'); setError(''); setOtpError(''); }}
                                        className="text-slate-500 hover:text-slate-700 transition">
                                        ← Edit details
                                    </button>
                                    <button type="button"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0 || otpLoading}
                                        className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                                        <RefreshCw size={13} className={resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'} />
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Back link */}
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Upchar Health</Link>
                </p>
            </motion.div>

            {/* ── Success Modal ── */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-900/20 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-emerald-100">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Account Created!</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                {signUpForm.profileType === 'doctor'
                                    ? 'Your doctor account is pending admin approval.'
                                    : 'Your account was created successfully. Phone verified ✓'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-teal-600 font-medium text-sm">
                                <Loader2 size={16} className="animate-spin" />Redirecting to Sign In...
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
