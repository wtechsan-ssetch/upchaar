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

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, Phone, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';
import { supabase } from '@/lib/supabase.js';
import { sendOtp, verifyOtp } from '@/lib/otpService.js';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function PatientRegister() {
    const { signUp } = usePatient();
    const navigate = useNavigate();

    // ── Form state ────────────────────────────────
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── OTP step: 'form' | 'otp' ──────────────────
    const [step, setStep]             = useState('form');
    const [otp, setOtp]               = useState(['','','','','','']);
    const [otpPhone]                  = useState('');
    const [otpError, setOtpError]     = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(s => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleOtpChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp]; next[idx] = val; setOtp(next);
        if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };
    const handleOtpPaste = e => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (pasted.length === OTP_LENGTH) { setOtp(pasted.split('')); otpRefs.current[OTP_LENGTH - 1]?.focus(); }
        e.preventDefault();
    };

    // Step 1: Validate form & send OTP
    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6)               { setError('Password must be at least 6 characters.'); return; }
        if (!isStrongPassword(form.password))        { setError(PASSWORD_RULE_MESSAGE); return; }
        if (!form.phone.trim())                      { setError('Phone number is required.'); return; }

        setLoading(true);
        try {
            // Uniqueness checks via RPC (bypasses RLS for anon users)
            const { data: phoneTaken } = await supabase.rpc('is_phone_taken', { p_phone: form.phone.trim() });
            if (phoneTaken) throw new Error('This phone number is already registered.');
            if (form.whatsappNumber.trim()) {
                const { data: waTaken } = await supabase.rpc('is_whatsapp_taken', { p_wa: form.whatsappNumber.trim() });
                if (waTaken) throw new Error('This WhatsApp number is already registered.');
            }
            // Bypass OTP for now
            // const e164 = await sendOtp(form.phone);
            // setOtpPhone(e164);
            // setOtp(['','','','','','']);
            // setOtpError('');
            // setResendCooldown(RESEND_COOLDOWN);
            // setStep('otp');
            
            await signUp({ fullName: form.fullName, email: form.email, phone: form.phone, whatsappNumber: form.whatsappNumber, password: form.password });
            navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtpError(''); setOtpLoading(true);
        try { await sendOtp(form.phone); setOtp(['','','','','','']); setResendCooldown(RESEND_COOLDOWN); }
        catch (err) { setOtpError(err.message); }
        finally { setOtpLoading(false); }
    };

    // Step 2: Verify OTP & create account
    const handleVerifyOtp = async e => {
        e.preventDefault();
        const token = otp.join('');
        if (token.length < OTP_LENGTH) { setOtpError('Please enter the complete 6-digit code.'); return; }
        setOtpLoading(true); setOtpError('');
        try {
            await verifyOtp(otpPhone, token);
            await supabase.auth.signOut(); // clear temp OTP session
            await signUp({ fullName: form.fullName, email: form.email, phone: form.phone, whatsappNumber: form.whatsappNumber, password: form.password });
            navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
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
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-1">
                                <img src="/logo.png" alt="Upchar Logo" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Upchar Health</p>
                                <h1 className="text-white font-bold text-xl">
                                    {step === 'otp' ? 'Verify Mobile Number' : 'Create Patient Account'}
                                </h1>
                            </div>
                        </motion.div>
                        <p className="text-white/80 text-sm">
                            {step === 'otp'
                                ? `6-digit code sent to ${form.phone}`
                                : 'Join Upchar Health and take control of your wellness.'}
                        </p>
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

                        {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="fullName" type="text" required
                                        value={form.fullName} onChange={handleChange}
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
                                        name="email" type="email" required
                                        value={form.email} onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Phone & WhatsApp */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                                        Phone <span className="text-red-500">*</span> <span className="text-slate-400 font-normal text-[10px]">(OTP sent here)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                                            placeholder="98765 43210"
                                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                                        WhatsApp <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input name="whatsappNumber" type="tel" value={form.whatsappNumber} onChange={handleChange}
                                            placeholder="Optional"
                                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input name="password" type={showPass ? 'text' : 'password'} required minLength={6}
                                        value={form.password} onChange={handleChange} placeholder="Minimum 6 characters"
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
                                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                                        value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter your password"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition placeholder:text-slate-400"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                                {loading
                                    ? <><Loader2 size={16} className="animate-spin" />Registering…</>
                                    : <><ShieldCheck size={16} />Create Account</>}
                            </button>
                        </form>
                        )}

                        {/* ── OTP Step ── */}
                        {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex flex-col items-center text-center gap-2 py-2">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-1">
                                    <ShieldCheck size={28} className="text-emerald-500" />
                                </div>
                                <p className="text-sm text-slate-600">Enter the <span className="font-semibold text-slate-800">6-digit code</span> sent to</p>
                                <p className="text-base font-bold text-emerald-700 tracking-wide">{form.phone}</p>
                            </div>

                            {/* OTP boxes */}
                            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input key={idx} ref={el => otpRefs.current[idx] = el}
                                        type="text" inputMode="numeric" maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                                        autoFocus={idx === 0}
                                        style={{ height: '52px' }}
                                        className={`w-11 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                                            ${digit ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-800'}
                                            focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25`}
                                    />
                                ))}
                            </div>

                            <AnimatePresence>
                                {otpError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                        <AlertCircle size={15} className="flex-shrink-0" />{otpError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={otpLoading || otp.join('').length < OTP_LENGTH}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {otpLoading
                                    ? <><Loader2 size={16} className="animate-spin" />Verifying…</>
                                    : <><CheckCircle2 size={16} />Verify & Create Account</>}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setStep('form'); setError(''); setOtpError(''); }}
                                    className="text-slate-500 hover:text-slate-700 transition">← Edit details</button>
                                <button type="button" onClick={handleResend}
                                    disabled={resendCooldown > 0 || otpLoading}
                                    className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                                    <RefreshCw size={13} />
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </form>
                        )}

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
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Upchar Health</Link>
                </p>
            </motion.div>
        </div>
    );
}
