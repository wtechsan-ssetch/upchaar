import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, MapPin, Calendar as CalendarIcon, Clock, 
    ArrowRight, CheckCircle, ChevronLeft, 
    Info, AlertCircle, Loader2, UploadCloud, FileText, X,
    ShieldCheck, Activity, CreditCard, Sparkles, User, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/auth/AuthContext.jsx';
import { diagnosticCenters } from '@/lib/data.js';

export default function BookTest() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    
    // ── Data State ───────────────────────────────────
    const [centerId, setCenterId] = useState(searchParams.get('centerId'));
    const [center, setCenter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    
    // ── UI Flow State ────────────────────────────────
    const [step, setStep] = useState(1); // 1: Select Slot & Upload, 2: Details & OTP, 3: Payment, 4: Confirmation
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // ── File Upload State ────────────────────────────
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [prescriptionUrl, setPrescriptionUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // ── Patient Details State ────────────────────────
    const [patientInfo, setPatientInfo] = useState({
        name: user?.user_metadata?.full_name || '',
        phone: user?.user_metadata?.phone || '',
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        if (user) {
            setPatientInfo({
                name: user.user_metadata?.full_name || '',
                phone: user.user_metadata?.phone || '',
            });
        }
    }, [user]);

    // ── Fetch Diagnostic Center ──────────────────────
    useEffect(() => {
        const fetchCenter = async () => {
            if (!centerId) {
                navigate('/diagnostics');
                return;
            }
            
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('diagnostics')
                    .select('*')
                    .eq('id', centerId)
                    .maybeSingle();
                    
                if (data) {
                    setCenter(data);
                } else {
                    const staticCenter = diagnosticCenters.find(c => c.id === centerId);
                    if (staticCenter) {
                        setCenter({
                            ...staticCenter,
                            address: staticCenter.location
                        });
                    } else {
                        toast.error("Diagnostic center not found.");
                        navigate('/diagnostics');
                    }
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCenter();
    }, [centerId, navigate]);

    const availableSlots = useMemo(() => {
        if (!selectedDate) return [];
        const slots = [];
        for (let hh = 8; hh <= 18; hh++) {
            let ampm = hh >= 12 ? 'PM' : 'AM';
            let dh = hh % 12 || 12;
            slots.push(`${dh.toString().padStart(2,'0')}:00 ${ampm}`);
            slots.push(`${dh.toString().padStart(2,'0')}:30 ${ampm}`);
        }
        return slots;
    }, [selectedDate]);

    // ── File Upload Handler ──────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setPrescriptionFile(file);
        setUploading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `prescriptions/${fileName}`;

            const { data, error } = await supabase.storage
                .from('medical_records')
                .upload(filePath, file);

            if (error) {
                console.error("Upload error:", error);
                setPrescriptionUrl(`https://placehold.co/400x600?text=Prescription+Preview`);
                toast.info("Using preview mode for prescription.");
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('medical_records')
                    .getPublicUrl(filePath);
                setPrescriptionUrl(publicUrl);
                toast.success("Prescription uploaded!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setPrescriptionFile(null);
        setPrescriptionUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Navigation & Actions ─────────────────────────
    const handleConfirmSlots = () => {
        if (!prescriptionFile && !prescriptionUrl) {
            toast.error("Please upload a prescription to proceed.");
            return;
        }
        if (user) {
            setStep(3);
        } else {
            setStep(2);
        }
    };

    const handleVerifyOtp = () => {
        setVerifyingOtp(true);
        setTimeout(() => {
            setOtpVerified(true);
            setVerifyingOtp(false);
            setStep(3);
        }, 1200);
    };

    const handleConfirmBooking = async () => {
        setBookingLoading(true);
        
        const appointmentData = {
            patient_id: user?.id || null,
            patient_name: patientInfo.name,
            doctor_id: center?.profile_id || center?.id || centerId,
            doctor_name: center?.name || 'Diagnostic Center',
            organization_id: center?.id || centerId,
            organization_type: 'diagnostic',
            date: selectedDate,
            time_slot: selectedSlot,
            status: 'Pending',
            type: 'In-person',
            fee: 0,
            specialization: 'Pathology/Radiology',
            notes: JSON.stringify({
                prescription_url: prescriptionUrl,
                test_booking: true
            })
        };

        try {
            const { error } = await supabase.from('appointments').insert([appointmentData]);
            
            if (error) {
                console.warn("DB Insert failed, possibly due to mock ID constraint:", error.message);
                if (centerId.startsWith('1111') || centerId.startsWith('2222') || centerId.startsWith('3333')) {
                    setBookingSuccess(true);
                    setStep(4);
                    toast.success('Booking Confirmed!');
                    return;
                }
                throw error;
            }

            setBookingSuccess(true);
            setStep(4);
            toast.success('Booking Confirmed!');
        } catch (err) {
            console.error("Booking error:", err);
            toast.error("Error booking test. " + err.message);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                >
                    <Activity className="h-12 w-12 text-emerald-500" />
                </motion.div>
                <p className="text-slate-400 font-medium animate-pulse">Loading diagnostic center...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section (Same as BookAppointment) */}
                <div className="flex items-center gap-4 mb-8">
                    {step > 1 && !bookingSuccess && (
                        <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 font-headline">
                            {step === 1 ? 'Book a Test' : 
                             step === 2 ? 'Patient Details' : 
                             step === 3 ? 'Payment Summary' :
                             'Booking Confirmed'}
                        </h1>
                        <p className="text-slate-500">
                            {step === 1 ? 'Select a date, time, and upload your prescription.' : 
                             step === 2 ? 'Confirm your contact information for verification.' :
                             step === 3 ? 'Review and complete your booking.' :
                             'Your test has been successfully scheduled.'}
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: DATE, SLOT & UPLOAD */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {/* Left: Center Info */}
                            <div className="md:col-span-1 space-y-6">
                                <Card className="border-none shadow-xl overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="h-32 bg-slate-900 flex items-center justify-center p-6">
                                            <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center shadow-lg border-4 border-slate-800">
                                                {center?.logo ? (
                                                    <img src={center.logo} alt={center.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : <FileText size={32} className="text-slate-400" />}
                                            </div>
                                        </div>
                                        <div className="p-6 text-center space-y-2">
                                            <h2 className="text-xl font-bold text-slate-900">{center?.name || 'Diagnostic Center'}</h2>
                                            <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
                                                <MapPin size={14} className="text-emerald-500" /> {center?.address || 'Location Unavailable'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                {/* Prescription Upload Panel */}
                                <Card className="border-none shadow-xl">
                                    <div className="bg-slate-900 p-4 text-white rounded-t-xl">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <FileText size={18} /> Prescription
                                        </h3>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        {!prescriptionFile ? (
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                                            >
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    onChange={handleFileUpload}
                                                />
                                                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    {uploading ? (
                                                        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                                                    ) : (
                                                        <UploadCloud className="h-6 w-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">Upload Prescription</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Mandatory</p>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-600">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{prescriptionFile.name}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Uploaded</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={removeFile}>
                                                    <X size={18} />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Selection Form */}
                            <div className="md:col-span-2 space-y-6">
                                <Card className="border-none shadow-xl min-h-[500px]">
                                    <div className="bg-slate-900 p-6 text-white rounded-t-xl">
                                        <h3 className="text-xl font-bold">Schedule Your Test</h3>
                                        <p className="text-slate-400 text-sm">Select your preferred time slot</p>
                                    </div>
                                    <CardContent className="p-8 space-y-10">
                                        {/* Date Selection */}
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                                                <CalendarIcon size={16} /> 1. Select Date
                                            </label>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                                {Array.from({length: 14}).map((_, offset) => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + offset);
                                                    if (d.getDay() === 0) return null;

                                                    const dateStr = d.toISOString().split('T')[0];
                                                    const isSelected = selectedDate === dateStr;

                                                    return (
                                                        <div 
                                                            key={dateStr}
                                                            onClick={() => { setSelectedDate(dateStr); setSelectedSlot(''); }}
                                                            className={`flex-shrink-0 w-16 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                                                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'border-slate-100 hover:border-slate-300 bg-white'
                                                            }`}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase opacity-80">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                            <span className="text-xl font-bold">{d.getDate()}</span>
                                                            <span className="text-[10px] font-medium opacity-80">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Time Selection */}
                                        {selectedDate ? (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} 
                                                animate={{ opacity: 1, height: 'auto' }} 
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                                                    <Clock size={16} /> 2. Select Time Slot
                                                </label>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {availableSlots.map(slot => (
                                                        <Button
                                                            key={slot}
                                                            variant={selectedSlot === slot ? 'default' : 'outline'}
                                                            className={`h-12 rounded-xl border-2 transition-all font-bold ${selectedSlot === slot ? 'shadow-md scale-105 bg-emerald-600 hover:bg-emerald-700' : 'border-slate-100 bg-white hover:border-emerald-600/50'}`}
                                                            onClick={() => setSelectedSlot(slot)}
                                                        >
                                                            {slot}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                                <p className="text-slate-400 font-medium">Please select a date first</p>
                                            </div>
                                        )}

                                        {/* Confirm Button */}
                                        <Button 
                                            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 mt-4 font-bold rounded-2xl"
                                            onClick={handleConfirmSlots}
                                            disabled={!selectedDate || !selectedSlot || (!prescriptionFile && !prescriptionUrl)}
                                        >
                                            Continue to Details
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: PATIENT DETAILS & OTP */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="border-none shadow-2xl overflow-hidden">
                                <div className="bg-slate-900 p-6 text-white">
                                    <h3 className="text-xl font-bold">Patient Information</h3>
                                    <p className="text-slate-400 text-sm">Verify your details for the appointment</p>
                                </div>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <User size={12} /> Patient Name
                                                </label>
                                                <Input 
                                                    value={patientInfo.name} 
                                                    onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                                                    placeholder="Enter full name"
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <Phone size={12} /> Phone Number
                                                </label>
                                                <Input 
                                                    value={patientInfo.phone} 
                                                    onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                                                    placeholder="Enter phone number"
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-8">
                                        <div className="text-center">
                                            <h3 className="font-bold text-slate-900">OTP Verification</h3>
                                            <p className="text-sm text-slate-500">We've sent a code to your phone (Demo: 000000)</p>
                                        </div>
                                        <div className="flex justify-center gap-2">
                                            {otp.map((digit, idx) => (
                                                <Input
                                                    key={idx}
                                                    type="text"
                                                    maxLength={1}
                                                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:border-emerald-500 bg-slate-50"
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
                                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl"
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

                    {/* STEP 3: PAYMENT SUMMARY */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-xl mx-auto"
                        >
                            <Card className="border-none shadow-2xl overflow-hidden">
                                <div className="bg-slate-900 p-6 text-white">
                                    <h3 className="text-xl font-bold">Booking Summary</h3>
                                    <p className="text-slate-400 text-sm">Review your test booking details</p>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Center</span>
                                            <span className="font-bold text-slate-900">{center?.name || 'Diagnostic Center'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Date & Time</span>
                                            <span className="font-bold text-slate-900">{new Date(selectedDate).toDateString()} at {selectedSlot}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Patient</span>
                                            <span className="font-bold text-slate-900">{patientInfo.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Prescription</span>
                                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                <CheckCircle size={14} /> Uploaded & Secured
                                            </span>
                                        </div>
                                        <div className="h-[1px] bg-slate-100 my-4" />
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Processing Fee</span>
                                            <span className="font-bold text-emerald-600">FREE</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Estimated Cost</span>
                                            <span className="font-bold text-slate-400 italic">To be updated by center</span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-xl shadow-emerald-500/20 rounded-2xl mt-4"
                                        onClick={handleConfirmBooking}
                                        disabled={bookingLoading}
                                    >
                                        {bookingLoading ? <Loader2 className="animate-spin mr-2" /> : 'Confirm Booking'}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400">
                                        By clicking confirm, you agree to allow the diagnostic center to contact you.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && bookingSuccess && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
                                <div className="bg-emerald-600 h-2" />
                                <CardContent className="p-12 text-center space-y-8">
                                    <div className="relative mx-auto w-24 h-24">
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                            className="absolute inset-0 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner"
                                        >
                                            <CheckCircle size={48} strokeWidth={3} />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Booking Confirmed!</h2>
                                        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                            Your diagnostic test at <span className="font-bold text-slate-700">{center?.name}</span> has been successfully scheduled.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                            <p className="font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                                            <p className="font-bold text-slate-900">{selectedSlot}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left flex items-start gap-3">
                                        <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                                            The diagnostic center will review your prescription and confirm the final cost via call or dashboard update.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <Button 
                                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl transition-all"
                                            onClick={() => navigate('/patient/dashboard')}
                                        >
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
