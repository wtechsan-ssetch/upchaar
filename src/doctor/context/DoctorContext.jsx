import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { isStrongPassword, PASSWORD_RULE_MESSAGE, withAuthTimeout } from '@/lib/auth.js';

const DoctorContext = createContext(null);
const DEFAULT_AVAILABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_HOURS_FROM = '09:00';
const DEFAULT_HOURS_TO = '20:00';

const formatUser = (user) => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return { id: user.id, email: user.email, phone: user.phone || meta.phone, ...meta };
};

const mapDoctorRecord = (record) => {
    if (!record) return {};
    return {
        id: record.profile_id || record.id,
        doctorId: record.id,
        fullName: record.full_name || '',
        email: record.email || '',
        phone: record.phone || '',
        city: record.city || '',
        specialization: record.specialization || 'General Physician',
        clinicName: record.clinic_name || '',
        clinicAddress: record.clinic_address || '',
        experience: record.experience || 0,
        fee: record.consultation_fee ?? 500,
        degree: record.degree || 'MBBS',
        bio: record.bio || '',
        gender: record.gender || '',
        hoursFrom: DEFAULT_HOURS_FROM,
        hoursTo: DEFAULT_HOURS_TO,
        availableDays: DEFAULT_AVAILABLE_DAYS,
        languages: record.languages || ['English'],
        avatarColor: record.avatar_color || '#0d9488',
        totalRevenue: record.total_revenue || 0,
        totalAppointments: record.total_appointments || 0,
        status: record.status || 'Pending',
        medicalLicense: record.medical_license || '',
        nmcRegistration: record.nmc_registration || '',
    };
};

const buildDoctorState = (user, doctorRecord) => ({
    ...formatUser(user),
    ...mapDoctorRecord(doctorRecord),
});

export function DoctorProvider({ children }) {
    const [doctor, setDoctor] = useState(null);
    const [doctorRecord, setDoctorRecord] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDoctorRecord = useCallback(async (userId, email) => {
        try {
            let { data } = await supabase
                .from('doctors')
                .select('*')
                .eq('profile_id', userId)
                .maybeSingle();

            if (!data && email) {
                ({ data } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle());
            }

            return data ?? null;
        } catch {
            return null;
        }
    }, []);

    const restoreDoctorSession = useCallback(async (session) => {
        if (!session?.user) {
            setDoctor(null);
            setDoctorRecord(null);
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profile?.profile_type === 'doctor') {
            const record = await fetchDoctorRecord(session.user.id, session.user.email);
            setDoctorRecord(record);
            setDoctor(buildDoctorState(session.user, record));
        } else {
            setDoctor(null);
            setDoctorRecord(null);
        }
    }, [fetchDoctorRecord]);

    useEffect(() => {
        let mounted = true;

        Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('session fetch timeout')), 5000))
        ]).then(async ({ data: { session } }) => {
            if (!mounted) return;
            await restoreDoctorSession(session);
            if (mounted) setLoading(false);
        }).catch(() => {
            if (mounted) setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setDoctor(null);
                setDoctorRecord(null);
                setLoading(false);
                return;
            }

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                void (async () => {
                    await restoreDoctorSession(session);
                    if (mounted) setLoading(false);
                })();
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [restoreDoctorSession]);

    const login = useCallback(async (loginId, password) => {
        const identifier = loginId.trim().toLowerCase();
        const isEmail = identifier.includes('@');
        const loginData = isEmail ? { email: identifier } : { phone: identifier };

        const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
            ...loginData, password,
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

        const record = await fetchDoctorRecord(data.user.id, data.user.email);
        if ((record?.status || data?.user?.user_metadata?.status) === 'Suspended') {
            await supabase.auth.signOut();
            throw new Error('Your account has been suspended. Contact admin.');
        }

        setDoctorRecord(record);
        const formatted = buildDoctorState(data.user, record);
        setDoctor(formatted);
        return formatted;
    }, [fetchDoctorRecord]);

    const register = useCallback(async ({
        fullName,
        email,
        phone,
        password,
        specialization,
        city,
        medicalLicense,
        nmcRegistration,
        dob,
        clinicName,
        availableDays,
        hoursFrom,
        hoursTo,
        fee,
    }) => {
        if (!isStrongPassword(password)) {
            throw new Error(PASSWORD_RULE_MESSAGE);
        }

        const safeAvailableDays = DEFAULT_AVAILABLE_DAYS;
        const safeHoursFrom = DEFAULT_HOURS_FROM;
        const safeHoursTo = DEFAULT_HOURS_TO;
        const safeFee = Number(fee) || 500;

        const { data, error } = await withAuthTimeout(supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    specialization: specialization || 'General Physician',
                    city: city || '',
                    medicalLicense: medicalLicense || '',
                    nmcRegistration: nmcRegistration || '',
                    dob: dob || '',
                    clinicName: clinicName || '',
                    availableDays: safeAvailableDays,
                    hoursFrom: safeHoursFrom,
                    hoursTo: safeHoursTo,
                    fee: safeFee,
                    experience: 0,
                    status: 'Pending',
                    bio: '',
                    gender: '',
                    degree: 'MBBS',
                    languages: ['English'],
                    rating: 0,
                    totalAppointments: 0,
                    totalRevenue: 0,
                    avatarColor: '#0d9488',
                    joinedAt: new Date().toISOString(),
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

        let nextDoctor = formatUser(data.user);
        const userId = data.user?.id;
        if (userId) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: userId,
                email: email.trim(),
                full_name: fullName.trim(),
                phone: phone.trim(),
                profile_type: 'doctor',
                status: 'pending',
            });

            if (profileError) {
                throw new Error('Failed to create user profile: ' + profileError.message);
            }

            const { data: doctorRow, error: doctorError } = await supabase.from('doctors').insert({
                profile_id: userId,
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                medical_license: medicalLicense.trim(),
                nmc_registration: nmcRegistration.trim(),
                dob: dob,
                specialization: specialization || 'General Physician',
                city: city || '',
                clinic_name: clinicName || '',
                available_days: safeAvailableDays,
                hours_from: safeHoursFrom,
                hours_to: safeHoursTo,
                consultation_fee: safeFee,
                total_appointments: 0,
                total_revenue: 0,
                experience: 0,
                status: 'Pending',
            }).select().single();

            if (doctorError) {
                throw new Error('Failed to create doctor record: ' + doctorError.message);
            }

            setDoctorRecord(doctorRow);
            nextDoctor = buildDoctorState(data.user, doctorRow);
            setDoctor(nextDoctor);
        }

        return nextDoctor;
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setDoctor(null);
        setDoctorRecord(null);
    }, []);

    const updateProfile = useCallback(async (updates) => {
        if (!doctor?.id || !doctorRecord?.id) {
            throw new Error('No doctor session found.');
        }

        const doctorUpdates = {
            full_name: updates.fullName,
            phone: updates.phone,
            city: updates.city,
            specialization: updates.specialization,
            experience: updates.experience,
            consultation_fee: updates.fee,
            degree: updates.degree,
            clinic_name: updates.clinicName,
            bio: updates.bio,
            gender: updates.gender,
            hours_from: updates.hoursFrom,
            hours_to: updates.hoursTo,
            available_days: updates.availableDays,
            languages: updates.languages,
            avatar_color: updates.avatarColor,
            updated_at: new Date().toISOString(),
        };

        Object.keys(doctorUpdates).forEach((key) => doctorUpdates[key] === undefined && delete doctorUpdates[key]);

        const authMetaUpdates = {
            fullName: updates.fullName,
            phone: updates.phone,
            city: updates.city,
            specialization: updates.specialization,
            clinicName: updates.clinicName,
            availableDays: updates.availableDays,
            hoursFrom: updates.hoursFrom,
            hoursTo: updates.hoursTo,
            fee: updates.fee,
            degree: updates.degree,
            bio: updates.bio,
            gender: updates.gender,
            languages: updates.languages,
            avatarColor: updates.avatarColor,
        };

        Object.keys(authMetaUpdates).forEach((key) => authMetaUpdates[key] === undefined && delete authMetaUpdates[key]);

        const [{ data: authData, error: authError }, { data: doctorData, error: doctorError }] = await Promise.all([
            supabase.auth.updateUser({ data: authMetaUpdates }),
            supabase
                .from('doctors')
                .update(doctorUpdates)
                .eq('id', doctorRecord.id)
                .select()
                .single(),
        ]);

        if (authError) throw new Error(authError.message);
        if (doctorError) throw new Error(doctorError.message);

        setDoctorRecord(doctorData);
        const nextDoctor = buildDoctorState(authData.user, doctorData);
        setDoctor(nextDoctor);
        return nextDoctor;
    }, [doctor?.id, doctorRecord?.id]);

    return (
        <DoctorContext.Provider value={{ doctor, doctorRecord, login, register, logout, updateProfile, loading }}>
            {children}
        </DoctorContext.Provider>
    );
}

export function useDoctor() {
    const ctx = useContext(DoctorContext);
    if (!ctx) throw new Error('useDoctor must be used inside <DoctorProvider>');
    return ctx;
}
