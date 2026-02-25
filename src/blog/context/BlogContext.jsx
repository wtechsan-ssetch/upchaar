import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';

const BlogContext = createContext(null);

export function BlogProvider({ children }) {
    const [posts, setPosts] = useState([]);
    const [blogger, setBlogger] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) await loadBloggerProfile(session.user);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await loadBloggerProfile(session.user);
            } else {
                setBlogger(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load all published posts on mount
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data } = await supabase
            .from('posts')
            .select('*')
            .order('published_at', { ascending: false });
        if (data) setPosts(data);
    };

    const loadBloggerProfile = async (user) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            setBlogger({
                id: user.id,
                email: user.email,
                name: profile.name,
                specialty: profile.specialty,
                bio: profile.bio,
                avatarColor: profile.avatar_color,
                role: profile.role,
            });
        }
    };

    const loginBlogger = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        const session = {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name || data.user.email,
            specialty: profile?.specialty || '',
            bio: profile?.bio || '',
            avatarColor: profile?.avatar_color || '#0d9488',
            role: profile?.role || 'blogger',
        };
        setBlogger(session);
        return session;
    }, []);

    const logoutBlogger = useCallback(async () => {
        await supabase.auth.signOut();
        setBlogger(null);
    }, []);

    const updateBlogger = useCallback(async (data) => {
        if (!blogger) return;
        const { error } = await supabase
            .from('profiles')
            .update({
                name: data.name,
                specialty: data.specialty,
                bio: data.bio,
                avatar_color: data.avatarColor,
            })
            .eq('id', blogger.id);

        if (!error) {
            const updated = { ...blogger, ...data };
            setBlogger(updated);
        }
    }, [blogger]);

    const publishPost = useCallback(async (postData) => {
        const slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { data, error } = await supabase
            .from('posts')
            .insert({
                blogger_id: blogger?.id,
                title: postData.title,
                slug,
                content: postData.content,
                excerpt: postData.excerpt,
                tags: postData.tags,
                cover_image: postData.coverImage,
                status: 'published',
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        setPosts(prev => [data, ...prev]);
        return data;
    }, [blogger]);

    const saveDraft = useCallback(async (postData) => {
        const now = new Date().toISOString();
        if (postData.id) {
            // Update existing
            const { data, error } = await supabase
                .from('posts')
                .update({ ...postData, updated_at: now })
                .eq('id', postData.id)
                .select()
                .single();
            if (!error) setPosts(prev => prev.map(p => p.id === postData.id ? data : p));
        } else {
            // Create new draft
            const slug = postData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'untitled';
            const { data, error } = await supabase
                .from('posts')
                .insert({
                    blogger_id: blogger?.id,
                    title: postData.title || 'Untitled',
                    slug,
                    content: postData.content,
                    excerpt: postData.excerpt,
                    tags: postData.tags,
                    cover_image: postData.coverImage,
                    status: 'draft',
                    published_at: now,
                    updated_at: now,
                })
                .select()
                .single();
            if (!error) setPosts(prev => [data, ...prev]);
        }
    }, [blogger]);

    const updatePost = useCallback(async (id, data) => {
        const { data: updated, error } = await supabase
            .from('posts')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (!error) setPosts(prev => prev.map(p => p.id === id ? updated : p));
    }, []);

    const deletePost = useCallback(async (id) => {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (!error) setPosts(prev => prev.filter(p => p.id !== id));
    }, []);

    const likePost = useCallback(async (id) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    }, [posts]);

    const incrementViews = useCallback(async (id) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        await supabase.from('posts').update({ views: post.views + 1 }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, views: p.views + 1 } : p));
    }, [posts]);

    const publishedPosts = posts.filter(p => p.status === 'published');
    const myPosts = posts.filter(p => p.blogger_id === blogger?.id);

    return (
        <BlogContext.Provider value={{
            posts, publishedPosts, myPosts,
            blogger, loginBlogger, logoutBlogger, updateBlogger,
            publishPost, saveDraft, updatePost, deletePost, likePost, incrementViews,
            loading, fetchPosts,
        }}>
            {children}
        </BlogContext.Provider>
    );
}

export function useBlog() {
    const ctx = useContext(BlogContext);
    if (!ctx) throw new Error('useBlog must be used inside BlogProvider');
    return ctx;
}
