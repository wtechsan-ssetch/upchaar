import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                await loadAdminProfile(session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await loadAdminProfile(session.user);
            } else {
                setAdmin(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadAdminProfile = async (user) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
            await supabase.auth.signOut();
            setAdmin(null);
            throw new Error('Access denied. Not an admin account.');
        }

        setAdmin({
            id: user.id,
            email: user.email,
            name: profile.name,
            role: profile.role,
            loginAt: new Date().toISOString(),
        });
    };

    const login = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
            await supabase.auth.signOut();
            throw new Error('Access denied. Not an admin account.');
        }

        const session = {
            id: data.user.id,
            email: data.user.email,
            name: profile.name,
            role: profile.role,
            loginAt: new Date().toISOString(),
        };
        setAdmin(session);
        return session;
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setAdmin(null);
    }, []);

    const isSuperAdmin = admin?.role === 'super_admin';

    return (
        <AdminContext.Provider value={{ admin, login, logout, isSuperAdmin, loading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
    return ctx;
}
