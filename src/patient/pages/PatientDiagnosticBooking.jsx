import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { uploadDiagnosticFile, getStorageUrl } from '@/lib/uploadImage.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical, FileText, ShieldCheck, ShieldAlert, CheckCircle2, Clock, DollarSign,
    UploadCloud, ArrowLeft, Search, Plus, X, FileCheck, MapPin, Phone,
    CreditCard, Download, Printer, ChevronRight, Hash, Building2,
    CheckCircle, RefreshCw, Loader2, Sparkles, Filter, Eye, Send, Calendar
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Standard common lab tests
const COMMON_LAB_TESTS = [
    { id: 'cbc', name: 'Complete Blood Count (CBC)', category: 'Blood Test' },
    { id: 'lipid', name: 'Lipid Profile', category: 'Blood Test' },
    { id: 'thyroid', name: 'Thyroid Function Test (T3, T4, TSH)', category: 'Endocrinology' },
    { id: 'lft', name: 'Liver Function Test (LFT)', category: 'Blood Test' },
    { id: 'fbs', name: 'Fasting Blood Sugar (FBS)', category: 'Diabetes' },
    { id: 'kft', name: 'Kidney Function Test (KFT)', category: 'Blood Test' },
    { id: 'vitd', name: 'Vitamin D3 & B12 Panel', category: 'Vitamins' },
    { id: 'hba1c', name: 'HbA1c (Glycated Hemoglobin)', category: 'Diabetes' },
    { id: 'urine', name: 'Urine Routine & Microscopy', category: 'Pathology' },
    { id: 'xray', name: 'X-Ray Chest PA View', category: 'Radiology' },
    { id: 'ecg', name: '12-Lead ECG (Electrocardiogram)', category: 'Cardiology' },
];

export default function PatientDiagnosticBooking() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    // Tabs: 'browse' | 'new-booking' | 'tracker'
    const [activeTab, setActiveTab] = useState('browse');

    // Centers List (Merged Directory & Detailed catalogue)
    const [centers, setCenters] = useState([]);
    const [loadingCenters, setLoadingCenters] = useState(true);

    // Filters for Browse Tab
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Booking Form State
    const [selectedCenterId, setSelectedCenterId] = useState('');
    const [bookingMode, setBookingMode] = useState('manual'); // 'manual' | 'prescription'
    const [selectedTests, setSelectedTests] = useState([]);
    const [testSearch, setTestSearch] = useState('');
    const [customTestText, setCustomTestText] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [prescriptionPreview, setPrescriptionPreview] = useState(null);
    const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
    const [preferredSlot, setPreferredSlot] = useState('09:00 AM');

    // Patient Contact Details
    const [patientName, setPatientName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
    const [patientPhone, setPatientPhone] = useState(profile?.phone || user?.user_metadata?.phone || '');
    const [patientEmail, setPatientEmail] = useState(user?.email || '');

    // Insurance & ID Upload State
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [hasInsurance, setHasInsurance] = useState(false);
    const [insuranceFile, setInsuranceFile] = useState(null);
    const [identityCardFile, setIdentityCardFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Requests List for Live Tracker
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    // Payment Modal & Invoice State
    const [payingRequest, setPayingRequest] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Invoice View Modal
    const [invoiceRequest, setInvoiceRequest] = useState(null);

    const categories = ['All', 'Pathology', 'Radiology', 'MRI/CT Scan', 'Blood Test'];

    useEffect(() => {
        if (profile) {
            setPatientName(profile.full_name || '');
            setPatientPhone(profile.phone || '');
        }
    }, [profile]);

    // Fetch active diagnostic centers & merge with profiles
    useEffect(() => {
        const fetchCenters = async () => {
            setLoadingCenters(true);
            try {
                const { data: profileData } = await supabase
                    .from('profiles').select('*').eq('profile_type', 'diagnostic');

                const { data: centerData } = await supabase
                    .from('diagnostic_centers').select('*');

                const centerMap = {};
                (centerData || []).forEach(c => { centerMap[c.profile_id] = c; });

                const parseTestItem = (t) => {
                    if (!t) return null;
                    if (typeof t === 'object') return t;
                    if (typeof t === 'string') {
                        const trimmed = t.trim();
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            try { return JSON.parse(trimmed); } catch (e) { return { name: t, status: 'Active' }; }
                        }
                        return { name: t, status: 'Active' };
                    }
                    return null;
                };

                const merged = (profileData || []).map(p => {
                    const dc = centerMap[p.id];
                    const rawTests = Array.isArray(dc?.tests) ? dc.tests.map(parseTestItem).filter(Boolean) : [];
                    const activeTestNames = rawTests
                        .filter(t => (t.status ? t.status === 'Active' : true) && t.name)
                        .map(t => t.name);
                    return {
                        id: dc?.id || p.id,
                        profile_id: p.id,
                        name: dc?.name || p.full_name || 'Diagnostic Center',
                        location: dc?.city
                            ? `${dc.city}${dc.address ? ', ' + dc.address : ''}`
                            : (p.city || p.state ? `${p.city || ''} ${p.state || ''}`.trim() : 'Location not specified'),
                        address: dc?.address || p.address || '',
                        city: dc?.city || p.city || '',
                        phone: dc?.phone || p.phone || null,
                        tests: activeTestNames.length > 0 ? activeTestNames : ['CBC', 'Lipid Profile', 'Blood Test', 'Pathology'],
                        rawTests,
                        logo: getStorageUrl(dc?.avatar_url || p.avatar_url, 'avatars'),
                        status: dc?.status || p.status,
                        accepts_insurance: dc?.accepts_insurance ?? true
                    };
                });

                (centerData || []).forEach(dc => {
                    if (!merged.find(m => m.id === dc.id || m.profile_id === dc.profile_id)) {
                        const rawTests = Array.isArray(dc.tests) ? dc.tests.map(parseTestItem).filter(Boolean) : [];
                        const activeTestNames = rawTests
                            .filter(t => (t.status ? t.status === 'Active' : true) && t.name)
                            .map(t => t.name);
                        merged.push({
                            id: dc.id,
                            profile_id: dc.profile_id,
                            name: dc.name || 'Diagnostic Center',
                            location: dc.city || dc.address || 'Location not specified',
                            address: dc.address || '',
                            city: dc.city || '',
                            phone: dc.phone || null,
                            tests: activeTestNames.length > 0 ? activeTestNames : ['CBC', 'Blood Test', 'Pathology'],
                            rawTests,
                            logo: getStorageUrl(dc.avatar_url, 'avatars'),
                            status: dc.status,
                            accepts_insurance: dc.accepts_insurance ?? true
                        });
                    }
                });

                setCenters(merged);
            } catch (err) {
                console.error('Error loading diagnostic centers:', err);
            } finally {
                setLoadingCenters(false);
            }
        };
        fetchCenters();
    }, []);

    // Load Patient's Requests
    const fetchRequests = async () => {
        if (!user?.id) return;
        setLoadingRequests(true);
        try {
            const { data, error } = await supabase
                .from('diagnostic_requests')
                .select('*')
                .eq('patient_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setRequests(data);
            }
        } catch (err) {
            console.error('Error loading patient diagnostic requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        if (!user?.id) return;
        const channel = supabase
            .channel('patient-diagnostic-requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'diagnostic_requests',
                    filter: `patient_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Realtime update on diagnostic_requests:', payload);
                    if (payload.eventType === 'INSERT') {
                        setRequests(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
                    } else if (payload.eventType === 'DELETE') {
                        setRequests(prev => prev.filter(r => r.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // Handle Manual Test Toggle
    const handleToggleTest = (testName) => {
        setSelectedTests(prev =>
            prev.includes(testName)
                ? prev.filter(t => t !== testName)
                : [...prev, testName]
        );
    };

    // Handle Prescription Upload
    const handlePrescriptionChange = (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit.');
            return;
        }
        setPrescriptionFile(file);
        if (file.type.startsWith('image/')) {
            setPrescriptionPreview(URL.createObjectURL(file));
        } else {
            setPrescriptionPreview(null);
        }
    };

    // Handle Quick Book from Directory Card
    const handleSelectCenterAndBook = (centerObj) => {
        setSelectedCenterId(centerObj.id);
        setActiveTab('new-booking');
        toast.info(`Selected ${centerObj.name}. Choose your tests below.`);
    };

    // Initiate Booking -> Check if center accepts insurance
    const handleInitiateSubmission = (e) => {
        e.preventDefault();
        if (!patientName.trim() || !patientPhone.trim()) {
            toast.error('Please provide your full name and phone number.');
            return;
        }

        if (bookingMode === 'manual' && selectedTests.length === 0 && !customTestText.trim()) {
            toast.error('Please select at least one test or enter a custom test name.');
            return;
        }

        if (bookingMode === 'prescription' && !prescriptionFile) {
            toast.error('Please upload a prescription image or PDF document.');
            return;
        }

        const targetCenter = centers.find(c => c.id === selectedCenterId);
        const acceptsIns = targetCenter ? (targetCenter.accepts_insurance !== false) : true;

        if (!acceptsIns) {
            // Center does not accept insurance -> Bypass insurance modal, submit directly as self-pay
            executeSubmission(false);
            return;
        }

        setIsInsuranceModalOpen(true);
    };

    // Finalize Request Submission
    const handleFinalSubmit = async () => {
        if (hasInsurance && !insuranceFile) {
            toast.error('Please upload your insurance policy document.');
            return;
        }
        await executeSubmission(hasInsurance);
    };

    const executeSubmission = async (insuranceFlag) => {
        setIsSubmitting(true);
        try {
            let pUrl = null;
            let iUrl = null;
            let idUrl = null;

            if (bookingMode === 'prescription' && prescriptionFile) {
                pUrl = await uploadDiagnosticFile(prescriptionFile, 'prescriptions', user?.id || 'guest');
            }

            if (insuranceFlag && insuranceFile) {
                iUrl = await uploadDiagnosticFile(insuranceFile, 'insurance', user?.id || 'guest');
            }

            if (insuranceFlag && identityCardFile) {
                idUrl = await uploadDiagnosticFile(identityCardFile, 'id_cards', user?.id || 'guest');
            }

            const targetCenter = centers.find(c => c.id === selectedCenterId);
            const centerName = targetCenter ? targetCenter.name : 'Any Nearby Center';

            const isUuid = (val) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
            const validCenterId = isUuid(selectedCenterId) ? selectedCenterId : null;
            const validPatientId = isUuid(user?.id) ? user.id : null;

            const payload = {
                patient_id: validPatientId,
                patient_name: patientName.trim(),
                patient_phone: patientPhone.trim(),
                patient_email: patientEmail.trim(),
                diagnostic_center_id: validCenterId,
                diagnostic_center_name: centerName,
                selection_mode: bookingMode,
                selected_tests: selectedTests,
                custom_tests: customTestText.trim() || null,
                prescription_url: pUrl,
                has_insurance: insuranceFlag,
                insurance_policy_url: iUrl,
                identity_card_url: idUrl,
                appointment_date: preferredDate,
                time_slot: preferredSlot,
                status: 'pending_quote',
                payment_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('diagnostic_requests')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            toast.success('Diagnostic request submitted successfully!');
            setIsInsuranceModalOpen(false);

            // Reset form
            setSelectedTests([]);
            setCustomTestText('');
            setPrescriptionFile(null);
            setPrescriptionPreview(null);
            setInsuranceFile(null);
            setIdentityCardFile(null);
            setHasInsurance(false);

            // Switch to tracker tab
            setActiveTab('tracker');
            fetchRequests();
        } catch (err) {
            console.error('Error submitting diagnostic request:', err);
            toast.error(err.message || 'Failed to submit diagnostic request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Payment Submission
    const handlePayNow = async (e) => {
        e.preventDefault();
        if (!payingRequest) return;

        setIsProcessingPayment(true);
        try {
            const randCode = Math.floor(10000 + Math.random() * 90000);
            const tokenNum = `UPC-DIAG-${randCode}`;

            const { data, error } = await supabase
                .from('diagnostic_requests')
                .update({
                    status: 'paid',
                    payment_status: 'paid',
                    token_number: tokenNum,
                    paid_at: new Date().toISOString()
                })
                .eq('id', payingRequest.id)
                .select()
                .single();

            if (error) throw error;

            toast.success(`Payment of ₹${payingRequest.price} successful! Token: ${tokenNum}`);
            setPayingRequest(null);
            setInvoiceRequest(data || { ...payingRequest, status: 'paid', token_number: tokenNum });
            fetchRequests();
        } catch (err) {
            console.error('Payment error:', err);
            toast.error('Payment processing failed. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const selectedCenterObj = centers.find(c => c.id === selectedCenterId);

    const filteredCenters = centers.filter(center => {
        const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            center.tests.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = activeCategory === 'All' ||
            center.tests.some(t => t.toLowerCase().includes(activeCategory.toLowerCase()));
        return matchesSearch && matchesCategory;
    });

    const pendingQuotesCount = requests.filter(r => r.status === 'quoted').length;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
            <Toaster position="top-right" richColors />

            {/* PAGE HEADER */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-teal-800/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black uppercase tracking-wider border border-teal-500/30">
                            <Sparkles size={14} /> Unified Diagnostic Hub
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                            Diagnostic Centers & Booking System
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                            Explore verified diagnostic centers, book lab tests, upload prescriptions, attach health insurance & ID cards, and track live price quotes.
                        </p>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Active Requests</p>
                            <p className="text-xl font-black text-teal-300">{requests.length}</p>
                        </div>
                        <div className="bg-teal-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-center shadow-lg shadow-teal-500/20">
                            <p className="text-xs text-slate-900 font-extrabold uppercase tracking-wider">Quotes Ready</p>
                            <p className="text-xl font-black">{pendingQuotesCount}</p>
                        </div>
                    </div>
                </div>

                {/* UNIFIED NAVIGATION TABS */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'browse'
                                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-105'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                    >
                        <Building2 size={16} /> Browse Diagnostic Centers ({centers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('new-booking')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'new-booking'
                                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-105'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                    >
                        <FlaskConical size={16} /> Book a Test
                    </button>
                    <button
                        onClick={() => setActiveTab('tracker')}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 relative ${
                            activeTab === 'tracker'
                                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-105'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                    >
                        <Clock size={16} /> My Bookings & Tracker
                        {pendingQuotesCount > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
                        )}
                    </button>
                </div>
            </div>

            {/* TAB 1: BROWSE DIAGNOSTIC CENTERS DIRECTORY */}
            {activeTab === 'browse' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search diagnostic centers or lab tests..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                                        activeCategory === cat
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingCenters ? (
                        <div className="py-20 text-center space-y-3">
                            <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-500">Loading verified diagnostic centers...</p>
                        </div>
                    ) : filteredCenters.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                            <Building2 size={48} className="text-slate-300 mx-auto" />
                            <h3 className="text-lg font-black text-slate-800">No Diagnostic Centers Found</h3>
                            <p className="text-xs text-slate-500">Try adjusting your search query or category filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCenters.map(center => (
                                <motion.div
                                    key={center.id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                {center.logo ? (
                                                    <img src={center.logo} alt={center.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FlaskConical className="w-7 h-7 text-teal-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{center.name}</h3>
                                                    <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                                                    <MapPin size={12} className="text-emerald-500 shrink-0" /> {center.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {center.accepts_insurance !== false ? (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                                                    <ShieldCheck size={14} className="text-emerald-600" /> Accepts Health Insurance & Self-Pay
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                                                    <ShieldAlert size={14} className="text-amber-600" /> Self-Pay Only (No Insurance)
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Test Catalogue</p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {center.tests.map(testName => (
                                                    <span
                                                        key={testName}
                                                        onClick={() => {
                                                            setSelectedCenterId(center.id);
                                                            setSelectedTests([testName]);
                                                            setActiveTab('new-booking');
                                                            toast.info(`Selected ${testName} at ${center.name}`);
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                                                    >
                                                        {testName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                            <Clock size={14} /> 60-Min Home Collection
                                        </div>
                                        <button
                                            onClick={() => handleSelectCenterAndBook(center)}
                                            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md inline-flex items-center gap-1.5"
                                        >
                                            <FlaskConical size={14} /> Book at this Center
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB 2: BOOK A DIAGNOSTIC TEST FORM */}
            {activeTab === 'new-booking' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <form onSubmit={handleInitiateSubmission} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Step 1: Select Diagnostic Center */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Building2 className="text-teal-600" size={20} /> 1. Select Diagnostic Center
                                </h3>

                                {loadingCenters ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">Loading centers...</div>
                                ) : (
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Any Nearby Partner Center (Open Quote)</option>
                                        {centers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.location || 'Partner Center'}) {c.accepts_insurance === false ? ' [Self-Pay Only]' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {selectedCenterObj && (
                                    <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-center justify-between text-xs">
                                        <div className="space-y-0.5">
                                            <p className="font-extrabold text-teal-900">{selectedCenterObj.name}</p>
                                            <p className="text-slate-500">{selectedCenterObj.location}</p>
                                        </div>
                                        {selectedCenterObj.accepts_insurance !== false ? (
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg">Accepts Insurance</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-lg">Self-Pay Only</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Choose Test Input Mode */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <FlaskConical className="text-teal-600" size={20} /> 2. Select Diagnostic Tests
                                    </h3>

                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setBookingMode('manual')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                bookingMode === 'manual'
                                                    ? 'bg-white text-teal-800 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Manual Selection
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBookingMode('prescription')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                bookingMode === 'prescription'
                                                    ? 'bg-white text-teal-800 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Upload Prescription
                                        </button>
                                    </div>
                                </div>

                                {bookingMode === 'manual' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search lab tests (e.g. CBC, Thyroid, HbA1c...)"
                                                value={testSearch}
                                                onChange={(e) => setTestSearch(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
                                            {COMMON_LAB_TESTS
                                                .filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.category.toLowerCase().includes(testSearch.toLowerCase()))
                                                .map((test) => {
                                                    const isSelected = selectedTests.includes(test.name);
                                                    return (
                                                        <div
                                                            key={test.id}
                                                            onClick={() => handleToggleTest(test.name)}
                                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                                isSelected
                                                                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 shadow-sm'
                                                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                                                            }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                                                isSelected ? 'bg-teal-600 text-white' : 'border border-slate-300 bg-white'
                                                            }`}>
                                                                {isSelected && <CheckCircle size={14} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-extrabold">{test.name}</p>
                                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{test.category}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        {selectedTests.length > 0 && (
                                            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
                                                <p className="text-xs font-bold text-teal-800 mb-2">Selected Tests ({selectedTests.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedTests.map(test => (
                                                        <span key={test} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-teal-700 border border-teal-200 text-xs font-bold shadow-xs">
                                                            {test}
                                                            <button type="button" onClick={() => handleToggleTest(test)} className="text-teal-400 hover:text-teal-800">
                                                                <X size={14} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <label className="text-xs font-extrabold text-slate-700">Custom / Unlisted Tests</label>
                                            <textarea
                                                rows={2}
                                                value={customTestText}
                                                onChange={(e) => setCustomTestText(e.target.value)}
                                                placeholder="Can't find your test? Type specific tests or clinical instructions here..."
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {bookingMode === 'prescription' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/30 rounded-3xl p-8 text-center transition-all cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, application/pdf"
                                                onChange={(e) => handlePrescriptionChange(e.target.files?.[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <UploadCloud size={28} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">Click to upload or drag & drop prescription</p>
                                                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, or PDF up to 10MB</p>
                                            </div>
                                        </div>

                                        {prescriptionFile && (
                                            <div className="p-4 bg-white border border-teal-200 rounded-2xl flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{prescriptionFile.name}</p>
                                                        <p className="text-[10px] text-slate-400">{(prescriptionFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setPrescriptionFile(null); setPrescriptionPreview(null); }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}

                                        {prescriptionPreview && (
                                            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100 flex items-center justify-center">
                                                <img src={prescriptionPreview} alt="Prescription Preview" className="max-h-48 object-contain" />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Preferred Date & Patient Details */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 sticky top-6">
                                <h3 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                                    <Clock className="text-teal-600" size={20} /> 3. Preferred Date & Details
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-extrabold text-slate-700">Select Preferred Date</label>
                                        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                                            {preferredDate ? new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Select Date'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + i);
                                            const dateStr = d.toISOString().split('T')[0];
                                            const isSelected = preferredDate === dateStr;
                                            return (
                                                <button
                                                    key={dateStr}
                                                    type="button"
                                                    onClick={() => setPreferredDate(dateStr)}
                                                    className={`flex-1 min-w-[58px] p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-teal-500 bg-teal-600 text-white shadow-md scale-105'
                                                            : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <p className="text-[9px] font-extrabold uppercase opacity-80">
                                                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </p>
                                                    <p className="text-base font-black leading-tight">{d.getDate()}</p>
                                                    <p className="text-[9px] font-bold opacity-90">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={preferredDate}
                                        onChange={(e) => setPreferredDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                                        <Clock size={14} className="text-teal-600" /> Preferred Time Slot
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setPreferredSlot(slot)}
                                                className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                    preferredSlot === slot
                                                        ? 'border-teal-500 bg-teal-50 text-teal-800 font-extrabold'
                                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-3 border-t border-slate-100">
                                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Patient Contact Details</h4>
                                    <div>
                                        <label className="text-xs font-extrabold text-slate-600 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={patientName}
                                            onChange={(e) => setPatientName(e.target.value)}
                                            placeholder="Patient Full Name"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-extrabold text-slate-600 ml-1">Contact Phone</label>
                                        <input
                                            type="tel"
                                            required
                                            value={patientPhone}
                                            onChange={(e) => setPatientPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-extrabold text-slate-600 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={patientEmail}
                                            onChange={(e) => setPatientEmail(e.target.value)}
                                            placeholder="patient@example.com"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Proceed to Request Quote
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <p className="text-[11px] text-center text-slate-400 font-medium">
                                        ⚡ No payment required now. Quote will be sent directly by Diagnostic Center.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* INSURANCE & IDENTITY CHECK MODAL */}
                    <AnimatePresence>
                        {isInsuranceModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsInsuranceModalOpen(false)}
                                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 p-6 sm:p-8 overflow-hidden border border-slate-100"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900 text-center">Health Insurance Check</h3>
                                    <p className="text-sm text-slate-500 text-center mt-1 mb-6">
                                        Do you have valid health insurance coverage for this diagnostic test?
                                    </p>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setHasInsurance(true)}
                                                className={`py-3.5 rounded-2xl font-extrabold text-sm border-2 transition-all ${
                                                    hasInsurance
                                                        ? 'border-teal-500 bg-teal-50 text-teal-800'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                YES (I Have Insurance)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setHasInsurance(false); setInsuranceFile(null); setIdentityCardFile(null); }}
                                                className={`py-3.5 rounded-2xl font-extrabold text-sm border-2 transition-all ${
                                                    !hasInsurance
                                                        ? 'border-teal-500 bg-teal-50 text-teal-800'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                NO (Self-Pay)
                                            </button>
                                        </div>

                                        {hasInsurance && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-slate-100">
                                                <div>
                                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">1. Health Insurance Policy Card (PDF/Image)</label>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf, image/png, image/jpeg"
                                                        onChange={(e) => setInsuranceFile(e.target.files?.[0])}
                                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                                                    />
                                                    {insuranceFile && (
                                                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                                            <FileCheck size={14} /> Insurance Attached: {insuranceFile.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">2. Identity Card (Aadhaar / Govt Photo ID Card)</label>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf, image/png, image/jpeg"
                                                        onChange={(e) => setIdentityCardFile(e.target.files?.[0])}
                                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                    />
                                                    {identityCardFile && (
                                                        <p className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1">
                                                            <FileCheck size={14} /> Identity Card Attached: {identityCardFile.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setIsInsuranceModalOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleFinalSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                                            >
                                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Confirm & Send'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* TAB 3: REQUEST TRACKER & PAYMENT */}
            {activeTab === 'tracker' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">Your Diagnostic Request Tracker</h2>
                            <p className="text-xs text-slate-500 mt-1">Live status tracking for test quotes, payments, and generated tokens.</p>
                        </div>
                        <button
                            onClick={fetchRequests}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={14} className={loadingRequests ? 'animate-spin' : ''} /> Refresh Status
                        </button>
                    </div>

                    {loadingRequests ? (
                        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
                            <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-500">Loading your test requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                            <FlaskConical size={48} className="text-slate-300 mx-auto" />
                            <h3 className="text-lg font-black text-slate-800">No Booking Requests Found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                You haven't requested any diagnostic test quotes yet.
                            </p>
                            <button
                                onClick={() => setActiveTab('new-booking')}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2"
                            >
                                <FlaskConical size={16} /> Book Your First Test
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {requests.map((req) => {
                                const isQuoted = req.status === 'quoted';
                                const isPaid = req.status === 'paid' || req.status === 'token_issued';

                                return (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">
                                                        {req.diagnostic_center_name || 'Diagnostic Center'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-semibold">
                                                        #{req.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Submitted on {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>

                                            <div>
                                                {req.status === 'pending_quote' && (
                                                    <span className="px-4 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                                                        <Clock size={14} className="animate-spin text-amber-600" /> Waiting for Quote
                                                    </span>
                                                )}
                                                {isQuoted && (
                                                    <span className="px-4 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 animate-bounce">
                                                        <DollarSign size={14} className="text-teal-600" /> Quote Ready: ₹{req.price}
                                                    </span>
                                                )}
                                                {isPaid && (
                                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                                                        <CheckCircle2 size={14} className="text-emerald-600" /> Token Issued ({req.token_number})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 py-2">
                                            {[
                                                { label: 'Pending Quote', active: true },
                                                { label: 'Quote Received', active: isQuoted || isPaid },
                                                { label: 'Payment Done', active: isPaid },
                                                { label: 'Token Issued', active: isPaid }
                                            ].map((step, idx) => (
                                                <div key={idx} className="space-y-1.5 text-center">
                                                    <div className={`h-2 rounded-full transition-colors ${
                                                        step.active ? 'bg-teal-500' : 'bg-slate-100'
                                                    }`} />
                                                    <p className={`text-[10px] font-bold ${
                                                        step.active ? 'text-teal-800' : 'text-slate-400'
                                                    }`}>{step.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                                            <div className="space-y-1">
                                                <p className="font-extrabold text-slate-800">
                                                    {req.selection_mode === 'manual' ? (
                                                        <span>Selected Tests: {Array.isArray(req.selected_tests) ? req.selected_tests.join(', ') : 'Manual Test'}</span>
                                                    ) : (
                                                        <span>Prescription Document Booking</span>
                                                    )}
                                                </p>
                                                {req.custom_tests && (
                                                    <p className="text-slate-500 italic">Notes: {req.custom_tests}</p>
                                                )}
                                                {req.appointment_date && (
                                                    <p className="text-teal-800 font-bold">
                                                        Scheduled: {req.appointment_date} at {req.time_slot}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                {isQuoted && (
                                                    <button
                                                        onClick={() => setPayingRequest(req)}
                                                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                                                    >
                                                        <CreditCard size={14} /> Pay ₹{req.price} Now
                                                    </button>
                                                )}

                                                {isPaid && (
                                                    <button
                                                        onClick={() => setInvoiceRequest(req)}
                                                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                                                    >
                                                        <Printer size={14} /> Download Token Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* PAYMENT MODAL */}
            <AnimatePresence>
                {payingRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayingRequest(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Complete Payment</h3>
                                    <p className="text-xs text-slate-500">{payingRequest.diagnostic_center_name}</p>
                                </div>
                                <button onClick={() => setPayingRequest(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-teal-800">Total Quoted Amount</p>
                                    <p className="text-2xl font-black text-teal-950">₹{payingRequest.price}</p>
                                </div>
                                <span className="px-3 py-1 bg-white text-teal-800 text-xs font-bold rounded-xl border border-teal-200">
                                    {payingRequest.appointment_date}
                                </span>
                            </div>

                            <form onSubmit={handlePayNow} className="space-y-4">
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                    <button type="button" onClick={() => setPaymentMethod('upi')} className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${paymentMethod === 'upi' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                                        UPI / QR Code
                                    </button>
                                    <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${paymentMethod === 'card' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                                        Debit / Credit Card
                                    </button>
                                </div>

                                {paymentMethod === 'upi' ? (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-700 block">Enter UPI ID</label>
                                        <input type="text" required placeholder="mobile@upi or user@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Card Number</label>
                                            <input type="text" required placeholder="4532 0154 9821 3491" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                                                <input type="text" required placeholder="12/28" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">CVV</label>
                                                <input type="password" required maxLength={4} placeholder="123" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={isProcessingPayment} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    {isProcessingPayment ? <><Loader2 size={16} className="animate-spin" /> Processing Payment...</> : `Confirm Payment of ₹${payingRequest.price}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINTABLE INVOICE & TOKEN SLIP MODAL */}
            <AnimatePresence>
                {invoiceRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInvoiceRequest(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Diagnostic Token & Invoice Receipt</h3>
                                        <p className="text-xs text-slate-500">Upchaar Health Official Receipt</p>
                                    </div>
                                </div>
                                <button onClick={() => setInvoiceRequest(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl text-center space-y-2 border border-teal-700">
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-widest">Diagnostic Booking Token Number</p>
                                <h2 className="text-3xl font-black text-white tracking-wider">{invoiceRequest.token_number || 'UPC-DIAG-TOKEN'}</h2>
                                <p className="text-xs text-slate-300">Show this token at center counter on arrival</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                                <div className="flex justify-between py-1 border-b border-slate-200">
                                    <span className="text-slate-500 font-bold">Patient Name:</span>
                                    <span className="font-extrabold text-slate-800">{invoiceRequest.patient_name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200">
                                    <span className="text-slate-500 font-bold">Diagnostic Center:</span>
                                    <span className="font-extrabold text-slate-800">{invoiceRequest.diagnostic_center_name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200">
                                    <span className="text-slate-500 font-bold">Appointment Date:</span>
                                    <span className="font-extrabold text-slate-800">{invoiceRequest.appointment_date} ({invoiceRequest.time_slot})</span>
                                </div>
                                <div className="flex justify-between py-1 pt-2 text-sm">
                                    <span className="text-slate-700 font-black">Amount Paid:</span>
                                    <span className="font-black text-teal-700">₹{invoiceRequest.price} (PAID)</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => window.print()} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
                                    <Printer size={16} /> Print Receipt
                                </button>
                                <button onClick={() => setInvoiceRequest(null)} className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
