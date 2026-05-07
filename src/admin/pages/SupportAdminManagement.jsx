import { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { Search, Plus, Trash2, UserCog, Mail, Phone, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 8;
const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export default function SupportAdminManagement() {
    const { isSuperAdmin } = useAdmin();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('controllers')
                .select('*')
                .eq('role', 'support_admin')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAdmins(data || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = useMemo(() =>
        admins.filter(a => !search ||
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.email.toLowerCase().includes(search.toLowerCase())
        ), [admins, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDelete = async () => {
        try {
            const { error } = await supabase.from('controllers').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            setAdmins(prev => prev.filter(a => a.id !== deleteTarget.id));
            showToast(`${deleteTarget.name} removed`, 'error');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeleteTarget(null);
    };

    const [isCreating, setIsCreating] = useState(false);
    const handleAdd = async (e) => {
        e.preventDefault();
        if (isCreating) return;
        
        try {
            setIsCreating(true);
            // Get the current admin's JWT to pass as Authorization header
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Admin session not found. Please log in again.');

            const res = await supabase.functions.invoke('create-support-admin', {
                body: {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    phone: form.phone.trim(),
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            // Handle potential errors from the function
            if (res.error) {
                // Try to get JSON error from function body if it exists
                let errorMsg = 'Failed to create support admin';
                if (res.error instanceof Error) {
                    errorMsg = res.error.message;
                }
                
                // If the function returned a body with an error field, use that
                if (res.data?.error) {
                    errorMsg = res.data.error;
                } else if (typeof res.error === 'object' && res.error?.context?.message) {
                  errorMsg = res.error.context.message;
                }

                throw new Error(errorMsg);
            }

            const { supportAdmin } = res.data ?? {};
            if (!supportAdmin) throw new Error('No admin data returned from server');

            setAdmins(prev => [supportAdmin, ...prev]);
            setShowAdd(false);
            setForm(EMPTY_FORM);
            setPage(1);
            showToast(`${supportAdmin.name} added as Support Admin ✓`);
        } catch (err) {
            console.error('[SupportAdmin] add error:', err);
            showToast(err.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Support Admin Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{admins.length} support admins</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all">
                        <Plus size={16} /> Add Support Admin
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search support admins…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {['Admin', 'Contact', 'Joined', 'Status', ...(isSuperAdmin ? ['Actions'] : [])].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paged.map(admin => (
                            <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-sm flex-shrink-0">
                                            <UserCog size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{admin.name}</p>
                                            <p className="text-xs text-slate-400">{admin.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1 text-xs text-slate-600"><Mail size={11} /> {admin.email}</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} /> {admin.phone}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{format(new Date(admin.created_at || new Date()), 'dd MMM yyyy')}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-600 border-emerald-200">{admin.status}</span>
                                </td>
                                {isSuperAdmin && (
                                    <td className="px-4 py-3">
                                        <button onClick={() => setDeleteTarget(admin)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Remove">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr><td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-12 text-center text-slate-400 text-sm">No support admins found</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition"><ChevronLeft size={14} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={cn('h-8 w-8 rounded-lg text-xs font-medium transition', page === p ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary')}>{p}</button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg">Add Support Admin</h3>
                                <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-5 space-y-4">
                                {[
                                    { key: 'name', label: 'Full Name', placeholder: 'e.g. Rahul Nair', type: 'text' },
                                    { key: 'email', label: 'Email Address', placeholder: 'support@upcharhealth.com', type: 'email' },
                                    { key: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel' },
                                    { key: 'password', label: 'Initial Password', placeholder: 'Min. 8 characters', type: 'password' },
                                ].map(({ key, label, placeholder, type }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                        <input required={key !== 'phone'} minLength={key === 'password' ? 8 : undefined}
                                            type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit" disabled={isCreating}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
                                        {isCreating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Adding…
                                            </>
                                        ) : (
                                            'Add Admin'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm ─────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Remove Support Admin?</h3>
                            <p className="text-sm text-slate-500 mb-5">{deleteTarget.name} — {deleteTarget.email}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Yes, Remove</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className={cn('fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
                            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
