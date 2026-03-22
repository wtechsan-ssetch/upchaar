/**
 * BlogContext.jsx
 * ─────────────────────────────────────────────────
 * Blog portal auth + posts state.
 * Bloggers authenticate via Supabase Auth & controllers table.
 *
 * Restores blogger state on refresh and keeps it in sync
 * with Supabase auth state changes.
 * ─────────────────────────────────────────────────
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { BLOG_CATEGORIES, COVER_GRADIENTS } from '@/lib/constants.js';
import { withAuthTimeout } from '@/lib/auth.js';

export { BLOG_CATEGORIES, COVER_GRADIENTS };

const BlogContext = createContext(null);

export function BlogProvider({ children }) {
    const [posts, setPosts] = useState([]);
    const [blogger, setBlogger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);

    // ── Fetch blogger row from controllers table ───────────────────────────────
    const fetchBloggerProfile = useCallback(async (userId) => {
        if (!userId) return null;
        try {
            const { data, error } = await Promise.race([
                supabase.from('controllers').select('*').eq('id', userId).eq('role', 'blogger').maybeSingle(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
            ]);
            if (error) { console.warn('[Blog] fetchBloggerProfile error:', error.message); return null; }
            return data ?? null;
        } catch {
            return null;
        }
    }, []);

    const restoreBloggerSession = useCallback(async (session) => {
        if (!session?.user) {
            setBlogger(null);
            return;
        }

        const profile = await fetchBloggerProfile(session.user.id);
        setBlogger(profile ? { ...profile, email: session.user.email } : null);
    }, [fetchBloggerProfile]);

    // ── Restore session on mount + keep in sync with auth changes ────────────
    useEffect(() => {
        let mounted = true;
        Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('session fetch timeout')), 5000))
        ]).then(async ({ data: { session } }) => {
            if (!mounted) return;
            await restoreBloggerSession(session);
            if (mounted) setLoading(false);
        }).catch(() => { if (mounted) setLoading(false); });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setBlogger(null);
                    setLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                    void (async () => {
                        await restoreBloggerSession(session);
                        if (mounted) setLoading(false);
                    })();
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [restoreBloggerSession]);

    // ── Load published posts on mount ─────────────────────────────────────────
    useEffect(() => { loadPosts(); }, []);

    const loadPosts = async () => {
        setPostsLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*, controllers:author_id(id, name, avatar_url, metadata)')
            .order('published_at', { ascending: false });
        if (!error) {
            setPosts((data || []).map(p => ({
                ...p,
                author: p.controllers
                    ? { name: p.controllers.name, avatarUrl: p.controllers.avatar_url, ...(p.controllers.metadata || {}) }
                    : { name: 'Unknown' },
            })));
        }
        setPostsLoading(false);
    };

    // ── Blogger login ─────────────────────────────────────────────────────────
    const loginBlogger = useCallback(async (email, password) => {
        const { data, error } = await withAuthTimeout(
            supabase.auth.signInWithPassword({ email: email.trim(), password }),
            'Sign in is taking too long. Please check your connection and try again.'
        );
        if (error) {
            throw new Error(
                error.message.toLowerCase().includes('invalid login credentials')
                    ? 'Invalid credentials. Please try again.'
                    : error.message
            );
        }
        const profile = await fetchBloggerProfile(data.user.id);
        if (!profile) {
            await supabase.auth.signOut();
            throw new Error('This account is not registered as a blogger.');
        }
        if (profile.status === 'suspended') {
            await supabase.auth.signOut();
            throw new Error('Your blogger account has been suspended.');
        }
        const session = { ...profile, email: data.user.email };
        setBlogger(session);
        return session;
    }, [fetchBloggerProfile]);

    // ── Blogger logout ────────────────────────────────────────────────────────
    const logoutBlogger = useCallback(async () => {
        await supabase.auth.signOut();
        setBlogger(null);
    }, []);

    // ── Update blogger profile ────────────────────────────────────────────────
    const updateBlogger = useCallback(async (updates) => {
        if (!blogger) return;
        const { avatarUrl, avatar_url, name, ...meta } = updates;
        const dbUpdates = {};
        if (name) dbUpdates.name = name;
        if (avatarUrl || avatar_url) dbUpdates.avatar_url = avatarUrl || avatar_url;
        if (Object.keys(meta).length > 0) {
            dbUpdates.metadata = { ...(blogger.metadata || {}), ...meta };
        }
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('controllers').update(dbUpdates).eq('id', blogger.id).select().single();
        if (error) throw new Error(error.message);
        setBlogger(prev => ({ ...prev, ...data, email: prev.email }));
    }, [blogger]);

    // ── Post helpers ──────────────────────────────────────────────────────────
    const makeSlug = (title) =>
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
        let slug = baseSlug; let counter = 1;
        while (true) {
            let query = supabase.from('posts').select('id').eq('slug', slug);
            if (excludeId) query = query.neq('id', excludeId);
            const { data } = await query.maybeSingle();
            if (!data) break;
            slug = `${baseSlug}-${counter++}`;
        }
        return slug;
    };

    const publishPost = useCallback(async (postData) => {
        if (!blogger) throw new Error('Not logged in as blogger.');
        const slug = await ensureUniqueSlug(makeSlug(postData.title));
        const now = new Date().toISOString();
        const row = {
            author_id: blogger.id, title: postData.title, slug,
            excerpt: postData.excerpt || '', content: postData.content || '',
            cover_gradient: postData.coverGradient || COVER_GRADIENTS[0],
            image_url: postData.imageUrl || postData.image_url || null,
            category: postData.category || '', tags: postData.tags || [],
            status: 'published', read_time: postData.readTime || 5,
            published_at: now, created_at: now, updated_at: now,
        };
        const { data, error } = await supabase.from('posts').insert([row]).select().single();
        if (error) throw new Error(error.message);
        await loadPosts(); return data;
    }, [blogger]);

    const saveDraft = useCallback(async (postData) => {
        if (!blogger) throw new Error('Not logged in as blogger.');
        const slug = await ensureUniqueSlug(makeSlug(postData.title || 'untitled'));
        const row = {
            author_id: blogger.id, title: postData.title || 'Untitled', slug,
            excerpt: postData.excerpt || '', content: postData.content || '',
            cover_gradient: postData.coverGradient || COVER_GRADIENTS[0],
            image_url: postData.imageUrl || postData.image_url || null,
            category: postData.category || '', tags: postData.tags || [],
            status: 'draft', read_time: postData.readTime || 5,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('posts').insert([row]).select().single();
        if (error) throw new Error(error.message);
        await loadPosts(); return data;
    }, [blogger]);

    const updatePost = useCallback(async (postId, updates) => {
        const baseSlug = updates.title ? makeSlug(updates.title) : null;
        const slug = baseSlug ? await ensureUniqueSlug(baseSlug, postId) : undefined;
        const row = {
            ...(updates.title && { title: updates.title }),
            ...(slug && { slug }),
            ...(updates.excerpt !== undefined && { excerpt: updates.excerpt }),
            ...(updates.content !== undefined && { content: updates.content }),
            ...(updates.coverGradient && { cover_gradient: updates.coverGradient }),
            ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl }),
            ...(updates.image_url !== undefined && { image_url: updates.image_url }),
            ...(updates.category && { category: updates.category }),
            ...(updates.tags && { tags: updates.tags }),
            ...(updates.status && { status: updates.status }),
            ...(updates.readTime && { read_time: updates.readTime }),
            updated_at: new Date().toISOString(),
        };
        if (updates.status === 'published') row.published_at = new Date().toISOString();
        const { data, error } = await supabase.from('posts').update(row).eq('id', postId).select().single();
        if (error) throw new Error(error.message);
        await loadPosts(); return data;
    }, []);

    const deletePost = useCallback(async (postId) => {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) throw new Error(error.message);
        setPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    const getMyPosts = useCallback(() =>
        blogger ? posts.filter(p => p.author_id === blogger.id) : [], [posts, blogger]);

    const getPublishedPosts = useCallback(() =>
        posts.filter(p => p.status === 'published'), [posts]);

    return (
        <BlogContext.Provider value={{
            posts, postsLoading, blogger, loading,
            loginBlogger, logoutBlogger, updateBlogger,
            publishPost, saveDraft, updatePost, deletePost,
            getMyPosts, getPublishedPosts, refreshPosts: loadPosts,
        }}>
            {children}
        </BlogContext.Provider>
    );
}

export function useBlog() {
    const ctx = useContext(BlogContext);
    if (!ctx) throw new Error('useBlog must be used inside <BlogProvider>');
    return ctx;
}
