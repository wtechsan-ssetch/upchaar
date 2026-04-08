import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchClinicData = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('profile_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching clinic data:', err.message);
            return null;
        }
    }, []);

    return (
        <ClinicContext.Provider value={{ clinic, loading }}>
            {children}
        </ClinicContext.Provider>
    );
}

export function useClinic() {
    const ctx = useContext(ClinicContext);
    if (!ctx) throw new Error('useClinic must be used inside <ClinicProvider>');
    return ctx;
}
