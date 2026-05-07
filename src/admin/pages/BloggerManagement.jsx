import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { supabase } from '@/lib/supabase.js';
import {
    Search, Plus, Trash2, PenLine, Mail, X, ChevronLeft, ChevronRight,
    ShieldAlert, ShieldCheck, Eye, FileText, RefreshCw, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 8;
const EMPTY_FORM = { name: '', email: '', password: '', specialty: '', bio: '', avatarColor: '#0d9488' };
const AVATAR_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981'];

const STATUS_STYLES = {
    active:    'bg-emerald-50 text-emerald-600 border-emerald-200',
    Active:    'bg-emerald-50 text-emerald-600 border-emerald-200',
    suspended: 'bg-red-50 text-red-500 border-red-200',
    Suspended: 'bg-red-50 text-red-500 border-red-200',
};

export default function BloggerManagement() {
    const { isSuperAdmin } = useAdmin();
    const [bloggers, setBloggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState('bloggers'); // 'bloggers' | 'posts'

    // Modals / targets
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [adding, setAdding] = useState(false);

    // Posts management
    const [allPosts, setAllPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [deletePostTarget, setDeletePostTarget] = useState(null);
    const [postSearch, setPostSearch] = useState('');

    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Load bloggers ────────────────────────────────────────────────────────
    const loadBloggers = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('controllers')
                .select('*')
                .eq('role', 'blogger')
                .order('created_at', { ascending: false });
            if (error) throw error;

            // Attach post counts
            const { data: postCounts } = await supabase
                .from('posts')
                .select('author_id');
            const countMap = {};
            for (const p of (postCounts || [])) {
                countMap[p.author_id] = (countMap[p.author_id] || 0) + 1;
            }
            setBloggers((data || []).map(b => ({ ...b, posts: countMap[b.id] || 0 })));
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Load all posts ───────────────────────────────────────────────────────
    const loadPosts = useCallback(async () => {
        setPostsLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, slug, status, published_at, created_at, author_id, category, controllers:author_id(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAllPosts(data || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setPostsLoading(false);
        }
    }, []);

    useEffect(() => { loadBloggers(); }, [loadBloggers]);
    useEffect(() => { if (tab === 'posts') loadPosts(); }, [tab, loadPosts]);

    // ── Filtered bloggers ────────────────────────────────────────────────────
    const filtered = useMemo(() =>
        bloggers.filter(b => !search ||
            (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (b.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (b.specialty || '').toLowerCase().includes(search.toLowerCase())
        ), [bloggers, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const filteredPosts = useMemo(() =>
        allPosts.filter(p => !postSearch ||
            (p.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
            (p.controllers?.name || '').toLowerCase().includes(postSearch.toLowerCase())
        ), [allPosts, postSearch]);

    // ── Add blogger (creates auth user via Edge Function + controller row) ───
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
        setAdding(true);
        try {
            // Use register-blogger Edge Function or direct admin insert
            // Since we have service role available via Edge Function pattern,
            // we'll call it via the admin session
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-blogger`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        password: form.password.trim(),
                        specialty: form.specialty.trim(),
                        bio: form.bio.trim(),
                        avatarColor: form.avatarColor,
                    }),
                }
            );
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to create blogger');

            setBloggers(prev => [{ ...result.blogger, posts: 0 }, ...prev]);
            setShowAdd(false);
            setForm(EMPTY_FORM);
            showToast(`${form.name} added as Blogger ✓`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setAdding(false);
        }
    };

    // ── Delete blogger ───────────────────────────────────────────────────────
    const handleDeleteBlogger = async () => {
        try {
            const { error } = await supabase.from('controllers').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            setBloggers(prev => prev.filter(b => b.id !== deleteTarget.id));
            showToast(`${deleteTarget.name} removed`, 'error');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeleteTarget(null);
    };

    // ── Suspend / unsuspend blogger ──────────────────────────────────────────
    const handleToggleSuspend = async (blogger) => {
        const newStatus = (blogger.status === 'suspended' || blogger.status === 'Suspended')
            ? 'active' : 'suspended';
        try {
            const { error } = await supabase
                .from('controllers')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', blogger.id);
            if (error) throw error;
            setBloggers(prev => prev.map(b => b.id === blogger.id ? { ...b, status: newStatus } : b));
            showToast(
                newStatus === 'suspended'
                    ? `${blogger.name} suspended`
                    : `${blogger.name} reinstated ✓`,
                newStatus === 'suspended' ? 'warn' : 'success'
            );
        } catch (err) {
            showToast(err.message, 'error');
        }
        setSuspendTarget(null);
    };

    // ── Delete post ──────────────────────────────────────────────────────────
    const handleDeletePost = async () => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', deletePostTarget.id);
            if (error) throw error;
            setAllPosts(prev => prev.filter(p => p.id !== deletePostTarget.id));
            setBloggers(prev => prev.map(b =>
                b.id === deletePostTarget.author_id ? { ...b, posts: Math.max(0, (b.posts || 1) - 1) } : b
            ));
            showToast('Post deleted', 'error');
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeletePostTarget(null);
    };

    const isSuspended = (b) => b.status === 'suspended' || b.status === 'Suspended';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Blogger Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{bloggers.length} bloggers · {allPosts.length} posts</p>
                </div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all">
                            <Plus size={16} /> Add Blogger
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {[
                    { key: 'bloggers', label: 'Bloggers', icon: PenLine },
                    { key: 'posts', label: 'All Posts', icon: FileText },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            tab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* ── BLOGGERS TAB ─────────────────────────────────────────── */}
            {tab === 'bloggers' && (
                <>
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search bloggers…" value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        {['Blogger', 'Email', 'Specialty', 'Posts', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
                                    ) : paged.map(blogger => (
                                        <tr key={blogger.id} className={cn('hover:bg-slate-50/70 transition-colors', isSuspended(blogger) && 'opacity-60')}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                                                        style={{ backgroundColor: blogger.avatar_color || blogger.avatarColor || '#0d9488' }}>
                                                        {(blogger.name || '?')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{blogger.name}</p>
                                                        <p className="text-xs text-slate-400">{blogger.id.slice(0, 8)}…</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 text-xs text-slate-600"><Mail size={11} /> {blogger.email}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">{blogger.specialty || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                                    <PenLine size={12} className="text-slate-400" /> {blogger.posts}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border capitalize',
                                                    STATUS_STYLES[blogger.status] || 'bg-slate-100 text-slate-500 border-slate-200')}>
                                                    {blogger.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                                {format(new Date(blogger.created_at || new Date()), 'dd MMM yyyy')}
                                            </td>
                                            {isSuperAdmin && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Suspend / Unsuspend */}
                                                        <button
                                                            onClick={() => setSuspendTarget(blogger)}
                                                            title={isSuspended(blogger) ? 'Reinstate' : 'Suspend'}
                                                            className={cn(
                                                                'h-8 w-8 flex items-center justify-center rounded-lg transition-all',
                                                                isSuspended(blogger)
                                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                                                    : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white'
                                                            )}>
                                                            {isSuspended(blogger)
                                                                ? <ShieldCheck size={14} />
                                                                : <ShieldAlert size={14} />}
                                                        </button>
                                                        {/* Delete */}
                                                        <button onClick={() => setDeleteTarget(blogger)}
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete Blogger">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {!loading && paged.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No bloggers found</td></tr>
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
                </>
            )}

            {/* ── POSTS TAB ─────────────────────────────────────────────── */}
            {tab === 'posts' && (
                <>
                    <div className="flex items-center gap-3">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" placeholder="Search by title or author…" value={postSearch}
                                onChange={e => setPostSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                        </div>
                        <button onClick={loadPosts} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:border-primary hover:text-primary text-sm transition">
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        {['Title', 'Author', 'Category', 'Status', 'Published', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {postsLoading ? (
                                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
                                    ) : filteredPosts.map(post => (
                                        <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3 max-w-xs">
                                                <p className="font-medium text-slate-800 truncate">{post.title}</p>
                                                <p className="text-xs text-slate-400">{post.id.slice(0, 8)}…</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                                {post.controllers?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">{post.category || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border capitalize',
                                                    post.status === 'published'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-600 border-amber-200'
                                                )}>
                                                    {post.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                                {post.published_at
                                                    ? format(new Date(post.published_at), 'dd MMM yyyy')
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <a href={`/blogs/${post.slug || post.id}`} target="_blank" rel="noreferrer"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all" title="View Post">
                                                        <Eye size={14} />
                                                    </a>
                                                    {isSuperAdmin && (
                                                        <button onClick={() => setDeletePostTarget(post)}
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete Post">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!postsLoading && filteredPosts.length === 0 && (
                                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No posts found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Add Blogger Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg">Add Blogger</h3>
                                <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                {[
                                    { key: 'name', label: 'Full Name', placeholder: 'Dr. Meera Krishnan', type: 'text', required: true },
                                    { key: 'email', label: 'Email', placeholder: 'blogger@upcharhealth.com', type: 'email', required: true },
                                    { key: 'password', label: 'Password', placeholder: 'Set login password', type: 'password', required: true },
                                    { key: 'specialty', label: 'Medical Specialty', placeholder: 'General Medicine', type: 'text', required: false },
                                    { key: 'bio', label: 'Bio (optional)', placeholder: 'Short bio…', type: 'text', required: false },
                                ].map(({ key, label, placeholder, type, required }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder} required={required}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Avatar Color</label>
                                    <div className="flex gap-2">
                                        {AVATAR_COLORS.map(color => (
                                            <button type="button" key={color} onClick={() => setForm(f => ({ ...f, avatarColor: color }))}
                                                style={{ backgroundColor: color }}
                                                className={cn('h-7 w-7 rounded-full transition-all', form.avatarColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80 hover:opacity-100')} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit" disabled={adding}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                                        {adding ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                        {adding ? 'Creating…' : 'Add Blogger'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Suspend Confirm Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {suspendTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">
                                {isSuspended(suspendTarget) ? 'Reinstate Blogger?' : 'Suspend Blogger?'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">{suspendTarget.name} — {suspendTarget.email}</p>
                            {!isSuspended(suspendTarget) && (
                                <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
                                    The blogger will see a &quot;Suspended&quot; screen when they log in and will only be able to submit an appeal.
                                </p>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setSuspendTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={() => handleToggleSuspend(suspendTarget)}
                                    className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition',
                                        isSuspended(suspendTarget) ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600')}>
                                    {isSuspended(suspendTarget) ? 'Yes, Reinstate' : 'Yes, Suspend'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Blogger Confirm ────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Blogger?</h3>
                            <p className="text-sm text-slate-500 mb-2">{deleteTarget.name} — {deleteTarget.email}</p>
                            <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3 mb-5 border border-red-200">
                                This will permanently remove the blogger account. Their posts will remain but be unattributed.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleDeleteBlogger} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Post Confirm ───────────────────────────────────── */}
            <AnimatePresence>
                {deletePostTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Post?</h3>
                            <p className="text-sm text-slate-500 mb-5 truncate">&quot;{deletePostTarget.title}&quot;</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeletePostTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleDeletePost} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className={cn('fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2',
                            toast.type === 'success' ? 'bg-emerald-500 text-white' :
                                toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        )}>
                        <CheckCircle size={15} /> {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
