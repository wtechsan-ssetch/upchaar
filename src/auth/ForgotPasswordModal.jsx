/**
 * ForgotPasswordModal.jsx
 * ─────────────────────────────────────────────────
 * 3-step forgot password flow using Resend email OTP:
 *   Step 1 — Enter registered email
 *   Step 2 — Enter 6-digit OTP sent to email
 *   Step 3 — Set new password
 *
 * Security notes:
 * - OTP is hashed (SHA-256) on the server before storage
 * - Email enumeration is prevented (always shows "check your inbox")
 * - OTPs expire in 10 minutes
 * - Max 3 OTP requests per 10 minutes per email
 * ─────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
    CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw, KeyRound
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

// Supabase project URL for edge functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callEdgeFunction(fnName, body) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok && data.error) throw new Error(data.error);
    return data;
}

// ─── OTP input component ───────────────────────────────────────────────────
function OtpInput({ otp, onChange, onKeyDown, onPaste, refs }) {
    return (
        <div className="flex gap-2.5 justify-center" onPaste={onPaste}>
            {otp.map((digit, idx) => (
                <input
                    key={idx}
                    ref={el => refs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => onChange(idx, e.target.value)}
                    onKeyDown={e => onKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    className={`w-11 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                        ${digit
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-200 bg-slate-50 text-slate-800'}
                        focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25`}
                    style={{ height: '52px' }}
                />
            ))}
        </div>
    );
}

// ─── MAIN MODAL ────────────────────────────────────────────────────────────
export default function ForgotPasswordModal({ onClose }) {
    // step: 'email' | 'otp' | 'password' | 'done'
    const [step, setStep] = useState('email');

    // Step 1
    const [email, setEmail]         = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError]     = useState('');

    // Step 2
    const [otp, setOtp]                   = useState(Array(OTP_LENGTH).fill(''));
    const [otpLoading, setOtpLoading]     = useState(false);
    const [otpError, setOtpError]         = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);

    // Step 3
    const [newPassword, setNewPassword]       = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass]             = useState(false);
    const [showConfirm, setShowConfirm]       = useState(false);
    const [passLoading, setPassLoading]       = useState(false);
    const [passError, setPassError]           = useState('');

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(s => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    // ── OTP handlers ─────────────────────────────────────────────────────
    const handleOtpChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
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

    // ── Step 1: Send OTP ──────────────────────────────────────────────────
    const handleSendOtp = async e => {
        e.preventDefault();
        setEmailError('');
        if (!email.trim()) { setEmailError('Please enter your email address.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError('Please enter a valid email address.'); return; }

        setEmailLoading(true);
        try {
            const data = await callEdgeFunction('send-forgot-password-otp', { email: email.trim() });
            // We always show "check your inbox" even if email not found (anti-enumeration)
            setOtp(Array(OTP_LENGTH).fill(''));
            setOtpError('');
            setResendCooldown(RESEND_COOLDOWN);
            setStep('otp');
        } catch (err) {
            setEmailError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    // ── Step 1→2: Resend OTP ─────────────────────────────────────────────
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtpError('');
        setOtpLoading(true);
        try {
            await callEdgeFunction('send-forgot-password-otp', { email: email.trim() });
            setOtp(Array(OTP_LENGTH).fill(''));
            setResendCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setOtpError(err.message || 'Failed to resend. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Step 2: Verify OTP ────────────────────────────────────────────────
    const handleVerifyOtp = async e => {
        e.preventDefault();
        const token = otp.join('');
        if (token.length < OTP_LENGTH) { setOtpError('Please enter the complete 6-digit code.'); return; }

        setOtpLoading(true);
        setOtpError('');
        try {
            // Verify only — check if OTP is correct before asking for new password
            await callEdgeFunction('verify-forgot-password-otp', {
                email: email.trim(),
                otp: token,
            });
            // If successful, move to step 3
            setStep('password');
        } catch (err) {
            setOtpError(err.message || 'Verification failed.');
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Step 3: Set new password ──────────────────────────────────────────
    const handleSetPassword = async e => {
        e.preventDefault();
        setPassError('');
        if (newPassword.length < 6) { setPassError('Password must be at least 6 characters.'); return; }
        if (!isStrongPassword(newPassword)) { setPassError(PASSWORD_RULE_MESSAGE); return; }
        if (newPassword !== confirmPassword) { setPassError('Passwords do not match.'); return; }

        setPassLoading(true);
        try {
            await callEdgeFunction('verify-forgot-password-otp', {
                email: email.trim(),
                otp: otp.join(''),
                newPassword,
            });
            setStep('done');
        } catch (err) {
            setPassError(err.message || 'Failed to reset password. Please try again.');
            // If OTP was invalid, go back to OTP step
            if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
                setTimeout(() => setStep('otp'), 1500);
            }
        } finally {
            setPassLoading(false);
        }
    };

    // ── Step indicator ────────────────────────────────────────────────────
    const STEPS = [
        { id: 'email', label: 'Email' },
        { id: 'otp',   label: 'Verify' },
        { id: 'password', label: 'Reset' },
    ];
    const stepIdx = { email: 0, otp: 1, password: 2, done: 3 }[step] ?? 0;

    const inputCls = 'w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition placeholder:text-slate-400';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white rounded-3xl shadow-2xl shadow-teal-900/15 border border-white/60 w-full max-w-md overflow-hidden"
                >
                    {/* ── Header ── */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-7 pt-7 pb-5 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                        >
                            <X size={15} className="text-white" />
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <KeyRound size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Upchaar Health</p>
                                <h2 className="text-white font-bold text-lg leading-tight">
                                    {step === 'done' ? 'Password Reset!' : 'Forgot Password'}
                                </h2>
                            </div>
                        </div>
                        <p className="text-white/75 text-sm">
                            {step === 'email'    && 'Enter your registered email to receive a reset code.'}
                            {step === 'otp'      && `A 6-digit code was sent to ${email}`}
                            {step === 'password' && 'Create a strong new password for your account.'}
                            {step === 'done'     && 'Your password has been reset successfully.'}
                        </p>

                        {/* Step progress */}
                        {step !== 'done' && (
                            <div className="flex items-center gap-1 mt-4">
                                {STEPS.map((s, i) => (
                                    <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500
                                            ${i < stepIdx ? 'bg-white' : i === stepIdx ? 'bg-white/60' : 'bg-white/25'}`}
                                        />
                                        {i === STEPS.length - 1 && (
                                            <div className={`h-1.5 w-3 rounded-full ${stepIdx >= STEPS.length ? 'bg-white' : 'bg-white/25'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Body ── */}
                    <div className="px-7 py-6">
                        <AnimatePresence mode="wait">

                            {/* ═══ STEP 1: EMAIL ═══ */}
                            {step === 'email' && (
                                <motion.form key="email" onSubmit={handleSendOtp}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <AnimatePresence>
                                        {emailError && (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /><span>{emailError}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Registered Email Address</label>
                                        <div className="relative">
                                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email" required value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className={`${inputCls} pl-10 pr-4`}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5">
                                            We'll send a 6-digit OTP to this email if it's registered.
                                        </p>
                                    </div>

                                    <button type="submit" disabled={emailLoading}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {emailLoading
                                            ? <><Loader2 size={16} className="animate-spin" />Sending OTP…</>
                                            : <><Mail size={16} />Send Reset Code</>
                                        }
                                    </button>
                                </motion.form>
                            )}

                            {/* ═══ STEP 2: OTP ═══ */}
                            {step === 'otp' && (
                                <motion.form key="otp" onSubmit={handleVerifyOtp}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="flex flex-col items-center text-center gap-1 pt-1">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-2">
                                            <ShieldCheck size={28} className="text-teal-500" />
                                        </div>
                                        <p className="text-sm text-slate-600">Check your inbox for the <span className="font-semibold text-slate-800">6-digit code</span></p>
                                        <p className="text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-1 rounded-full">{email}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Also check your spam/junk folder.</p>
                                    </div>

                                    <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} refs={otpRefs} />

                                    <AnimatePresence>
                                        {otpError && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                                <AlertCircle size={15} className="flex-shrink-0" />{otpError}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button type="submit" disabled={otpLoading || otp.join('').length < OTP_LENGTH}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {otpLoading
                                            ? <><Loader2 size={16} className="animate-spin" />Verifying…</>
                                            : <><CheckCircle2 size={16} />Verify Code</>
                                        }
                                    </button>

                                    <div className="flex items-center justify-between text-sm pt-1">
                                        <button type="button" onClick={() => { setStep('email'); setOtpError(''); }}
                                            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition">
                                            <ArrowLeft size={14} />Change Email
                                        </button>
                                        <button type="button" onClick={handleResend}
                                            disabled={resendCooldown > 0 || otpLoading}
                                            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                                            <RefreshCw size={13} className={resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'} />
                                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {/* ═══ STEP 3: NEW PASSWORD ═══ */}
                            {step === 'password' && (
                                <motion.form key="password" onSubmit={handleSetPassword}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <AnimatePresence>
                                        {passError && (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /><span>{passError}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100 text-sm text-teal-700 mb-1">
                                        <CheckCircle2 size={16} className="flex-shrink-0 text-teal-500" />
                                        OTP verified! Now set your new password.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">New Password</label>
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showPass ? 'text' : 'password'} required
                                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Min 6 chars, strong password"
                                                className={`${inputCls} pl-10 pr-11`}
                                            />
                                            <button type="button" onClick={() => setShowPass(s => !s)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'} required
                                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter new password"
                                                className={`${inputCls} pl-10 pr-11`}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(s => !s)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {/* Password match indicator */}
                                        {confirmPassword && (
                                            <p className={`text-xs mt-1.5 flex items-center gap-1 ${newPassword === confirmPassword ? 'text-teal-600' : 'text-red-500'}`}>
                                                {newPassword === confirmPassword
                                                    ? <><CheckCircle2 size={12} />Passwords match</>
                                                    : <><AlertCircle size={12} />Passwords do not match</>
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={passLoading}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {passLoading
                                            ? <><Loader2 size={16} className="animate-spin" />Resetting Password…</>
                                            : <><KeyRound size={16} />Reset Password</>
                                        }
                                    </button>

                                    <button type="button" onClick={() => { setStep('otp'); setPassError(''); }}
                                        className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition flex items-center justify-center gap-1">
                                        <ArrowLeft size={13} />Back to OTP
                                    </button>
                                </motion.form>
                            )}

                            {/* ═══ STEP DONE ═══ */}
                            {step === 'done' && (
                                <motion.div key="done"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="py-4 flex flex-col items-center text-center gap-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-400/30"
                                    >
                                        <CheckCircle2 size={40} className="text-white" />
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Password Reset!</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Your password has been updated successfully.<br />
                                            You can now sign in with your new password.
                                        </p>
                                    </div>
                                    <button onClick={onClose}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-400/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2">
                                        <CheckCircle2 size={16} />Sign In Now
                                    </button>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
