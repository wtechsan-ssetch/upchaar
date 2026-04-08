import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const MedicalContext = createContext(null);

export function MedicalProvider({ children }) {
    const [medicalStore, setMedicalStore] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMedicalData = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('medicals')
                .select('*')
                .eq('profile_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching medical data:', err.message);
            return null;
        }
    }, []);

    const updateMedicalStore = useCallback(async (updates) => {
        // ... implementation for updates
    }, []);

    return (
        <MedicalContext.Provider value={{ medicalStore, updateMedicalStore, loading }}>
            {children}
        </MedicalContext.Provider>
    );
}

export function useMedical() {
    const ctx = useContext(MedicalContext);
    if (!ctx) throw new Error('useMedical must be used inside <MedicalProvider>');
    return ctx;
}
