/**
 * PatientContext.jsx
 * ─────────────────────────────────────────────────
 * Global auth context for patients.
 *
 * Uses Supabase Auth for authentication and the
 * `public.profiles` table for storing patient info.
 *
 * Exposed values via `usePatient()`:
 *  - patient      → Current patient profile (or null)
 *  - loading      → True while checking session on mount
 *  - signIn(email, password) → Signs in via Supabase Auth
 *  - signUp(data) → Creates auth user + inserts profile row
 *  - signOut()    → Signs out and clears state
 *  - updateProfile(data) → Updates `profiles` row + local state
 *
 * Usage:
 *   Wrap your app (or patient section) in <PatientProvider>.
 *   Access state with the usePatient() hook.
 * ─────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase.js';
import { isStrongPassword, PASSWORD_RULE_MESSAGE, withAuthTimeout } from '@/lib/auth.js';

// ── Context ───────────────────────────────────────
const PatientContext = createContext(null);

export function PatientProvider({ children }) {
    // patient: the profile row from public.profiles (null if not logged in)
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * fetchProfile
     * Retrieves the patient's row from public.profiles using their auth uid.
     * Returns the profile object, or null if not found.
     */
    const fetchProfile = useCallback(async (userId) => {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            // If the profile row doesn't exist yet, that's okay
            console.warn('[PatientContext] fetchProfile error:', error.message);
            return null;
        }
        return data;
    }, []);

    /**
     * On mount: restore session from Supabase and load patient profile.
     * Also listens for auth state changes (login / logout in other tabs).
     *
     * Key design: `loading` is set to false as soon as `getSession()` resolves,
     * so the app never hangs on a loading spinner.
     */
    useEffect(() => {
        let mounted = true;

        // ── Initial session restore ────────────────────────────────
        Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('session fetch timeout')), 5000))
        ]).then(async ({ data: { session } }) => {
            if (!mounted) return;
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                if (mounted) {
                    setPatient(profile?.profile_type === 'patient' ? profile : null);
                }
            }
            if (mounted) setLoading(false);
        }).catch(() => {
            if (mounted) setLoading(false);
        });

        // ── Auth state change (login / logout events) ──────────────
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setPatient(null);
                    setLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                    if (!session?.user) {
                        if (mounted) setLoading(false);
                        return;
                    }

                    void (async () => {
                        const profile = await fetchProfile(session.user.id);
                        if (mounted) {
                            setPatient(profile?.profile_type === 'patient' ? profile : null);
                            setLoading(false);
                        }
                    })();
                }
                // INITIAL_SESSION is handled by getSession() above, skip it here
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    /**
     * signIn
     * Signs in an existing patient using email + password.
     * Throws an error with a user-friendly message on failure.
     *
     * @param {string} email
     * @param {string} password
     * @returns {object} The patient profile from public.profiles
     */
    const signIn = useCallback(async (loginId, password) => {
        const identifier = loginId.trim().toLowerCase();
        const isEmail = identifier.includes('@');
        const loginData = isEmail ? { email: identifier } : { phone: identifier };

        const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
            ...loginData,
            password,
        }), 'Sign in is taking too long. Please check your connection and try again.');

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Incorrect email or password. Please try again.');
            }
            throw new Error(error.message);
        }

        // Fetch profile to verify this is a patient account
        const profile = await fetchProfile(data.user.id);
        if (!profile || profile.profile_type !== 'patient') {
            await supabase.auth.signOut();
            throw new Error('This account is not registered as a patient.');
        }

        if (profile.status === 'suspended') {
            await supabase.auth.signOut();
            throw new Error('Your account has been suspended. Please contact support.');
        }

        setPatient(profile);
        return profile;
    }, [fetchProfile]);

    /**
     * signUp
     * Registers a new patient:
     *  1. Creates a Supabase Auth user
     *  2. Inserts a row into public.profiles with profile_type = 'patient'
     *
     * @param {object} params - { fullName, email, phone, password }
     * @returns {object} The newly created profile row
     */
    const signUp = useCallback(async ({ fullName, email, phone, password }) => {
        if (!isStrongPassword(password)) {
            throw new Error(PASSWORD_RULE_MESSAGE);
        }

        // Step 1: Create Supabase Auth user
        const { data, error } = await withAuthTimeout(supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    full_name: fullName.trim(),
                    phone: phone?.trim() || '',
                    profile_type: 'patient',
                },
            },
        }), 'Sign up is taking too long. Please check your connection and try again.');

        if (error) {
            if (error.message.includes('already registered')) {
                throw new Error('An account with this email already exists. Please sign in.');
            }
            throw new Error(error.message);
        }

        const userId = data.user?.id;
        if (!userId) throw new Error('Account created but could not retrieve user ID.');

        // Step 2: Insert patient profile into public.profiles
        const { data: profile, error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: email.trim(),
                full_name: fullName.trim(),
                phone: phone?.trim() || '',
                profile_type: 'patient',
                status: 'active',
                metadata: {}, // Extend later with allergies, blood group, etc.
            })
            .select()
            .single();

        if (insertError) {
            console.error('[PatientContext] Profile insert error:', insertError.message);
            throw new Error('Account created but profile setup failed. Please contact support.');
        }

        setPatient(profile);
        return profile;
    }, []);

    /**
     * signOut
     * Signs the patient out of Supabase and clears local state.
     */
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setPatient(null);
    }, []);

    /**
     * updateProfile
     * Updates patient data in public.profiles and refreshes local state.
     *
     * @param {object} updates - Fields to update (e.g., full_name, phone)
     */
    const updateProfile = useCallback(async (updates) => {
        if (!patient?.id) throw new Error('No patient session found.');

        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', patient.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        setPatient(data);
        return data;
    }, [patient]);

    const contextValue = useMemo(() => ({
        patient, loading, signIn, signUp, signOut, updateProfile,
    }), [patient, loading, signIn, signUp, signOut, updateProfile]);

    return (
        <PatientContext.Provider value={contextValue}>
            {/* Render children immediately — PatientDashboard handles its own null-patient guard */}
            {children}
        </PatientContext.Provider>
    );
}

/**
 * usePatient
 * Hook to access the PatientContext.
 * Must be called inside a component wrapped by <PatientProvider>.
 */
export function usePatient() {
    const ctx = useContext(PatientContext);
    if (!ctx) throw new Error('usePatient must be used inside <PatientProvider>');
    return ctx;
}
