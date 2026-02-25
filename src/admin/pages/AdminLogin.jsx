import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const { login } = useAdmin();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please check your email and password.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
            {/* Background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-400 shadow-lg shadow-primary/30 mb-4">
                            <Shield className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
                        <p className="text-sm text-slate-500 mt-1">Sanjiwani Health — Secure Access</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="admin@sanjiwani.health"
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="••••••••"
                                    className="w-full h-11 px-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                />
                                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-semibold text-sm shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
