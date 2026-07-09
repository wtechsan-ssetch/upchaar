import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlog } from '@/blog/context/BlogContext.jsx';
import { Heart, Eye, Clock, ArrowLeft, Share2, Calendar, Stethoscope, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

function safeDate(val) {
    try { const d = new Date(val); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}

export default function BlogPost() {
    const { slug } = useParams();
    const { publishedPosts, likePost, incrementViews } = useBlog();
    const [liked, setLiked]   = useState(false);
    const [copied, setCopied] = useState(false);
    const viewedSlugRef = useRef(null);

    const post = publishedPosts.find(p => p.slug === slug);
    const related = publishedPosts.filter(p =>
        p.slug !== slug &&
        (p.category === post?.category || (Array.isArray(p.tags) && Array.isArray(post?.tags) && p.tags.some(t => post.tags.includes(t))))
    ).slice(0, 3);

    useEffect(() => {
        if (post && viewedSlugRef.current !== slug) {
            incrementViews(post.id);
            window.scrollTo(0, 0);
            viewedSlugRef.current = slug;
        }
    }, [slug, post, incrementViews]);

    const handleLike = () => {
        if (!liked && post) { likePost(post.id); setLiked(true); }
    };
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="text-5xl">📄</div>
            <p className="text-slate-600 font-medium">Article not found</p>
            <Link to="/blogs" className="text-primary hover:underline text-sm">← Back to Blog</Link>
        </div>
    );

    const imgUrl   = post.imageUrl || post.image_url || '';
    const gradient = post.coverGradient || post.cover_gradient || 'from-primary to-teal-400';
    const pubDate  = safeDate(post.publishedAt || post.published_at);
    const tags     = Array.isArray(post.tags) ? post.tags : [];

    return (
        <div className="min-h-screen bg-white">
            {/* ── Hero Cover ───────────────────────────────────────────────── */}
            <div className={cn(
                `bg-gradient-to-br ${gradient} h-64 sm:h-96 relative flex items-end overflow-hidden`
            )}>
                {imgUrl && (
                    <>
                        <img src={imgUrl} alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </>
                )}
                {!imgUrl && <div className="absolute inset-0 bg-black/25" />}

                <div className="relative max-w-3xl mx-auto w-full px-4 pb-8 z-10">
                    <Link to="/blogs"
                        className="inline-flex items-center gap-1.5 text-white/80 text-sm hover:text-white transition-colors mb-4">
                        <ArrowLeft size={14} /> Back to Blog
                    </Link>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-semibold">
                        {post.category}
                    </span>
                </div>
            </div>

            {/* ── Article ──────────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-4 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 -mt-12 relative z-10">

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                        {pubDate && <span className="flex items-center gap-1"><Calendar size={11} /> {format(pubDate, 'dd MMMM yyyy')}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime || post.read_time || 5} min read</span>
                        <span className="flex items-center gap-1"><Eye size={11} /> {(post.views || 0).toLocaleString()} views</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {post.category}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight mb-4">
                        {post.title}
                    </h1>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {tags.map(t => (
                                <span key={t} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Author card */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-8">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                            style={{ background: post.author?.avatarColor || '#0d9488' }}>
                            {(post.author?.name || '?')[0]}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{post.author?.name}</p>
                            {post.author?.specialty && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Stethoscope size={10} /> {post.author.specialty}
                                </p>
                            )}
                            {post.author?.bio && <p className="text-xs text-slate-400 mt-1">{post.author.bio}</p>}
                        </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-base text-slate-600 font-medium leading-relaxed mb-8 border-l-4 border-primary/40 pl-4 italic">
                        {post.excerpt}
                    </p>

                    {/* Featured image (again full-width inside article if set) */}
                    {imgUrl && (
                        <div className="rounded-xl overflow-hidden mb-8 border border-slate-100">
                            <img src={imgUrl} alt={post.title} className="w-full object-cover max-h-72" />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-slate prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-blockquote:border-primary prose-blockquote:text-slate-600 prose-blockquote:italic max-w-none text-sm sm:text-base"
                        style={{ lineHeight: 1.8 }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    />

                    {/* Action bar */}
                    <div className="flex items-center gap-3 mt-10 pt-8 border-t border-slate-100">
                        <button onClick={handleLike}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                                liked
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500'
                            )}>
                            <Heart size={15} className={liked ? 'fill-current' : ''} />
                            {(post.likes || 0) + (liked ? 1 : 0)} Likes
                        </button>
                        <button onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all">
                            <Share2 size={15} />
                            {copied ? 'Copied!' : 'Share'}
                        </button>
                        <Link to="/blogs" className="ml-auto text-sm text-primary hover:underline flex items-center gap-1">
                            <ArrowLeft size={13} /> All Articles
                        </Link>
                    </div>
                </motion.div>

                {/* Related Posts */}
                {related.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-lg font-bold text-slate-800 mb-5">Related Articles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {related.map(rel => {
                                const relImg = rel.imageUrl || rel.image_url || '';
                                const relGrad = rel.coverGradient || rel.cover_gradient || 'from-primary to-teal-400';
                                const relDate = safeDate(rel.publishedAt || rel.published_at);
                                return (
                                    <Link key={rel.id} to={`/blogs/${rel.slug}`}
                                        className="group block bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                                        <div className={cn(`relative bg-gradient-to-br ${relGrad} h-28 flex items-end p-3 overflow-hidden`)}>
                                            {relImg && (
                                                <>
                                                    <img src={relImg} alt={rel.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                </>
                                            )}
                                            <span className="relative z-10 text-[10px] font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                                                {rel.category}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 mb-1">{rel.title}</h3>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={9} /> {rel.readTime || rel.read_time || 5}m
                                                {relDate && ` · ${format(relDate, 'dd MMM')}`}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
