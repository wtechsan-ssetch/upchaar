import { useState, useMemo } from 'react';
import { useBlog } from '../context/BlogContext.jsx';
import { Link } from 'react-router-dom';
import { PenLine, Trash2, Eye, Heart, Clock, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
    published: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    draft:     'bg-amber-50 text-amber-600 border-amber-200',
};

function safeDate(val) {
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
}

export default function MyPosts() {
    const { myPosts, deletePost, updatePost } = useBlog();
    const [filter, setFilter] = useState('All');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = useMemo(() => {
        const sorted = [...myPosts].sort((a, b) => {
            const da = safeDate(a.updatedAt || a.updated_at);
            const db = safeDate(b.updatedAt || b.updated_at);
            return (db?.getTime() || 0) - (da?.getTime() || 0);
        });
        if (filter === 'All') return sorted;
        return sorted.filter(p => p.status === filter.toLowerCase());
    }, [myPosts, filter]);

    const handleDelete = (id) => {
        deletePost(id);
        setConfirmDelete(null);
        showToast('Post deleted');
    };

    const toggleStatus = (post) => {
        const newStatus = post.status === 'published' ? 'draft' : 'published';
        updatePost(post.id, { status: newStatus });
        showToast(`Post ${newStatus === 'published' ? 'published ✓' : 'moved to draft'}`);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-800">My Posts</h1>
                <Link to="/blogger/write"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20">
                    <PenLine size={14} /> New Post
                </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
                {['All', 'Published', 'Draft'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition',
                            filter === f
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30')}>
                        {f}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* ── Desktop Table ─────────────────────────────────────────── */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                {['Post', 'Category', 'Status', 'Date', 'Views', 'Likes', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(post => {
                                const gradient = post.coverGradient || post.cover_gradient || 'from-primary to-teal-400';
                                const postDate = safeDate(post.updatedAt || post.updated_at);
                                return (
                                    <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0`)} />
                                                <div>
                                                    <p className="font-medium text-slate-800 line-clamp-1 max-w-xs">{post.title}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">{post.excerpt}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{post.category}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleStatus(post)}
                                                className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border hover:opacity-70 transition-opacity', STATUS_STYLES[post.status])}>
                                                {post.status}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {postDate ? format(postDate, 'dd MMM yyyy') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-slate-600 text-xs"><Eye size={12} />{(post.views || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-slate-600 text-xs"><Heart size={12} />{post.likes || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link to={`/blogger/edit/${post.id}`}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all">
                                                    <PenLine size={13} />
                                                </Link>
                                                {post.status === 'published' && (
                                                    <a href={`/blogs/${post.slug}`} target="_blank" rel="noreferrer"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white transition-all">
                                                        <Eye size={13} />
                                                    </a>
                                                )}
                                                <button onClick={() => setConfirmDelete(post)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center">
                                        <p className="text-slate-400 text-sm">No {filter !== 'All' ? filter.toLowerCase() : ''} posts yet</p>
                                        <Link to="/blogger/write" className="text-xs text-primary hover:underline mt-1 block">Write your first post →</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Mobile Card List ─────────────────────────────────────── */}
            <div className="sm:hidden space-y-3">
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                        <p className="text-slate-400 text-sm">No posts yet</p>
                        <Link to="/blogger/write" className="text-xs text-primary hover:underline mt-1 block">Write your first post →</Link>
                    </div>
                )}
                {filtered.map(post => {
                    const gradient = post.coverGradient || post.cover_gradient || 'from-primary to-teal-400';
                    const postDate = safeDate(post.updatedAt || post.updated_at);
                    return (
                        <div key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Cover strip */}
                            <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 line-clamp-2 text-sm leading-snug">{post.title}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{post.category}</p>
                                    </div>
                                    <button onClick={() => toggleStatus(post)}
                                        className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0', STATUS_STYLES[post.status])}>
                                        {post.status}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                    {postDate && <span className="flex items-center gap-0.5"><Clock size={10} /> {format(postDate, 'dd MMM yy')}</span>}
                                    <span className="flex items-center gap-0.5"><Eye size={10} /> {(post.views || 0).toLocaleString()}</span>
                                    <span className="flex items-center gap-0.5"><Heart size={10} /> {post.likes || 0}</span>
                                </div>

                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                                    <Link to={`/blogger/edit/${post.id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-primary hover:text-white transition-all">
                                        <PenLine size={12} /> Edit
                                    </Link>
                                    {post.status === 'published' && (
                                        <a href={`/blogs/${post.slug}`} target="_blank" rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-blue-500 hover:text-white transition-all">
                                            <Eye size={12} /> View
                                        </a>
                                    )}
                                    <button onClick={() => setConfirmDelete(post)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-400 text-xs font-medium hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Post?</h3>
                            <p className="text-sm text-slate-500 mb-5 line-clamp-2">{confirmDelete.title}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(confirmDelete.id)}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg bg-emerald-500 text-white text-sm font-medium whitespace-nowrap">
                        <CheckCircle size={15} /> {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
