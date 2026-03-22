/**
 * DoctorContext.jsx
 * ─────────────────────────────────────────────────
 * Doctor portal authentication and session management.
 *
 * Keeps doctor state in sync with Supabase session restore
 * and auth state changes across refreshes and token updates.
 * ─────────────────────────────────────────────────
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { isStrongPassword, PASSWORD_RULE_MESSAGE, withAuthTimeout } from '@/lib/auth.js';

const DoctorContext = createContext(null);

const formatUser = (user) => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return { id: user.id, email: user.email, phone: user.phone || meta.phone, ...meta };
};

export function DoctorProvider({ children }) {
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    const restoreDoctorSession = useCallback(async (session) => {
        if (!session?.user) {
            setDoctor(null);
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', session.user.id)
            .maybeSingle();

        setDoctor(profile?.profile_type === 'doctor' ? formatUser(session.user) : null);
    }, []);

    // ── Restore session on mount + keep in sync with auth changes ────────────
    useEffect(() => {
        let mounted = true;
        Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('session fetch timeout')), 5000))
        ]).then(async ({ data: { session } }) => {
            if (!mounted) return;
            await restoreDoctorSession(session);
            if (mounted) setLoading(false);
        }).catch(() => { if (mounted) setLoading(false); });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setDoctor(null);
                    setLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                    void (async () => {
                        await restoreDoctorSession(session);
                        if (mounted) setLoading(false);
                    })();
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [restoreDoctorSession]);

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
            email: email.trim(), password,
        }), 'Sign in is taking too long. Please check your connection and try again.');
        if (error) {
            throw new Error(
                error.message.includes('Invalid login credentials')
                    ? 'Invalid credentials. Please check your email and password.'
                    : error.message
            );
        }
        
        const { data: profile } = await supabase.from('profiles').select('profile_type').eq('id', data.user.id).maybeSingle();
        if (profile?.profile_type !== 'doctor') {
            await supabase.auth.signOut();
            throw new Error('This account is not registered as a doctor.');
        }

        if (data?.user?.user_metadata?.status === 'Suspended') {
            await supabase.auth.signOut();
            throw new Error('Your account has been suspended. Contact admin.');
        }
        const formatted = formatUser(data.user);
        setDoctor(formatted);
        return formatted;
    }, []);

    // ── Register ──────────────────────────────────────────────────────────────
    const register = useCallback(async ({ fullName, email, phone, password, specialization, city }) => {
        if (!isStrongPassword(password)) {
            throw new Error(PASSWORD_RULE_MESSAGE);
        }

        const { data, error } = await withAuthTimeout(supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    specialization: specialization || 'General Physician',
                    city: city || '',
                    experience: 0, fee: 500, status: 'Pending', bio: '',
                    gender: '', degree: 'MBBS', clinicName: '',
                    languages: ['English'], availableDays: [],
                    hoursFrom: '09:00', hoursTo: '17:00',
                    rating: 0, totalAppointments: 0, totalRevenue: 0,
                    avatarColor: '#0d9488', joinedAt: new Date().toISOString(),
                },
            },
        }), 'Sign up is taking too long. Please check your connection and try again.');
        if (error) {
            throw new Error(
                error.message.includes('already registered')
                    ? 'An account with this email already exists.'
                    : error.message
            );
        }
        const userId = data.user?.id;
        if (userId) {
            await supabase.from('profiles').insert({
                id: userId, email: email.trim(),
                full_name: fullName.trim(), phone: phone.trim(),
                profile_type: 'doctor', status: 'pending',
            });
            await supabase.from('doctors').insert({
                profile_id: userId, full_name: fullName.trim(),
                email: email.trim(), phone: phone.trim(),
                specialization: specialization || 'General Physician',
                city: city || '', status: 'Pending',
            });
        }
        return formatUser(data.user);
    }, []);

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setDoctor(null);
    }, []);

    // ── Update profile ────────────────────────────────────────────────────────
    const updateProfile = useCallback(async (updates) => {
        const { data, error } = await supabase.auth.updateUser({ data: updates });
        if (error) throw new Error(error.message);
        setDoctor(formatUser(data.user));
    }, []);

    return (
        <DoctorContext.Provider value={{ doctor, login, register, logout, updateProfile, loading }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    const ctx = useContext(DoctorContext);
    if (!ctx) throw new Error('useDoctor must be used inside <DoctorProvider>');
    return ctx;
}
