import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '@/blog/context/BlogContext.jsx';
import { BLOG_CATEGORIES } from '@/lib/constants.js';
import { Search, Heart, Eye, Clock, ChevronRight, Rss, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Skeleton } from 'boneyard-js/react';

/* ── Safe date helper ─────────────────────────────────── */
function safeDate(val) {
    try { const d = new Date(val); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}

/* ── Vertical post card ───────────────────────────────── */
function PostCard({ post, index }) {
    const imgUrl   = post.imageUrl || post.image_url || '';
    const gradient = post.coverGradient || post.cover_gradient || 'from-primary to-teal-400';
    const tags     = Array.isArray(post.tags) ? post.tags : [];
    const pubDate  = safeDate(post.publishedAt || post.published_at);

    // Strip HTML tags from content to show plain excerpt
    const plainContent = post.content
        ? post.content.replace(/<[^>]+>/g, '').slice(0, 280)
        : post.excerpt || '';

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row">
                {/* Cover image / gradient strip */}
                <div className={cn(
                    'relative flex-shrink-0 overflow-hidden',
                    `bg-gradient-to-br ${gradient}`,
                    'sm:w-48 h-40 sm:h-auto'
                )}>
                    {imgUrl && (
                        <>
                            <img src={imgUrl} alt={post.title}
                                className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20" />
                        </>
                    )}
                    {/* Category pill */}
                    <span className="absolute bottom-3 left-3 z-10 inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[11px] font-semibold">
                        {post.category}
                    </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                    {/* Author + date row */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: post.author?.avatarColor || '#0d9488' }}>
                            {(post.author?.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{post.author?.name || 'Upchaar Author'}</span>
                        {pubDate && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs text-slate-400">{format(pubDate, 'dd MMM yyyy')}</span>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <Link to={`/blogs/${post.slug}`}>
                        <h2 className="text-base font-bold text-slate-800 hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                            {post.title}
                        </h2>
                    </Link>

                    {/* Body preview */}
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-3 flex-1">
                        {plainContent}{plainContent.length >= 280 ? '…' : ''}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {tags.slice(0, 4).map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5"><Clock size={11} /> {post.readTime || post.read_time || 5} min</span>
                            <span className="flex items-center gap-0.5"><Heart size={11} /> {post.likes || 0}</span>
                            <span className="flex items-center gap-0.5"><Eye size={11} /> {(post.views || 0).toLocaleString()}</span>
                        </div>
                        <Link to={`/blogs/${post.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2 transition-all">
                            Read more <ChevronRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

/* ── Featured hero card ───────────────────────────────── */
function FeaturedCard({ post }) {
    const imgUrl   = post.imageUrl || post.image_url || '';
    const gradient = post.coverGradient || post.cover_gradient || 'from-primary to-teal-400';
    const tags     = Array.isArray(post.tags) ? post.tags : [];
    const pubDate  = safeDate(post.publishedAt || post.published_at);
    const plainContent = post.content
        ? post.content.replace(/<[^>]+>/g, '').slice(0, 320)
        : post.excerpt || '';

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link to={`/blogs/${post.slug}`}
                className={cn(
                    'group block relative rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300',
                    `bg-gradient-to-br ${gradient}`
                )}>
                {/* Hero image */}
                {imgUrl ? (
                    <>
                        <img src={imgUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}

                <div className="relative z-10 p-6 sm:p-8 flex flex-col min-h-[280px] justify-end">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white/80 uppercase tracking-widest">
                            <TrendingUp size={10} /> Featured
                        </span>
                        <span className="h-1 w-1 rounded-full bg-white/40" />
                        <span className="text-xs font-medium text-white/70 bg-black/25 px-2 py-0.5 rounded-full">{post.category}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-2 group-hover:text-emerald-200 transition-colors">
                        {post.title}
                    </h2>
                    <p className="text-sm text-white/75 line-clamp-2 mb-4">{plainContent}</p>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {tags.slice(0, 3).map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-[11px] font-medium">#{t}</span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-white/60">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: post.author?.avatarColor || '#0d9488' }}>
                            {(post.author?.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-white/80">{post.author?.name}</span>
                        {pubDate && <><span>·</span><span>{format(pubDate, 'dd MMM yyyy')}</span></>}
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {post.readTime || post.read_time || 5} min</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

/* ── Main Blogs page ──────────────────────────────────── */
const PAGE_SIZE = 8;

export default function Blogs() {
    const { publishedPosts, postsLoading } = useBlog();
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch]                 = useState('');
    const [page, setPage]                     = useState(1);

    const filtered = useMemo(() => {
        return publishedPosts.filter(p => {
            const tags = Array.isArray(p.tags) ? p.tags : [];
            const matchCat = activeCategory === 'All' || p.category === activeCategory;
            const q = search.toLowerCase();
            const matchSearch = !search
                || (p.title || '').toLowerCase().includes(q)
                || (p.excerpt || '').toLowerCase().includes(q)
                || tags.some(t => t.toLowerCase().includes(q));
            return matchCat && matchSearch;
        });
    }, [publishedPosts, activeCategory, search]);

    const featured   = !search && filtered[0];
    const rest       = !search ? filtered.slice(1) : filtered;
    const totalPages = Math.ceil(rest.length / PAGE_SIZE);
    const paged      = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

            {/* ── Hero banner ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-teal-600 to-emerald-500 text-white px-4 pt-16 pb-20">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white blur-3xl" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-5">
                        <Rss size={13} /> Health Insights From Our Experts
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                        Upchaar <span className="text-emerald-200">Health Blog</span>
                    </h1>
                    <p className="text-white/80 text-base sm:text-lg mb-8">
                        Evidence-based health articles and wellness tips written by medical professionals.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                            type="text"
                            placeholder="Search articles, topics, tags…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* ── Category strip ──────────────────────────── */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
                    {['All', ...BLOG_CATEGORIES].map(cat => (
                        <button key={cat}
                            onClick={() => { setActiveCategory(cat); setPage(1); }}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                                activeCategory === cat
                                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ─────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

                {/* Search result info */}
                {search && !postsLoading && (
                    <p className="text-sm text-slate-500">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<span className="font-medium text-slate-700">{search}</span>"
                    </p>
                )}

                {/* Featured post */}
                {!postsLoading && featured && <FeaturedCard post={featured} />}

                {/* Section heading */}
                {!postsLoading && paged.length > 0 && (
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide pt-2">
                        {search ? 'Results' : activeCategory === 'All' ? 'Latest Articles' : activeCategory}
                    </h2>
                )}

                {/* Vertical list */}
                <Skeleton name="blog-card" loading={postsLoading}>
                    <div className="space-y-4">
                        {(search ? rest : paged).map((post, i) => (
                            <PostCard key={post.id} post={post} index={i} />
                        ))}
                    </div>
                </Skeleton>

                {/* Empty */}
                {!postsLoading && filtered.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🩺</div>
                        <p className="text-slate-500 font-medium">No articles found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
                    </div>
                )}

                {/* Pagination */}
                {!search && totalPages > 1 && !postsLoading && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={cn('h-9 w-9 rounded-xl text-sm font-medium transition',
                                    page === p
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary')}>
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="bg-gradient-to-r from-primary/5 via-teal-50 to-emerald-50 rounded-2xl border border-primary/15 p-8 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-4">
                        <User size={22} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Are you a healthcare professional?</h3>
                    <p className="text-sm text-slate-500 mb-4">Share your expertise and reach thousands of patients through the Upchaar Health Blog.</p>
                    <Link to="/blogger/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
                        Start Writing <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
