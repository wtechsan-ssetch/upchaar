import { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { fetchFacilities, addFacility, deleteFacility } from '@/lib/adminApi.js';
import { Search, Plus, Trash2, Building2, Stethoscope, Pill, X, ChevronLeft, ChevronRight, TestTubes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { key: 'hospital', label: 'Hospitals', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
    { key: 'clinic', label: 'Clinics', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-700' },
    { key: 'medical', label: 'Medical Stores', icon: Pill, color: 'text-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
    { key: 'diagnostic', label: 'Diagnostics Centres', icon: TestTubes, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
];
const PAGE_SIZE = 8;

const EMPTY_FORM = { name: '', location: '', city: '', facilities: '', type: 'hospital' };

export default function FacilitiesManagement() {
    const { isSuperAdmin } = useAdmin();
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFacilities();
    }, []);

    const loadFacilities = async () => {
        try {
            setLoading(true);
            const data = await fetchFacilities();
            // Data maps directly since Supabase columns and initial mock data share structure (type, name, location, city, facilities)
            setFacilities(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    const [activeTab, setActiveTab] = useState('hospital');
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
        facilities.filter(f => f.type === activeTab && (!search ||
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.city.toLowerCase().includes(search.toLowerCase()) ||
            f.location.toLowerCase().includes(search.toLowerCase())
        )), [facilities, activeTab, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleDelete = async () => {
        try {
            await deleteFacility(deleteTarget);
            setFacilities(prev => prev.filter(f => f.id !== deleteTarget.id));
            showToast(`${deleteTarget.name} removed`, 'error');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeleteTarget(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const newItem = {
                type: form.type,
                name: form.name.trim(),
                location: form.location.trim(),
                city: form.city.trim(),
                facilities: form.facilities.split(',').map(s => s.trim()).filter(Boolean),
                status: 'Active',
            };
            const added = await addFacility(newItem);
            setFacilities(prev => [added, ...prev]);
            setActiveTab(form.type);
            setShowAdd(false);
            setForm(EMPTY_FORM);
            setPage(1);
            showToast(`${added.name} added successfully ✓`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const currentTab = TABS.find(t => t.key === activeTab);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Facilities Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{facilities.length} total facilities registered</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all">
                        <Plus size={16} /> Add Facility
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(({ key, label, icon: Icon, badge }) => {
                    const count = facilities.filter(f => f.type === key).length;
                    return (
                        <button key={key} onClick={() => { setActiveTab(key); setPage(1); setSearch(''); }}
                            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                                activeTab === key
                                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30')}>
                            <Icon size={14} />
                            {label}
                            <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                activeTab === key ? 'bg-white/20 text-white' : badge)}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder={`Search ${currentTab?.label}…`} value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                {['Name', 'Location', 'City', 'Services', 'Added', ...(isSuperAdmin ? ['Actions'] : [])].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paged.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0', currentTab?.bg)}>
                                                {currentTab && <currentTab.icon size={16} className={currentTab.color} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-400">{item.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px] truncate">{item.location}</td>
                                    <td className="px-4 py-3 text-slate-600">{item.city}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {item.facilities.slice(0, 2).map(f => (
                                                <span key={f} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">{f}</span>
                                            ))}
                                            {item.facilities.length > 2 && (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">+{item.facilities.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{format(new Date(item.added_at || new Date()), 'dd MMM yyyy')}</td>
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleteTarget(item)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {paged.length === 0 && (
                                <tr><td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-12 text-center text-slate-400 text-sm">No {currentTab?.label} found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
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

            {/* ── Add Facility Modal ─────────────────────────── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg">Add New Facility</h3>
                                <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
                                    <div className="flex gap-2">
                                        {TABS.map(t => (
                                            <button type="button" key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                                                className={cn('flex-1 py-2 rounded-xl text-xs font-semibold border transition', form.type === t.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40')}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {[
                                    { key: 'name', label: 'Facility Name', placeholder: 'e.g. Apollo Hospital' },
                                    { key: 'location', label: 'Full Address', placeholder: 'e.g. Sarita Vihar, Delhi' },
                                    { key: 'city', label: 'City', placeholder: 'e.g. Delhi' },
                                    { key: 'facilities', label: 'Services (comma-separated)', placeholder: 'ICU, Pharmacy, Emergency' },
                                ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                        <input required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition">Add Facility</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ───────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Remove Facility?</h3>
                            <p className="text-sm text-slate-500 mb-5">{deleteTarget.name} — {deleteTarget.city}</p>
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
