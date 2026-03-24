import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlog } from '../context/BlogContext.jsx';
import { BLOG_CATEGORIES, COVER_GRADIENTS } from '@/lib/constants.js';
import {
    Save, Send, Bold, Italic, Heading2, List, Quote, RotateCcw, CheckCircle,
    ImagePlus, X, Eye, Clock, Stethoscope, Loader2, Settings, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { uploadBlogImage } from '@/lib/uploadImage.js';
import { supabase } from '@/lib/supabase.js';

const EMPTY = {
    title: '', category: BLOG_CATEGORIES[0], tags: '', excerpt: '',
    content: '', coverGradient: COVER_GRADIENTS[0], readTime: 5, imageUrl: '',
};

function ToolbarBtn({ onClick, title, children }) {
    return (
        <button type="button" onClick={onClick} title={title}
            className="h-7 px-2 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition text-xs font-mono">
            {children}
        </button>
    );
}

/* ── Image Upload ───────────────────────────────────────────────────────── */
function ImageUpload({ imageUrl, onChange, bloggerId }) {
    const fileInputRef = useRef(null);
    const [urlInput, setUrlInput] = useState('');
    const [urlMode, setUrlMode] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setUploadError('');
        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || bloggerId || 'anonymous';
            const url = await uploadBlogImage(file, userId);
            onChange(url);
        } catch (err) {
            setUploadError(err.message || 'Upload failed. Try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const applyUrl = () => {
        if (urlInput.trim()) { onChange(urlInput.trim()); setUrlMode(false); setUrlInput(''); }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ImagePlus size={11} /> Featured Image
            </h3>

            {imageUrl ? (
                <div className="relative">
                    <img src={imageUrl} alt="Featured" className="w-full h-32 object-cover rounded-lg border border-slate-100" />
                    <button onClick={() => onChange('')}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                        <X size={12} />
                    </button>
                    <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle size={9} /> Image ready
                    </p>
                </div>
            ) : (
                <>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={cn(
                            'border-2 border-dashed rounded-xl p-5 text-center transition-all',
                            uploading ? 'cursor-default opacity-70' : 'cursor-pointer',
                            dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                        )}>
                        {uploading ? (
                            <>
                                <Loader2 size={22} className="mx-auto text-primary mb-2 animate-spin" />
                                <p className="text-xs font-medium text-primary">Uploading…</p>
                            </>
                        ) : (
                            <>
                                <ImagePlus size={22} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs font-medium text-slate-500">Drop image or click to upload</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP · max 10 MB</p>
                            </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])} disabled={uploading} />
                    </div>
                    {uploadError && <p className="mt-1.5 text-[11px] text-red-500">⚠ {uploadError}</p>}
                    <div className="mt-2">
                        {urlMode ? (
                            <div className="flex gap-1.5">
                                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyUrl()}
                                    placeholder="https://example.com/image.jpg" autoFocus
                                    className="flex-1 h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                                <button onClick={applyUrl} className="h-8 px-2.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition">Apply</button>
                                <button onClick={() => { setUrlMode(false); setUrlInput(''); }} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"><X size={12} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setUrlMode(true)} className="w-full text-[11px] text-primary hover:underline text-center py-1">
                                Or paste image URL
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Sidebar Settings Panel ─────────────────────────────────────────────── */
function SidebarPanel({ form, set, blogger, handlePublish, handleSaveDraft }) {
    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const today = format(new Date(), 'dd MMM yyyy');

    return (
        <div className="space-y-4">
            {/* Post Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Settings</h3>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition">
                        {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Tags <span className="text-slate-400">(comma separated)</span></label>
                    <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                        placeholder="e.g. Heart, Cardiology, Tips"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Read Time <span className="text-slate-400">(minutes)</span></label>
                    <input type="number" min={1} max={60} value={form.readTime} onChange={e => set('readTime', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                </div>
            </div>

            {/* Cover Gradient */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cover Color</h3>
                <div className="grid grid-cols-4 gap-2">
                    {COVER_GRADIENTS.map(g => (
                        <button key={g} type="button" onClick={() => set('coverGradient', g)}
                            className={cn(`h-9 rounded-xl bg-gradient-to-br ${g} transition-all`,
                                form.coverGradient === g ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-105')}>
                            {form.coverGradient === g && <CheckCircle size={12} className="text-white mx-auto" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Image */}
            <ImageUpload imageUrl={form.imageUrl} onChange={(url) => set('imageUrl', url)} bloggerId={blogger?.id} />

            {/* Live Preview card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Eye size={11} /> Preview
                </h3>
                <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                    <div className={cn(`bg-gradient-to-br ${form.coverGradient} flex items-end p-3 relative overflow-hidden`, form.imageUrl ? 'h-32' : 'h-24')}>
                        {form.imageUrl && <img src={form.imageUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />}
                        {form.imageUrl && <div className="absolute inset-0 bg-black/30" />}
                        <span className="relative z-10 text-[10px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{form.category}</span>
                    </div>
                    <div className="p-3">
                        {form.title ? (
                            <>
                                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 leading-snug">{form.title}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{form.excerpt || 'Your excerpt will appear here…'}</p>
                                {tagsArr.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tagsArr.slice(0, 3).map(t => (
                                            <span key={t} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px]">{t}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                        style={{ background: blogger?.avatarColor || blogger?.avatar_color || '#0d9488' }}>
                                        {(blogger?.name || 'B')[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-semibold text-slate-700 truncate">{blogger?.name || 'Author'}</p>
                                        <p className="text-[9px] text-slate-400">{today}</p>
                                    </div>
                                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock size={7} /> {form.readTime}m</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-[11px] text-slate-400 text-center py-3">Start typing to preview…</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Publish actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Actions</h3>
                <button onClick={handlePublish}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20">
                    <Send size={14} /> Publish Now
                </button>
                <button onClick={handleSaveDraft}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                    <Save size={14} /> Save as Draft
                </button>
            </div>
        </div>
    );
}

/* ── Main Editor ────────────────────────────────────────────────────────── */
export default function PostEditor() {
    const { id } = useParams();
    const { myPosts, publishPost, saveDraft, updatePost, blogger } = useBlog();
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const [form, setForm] = useState(EMPTY);
    const [toast, setToast] = useState(null);
    const [mobileTab, setMobileTab] = useState('write'); // 'write' | 'settings'
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (id) {
            const existing = myPosts.find(p => p.id === id);
            if (existing) setForm({
                ...existing,
                tags: Array.isArray(existing.tags) ? existing.tags.join(', ') : existing.tags || '',
                imageUrl: existing.imageUrl || existing.image_url || '',
                coverGradient: existing.coverGradient || existing.cover_gradient || COVER_GRADIENTS[0],
                readTime: existing.readTime || existing.read_time || 5,
            });
        } else {
            setForm(EMPTY);
        }
    }, [id]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };
    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const tagsArray = () => form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const insertText = (before, after = '') => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const sel = form.content.slice(start, end);
        const newContent = form.content.slice(0, start) + before + sel + after + form.content.slice(end);
        set('content', newContent);
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + before.length, start + before.length + sel.length);
        }, 0);
    };

    const handleSaveDraft = async () => {
        const data = { ...form, tags: tagsArray(), status: 'draft' };
        try {
            if (id) { await updatePost(id, data); showToast('Draft updated ✓'); }
            else { await saveDraft(data); showToast('Draft saved ✓'); navigate('/blogger/posts'); }
        } catch {
            showToast('Failed to save draft.', 'error');
        }
    };

    const handlePublish = async () => {
        if (!form.title.trim() || !form.content.trim() || !form.excerpt.trim()) {
            showToast('Please fill in Title, Excerpt and Content before publishing.', 'error');
            return;
        }
        setPublishing(true);
        const data = { ...form, tags: tagsArray(), status: 'published' };
        try {
            if (id) {
                await updatePost(id, { ...data, status: 'published' });
                showToast('Blog published successfully! 🎉');
                const existing = myPosts.find(p => p.id === id);
                const slug = existing?.slug || id;
                setTimeout(() => navigate(`/blogs/${slug}`), 1200);
            } else {
                const published = await publishPost(data);
                showToast('Blog published successfully! 🎉');
                setTimeout(() => navigate(`/blogs/${published.slug}`), 1200);
            }
        } catch {
            showToast('Failed to publish. Please try again.', 'error');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">{id ? 'Edit Post' : 'Write New Post'}</h1>
                <div className="flex gap-2">
                    <button onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
                        <Save size={14} /> <span className="hidden sm:inline">Save Draft</span>
                    </button>
                    <button onClick={handlePublish} disabled={publishing}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition disabled:opacity-60">
                        {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>{publishing ? 'Publishing…' : 'Publish'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile tab switcher (only shows on small screens) */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit lg:hidden">
                {[
                    { key: 'write', label: 'Write', icon: PenLine },
                    { key: 'settings', label: 'Settings', icon: Settings },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setMobileTab(key)}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            mobileTab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* Layout: desktop = 2-col, mobile = tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── WRITE PANEL ──────────────────────────────────────── */}
                <div className={cn('lg:col-span-2 space-y-4', mobileTab === 'settings' && 'hidden lg:block')}>
                    <input type="text" placeholder="Article Title…" value={form.title}
                        onChange={e => set('title', e.target.value)}
                        className="w-full text-xl sm:text-2xl font-bold px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder-slate-300 transition" />

                    <textarea placeholder="Short excerpt / summary (shown on blog listing)…" value={form.excerpt}
                        onChange={e => set('excerpt', e.target.value)} rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder-slate-300 transition" />

                    {/* Rich text area with toolbar */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary transition">
                        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
                            <ToolbarBtn onClick={() => insertText('<strong>', '</strong>')} title="Bold"><Bold size={13} /></ToolbarBtn>
                            <ToolbarBtn onClick={() => insertText('<em>', '</em>')} title="Italic"><Italic size={13} /></ToolbarBtn>
                            <ToolbarBtn onClick={() => insertText('\n<h2>', '</h2>\n')} title="Heading"><Heading2 size={13} /></ToolbarBtn>
                            <ToolbarBtn onClick={() => insertText('\n<ul>\n  <li>', '</li>\n</ul>\n')} title="List"><List size={13} /></ToolbarBtn>
                            <ToolbarBtn onClick={() => insertText('\n<blockquote>\n  <p>', '</p>\n</blockquote>\n')} title="Quote"><Quote size={13} /></ToolbarBtn>
                            <ToolbarBtn onClick={() => insertText('\n<p>', '</p>\n')} title="Paragraph">¶</ToolbarBtn>
                            {form.imageUrl && (
                                <ToolbarBtn onClick={() => insertText(`\n<img src="${form.imageUrl}" alt="" class="w-full rounded-xl my-4" />\n`)} title="Insert Image">
                                    <ImagePlus size={13} />
                                </ToolbarBtn>
                            )}
                            <div className="flex-1" />
                            <button type="button" onClick={() => set('content', '')} title="Clear"
                                className="h-7 px-2 rounded text-xs text-slate-400 hover:text-red-400 hover:bg-red-50 flex items-center gap-1 transition">
                                <RotateCcw size={11} /> Clear
                            </button>
                        </div>
                        <textarea
                            ref={textareaRef}
                            placeholder="Write your article content here (HTML supported)…"
                            value={form.content}
                            onChange={e => set('content', e.target.value)}
                            rows={20}
                            className="w-full px-4 py-3 text-sm text-slate-700 font-mono leading-relaxed focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* ── SETTINGS PANEL ───────────────────────────────────── */}
                <div className={cn('space-y-4', mobileTab === 'write' && 'hidden lg:block')}>
                    <SidebarPanel
                        form={form}
                        set={set}
                        blogger={blogger}
                        handlePublish={handlePublish}
                        handleSaveDraft={handleSaveDraft}
                    />
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                        className={cn(
                            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap',
                            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        )}>
                        <CheckCircle size={16} /> {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
