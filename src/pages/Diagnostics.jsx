
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase.js';
import { getStorageUrl } from '@/lib/uploadImage.js';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/auth/AuthContext.jsx';
import { toast, Toaster } from 'sonner';
import {
    MapPin, FlaskConical, Search, Star, Clock,
    Phone, ChevronRight, CheckCircle2, X,
    Calendar, User, ArrowRight, CheckCircle, Loader2,
    FileUp, Paperclip
} from 'lucide-react';
import { uploadPrescription } from '@/lib/uploadImage.js';

// ── Booking Modal ─────────────────────────────────────────────────
function BookingModal({ center, onClose }) {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: test+date, 2: details, 3: confirmed
    const [selectedTest, setSelectedTest] = useState('');
    const [manualTest, setManualTest] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [testSearch, setTestSearch] = useState('');
    const [patientName, setPatientName] = useState(user?.user_metadata?.full_name || '');
    const [patientPhone, setPatientPhone] = useState(user?.user_metadata?.phone || '');
    const [booking, setBooking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const slots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

    // Next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const handleConfirm = async () => {
        if (!patientName.trim() || !patientPhone.trim()) {
            toast.error('Please fill in your name and phone number.');
            return;
        }
        setBooking(true);
        try {
            let prescriptionUrl = null;
            if (prescriptionFile) {
                setIsUploading(true);
                try {
                    prescriptionUrl = await uploadPrescription(prescriptionFile, user?.id || 'anonymous');
                } catch (uploadErr) {
                    console.error('Prescription upload failed:', uploadErr);
                    toast.error('Failed to upload prescription. Proceeding without it.');
                } finally {
                    setIsUploading(false);
                }
            }

            const finalTest = selectedTest || manualTest || (prescriptionFile ? 'Prescription Uploaded' : 'Unknown Test');

            const { error } = await supabase.from('appointments').insert([{
                patient_id: user?.id || null,
                patient_name: patientName.trim(),
                patient_phone: patientPhone.trim(),
                doctor_name: center.name,
                specialization: finalTest,
                organization_id: center.id,
                organization_type: 'diagnostic',
                date: selectedDate,
                time_slot: selectedSlot,
                status: 'Confirmed',
                type: 'diagnostic',
                fee: 0,
                notes: `Diagnostic test: ${selectedTest} at ${center.name}`,
                prescription_url: prescriptionUrl,
            }]);
            if (error) throw error;
            setStep(3);
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            {step === 3 ? 'Booking Confirmed!' : `Book a Test · ${center.name}`}
                        </p>
                        {step < 3 && (
                            <div className="flex gap-1 mt-1">
                                {[1, 2].map(s => (
                                    <div key={s} className={`h-1 w-8 rounded-full transition-colors ${step >= s ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* STEP 1: Test + Date + Slot */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            {/* Select Test */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FlaskConical size={16} className="text-emerald-500" /> Select Test
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="prescription-upload"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setPrescriptionFile(e.target.files[0])}
                                        />
                                        <label
                                            htmlFor="prescription-upload"
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                prescriptionFile
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300'
                                            }`}
                                        >
                                            {prescriptionFile ? (
                                                <><Paperclip size={14} /> {prescriptionFile.name.slice(0, 15)}...</>
                                            ) : (
                                                <><FileUp size={14} /> Upload Prescription</>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                {center.tests.length > 0 && (
                                    <>
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search available test..."
                                                value={testSearch}
                                                onChange={e => setTestSearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 -mr-1">
                                            {center.tests
                                                .filter(t => t.toLowerCase().includes(testSearch.toLowerCase()))
                                                .map(test => {
                                                    const raw = (center.rawTests || []).find(r => r.name === test);
                                                    return (
                                                        <button
                                                            key={test}
                                                            onClick={() => { setSelectedTest(test); setManualTest(''); }}
                                                            className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                                                                selectedTest === test
                                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                    : 'border-slate-100 hover:border-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-1">
                                                                {selectedTest === test && <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-500" />}
                                                                <span className="font-medium leading-tight">{test}</span>
                                                            </div>
                                                            {raw?.price && <p className="text-xs text-emerald-600 font-bold mt-1">{raw.price}</p>}
                                                        </button>
                                                    );
                                                })}

                                            {center.tests.filter(t => t.toLowerCase().includes(testSearch.toLowerCase())).length === 0 && (
                                                <p className="col-span-2 text-center text-slate-400 text-sm py-4">No tests match your search.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                                
                                <div className="text-sm text-slate-500 font-medium text-center">OR</div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <FlaskConical size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Enter test name manually (e.g. CBC)"
                                            value={manualTest}
                                            onChange={e => { setManualTest(e.target.value); setSelectedTest(''); }}
                                            className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium text-center">OR</div>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors bg-slate-50">
                                        <input 
                                            type="file" 
                                            id="prescription-upload"
                                            className="hidden" 
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file && file.size > 5 * 1024 * 1024) {
                                                    toast.error('File size must be under 5MB');
                                                    return;
                                                }
                                                setPrescriptionFile(file);
                                                setSelectedTest('');
                                            }}
                                        />
                                        <label htmlFor="prescription-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-emerald-600">
                                                <Camera size={18} />
                                            </div>
                                            <div className="text-sm font-bold text-slate-700">
                                                {prescriptionFile ? prescriptionFile.name : 'Upload Doctor Prescription'}
                                            </div>
                                            <div className="text-xs text-slate-500">Max 5MB (Images or PDF)</div>
                                        </label>
                                        {prescriptionFile && (
                                            <button 
                                                onClick={() => setPrescriptionFile(null)} 
                                                className="mt-2 text-xs text-red-500 font-bold hover:underline"
                                            >
                                                Remove File
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Select Date */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-500" /> Select Date
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {dates.map(d => {
                                        const dateStr = d.toISOString().split('T')[0];
                                        const day = d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const num = d.getDate();
                                        const mon = d.toLocaleDateString('en-US', { month: 'short' });
                                        const isSelected = selectedDate === dateStr;
                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`flex-shrink-0 w-14 h-18 rounded-2xl border-2 flex flex-col items-center justify-center py-3 gap-0.5 transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'border-slate-100 bg-white hover:border-emerald-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold uppercase opacity-80">{day}</span>
                                                <span className="text-lg font-black">{num}</span>
                                                <span className="text-[10px] font-medium opacity-70">{mon}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Select Slot */}
                            {selectedDate && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Clock size={16} className="text-emerald-500" /> Select Time Slot
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all ${
                                                    selectedSlot === slot
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 scale-105 shadow-md'
                                                        : 'border-slate-100 hover:border-emerald-200 text-slate-600'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <Button
                                onClick={() => setStep(2)}
                                disabled={!(selectedTest || manualTest || prescriptionFile) || !selectedDate || !selectedSlot}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold text-base gap-2"
                            >
                                Continue <ArrowRight size={18} />
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 2: Patient Details */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            {/* Summary */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-1">
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Your Selection</p>
                                <p className="font-bold text-slate-800">{selectedTest || manualTest || (prescriptionFile ? 'Prescription Uploaded' : '')}</p>
                                <p className="text-sm text-slate-500">
                                    {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedSlot}
                                </p>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <MapPin size={12} /> {center.name}
                                </p>
                            </div>

                            {/* Patient Details */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <User size={16} className="text-emerald-500" /> Your Details
                                </label>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Full Name"
                                        value={patientName}
                                        onChange={e => setPatientName(e.target.value)}
                                        className="h-12 rounded-xl"
                                    />
                                    <Input
                                        placeholder="Phone Number"
                                        value={patientPhone}
                                        onChange={e => setPatientPhone(e.target.value)}
                                        className="h-12 rounded-xl"
                                        type="tel"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl font-bold">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={booking}
                                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold gap-2"
                                >
                                    {booking ? <><Loader2 size={16} className="animate-spin" /> Booking...</> : 'Confirm Booking'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Confirmed */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center gap-4 py-6"
                        >
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">All Set!</h3>
                                <p className="text-slate-500 mt-1">Your test has been booked successfully.</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 w-full text-left space-y-2 border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Centre</span>
                                    <span className="font-bold text-slate-800">{center.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Test</span>
                                    <span className="font-bold text-slate-800">{selectedTest || manualTest || (prescriptionFile ? 'Prescription Uploaded' : '')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Date</span>
                                    <span className="font-bold text-slate-800">
                                        {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Time</span>
                                    <span className="font-bold text-slate-800">{selectedSlot}</span>
                                </div>
                                {prescriptionFile && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Prescription</span>
                                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                                            <Paperclip size={12} /> Attached
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Patient</span>
                                    <span className="font-bold text-slate-800">{patientName}</span>
                                </div>
                            </div>
                            <Button onClick={onClose} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold">
                                Done
                            </Button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

const parseTest = (t) => {
    if (typeof t === 'object' && t !== null) {
        return t;
    }
    if (typeof t === 'string') {
        try {
            const parsed = JSON.parse(t);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
            }
        } catch (e) {
            // Not a JSON string
        }
    }
    return t;
};

// ── Main Page ─────────────────────────────────────────────────────
export default function DiagnosticsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [diagnosticCenters, setDiagnosticCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingCenter, setBookingCenter] = useState(null); // which center's modal is open

    const categories = ['All', 'Pathology', 'Radiology', 'MRI/CT Scan', 'Blood Test'];

    useEffect(() => {
        const fetchCenters = async () => {
            setLoading(true);
            try {
                const { data: profileData } = await supabase
                    .from('profiles').select('*').eq('profile_type', 'diagnostic');

                const { data: centerData } = await supabase
                    .from('diagnostic_centers').select('*');

                const centerMap = {};
                (centerData || []).forEach(c => { centerMap[c.profile_id] = c; });

                const merged = (profileData || []).map(p => {
                    const dc = centerMap[p.id];
                    // Tests stored as [{id,name,price,category,status}] or plain strings
                    const rawTests = (Array.isArray(dc?.tests) ? dc.tests : []).map(parseTest);
                    const activeTestNames = rawTests
                        .filter(t => typeof t === 'object' && t !== null ? t.status === 'Active' : true)
                        .map(t => typeof t === 'object' && t !== null ? t.name : t);
                    return {
                        id: p.id,
                        name: dc?.name || p.full_name || 'Diagnostic Center',
                        location: dc?.city
                            ? `${dc.city}${dc.address ? ', ' + dc.address : ''}`
                            : (p.city || p.state ? `${p.city || ''} ${p.state || ''}`.trim() : 'Location not specified'),
                        tests: activeTestNames,
                        rawTests, // keep full objects for price info
                        logo: getStorageUrl(dc?.avatar_url || p.avatar_url, 'avatars'),
                        phone: dc?.phone || p.phone || null,
                        status: dc?.status || p.status,
                        dataAiHint: 'diagnostic center'
                    };
                });

                (centerData || []).forEach(dc => {
                    if (!merged.find(m => m.id === dc.profile_id)) {
                        const rawTests = (Array.isArray(dc.tests) ? dc.tests : []).map(parseTest);
                        const activeTestNames = rawTests
                            .filter(t => typeof t === 'object' && t !== null ? t.status === 'Active' : true)
                            .map(t => typeof t === 'object' && t !== null ? t.name : t);
                        merged.push({
                            id: dc.id,
                            name: dc.name || 'Diagnostic Center',
                            location: dc.city || dc.address || 'Location not specified',
                            tests: activeTestNames,
                            rawTests,
                            logo: getStorageUrl(dc.avatar_url, 'avatars'),
                            phone: dc.phone || null,
                            status: dc.status,
                            dataAiHint: 'diagnostic center'
                        });
                    }
                });

                setDiagnosticCenters(merged);
            } catch (err) {
                console.error('Error fetching diagnostics centers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCenters();

        // Real-time subscription for profile changes
        const channel = supabase
            .channel('diagnostic-centers-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: 'profile_type=eq.diagnostic'
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    if (payload.eventType === 'INSERT') {
                        const center = payload.new;
                        const mapped = {
                            id: center.id,
                            name: center.full_name || center.name || 'Diagnostic Center',
                            location: center.address || center.city ? `${center.city || ''} ${center.state || ''}`.trim() : 'Location not specified',
                            tests: ['Blood Test', 'Pathology', 'X-Ray'],
                            logo: getStorageUrl(center.avatar_url, 'avatars'),
                            dataAiHint: 'diagnostic center'
                        };
                        setDiagnosticCenters(prev => [mapped, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const center = payload.new;
                        setDiagnosticCenters(prev => prev.map(c => 
                            c.id === center.id ? {
                                ...c,
                                name: center.full_name || center.name || 'Diagnostic Center',
                                location: center.address || center.city ? `${center.city || ''} ${center.state || ''}`.trim() : 'Location not specified',
                                logo: getStorageUrl(center.avatar_url, 'avatars')
                            } : c
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setDiagnosticCenters(prev => prev.filter(c => c.id === payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredCenters = diagnosticCenters.filter(center => {
        const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            center.tests.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = activeCategory === 'All' ||
            center.tests.some(t => t.toLowerCase().includes(activeCategory.toLowerCase()));
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <Toaster richColors position="top-center" />

            {/* Booking Modal */}
            <AnimatePresence>
                {bookingCenter && (
                    <BookingModal center={bookingCenter} onClose={() => setBookingCenter(null)} />
                )}
            </AnimatePresence>

            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-16">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <FlaskConical className="w-full h-full text-emerald-500 translate-x-1/4" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 px-4 py-1">Premium Partners</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
                        Precision Diagnostics <br />
                        <span className="text-emerald-400 text-3xl md:text-4xl">At Your Doorstep</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 font-medium">
                        Compare prices, book home collection, and receive digital reports from India&apos;s top-rated NABL labs.
                    </p>
                    <div className="relative max-w-md group">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <Input
                            placeholder="Search tests (e.g. CBC, Liver Function...)"
                            className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:bg-white/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                activeCategory === cat ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="rounded-3xl border border-slate-100 shadow-md overflow-hidden animate-pulse">
                            <div className="h-40 bg-slate-100" />
                            <div className="p-6 space-y-3">
                                <div className="h-5 bg-slate-100 rounded w-3/4" />
                                <div className="h-4 bg-slate-100 rounded w-1/2" />
                                <div className="flex gap-2 pt-2">
                                    <div className="h-6 bg-slate-100 rounded-full w-20" />
                                    <div className="h-6 bg-slate-100 rounded-full w-20" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredCenters.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <FlaskConical className="w-10 h-10 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">No diagnostic centres found</h3>
                            <p className="text-slate-500 mt-1 text-sm">
                                {searchTerm ? 'Try a different search term.' : 'No diagnostic centres are registered yet.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredCenters.map((center, index) => (
                            <motion.div
                                key={center.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="group h-full flex flex-col border-slate-100 hover:border-emerald-500/20 transition-all duration-300 shadow-md hover:shadow-2xl overflow-hidden rounded-3xl">
                                    <div className="relative h-40 bg-slate-50 overflow-hidden">
                                        {center.logo ? (
                                            <img
                                                src={center.logo}
                                                alt={center.name}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                data-ai-hint={center.dataAiHint}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                                                <FlaskConical className="w-12 h-12 text-emerald-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-white/90 backdrop-blur text-emerald-600 border-emerald-100 flex items-center gap-1 font-bold">
                                                <Star className="w-3 h-3 fill-emerald-600" /> 4.8
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl font-extrabold text-slate-800">{center.name}</CardTitle>
                                                <div className="flex items-center gap-1.5 text-slate-500 mt-1 text-sm font-medium">
                                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                                    <span>{center.location}</span>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="text-emerald-500 h-6 w-6 flex-shrink-0" />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-grow space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Tests</p>
                                            {center.tests.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {center.tests.map(test => {
                                                        const raw = (center.rawTests || []).find(r => r.name === test);
                                                        return (
                                                            <Badge
                                                                key={test}
                                                                variant="secondary"
                                                                onClick={() => setBookingCenter(center)}
                                                                className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                                                            >
                                                                <span>{test}</span>
                                                                {raw?.price && <span className="text-emerald-600 font-bold">({raw.price})</span>}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">No tests listed yet.</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Clock className="w-3.5 h-3.5" /> 60-Min Collection
                                            </div>
                                            {center.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                    <Phone className="w-3.5 h-3.5" /> {center.phone}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0 p-6">
                                        <Button
                                            onClick={() => setBookingCenter(center)}
                                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 transition-all rounded-2xl font-bold gap-2 text-base group/btn shadow-lg shadow-emerald-600/10"
                                        >
                                            Book a Test
                                            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
