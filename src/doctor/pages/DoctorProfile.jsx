/**
 * DoctorProfile.jsx
 * ─────────────────────────────────────────────────
 * Fully mobile-responsive doctor profile editor.
 * Features:
 *  - Profile picture upload with live preview
 *  - Avatar color chooser (fallback when no photo)
 *  - Responsive grid forms (1-col on mobile, 2-col on sm+)
 *  - Availability days toggle + hours
 *  - Secret key display + copy + regenerate
 * ─────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react';
import { useDoctor, uploadDoctorAvatar } from '../context/DoctorContext.jsx';
import {
    Save, Loader2, CheckCircle, User, Stethoscope, Clock,
    Building2, Copy, RefreshCw, Camera, AlertCircle, KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'Gastroenterologist', 'Gynaecologist', 'Neurologist', 'Oncologist',
    'Ophthalmologist', 'Orthopaedic', 'Paediatrician', 'Psychiatrist',
    'Pulmonologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AVATAR_COLORS = [
    '#0d9488', '#6366f1', '#f59e0b', '#ec4899',
    '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
];

/* ── Section Wrapper ─────────────────────────────── */
function Section({ icon: Icon, title, children, className }) {
    return (
        <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6', className)}>
            <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
                {Icon && <Icon size={15} className="text-teal-500" />}
                {title}
            </h2>
            {children}
        </div>
    );
}

/* ── Field ───────────────────────────────────────── */
function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition';

export default function DoctorProfile() {
    const { doctor, doctorRecord, updateProfile, rotateSecretKey } = useDoctor();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        fullName: doctor.fullName || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        city: doctor.city || '',
        gender: doctor.gender || '',
        specialization: doctor.specialization || '',
        experience: doctor.experience || '',
        fee: doctor.fee || '',
        degree: doctor.degree || '',
        clinicName: doctor.clinicName || '',
        bio: doctor.bio || '',
        hoursFrom: doctor.hoursFrom || '09:00',
        hoursTo: doctor.hoursTo || '17:00',
        availableDays: doctor.availableDays || [],
        languages: (doctor.languages || []).join(', '),
        avatarColor: doctor.avatarColor || '#0d9488',
        avatarUrl: doctor.avatarUrl || null,
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(doctor.avatarUrl || null);

    const initials = (form.fullName || 'DR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    /* ── Handlers ── */
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const toggleDay = day => setForm(f => ({
        ...f,
        availableDays: f.availableDays.includes(day)
            ? f.availableDays.filter(d => d !== day)
            : [...f.availableDays, day],
    }));

    /* Profile picture upload */
    const handleAvatarChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB.');
            return;
        }
        setError('');
        // Instant preview
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setUploadingAvatar(true);
        try {
            const publicUrl = await uploadDoctorAvatar(file, doctorRecord?.id || doctor.id);
            setForm(f => ({ ...f, avatarUrl: publicUrl }));
            setAvatarPreview(publicUrl);
        } catch (err) {
            setError(err.message || 'Avatar upload failed.');
            setAvatarPreview(form.avatarUrl); // revert
        } finally {
            setUploadingAvatar(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    }, [doctorRecord?.id, doctor.id, form.avatarUrl]);

    const handleCopyKey = () => {
        if (!doctor.secretKey) return;
        navigator.clipboard.writeText(doctor.secretKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerateKey = async () => {
        if (!window.confirm('Regenerating will invalidate your current key for FUTURE links. Existing links remain active. Proceed?')) return;
        setRegenerating(true);
        try { await rotateSecretKey(); }
        catch (err) { setError('Failed to regenerate key: ' + err.message); }
        finally { setRegenerating(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await updateProfile({
                ...form,
                experience: Number(form.experience) || 0,
                fee: Number(form.fee) || 0,
                languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 pb-10 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
                <p className="text-sm text-slate-500 mt-0.5">Update your details, availability and clinic info</p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm"
                >
                    <AlertCircle size={15} className="shrink-0" /> {error}
                </motion.div>
            )}

            <form onSubmit={handleSave} className="space-y-5">

                {/* ── Profile Picture ── */}
                <Section icon={User} title="Profile Picture">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="h-24 w-24 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-2xl shadow-md"
                                style={{ backgroundColor: form.avatarColor }}
                            >
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                    : initials}
                            </div>
                            {/* Camera overlay */}
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:text-teal-600 transition disabled:opacity-60"
                                title="Change photo"
                            >
                                {uploadingAvatar
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Camera size={13} />}
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="flex-1 space-y-3 w-full">
                            <p className="text-xs text-slate-500">
                                Upload a clear, professional photo (max 5 MB). It will be visible to patients and admins.
                            </p>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm hover:border-teal-400 hover:text-teal-600 transition disabled:opacity-60"
                            >
                                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                {uploadingAvatar ? 'Uploading…' : 'Choose Photo'}
                            </button>

                            {/* Color chooser (fallback) */}
                            <div>
                                <p className="text-[11px] text-slate-400 mb-1.5">Avatar color (shown when no photo)</p>
                                <div className="flex flex-wrap gap-2">
                                    {AVATAR_COLORS.map(c => (
                                        <button
                                            type="button"
                                            key={c}
                                            onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                                            style={{ backgroundColor: c }}
                                            className={cn(
                                                'h-7 w-7 rounded-full border-2 transition-all',
                                                form.avatarColor === c
                                                    ? 'border-white ring-2 ring-offset-1 ring-slate-400 scale-110'
                                                    : 'border-transparent hover:scale-110'
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── Secret Key ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 overflow-hidden relative">
                    <div className="absolute top-3 right-4">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-wider border border-teal-100">
                            Private Key
                        </span>
                    </div>
                    <h2 className="font-semibold text-slate-700 text-sm mb-1 flex items-center gap-2">
                        <KeyRound size={15} className="text-teal-500" /> Doctor Secret Key
                    </h2>
                    <p className="text-[11px] text-slate-500 mb-4">
                        Share this with clinics or medical centers to link your profile to their dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm text-slate-700 select-all min-h-[44px] flex items-center break-all">
                            {doctor.secretKey || 'Generating…'}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCopyKey}
                                className={cn(
                                    'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border min-h-[44px]',
                                    copied
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                                )}
                            >
                                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={handleRegenerateKey}
                                disabled={regenerating}
                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-slate-50 transition disabled:opacity-50"
                                title="Regenerate Key"
                            >
                                <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Personal Information ── */}
                <Section icon={User} title="Personal Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full Name">
                            <input name="fullName" value={form.fullName} onChange={handleChange}
                                placeholder="Dr. Priya Sharma" className={inputCls} />
                        </Field>
                        <Field label="Phone Number">
                            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                                placeholder="9876543210" className={inputCls} />
                        </Field>
                        <Field label="Email">
                            <input name="email" type="email" value={form.email} onChange={handleChange}
                                placeholder="doctor@clinic.com" className={inputCls} readOnly
                                title="Email cannot be changed here. Contact admin." />
                        </Field>
                        <Field label="City">
                            <input name="city" value={form.city} onChange={handleChange}
                                placeholder="Delhi" className={inputCls} />
                        </Field>
                        <Field label="Gender">
                            <select name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
                                <option value="">Select gender</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                                <option>Prefer not to say</option>
                            </select>
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Bio / About">
                                <textarea
                                    name="bio" value={form.bio} onChange={handleChange}
                                    rows={3} placeholder="Write a short professional bio…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition resize-none"
                                />
                            </Field>
                        </div>
                    </div>
                </Section>

                {/* ── Professional Details ── */}
                <Section icon={Stethoscope} title="Professional Details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Specialization">
                            <select name="specialization" value={form.specialization} onChange={handleChange} className={inputCls}>
                                <option value="">Select…</option>
                                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Degree">
                            <input name="degree" value={form.degree} onChange={handleChange}
                                placeholder="MBBS, MD (Cardiology)" className={inputCls} />
                        </Field>
                        <Field label="Experience (years)">
                            <input name="experience" type="number" value={form.experience} onChange={handleChange}
                                placeholder="10" min="0" className={inputCls} />
                        </Field>
                        <Field label="Consultation Fee (₹)">
                            <input name="fee" type="number" value={form.fee} onChange={handleChange}
                                placeholder="500" min="0" className={inputCls} />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Languages (comma-separated)">
                                <input name="languages" value={form.languages} onChange={handleChange}
                                    placeholder="English, Hindi, Bengali" className={inputCls} />
                            </Field>
                        </div>
                    </div>
                </Section>

                {/* ── Clinic Information ── */}
                <Section icon={Building2} title="Clinic / Practice Name">
                    <Field label="Clinic Name(s)">
                        <input
                            name="clinicName" value={form.clinicName} onChange={handleChange}
                            placeholder="City Clinic, Apollo Hospital (comma-separated for multiple)"
                            className={inputCls}
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                            For clinic-specific timetables, use the "Add Timetable" option from the sidebar.
                        </p>
                    </Field>
                </Section>

                {/* ── General Availability (fallback) ── */}
                <Section icon={Clock} title="General Availability">
                    <p className="text-xs text-slate-400 mb-3">
                        This sets your default global availability. For per-clinic schedules, use <strong>Add Timetable</strong>.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Available Days</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={cn(
                                            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all select-none',
                                            form.availableDays.includes(day)
                                                ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/20'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600'
                                        )}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[{ name: 'hoursFrom', label: 'From' }, { name: 'hoursTo', label: 'To' }].map(({ name, label }) => (
                                <Field key={name} label={label}>
                                    <input
                                        type="time" name={name} value={form[name]} onChange={handleChange}
                                        className={inputCls}
                                    />
                                </Field>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Save Button ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving || uploadingAvatar}
                        className={cn(
                            'flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-md w-full sm:w-auto',
                            saved
                                ? 'bg-emerald-500 text-white shadow-emerald-200'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/25 hover:opacity-90 disabled:opacity-60'
                        )}
                    >
                        {saving
                            ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                            : saved
                                ? <><CheckCircle size={16} /> Saved!</>
                                : <><Save size={16} /> Save Profile</>}
                    </button>
                    {saved && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-emerald-600 font-medium"
                        >
                            ✓ Profile updated successfully
                        </motion.p>
                    )}
                </div>
            </form>
        </div>
    );
}
