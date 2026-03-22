/**
 * AdminContext.jsx
 * ─────────────────────────────────────────────────
 * Admin portal authentication — super_admin & support_admin.
 *
 * Restores the admin session on mount and keeps it in sync
 * with Supabase auth state changes.
 * ─────────────────────────────────────────────────
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { withAuthTimeout } from '@/lib/auth.js';

const AdminContext = createContext(null);

const ADMIN_ROLES = ['super_admin', 'support_admin'];

export function AdminProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * fetchController — reads the controllers table row for this user.
     * Returns null if not found, role doesn't match, or query times out.
     */
    const fetchController = useCallback(async (userId, timeoutMs = 5000) => {
        if (!userId) return null;
        try {
            const { data, error } = await Promise.race([
                supabase
                    .from('controllers')
                    .select('*')
                    .eq('id', userId)
                    .in('role', ADMIN_ROLES)
                    .maybeSingle(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
            ]);
            if (error) { console.warn('[Admin] fetchController error:', error.message); return null; }
            return data ?? null;
        } catch (err) {
            console.warn('[Admin] fetchController timeout/error:', err.message);
            return null;
        }
    }, []);

    const restoreAdminSession = useCallback(async (session, timeoutMs = 3000) => {
        if (!session?.user) {
            setAdmin(null);
            return;
        }

        const ctrl = await fetchController(session.user.id, timeoutMs);
        setAdmin(ctrl ? { ...ctrl, email: session.user.email } : null);
    }, [fetchController]);

    // ── Restore session on mount + keep in sync with auth changes ────────────
    useEffect(() => {
        let mounted = true;

        Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('session fetch timeout')), 5000))
        ]).then(async ({ data: { session } }) => {
            if (!mounted) return;
            await restoreAdminSession(session, 3000);
            if (mounted) setLoading(false);
        }).catch(() => { if (mounted) setLoading(false); });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setAdmin(null);
                    setLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                    void (async () => {
                        await restoreAdminSession(session, 3000);
                        if (mounted) setLoading(false);
                    })();
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [restoreAdminSession]);

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            // Step 1: Supabase auth
            const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
                email: email.trim(), password,
            }), 'Sign in is taking too long. Please check your connection and try again.');
            if (error) {
                throw new Error(
                    error.message.toLowerCase().includes('invalid login credentials')
                        ? 'Invalid email or password.'
                        : error.message
                );
            }

            // Step 2: Verify admin role in controllers table
            const ctrl = await fetchController(data.user.id);
            if (!ctrl) {
                await supabase.auth.signOut();
                throw new Error(
                    'No admin record found for this account. ' +
                    'Make sure a row exists in the controllers table with role = super_admin or support_admin.'
                );
            }

            if (ctrl.status === 'suspended') {
                await supabase.auth.signOut();
                throw new Error('This admin account has been suspended.');
            }

            // Step 3: Set state and return
            const adminSession = { ...ctrl, email: data.user.email };
            setAdmin(adminSession);
            setLoading(false);
            return adminSession;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    }, [fetchController]);

    // ── Logout ────────────────────────────────────────────────────────────────
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
    if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
    return ctx;
}
