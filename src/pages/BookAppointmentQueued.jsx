import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, Calendar as CalendarIcon, Clock, 
    Filter, ArrowRight, CheckCircle, ChevronLeft, 
    Stethoscope, Info, AlertCircle, Loader2, Building2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/auth/AuthContext.jsx';
import { getStorageUrl } from '@/lib/uploadImage.js';

// ── Static Data ──────────────────────────────────────
// Constants will be fetched dynamically

export default function BookAppointmentQueued() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const doctorIdParam = searchParams.get('doctorId');
    const clinicIdParam = searchParams.get('clinicId');
    
    useEffect(() => {
        if (!authLoading && !user) {
            const returnTo = `/book-appointment-queued${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
            navigate('/login', { state: { from: returnTo } });
            toast.error("You must be logged in to book a queued appointment.");
        }
    }, [user, authLoading, navigate, searchParams]);

    // ── Search & Filter State ────────────────────────
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);
    
    // ── Data State ───────────────────────────────────
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [clinicsLoading, setClinicsLoading] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [availableStates, setAvailableStates] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [doctorTimetables, setDoctorTimetables] = useState([]);
    const [availableScheduleDays, setAvailableScheduleDays] = useState([]);
    
    // ── UI Flow State ────────────────────────────────
    const [step, setStep] = useState(doctorIdParam ? 2 : 1); // 1: Search, 2: Clinic/Slot, 3: Details & OTP, 4: Payment, 5: Confirmation
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // ── Patient Details State ────────────────────────
    const [patientInfo, setPatientInfo] = useState({
        name: user?.user_metadata?.full_name || '',
        phone: user?.user_metadata?.phone || '',
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // Update patient info when auth user changes
    useEffect(() => {
        if (user) {
            setPatientInfo({
                name: user.user_metadata?.full_name || '',
                phone: user.user_metadata?.phone || '',
            });
        }
    }, [user]);

    // ── Fetch Available Locations ─────────────────────
    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase
                .from('doctors')
                .select('state')
                .eq('status', 'Approved')
                .not('state', 'is', null);
            
            if (!error && data) {
                const states = [...new Set(data.map(d => d.state))].sort();
                setAvailableStates(states);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        if (!selectedState) {
            setAvailableCities([]);
            return;
        }
        const fetchCities = async () => {
            const { data, error } = await supabase
                .from('doctors')
                .select('city')
                .eq('status', 'Approved')
                .eq('state', selectedState)
                .not('city', 'is', null);
            
            if (!error && data) {
                const cities = [...new Set(data.map(d => d.city))].sort();
                setAvailableCities(cities);
            }
        };
        fetchCities();
    }, [selectedState]);

    // ── Geolocation ──────────────────────────────────
    const handleAutoDetect = useCallback(() => {
        if (detectingLocation) return;
        setDetectingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Mock detection for demo: using Manipur/jvhuvv since it's in the DB
                    setTimeout(() => {
                        setSelectedState("Manipur");
                        setSelectedCity("jvhuvv");
                        setDetectingLocation(false);
                    }, 1000);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setDetectingLocation(false);
                },
                { timeout: 5000 }
            );
        } else {
            setDetectingLocation(false);
        }
    }, [detectingLocation]);

    // Auto-detect only if user is on step 1 (browsing, no doctorId in URL)
    // Removed auto-detect on mount since most users arrive via a doctorId link

    // ── Fetch Doctors ────────────────────────────────
    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            let query = supabase.from('doctors').select('*').eq('status', 'Approved');
            
            if (selectedState && selectedState !== '') query = query.ilike('state', `%${selectedState}%`);
            if (selectedCity && selectedCity !== '' && selectedCity !== 'Other') query = query.ilike('city', `%${selectedCity}%`);

            const { data, error } = await query;
            if (!error) setDoctors(data || []);
            setLoading(false);
        };
        fetchDoctors();
    }, [selectedState, selectedCity]);

    // ── Handle Deep Link Doctor ──────────────────────────────────────
    useEffect(() => {
        const doctorId = searchParams.get('doctorId');
        if (!doctorId) {
            // No doctor ID in URL — stay on step 1 for searching
            return;
        }

        // Fetch this doctor directly by ID, regardless of the filter state
        const fetchAndSelectDoctor = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .eq('id', doctorId)
                .maybeSingle();

            if (error || !data) {
                console.error('Doctor not found:', error);
                setLoading(false);
                navigate('/doctors');
                return;
            }

            await handleSelectDoctor(data);
        };

        fetchAndSelectDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // ── Fetch Clinics for Selected Doctor ────────────
    const handleSelectDoctor = async (doc) => {
        setSelectedDoctor(doc);
        setLoading(true);
        setClinicsLoading(true);
        setSelectedClinic(null);
        setSelectedDate('');
        setSelectedSlot('');
        setClinics([]);
        
        // Fetch linked clinics via staff_links
        const { data: staffData, error: staffError } = await supabase
            .from('staff_links')
            .select('organization_id, organization_type')
            .eq('doctor_id', doc.id);

        if (!staffError && staffData && staffData.length > 0) {
            const orgPromises = staffData.map(async (link) => {
                const orgId = link.organization_id;
                const orgType = link.organization_type;
                const table = orgType === 'medical' ? 'medicals' : 'clinics';
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orgId));

                let data = null;

                // Strategy 1: If UUID, try matching via profile_id column
                if (isUUID) {
                    const { data: d1 } = await supabase
                        .from(table)
                        .select('*')
                        .eq('profile_id', orgId)
                        .maybeSingle();
                    data = d1 || null;
                }

                // Strategy 2: If still no data, try matching via id column directly
                if (!data) {
                    const { data: d2 } = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', orgId)
                        .maybeSingle();
                    data = d2 || null;
                }

                // Strategy 3: Fall back to profiles table (covers cases where no internal row exists)
                if (!data && isUUID) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, full_name, name, city, state, phone')
                        .eq('id', orgId)
                        .maybeSingle();

                    if (profileData) {
                        data = {
                            id: profileData.id,
                            name: profileData.full_name || profileData.name || 'Unnamed Facility',
                            address: [profileData.city, profileData.state].filter(Boolean).join(', ') || '',
                            phone: profileData.phone || '',
                        };
                    }
                }

                if (!data) return null;

                // Ensure the name field is always populated (clinics table uses 'name', not 'full_name')
                const name = data.name || data.full_name || 'Unnamed Facility';
                return { ...data, name, organization_type: orgType };
            });

            const list = (await Promise.all(orgPromises)).filter(Boolean);
            setClinics(list);
            if (list.length > 0) {
                const desiredClinic = clinicIdParam
                    ? list.find(c => String(c.id) === String(clinicIdParam))
                    : null;
                setSelectedClinic(desiredClinic || list[0]);
            }
        } else {
            setClinics([]);
        }

        // Fetch doctor timetables for all linked orgs
        const { data: ttData, error: ttError } = await supabase
            .from('doctor_timetables')
            .select('*')
            .eq('doctor_id', doc.id)
            .eq('is_active', true);

        if (!ttError) {
            setDoctorTimetables(ttData || []);
        }

        setClinicsLoading(false);
        setLoading(false);
        setStep(2);
    };

    // ── Navigation & Actions ─────────────────────────
    const baseFee = selectedDoctor?.consultation_fee ?? selectedDoctor?.fees ?? 500;
    const bookingCharge = selectedDoctor?.booking_charges || 0;
    const platformFee = selectedDoctor?.platform_fee || 0;
    const totalFee = baseFee + bookingCharge + platformFee;

    const handleConfirmSlots = () => {
        if (user) {
            setStep(4); // Skip OTP for logged-in users
        } else {
            setStep(3); // Prompt for OTP
        }
    };

    const handleVerifyOtp = () => {
        setVerifyingOtp(true);
        // Simulate OTP verification
        setTimeout(() => {
            setOtpVerified(true);
            setVerifyingOtp(false);
            setStep(4);
        }, 1500);
    };

    const handleConfirmBooking = async () => {
        setBookingLoading(true);
        
        try {

            // Helper functions for time parsing
            const parseTimeToMinutes = (timeStr) => {
                if (!timeStr) return 0;
                const [time, ampm] = timeStr.split(' ');
                if (!time || !ampm) return 0;
                let [h, m] = time.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };

            const parseTimetableTime = (timeStr) => {
                if (!timeStr) return 0;
                let [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            // 1. Determine current timetable range
            const slotMin = parseTimeToMinutes(selectedSlot);
            const dStr = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
            const matchedOrgId = selectedClinic?.id;
            const matchedRanges = doctorTimetables.filter(t => t.org_id === matchedOrgId && t.day === dStr);

            let currentRange = null;
            for (const range of matchedRanges) {
                const startMin = parseTimetableTime(range.time_from);
                const endMin = parseTimetableTime(range.time_to);
                if (slotMin >= startMin && slotMin < endMin) {
                    currentRange = range;
                    break;
                }
            }

            // 2. Fetch all appointments for the day to check duplicates AND calculate queue
            let dayAppointmentsQuery = supabase
                .from('appointments')
                .select('id, time_slot, patient_id')
                .eq('doctor_id', selectedDoctor.id)
                .eq('date', selectedDate)
                .neq('status', 'Cancelled');

            if (selectedClinic?.id) {
                dayAppointmentsQuery = dayAppointmentsQuery.eq('organization_id', selectedClinic.id);
            } else {
                dayAppointmentsQuery = dayAppointmentsQuery.is('organization_id', null);
            }

            const { data: dayAppointments, error: dayAppointmentsError } = await dayAppointmentsQuery;

            if (dayAppointmentsError) throw dayAppointmentsError;

            // 3. Check for duplicates in the same range and count queue
            let isDuplicate = false;
            let queueCount = 0;
            const existingAppts = dayAppointments || [];

            if (currentRange) {
                const startMin = parseTimetableTime(currentRange.time_from);
                const endMin = parseTimetableTime(currentRange.time_to);
                
                for (const app of existingAppts) {
                    const appMin = parseTimeToMinutes(app.time_slot);
                    if (appMin >= startMin && appMin < endMin) {
                        queueCount++; // Count for queue

                        // Check if it's the same patient
                        if (user?.id && app.patient_id === user.id) {
                            isDuplicate = true;
                        }
                    }
                }
            } else {
                // Fallback if no range found: check exact time slot
                for (const app of existingAppts) {
                    if (app.time_slot === selectedSlot) {
                        queueCount++; // Count for queue
                        if (user?.id && app.patient_id === user.id) {
                            isDuplicate = true;
                        }
                    }
                }
            }

            if (isDuplicate) {
                toast.error('You have already booked the appointment', {
                    description: 'You cannot book another appointment with this doctor in the same time block.',
                });
                return;
            }

            const realQueueNumber = queueCount + 1;

            // Sync to appointments table
            const appointmentData = {
                patient_id: user?.id || null,
                patient_name: patientInfo.name,
                doctor_id: selectedDoctor.id,
                doctor_name: selectedDoctor.full_name,
                organization_id: selectedClinic?.id,
                organization_type: selectedClinic?.organization_type || 'clinic',
                date: selectedDate,
                time_slot: selectedSlot,
                status: 'Confirmed',
                type: 'In-person',
                fee: totalFee,
                platform_revenue: platformFee,
                queue_number: realQueueNumber,
                specialization: selectedDoctor.specialization
            };

            let { error } = await supabase.from('appointments').insert([appointmentData]);
        
            if (!error) {
                setBookingSuccess(true);
                toast.success('Appointment Confirmed!', {
                    description: `Your appointment with ${selectedDoctor.full_name} is set for ${new Date(selectedDate).toDateString()}. Queue #${realQueueNumber}`,
                    duration: 5000,
                });
                setStep(5);
            } else {
                console.error("Booking error:", error);
                if (error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate')) {
                    toast.error('You have already booked the appointment');
                } else {
                    toast.error(`Booking failed: ${error?.message || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error("Unexpected booking error:", err);
            if (err?.code === '23505' || err?.message?.toLowerCase().includes('duplicate')) {
                toast.error('You have already booked the appointment');
            } else {
                toast.error(`Booking failed: ${err?.message || 'Something went wrong. Please try again.'}`);
            }
        } finally {
            setBookingLoading(false);
        }
    };

    // Derived: filtered doctors by search term
    const filteredDoctors = useMemo(() => {
        return doctors.filter(d => 
            d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [doctors, searchTerm]);

    // Calculate slots for the currently selected date and clinic
    const availableSlots = useMemo(() => {
        if (!selectedClinic || !selectedDate) return [];
        const dStr = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
        
        // Find which timetables match clinic and day
        // Use internal org ID (medicals.id / clinics.id) to match timetable entries
        const matchedOrgId = selectedClinic.id;
        const matched = doctorTimetables.filter(t => t.org_id === matchedOrgId && t.day === dStr);
        if (matched.length === 0) return [];
        
        // Convert ranges like '09:00' to '12:00' into 30m slots
        const slots = [];
        matched.forEach(t => {
            let [h1, m1] = t.time_from.split(':').map(Number);
            let [h2, m2] = t.time_to.split(':').map(Number);
            let start = h1 * 60 + m1;
            let end = h2 * 60 + m2;
            
            for (let min = start; min < end; min += 30) {
                let hh = Math.floor(min / 60);
                let mm = min % 60;
                let ampm = hh >= 12 ? 'PM' : 'AM';
                let dh = hh % 12 || 12;
                slots.push(`${dh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')} ${ampm}`);
            }
        });
        
        return [...new Set(slots)];
    }, [selectedClinic, selectedDate, doctorTimetables]);

    // Which days has at least one active slot in that clinic?
    const daysWithSlots = useMemo(() => {
        if (!selectedClinic) return new Set();
        // Use internal org ID (medicals.id / clinics.id) to match timetable entries
        const matchedOrgId = selectedClinic.id;
        return new Set(doctorTimetables.filter(t => t.org_id === matchedOrgId).map(t => {
            // Ensure the day format from timetable matches the Javascript short form (Mon, Tue)
            // Doctor timetables has full day name e.g. "Monday". Convert to short format for tracking.
            return t.day.substring(0, 3);
        }));
    }, [selectedClinic, doctorTimetables]);

    const showDeepLinkLoader = authLoading || (doctorIdParam && !selectedDoctor && loading);

    if (showDeepLinkLoader) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    <p className="text-sm font-semibold text-slate-600">Preparing appointment slots...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        {step > 1 && !bookingSuccess && (
                            <Button variant="ghost" size="icon" onClick={() => {
                                if (step === 2) {
                                    navigate('/doctors');
                                } else {
                                    if (step === 4 && user) {
                                        setStep(2);
                                    } else {
                                        setStep(step - 1);
                                    }
                                }
                            }}>
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 font-headline">
                                {step === 1 ? 'Find Your Doctor' : 
                                 step === 2 ? 'Schedule Appointment' : 
                                 step === 3 ? 'Patient Details' :
                                 step === 4 ? 'Payment Summary' :
                                 'Booking Confirmed'}
                            </h1>
                            <p className="text-slate-500">
                                {step === 1 ? 'Search by location, specialty, or doctor name.' : 
                                 step === 2 ? 'Choose a clinic and time slot for your visit.' : 
                                 step === 3 ? 'Confirm your contact information for verification.' :
                                 step === 4 ? 'Review and complete your consultation payment.' :
                                 'Your appointment has been successfully scheduled.'}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP 1: SEARCH & FILTER */}
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {/* Filters Panel */}
                                <Card className="border-none shadow-xl shadow-slate-200/50">
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">State</label>
                                                <Select value={selectedState} onValueChange={(val) => { setSelectedState(val); setSelectedCity(''); }}>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                                                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select City" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Search Doctor</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input 
                                                        placeholder="Name or Specialty..." 
                                                        className="pl-10 h-12"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 justify-end">
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full h-12 flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
                                                    onClick={handleAutoDetect}
                                                    disabled={detectingLocation}
                                                >
                                                    {detectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                                    {detectingLocation ? 'Detecting...' : 'Auto-detect Location'}
                                                </Button>
                                                {(selectedState || selectedCity || searchTerm) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full h-10 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => { setSelectedState(''); setSelectedCity(''); setSearchTerm(''); }}
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Results Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? (
                                        Array(6).fill(0).map((_, i) => (
                                            <Card key={i} className="h-64 animate-pulse bg-slate-100" />
                                        ))
                                    ) : filteredDoctors.length > 0 ? (
                                        filteredDoctors.map((doc) => (
                                            <motion.div key={doc.id} whileHover={{ y: -5 }}>
                                                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => handleSelectDoctor(doc)}>
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 text-2xl font-bold overflow-hidden border-2 border-white shadow-sm">
                                                                {doc.avatar_url ? (
                                                                    <img src={getStorageUrl(doc.avatar_url, 'doctor-avtar')} alt={doc.full_name} className="w-full h-full object-cover" />
                                                                ) : doc.full_name?.[0]}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{doc.full_name}</h3>
                                                                <p className="text-emerald-600 text-sm font-medium">{doc.specialization}</p>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {doc.city}, {doc.state}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="pt-4 border-t flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-700">₹{(doc.consultation_fee ?? doc.fees ?? 500) + (doc.booking_charges || 0) + (doc.platform_fee || 0)} <span className="text-slate-400 font-normal">Fee</span></span>
                                                            </div>
                                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 group">
                                                                Book Now
                                                                <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center space-y-4">
                                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                                <Search className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-slate-900">No doctors found</h3>
                                                <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                                            </div>
                                            <Button variant="outline" onClick={() => { setSelectedState(''); setSelectedCity(''); setSearchTerm(''); }}>
                                                Clear All Filters
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: CLINIC & SLOT SELECTION */}
                        {step === 2 && selectedDoctor && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Left: Doctor Info */}
                                <div className="space-y-6">
                                    <Card className="border-none shadow-lg">
                                        <CardContent className="p-6 text-center space-y-4">
                                            <div className="h-24 w-24 rounded-full bg-slate-100 mx-auto border-4 border-white shadow-md overflow-hidden">
                                                {selectedDoctor.avatar_url ? (
                                                    <img src={getStorageUrl(selectedDoctor.avatar_url, 'doctor-avtar')} alt={selectedDoctor.full_name} className="w-full h-full object-cover" />
                                                ) : <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-slate-400">{selectedDoctor.full_name?.[0]}</div>}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.full_name}</h2>
                                                <p className="text-primary font-medium">{selectedDoctor.specialization}</p>
                                            </div>
                                            <div className="flex justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Experience</p>
                                                    <p className="font-bold">{selectedDoctor.experience || 5}+ Yr</p>
                                                </div>
                                                <div className="w-[1px] bg-slate-100" />
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Consultation</p>
                                                    <p className="font-bold">₹{baseFee}</p>
                                                </div>
                                                {(bookingCharge > 0 || platformFee > 0) && (
                                                    <>
                                                        <div className="w-[1px] bg-slate-100" />
                                                        <div className="text-center">
                                                            <p className="text-xs text-slate-400 font-bold uppercase">Total Fee</p>
                                                            <p className="font-bold text-emerald-600">₹{totalFee}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Info size={120} />
                                        </div>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle size={20} />
                                                <h3 className="font-bold">Important Info</h3>
                                            </div>
                                            <p className="text-blue-100 text-sm">
                                                Please arrive 10 minutes before your scheduled time. 
                                                You can manage your booking in the patient dashboard.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right: Selection Form */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-none shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xl">Practice & Time Slot</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-8">
                                            {/* Clinic / Medical Selection */}
                                            <div className="space-y-4">
                                                <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                                    <MapPin size={16} /> Select Linked Clinic / Medical
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {clinicsLoading ? (
                                                        // Skeleton cards while fetching
                                                        Array(2).fill(0).map((_, i) => (
                                                            <div key={i} className="p-4 rounded-2xl border-2 border-slate-100 space-y-2">
                                                                <Skeleton height={16} width="70%" borderRadius={8} />
                                                                <Skeleton height={12} width="50%" borderRadius={8} />
                                                            </div>
                                                        ))
                                                    ) : clinics.length > 0 ? clinics.map((clinic) => (
                                                        <div
                                                            key={clinic.id}
                                                            onClick={() => setSelectedClinic(clinic)}
                                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                                                selectedClinic?.id === clinic.id
                                                                ? 'border-blue-600 bg-blue-50/50 shadow-md'
                                                                : 'border-slate-100 hover:border-slate-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                                        <Building2 size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 text-sm">{clinic.name}</p>
                                                                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{clinic.address || clinic.city || 'Facility'}</p>
                                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                                                                            {clinic.organization_type || 'clinic'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {selectedClinic?.id === clinic.id && <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-1" />}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="col-span-full p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
                                                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                                <Info size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm">No linked facilities found</p>
                                                                <p className="text-xs text-amber-600 mt-0.5">This doctor is not currently linked to any medical or clinic.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date Selection */}
                                            <div className="space-y-4">
                                                <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                                    <CalendarIcon size={16} /> Select Date
                                                </label>
                                                {clinicsLoading ? (
                                                    // Skeleton date pills while loading
                                                    <div className="flex gap-3">
                                                        {Array(5).fill(0).map((_, i) => (
                                                            <Skeleton key={i} width={64} height={80} borderRadius={16} />
                                                        ))}
                                                    </div>
                                                ) : daysWithSlots.size === 0 ? (
                                                    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-2 font-medium">
                                                        <AlertCircle size={16} /> No schedule set up for the selected clinic yet.
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                                        {Array.from({length: 14}).map((_, offset) => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() + offset);
                                                            const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
                                                            // Only show if the doctor works that day
                                                            if (!daysWithSlots.has(dayShort)) return null;

                                                            const dateStr = d.toISOString().split('T')[0];
                                                            const isSelected = selectedDate === dateStr;

                                                            return (
                                                                <div 
                                                                    key={dateStr}
                                                                    onClick={() => { setSelectedDate(dateStr); setSelectedSlot(''); }}
                                                                    className={`flex-shrink-0 w-16 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                                                                        isSelected ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-slate-100 hover:border-slate-300 bg-white'
                                                                    }`}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase opacity-80">{dayShort}</span>
                                                                    <span className="text-xl font-bold">{d.getDate()}</span>
                                                                    <span className="text-[10px] font-medium opacity-80">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time Slot Selection */}
                                            {selectedDate && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }} 
                                                    animate={{ opacity: 1, height: 'auto' }} 
                                                    className="space-y-4 overflow-hidden"
                                                >
                                                    <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                                        <Clock size={16} /> Select Time Slot
                                                    </label>
                                                    
                                                    {availableSlots.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            {availableSlots.map(slot => (
                                                                <Button
                                                                    key={slot}
                                                                    variant={selectedSlot === slot ? 'default' : 'outline'}
                                                                    className={`h-12 rounded-xl border-2 transition-all ${selectedSlot === slot ? 'shadow-md scale-105' : 'border-slate-100 bg-white hover:border-primary/50'}`}
                                                                    onClick={() => setSelectedSlot(slot)}
                                                                >
                                                                    {slot}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                                                            No empty slots available for this day.
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Confirm Button */}
                                            <Button 
                                                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 mt-4 font-bold"
                                                onClick={handleConfirmSlots}
                                                disabled={!selectedDate || !selectedSlot}
                                            >
                                                Continue to Booking
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: PATIENT DETAILS & OTP */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl mx-auto"
                            >
                                <Card className="border-none shadow-xl">
                                    <CardContent className="p-8 space-y-8">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                                                    <Input 
                                                        value={patientInfo.name} 
                                                        onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                                                        placeholder="Enter full name"
                                                        className="h-12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                                    <Input 
                                                        value={patientInfo.phone} 
                                                        onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                                                        placeholder="Enter phone number"
                                                        className="h-12"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t pt-8">
                                            <div className="text-center">
                                                <h3 className="font-bold text-slate-900">OTP Verification</h3>
                                                <p className="text-sm text-slate-500">We&apos;ve sent a code to your phone (Demo: 000000)</p>
                                            </div>
                                            <div className="flex justify-center gap-2">
                                                {otp.map((digit, idx) => (
                                                    <Input
                                                        key={idx}
                                                        type="text"
                                                        maxLength={1}
                                                        className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:border-blue-500"
                                                        value={digit}
                                                        onChange={(e) => {
                                                            const newOtp = [...otp];
                                                            newOtp[idx] = e.target.value;
                                                            setOtp(newOtp);
                                                            if (e.target.value && idx < 5) {
                                                                const next = e.target.nextElementSibling;
                                                                if (next) next.focus();
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <Button 
                                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                                                onClick={handleVerifyOtp}
                                                disabled={verifyingOtp || otp.join('').length < 6}
                                            >
                                                {verifyingOtp ? <Loader2 className="animate-spin mr-2" /> : 'Verify & Continue'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* STEP 4: PAYMENT SUMMARY */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-xl mx-auto"
                            >
                                <Card className="border-none shadow-xl overflow-hidden">
                                    <div className="bg-slate-900 p-6 text-white">
                                        <h3 className="text-xl font-bold">Booking Summary</h3>
                                        <p className="text-slate-400 text-sm">Review your consultation details</p>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Doctor</span>
                                                <span className="font-bold text-slate-900">{selectedDoctor.full_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Clinic</span>
                                                <span className="font-bold text-slate-900">{selectedClinic?.name || 'In-Person'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Date & Time</span>
                                                <span className="font-bold text-slate-900">{new Date(selectedDate).toDateString()} at {selectedSlot}</span>
                                            </div>
                                            <div className="h-[1px] bg-slate-100 my-4" />
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Consultation Fee</span>
                                                <span className="font-bold">₹{baseFee}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Booking Charges</span>
                                                <span className="font-bold">{bookingCharge === 0 ? 'FREE' : `₹${bookingCharge}`}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Platform Fee</span>
                                                <span className="font-bold">{platformFee === 0 ? 'FREE' : `₹${platformFee}`}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-lg pt-4 border-t font-black">
                                                <span className="text-slate-900">Total Payable</span>
                                                <span className="text-emerald-600">₹{totalFee}</span>
                                            </div>
                                        </div>

                                        <Button 
                                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-xl shadow-emerald-500/20"
                                            onClick={handleConfirmBooking}
                                            disabled={bookingLoading}
                                        >
                                            {bookingLoading ? <Loader2 className="animate-spin mr-2" /> : 'Confirm and Pay Cash'}
                                        </Button>
                                        <p className="text-[10px] text-center text-slate-400">
                                            By clicking confirm, you agree to our terms of service and refund policy.
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* STEP 5: SUCCESS */}
                        {step === 5 && bookingSuccess && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-xl mx-auto text-center space-y-8 py-12"
                            >
                                <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                                    <CheckCircle size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-bold text-slate-900">Appointment Confirmed!</h2>
                                    <p className="text-slate-500 text-lg">
                                        Your session with <span className="text-emerald-600 font-bold">{selectedDoctor.full_name}</span> is booked for <span className="text-slate-900 font-medium">{new Date(selectedDate).toDateString()}</span> at <span className="text-slate-900 font-medium">{selectedSlot}</span>.
                                    </p>
                                </div>
                                
                                <Card className="border-none shadow-lg bg-emerald-50/50 p-6 text-left">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Practice:</span>
                                            <span className="font-bold text-slate-900">{selectedClinic?.name || 'In-Person'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Booking ID:</span>
                                            <span className="font-mono text-xs text-slate-400">#UP-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </Card>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button className="h-12 px-8 font-bold" onClick={() => navigate('/patient/dashboard')}>
                                        Go to My Dashboard
                                    </Button>
                                    <Button variant="outline" className="h-12 px-8 font-bold" onClick={() => window.print()}>
                                        Print Receipt
                                    </Button>
                                </div>
                                
                                <p className="text-slate-400 text-sm">
                                    A confirmation SMS has been sent to your registered mobile number.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <Toaster position="top-right" richColors />
            </div>
    );
}
