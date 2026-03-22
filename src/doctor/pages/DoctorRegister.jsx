import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDoctor } from '../context/DoctorContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Eye, EyeOff, Loader2, AlertCircle, Phone, Lock, User, MapPin, ChevronDown } from 'lucide-react';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth.js';

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'Gastroenterologist', 'Gynaecologist', 'Nephrologist', 'Neurologist',
    'Oncologist', 'Ophthalmologist', 'Orthopaedic', 'Paediatrician',
    'Psychiatrist', 'Pulmonologist', 'Radiologist', 'Urologist',
];

const EMPTY = { fullName: '', email: '', phone: '', password: '', confirmPassword: '', specialization: '', city: '' };

export default function DoctorRegister() {
    const { register } = useDoctor();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.fullName.trim()) return 'Full name is required.';
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) return 'Enter a valid 10-digit phone number.';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        if (!isStrongPassword(form.password)) return PASSWORD_RULE_MESSAGE;
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);
        try {
            await register({
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password,
                specialization: form.specialization,
                city: form.city,
            });
            navigate('/doctor/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { name: 'fullName', label: 'Full Name', placeholder: 'Dr. Priya Sharma', type: 'text', icon: User, required: true },
        { name: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel', icon: Phone, required: true },
        { name: 'email', label: 'Email Address', placeholder: 'doctor@clinic.com', type: 'email', icon: null, required: true },
        { name: 'city', label: 'City', placeholder: 'Delhi, Mumbai, Bangalore…', type: 'text', icon: MapPin, required: false },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-900/10 border border-white/60 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-teal-400 px-8 pt-10 pb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Stethoscope size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Sanjiwani Health</p>
                                <h1 className="text-white font-bold text-xl">Create Doctor Account</h1>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm">Join our network of trusted healthcare professionals.</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {fields.map(({ name, label, placeholder, type, icon: Icon, required }) => (
                                <div key={name}>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                                        {label} {required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="relative">
                                        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                                        <input
                                            name={name}
                                            type={type}
                                            required={required}
                                            value={form[name]}
                                            onChange={handleChange}
                                            placeholder={placeholder}
                                            className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400`}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Specialization */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Specialization</label>
                                <div className="relative">
                                    <select
                                        name="specialization"
                                        value={form.specialization}
                                        onChange={handleChange}
                                        className="w-full appearance-none pl-4 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition text-slate-700"
                                    >
                                        <option value="">Select specialization…</option>
                                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Password <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="password"
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Min 6 characters"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400"
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Confirm Password <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter password"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400"
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
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-teal-400 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/doctor/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-slate-600 transition">← Back to Sanjiwani Health</Link>
                </p>
            </motion.div>
        </div>
    );
}
