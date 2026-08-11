import { useAuth } from '@/auth/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';
import { SignOutModal } from '@/components/landing/SignOutModal';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Clock, DollarSign, Users, LogOut, CheckCircle, XCircle,
    Search, Edit, LayoutDashboard, TestTubes, FileText, Settings,
    ChevronLeft, ChevronRight, Menu, Plus, X, Filter, Trash2,
    Camera, Loader2, User, Phone, MapPin, Globe, Save, ShieldCheck,
    Upload, Download, Eye, ExternalLink, RefreshCw, Sparkles, Inbox, Calendar,
    FileCheck, IndianRupee, ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { uploadAvatar, uploadDiagnosticFile, getStorageUrl } from '@/lib/uploadImage.js';
import { toast, Toaster } from 'sonner';
import ProviderPendingPage from '@/components/ProviderPendingPage.jsx';

export default function DiagnosticDashboard() {
    const { profile, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileRef = useRef(null);

    // Tests Catalogue State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [testToDelete, setTestToDelete] = useState(null);
    const [newTest, setNewTest] = useState({
        name: '',
        price: '',
        category: 'Blood Test',
        description: '',
        status: 'Active'
    });

    // Profile & Settings State
    const [profileData, setProfileData] = useState({
        full_name: '',
        phone: '',
        bio: '',
        address: '',
        avatar_url: ''
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Center Approval Record & Insurance Setting
    const [diagnosticRecord, setDiagnosticRecord] = useState(null);
    const [diagnosticStatusLoading, setDiagnosticStatusLoading] = useState(true);
    const [dcId, setDcId] = useState(null);
    const [tests, setTests] = useState([]);
    const [testsLoading, setTestsLoading] = useState(true);
    const [acceptsInsurance, setAcceptsInsurance] = useState(true);

    // Incoming Requests State
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [requestFilter, setRequestFilter] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [quoteSlot, setQuoteSlot] = useState('09:00 AM');
    const [isSendingQuote, setIsSendingQuote] = useState(false);

    // Patient History Modal
    const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
    const [patientSearch, setPatientSearch] = useState('');

    // Reports Upload State
    const [reportingRequest, setReportingRequest] = useState(null);
    const [reportFile, setReportFile] = useState(null);
    const [isUploadingReport, setIsUploadingReport] = useState(false);

    useEffect(() => {
        if (profile) {
            setProfileData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                address: profile.address || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    const profileId = profile?.id;

    useEffect(() => {
        if (!profileId) return;
        let mounted = true;

        const checkStatus = () => {
            supabase
                .from('diagnostic_centers')
                .select('id, status, metadata, accepts_insurance')
                .eq('profile_id', profileId)
                .maybeSingle()
                .then(({ data }) => {
                    if (mounted) {
                        setDiagnosticRecord(data);
                        setDiagnosticStatusLoading(false);
                    }
                })
                .catch(() => { if (mounted) setDiagnosticStatusLoading(false); });
        };

        checkStatus();

        // Subscribe to real-time status updates so admin approval immediately reflects
        const channel = supabase
            .channel(`dc-status-${profileId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'diagnostic_centers', filter: `profile_id=eq.${profileId}` },
                (payload) => {
                    if (mounted && payload.new) {
                        setDiagnosticRecord(prev => ({ ...prev, ...payload.new }));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` },
                () => {
                    if (mounted && refreshProfile) refreshProfile();
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [profileId, refreshProfile]);

    // Load tests from Supabase on mount
    const loadTests = async () => {
        if (!profile?.id) return;
        setTestsLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userId = authUser?.id || profile?.id;

            if (!userId) {
                setTestsLoading(false);
                return;
            }

            const { data: centers, error: fetchError } = await supabase
                .from('diagnostic_centers')
                .select('*')
                .eq('profile_id', userId);

            if (fetchError) {
                toast.error('Error loading catalogue: ' + fetchError.message);
                setTestsLoading(false);
                return;
            }

            let dc = centers?.find(c => Array.isArray(c.tests) && c.tests.length > 0) || (centers && centers.length > 0 ? centers[0] : null);

            if (!dc) {
                const { data: created } = await supabase
                    .from('diagnostic_centers')
                    .insert([{
                        profile_id: userId,
                        name: profile.full_name || 'Diagnostic Center',
                        email: profile.email || '',
                        status: 'Active',
                        accepts_insurance: true,
                        tests: [
                            { id: 1, name: 'Blood Test', category: 'Blood Test', price: '₹800', status: 'Active' },
                            { id: 2, name: 'LFT', category: 'Blood Test', price: '₹1600', status: 'Active' },
                            { id: 3, name: 'Lipid Profile Test', category: 'Blood Test', price: '₹2000', status: 'Active' }
                        ]
                    }])
                    .select()
                    .single();
                dc = created;
            }

            if (dc) {
                setDcId(dc.id);
                setAcceptsInsurance(dc.accepts_insurance ?? true);

                let rawTests = [];
                if (typeof dc.tests === 'string') {
                    try { rawTests = JSON.parse(dc.tests); } catch (e) { rawTests = []; }
                } else if (Array.isArray(dc.tests)) {
                    rawTests = dc.tests;
                }

                const parsed = rawTests.map((t, idx) => {
                    if (typeof t === 'string') {
                        const trimmed = t.trim();
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            try { return JSON.parse(trimmed); } catch (e) { return { id: idx + 1, name: t, price: '₹500', category: 'Blood Test', status: 'Active' }; }
                        }
                        return { id: idx + 1, name: t, price: '₹500', category: 'Blood Test', status: 'Active' };
                    }
                    return t;
                }).filter(Boolean);

                if (parsed.length === 0) {
                    const defaultCatalogue = [
                        { id: 1, name: 'Blood Test', category: 'Blood Test', price: '₹800', status: 'Active' },
                        { id: 2, name: 'LFT', category: 'Blood Test', price: '₹1600', status: 'Active' },
                        { id: 3, name: 'Lipid Profile Test', category: 'Blood Test', price: '₹2000', status: 'Active' }
                    ];
                    setTests(defaultCatalogue);
                    persistTests(defaultCatalogue, dc.id);
                } else {
                    setTests(parsed);
                }
            }
        } catch (err) {
            console.error('Error loading tests:', err);
        } finally {
            setTestsLoading(false);
        }
    };

    useEffect(() => {
        loadTests();
    }, [profileId]);

    // Load Incoming Diagnostic Requests for this Center
    const fetchRequests = async () => {
        if (!profileId) return;
        setLoadingRequests(true);
        try {
            const { data, error } = await supabase
                .from('diagnostic_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Filter requests matching this center's ID or Name, or open requests
                const centerRequests = data.filter(r =>
                    !r.diagnostic_center_id ||
                    r.diagnostic_center_id === dcId ||
                    r.diagnostic_center_id === profileId ||
                    r.diagnostic_center_name === profile?.full_name
                );
                setRequests(centerRequests);
            }
        } catch (err) {
            console.error('Error loading diagnostic requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('center-diagnostic-requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [profileId, dcId]);

    // Save/Persist tests array to `diagnostic_centers`
    const persistTests = async (updatedTests, targetId = dcId) => {
        setTests(updatedTests);
        if (!targetId) return;
        try {
            const { error } = await supabase
                .from('diagnostic_centers')
                .update({ tests: updatedTests })
                .eq('id', targetId);

            if (error) throw error;
            toast.success('Test catalogue updated!');
        } catch (err) {
            console.error('Error saving tests:', err);
            toast.error('Failed to update test catalogue.');
        }
    };

    // Toggle Insurance Acceptance
    const handleToggleInsurance = async (newValue) => {
        setAcceptsInsurance(newValue);
        if (!dcId) return;
        try {
            const { error } = await supabase
                .from('diagnostic_centers')
                .update({ accepts_insurance: newValue })
                .eq('id', dcId);
            if (error) throw error;
            toast.success(`Insurance Acceptance set to ${newValue ? 'YES' : 'NO'}`);
        } catch (err) {
            console.error('Error updating insurance setting:', err);
            toast.error('Failed to update setting.');
        }
    };

    // Toggle Test Active/Inactive status
    const handleToggleStatus = (id) => {
        const updated = tests.map(test =>
            test.id === id ? { ...test, status: test.status === 'Active' ? 'Inactive' : 'Active' } : test
        );
        persistTests(updated);
    };

    // Delete Test
    const handleDeleteTest = () => {
        if (testToDelete) {
            persistTests(tests.filter(t => t.id !== testToDelete.id));
            setTestToDelete(null);
        }
    };

    // Save New Test
    const handleSaveNewTest = () => {
        if (!newTest.name || !newTest.price) {
            toast.error('Please provide at least a Test Name and Price.');
            return;
        }

        const displayPrice = newTest.price.startsWith('₹') ? newTest.price : `₹${newTest.price}`;
        const newId = tests.length > 0 ? Math.max(...tests.map(t => Number(t.id) || 0)) + 1 : 1;
        const updated = [...tests, {
            id: newId,
            name: newTest.name,
            price: displayPrice,
            category: newTest.category,
            status: newTest.status,
            description: newTest.description || ''
        }];

        persistTests(updated);
        setNewTest({ name: '', price: '', category: 'Blood Test', description: '', status: 'Active' });
        setIsAddTestModalOpen(false);
    };

    // Send Price Quote to Patient
    const handleSendQuote = async (e) => {
        e.preventDefault();
        if (!selectedRequest || !quotePrice) {
            toast.error('Please enter a valid price quote.');
            return;
        }

        setIsSendingQuote(true);
        try {
            const numPrice = quotePrice.replace(/[^0-9.]/g, '');
            const { error } = await supabase
                .from('diagnostic_requests')
                .update({
                    price: numPrice,
                    status: 'quoted',
                    appointment_date: quoteDate,
                    time_slot: quoteSlot,
                    diagnostic_center_id: dcId || profile.id,
                    diagnostic_center_name: profile.full_name || 'Diagnostic Center',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedRequest.id);

            if (error) throw error;

            toast.success(`Quote of ₹${numPrice} sent to ${selectedRequest.patient_name}!`);
            setSelectedRequest(null);
            setQuotePrice('');
            fetchRequests();
        } catch (err) {
            console.error('Error sending quote:', err);
            toast.error('Failed to send quote. Please try again.');
        } finally {
            setIsSendingQuote(false);
        }
    };

    // Upload Patient Test Report Result
    const handleUploadReport = async (e) => {
        e.preventDefault();
        if (!reportingRequest || !reportFile) {
            toast.error('Please select a test report file (PDF or image).');
            return;
        }

        setIsUploadingReport(true);
        try {
            const reportUrl = await uploadDiagnosticFile(reportFile, 'reports', reportingRequest.patient_id || 'patient');
            const { error } = await supabase
                .from('diagnostic_requests')
                .update({
                    report_url: reportUrl,
                    status: 'report_ready',
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportingRequest.id);

            if (error) throw error;

            toast.success(`Test Report uploaded for ${reportingRequest.patient_name}!`);
            setReportingRequest(null);
            setReportFile(null);
            fetchRequests();
        } catch (err) {
            console.error('Error uploading report:', err);
            toast.error('Failed to upload report.');
        } finally {
            setIsUploadingReport(false);
        }
    };

    // Profile Save
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    bio: profileData.bio,
                    address: profileData.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (error) throw error;
            await refreshProfile();
            toast.success('Center profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error(err.message || 'Failed to update profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const url = await uploadAvatar(file, profile.id);
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', profile.id);

            if (error) throw error;
            setProfileData(prev => ({ ...prev, avatar_url: url }));
            await refreshProfile();
            toast.success('Logo picture updated!');
        } catch (err) {
            console.error('Error uploading avatar:', err);
            toast.error('Failed to upload logo.');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // Calculate Dynamic Overview Stats
    const pendingQuotesCount = requests.filter(r => r.status === 'pending_quote').length;
    const activeQuotesCount = requests.filter(r => r.status === 'quoted').length;
    const paidBookingsCount = requests.filter(r => r.status === 'paid' || r.status === 'token_issued' || r.status === 'report_ready').length;
    const totalRevenueSum = requests
        .filter(r => r.status === 'paid' || r.status === 'token_issued' || r.status === 'report_ready')
        .reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    const stats = [
        { title: "Pending Quotes", value: pendingQuotesCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
        { title: "Active Quotes", value: activeQuotesCount, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Paid Bookings", value: paidBookingsCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Total Revenue", value: `₹${totalRevenueSum.toLocaleString('en-IN')}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-100" }
    ];

    const filteredTests = tests.filter(test => {
        const matchesCategory = filterCategory === 'All' || test.category === filterCategory;
        const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Unique Patients List for Patients Tab
    const uniquePatients = useMemo(() => {
        const map = {};
        requests.forEach(r => {
            const key = r.patient_phone || r.patient_name;
            if (!map[key]) {
                map[key] = {
                    id: r.patient_id || key,
                    name: r.patient_name || 'Patient',
                    phone: r.patient_phone || 'N/A',
                    email: r.patient_email || 'N/A',
                    requestsCount: 0,
                    totalSpent: 0,
                    hasInsurance: r.has_insurance,
                    lastDate: r.created_at,
                    requests: []
                };
            }
            map[key].requestsCount += 1;
            if (r.status === 'paid' || r.status === 'token_issued' || r.status === 'report_ready') {
                map[key].totalSpent += (Number(r.price) || 0);
            }
            map[key].requests.push(r);
        });
        return Object.values(map).filter(p =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.phone.includes(patientSearch)
        );
    }, [requests, patientSearch]);

    // Show loading spinner while diagnostic status loads
    if (diagnosticStatusLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <Loader2 size={40} className="animate-spin text-teal-600" />
            </div>
        );
    }

    // Block if status is pending/rejected
    const statusRaw = diagnosticRecord?.status || profile?.status || 'Pending';
    const statusLower = statusRaw.toLowerCase();
    const isApproved = statusLower === 'active' || statusLower === 'approved';

    if (!isApproved && (statusLower === 'pending' || statusLower === 'rejected' || statusLower === 'suspended')) {
        const pendingProfile = { ...profile, status: statusRaw, metadata: diagnosticRecord?.metadata };
        return <ProviderPendingPage profile={pendingProfile} />;
    }

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Incoming Requests', icon: Clock },
        { name: 'Available Tests', icon: TestTubes },
        { name: 'Patients', icon: Users },
        { name: 'Reports', icon: FileText },
        { name: 'Settings', icon: Settings }
    ];



    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            <Toaster position="top-right" richColors />

            {/* SIDEBAR (Matching Exact Design from Screenshot) */}
            <motion.div
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="bg-white border-r border-slate-200 h-full flex flex-col shadow-sm relative z-20 flex-shrink-0 transition-all duration-300"
            >
                {/* Logo Header */}
                <div className="h-20 flex items-center px-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 min-w-[40px] rounded-full border border-emerald-200 flex items-center justify-center p-1 bg-white overflow-hidden shadow-xs"
                        >
                            <img src="/logo.png" alt="Upchar Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-baseline gap-1 select-none"
                                >
                                    <span className="text-xl font-black text-[#0d9488] tracking-tighter">Upchar</span>
                                    <span className="text-xl font-black text-[#dc2626] tracking-tighter">Health</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar Collapse Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200 shadow-sm z-30 transition-colors"
                >
                    {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Navigation Links */}
                <div className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group text-sm font-bold ${
                                activeTab === item.name
                                    ? 'bg-teal-50 text-teal-800 shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                            title={!isSidebarOpen ? item.name : ''}
                        >
                            <item.icon
                                size={18}
                                className={`min-w-[18px] transition-colors ${activeTab === item.name ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                            />
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap flex-1 text-left"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Badge for Pending Requests */}
                            {item.name === 'Incoming Requests' && pendingQuotesCount > 0 && isSidebarOpen && (
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                                    {pendingQuotesCount}
                                </span>
                            )}

                            {activeTab === item.name && isSidebarOpen && (
                                <motion.div layoutId="sidebar-active-dot" className="w-1.5 h-1.5 rounded-full bg-teal-600 ml-auto" />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Topbar Header */}
                <div className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-xs flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">{activeTab}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center border-2 border-teal-400 text-white font-extrabold text-sm shadow-sm hover:scale-105 transition-all overflow-hidden focus:outline-none"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span>{profile?.full_name?.charAt(0) || 'K'}</span>
                            )}
                        </button>

                        {/* Profile Dropdown */}
                        <AnimatePresence>
                            {isProfileDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 top-14 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                                >
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || 'Diagnostic Center'}</p>
                                        <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => { setActiveTab('Settings'); setIsProfileDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <Settings size={16} /> Center Settings
                                    </button>
                                    <button
                                        onClick={() => { setIsProfileDropdownOpen(false); setIsSignOutModalOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* SCROLLABLE VIEW CONTAINER */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 w-full">
                    <div className="max-w-7xl mx-auto w-full space-y-8">

                        {/* 1. DASHBOARD OVERVIEW TAB (Exact Match to Screenshot) */}
                        {activeTab === 'Dashboard' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900">Overview</h3>
                                    <p className="text-xs text-slate-500 font-semibold">Your diagnostic center activity at a glance.</p>
                                </div>

                                {/* 4 Stat Cards Matching Screenshot */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={22} />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 mb-1">{stat.value}</h3>
                                                <p className="text-xs font-bold text-slate-500">{stat.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Insurance Policy Setting Banner Card */}
                                <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black uppercase tracking-wider border border-teal-500/30 inline-flex items-center gap-1.5">
                                            <ShieldCheck size={14} /> Insurance Acceptance Feature
                                        </span>
                                        <h3 className="text-xl font-black text-white pt-1">Do you accept health insurance for test bookings?</h3>
                                        <p className="text-xs text-slate-300 max-w-xl">
                                            When set to YES, patients booking tests at your center can upload their Health Insurance Policy Card & Identity Card (Aadhaar/Govt ID).
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleInsurance(true)}
                                            className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 border-2 ${
                                                acceptsInsurance
                                                    ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                                                    : 'border-white/20 bg-white/10 text-slate-300 hover:bg-white/20'
                                            }`}
                                        >
                                            <CheckCircle size={16} /> YES (Accept Insurance)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleInsurance(false)}
                                            className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 border-2 ${
                                                !acceptsInsurance
                                                    ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                                                    : 'border-white/20 bg-white/10 text-slate-300 hover:bg-white/20'
                                            }`}
                                        >
                                            <XCircle size={16} /> NO (Self-Pay Only)
                                        </button>
                                    </div>
                                </div>

                                {/* Available Tests Table Section */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900">Available Tests</h2>
                                            <p className="text-xs text-slate-500 font-semibold">Manage and view your diagnostic test catalogue</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <select
                                                    value={filterCategory}
                                                    onChange={(e) => setFilterCategory(e.target.value)}
                                                    className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                                                >
                                                    <option value="All">All Categories</option>
                                                    <option value="Blood Test">Blood Test</option>
                                                    <option value="Radiology">Radiology</option>
                                                    <option value="Pathology">Pathology</option>
                                                    <option value="Imaging">Imaging</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Search tests..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setIsAddTestModalOpen(true)}
                                                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                <Plus size={16} /> Add Test
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table Matching Screenshot */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/70 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <th className="px-6 py-4">Test Name</th>
                                                    <th className="px-6 py-4">Category</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                                {testsLoading ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                            <Loader2 size={24} className="animate-spin text-teal-600 mx-auto" />
                                                        </td>
                                                    </tr>
                                                ) : filteredTests.map((test) => (
                                                    <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-6 py-4 font-black text-slate-900">{test.name}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold">
                                                                {test.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-extrabold text-slate-900">{test.price}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                                                                test.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                <CheckCircle size={12} /> {test.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                                                                    <span className="text-[11px] text-slate-400 font-bold">
                                                                        {test.status === 'Active' ? 'On' : 'Off'}
                                                                    </span>
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="sr-only peer"
                                                                            checked={test.status === 'Active'}
                                                                            onChange={() => handleToggleStatus(test.id)}
                                                                        />
                                                                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                                                                    </label>
                                                                </div>
                                                                <button onClick={() => setEditingTest(test)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button onClick={() => setTestToDelete(test)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 2. INCOMING REQUESTS TAB */}
                        {activeTab === 'Incoming Requests' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Incoming Test Booking Requests</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Review patient test bookings, inspect uploaded documents, and send price quotes.</p>
                                    </div>

                                    {/* Request Filter Tabs */}
                                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                                        {['All', 'Pending Quote', 'Quoted', 'Paid & Confirmed'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setRequestFilter(tab)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                                                    requestFilter === tab
                                                        ? 'bg-white text-teal-800 shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Requests List */}
                                {loadingRequests ? (
                                    <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
                                        <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
                                    </div>
                                ) : requests.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                                        <Clock size={40} className="text-slate-300 mx-auto" />
                                        <h4 className="text-base font-black text-slate-800">No Incoming Requests</h4>
                                        <p className="text-xs text-slate-400">Incoming patient test bookings will appear here in real-time.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {requests
                                            .filter(r => {
                                                if (requestFilter === 'Pending Quote') return r.status === 'pending_quote';
                                                if (requestFilter === 'Quoted') return r.status === 'quoted';
                                                if (requestFilter === 'Paid & Confirmed') return r.status === 'paid' || r.status === 'token_issued' || r.status === 'report_ready';
                                                return true;
                                            })
                                            .map(req => (
                                                <div key={req.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-extrabold text-slate-900 text-base">{req.patient_name}</h4>
                                                            <p className="text-xs text-slate-400 font-medium">{req.patient_phone} · {req.patient_email || 'No email'}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                                            req.status === 'pending_quote' ? 'bg-amber-100 text-amber-800' :
                                                            req.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {req.status === 'pending_quote' ? 'Pending Quote' : req.status === 'quoted' ? `Quoted ₹${req.price}` : 'Paid / Confirmed'}
                                                        </span>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                                                        <p className="font-extrabold text-slate-800">
                                                            {req.selection_mode === 'manual' ? `Tests: ${Array.isArray(req.selected_tests) ? req.selected_tests.join(', ') : 'Manual Test'}` : 'Prescription Upload Booking'}
                                                        </p>
                                                        {req.custom_tests && <p className="text-slate-500 italic">Notes: {req.custom_tests}</p>}
                                                        {req.appointment_date && <p className="text-teal-800 font-bold">Scheduled: {req.appointment_date} ({req.time_slot})</p>}
                                                    </div>

                                                    {/* Document Attachments Badge List */}
                                                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                                                        {req.prescription_url && (
                                                            <a href={req.prescription_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 inline-flex items-center gap-1 hover:bg-blue-100">
                                                                <FileText size={14} /> Prescription PDF
                                                            </a>
                                                        )}
                                                        {req.insurance_policy_url && (
                                                            <a href={req.insurance_policy_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 inline-flex items-center gap-1 hover:bg-emerald-100">
                                                                <ShieldCheck size={14} /> Insurance Card
                                                            </a>
                                                        )}
                                                        {req.identity_card_url && (
                                                            <a href={req.identity_card_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 inline-flex items-center gap-1 hover:bg-purple-100">
                                                                <User size={14} /> Identity Card (Aadhaar/ID)
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="pt-2 flex justify-end">
                                                        {req.status === 'pending_quote' ? (
                                                            <button
                                                                onClick={() => { setSelectedRequest(req); setQuotePrice(''); }}
                                                                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                                                            >
                                                                <DollarSign size={14} /> Review & Send Quote
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setSelectedRequest(req); setQuotePrice(req.price || ''); }}
                                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                                            >
                                                                View Details
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* 3. AVAILABLE TESTS CATALOGUE TAB */}
                        {activeTab === 'Available Tests' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900">Diagnostic Test Catalogue</h2>
                                            <p className="text-xs text-slate-500 font-semibold">Full list of tests available for patient booking</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <select
                                                    value={filterCategory}
                                                    onChange={(e) => setFilterCategory(e.target.value)}
                                                    className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                                                >
                                                    <option value="All">All Categories</option>
                                                    <option value="Blood Test">Blood Test</option>
                                                    <option value="Radiology">Radiology</option>
                                                    <option value="Pathology">Pathology</option>
                                                    <option value="Imaging">Imaging</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Search tests..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setIsAddTestModalOpen(true)}
                                                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                <Plus size={16} /> Add Test
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <th className="px-6 py-4">Test Name</th>
                                                    <th className="px-6 py-4">Category</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                                {filteredTests.map((test) => (
                                                    <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-black text-slate-900">{test.name}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold">
                                                                {test.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-extrabold text-slate-900">{test.price}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                                                                test.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                <CheckCircle size={12} /> {test.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button onClick={() => setEditingTest(test)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button onClick={() => setTestToDelete(test)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. PATIENTS TAB */}
                        {activeTab === 'Patients' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Patient Directory & History</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Patients who have booked diagnostic tests at your center.</p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search patient by name or phone..."
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                {uniquePatients.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                                        <Users size={40} className="text-slate-300 mx-auto" />
                                        <h4 className="text-base font-black text-slate-800">No Patients Found</h4>
                                        <p className="text-xs text-slate-400">Patients booking tests will be recorded here.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {uniquePatients.map((pt, idx) => (
                                            <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-lg shrink-0">
                                                        {pt.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 text-base">{pt.name}</h4>
                                                        <p className="text-xs text-slate-400 font-medium">{pt.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Test Bookings</p>
                                                        <p className="text-base font-black text-slate-900">{pt.requestsCount}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</p>
                                                        <p className="text-base font-black text-teal-700">₹{pt.totalSpent}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedPatientHistory(pt)}
                                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Eye size={14} /> View Booking History
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* 5. REPORTS TAB */}
                        {activeTab === 'Reports' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Diagnostic Reports & Results</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Upload completed test report files (PDF) for patients to download.</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                <th className="px-6 py-4">Patient</th>
                                                <th className="px-6 py-4">Test Name</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Report File</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                                            {requests
                                                .filter(r => r.status === 'paid' || r.status === 'token_issued' || r.status === 'report_ready')
                                                .map(req => (
                                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="font-extrabold text-slate-900">{req.patient_name}</p>
                                                            <p className="text-[10px] text-slate-400">{req.patient_phone}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {Array.isArray(req.selected_tests) ? req.selected_tests.join(', ') : 'Diagnostic Test'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {req.report_url ? (
                                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-black border border-emerald-200">
                                                                    Report Delivered
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-[11px] font-black border border-amber-200">
                                                                    Pending Report Upload
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {req.report_url ? (
                                                                <a
                                                                    href={req.report_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-4 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-xl text-xs font-extrabold border border-teal-200 inline-flex items-center gap-1.5"
                                                                >
                                                                    <FileCheck size={14} /> View Report PDF
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { setReportingRequest(req); setReportFile(null); }}
                                                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-1.5"
                                                                >
                                                                    <Upload size={14} /> Upload Report PDF
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* 6. SETTINGS TAB */}
                        {activeTab === 'Settings' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
                                    <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Center Settings & Profile</h3>
                                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage your diagnostic center operational info and logo.</p>
                                        </div>
                                    </div>

                                    {/* Logo Upload */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {profileData.avatar_url ? (
                                                <img src={profileData.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <TestTubes className="w-10 h-10 text-teal-600" />
                                            )}
                                        </div>
                                        <div>
                                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingAvatar}
                                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-2"
                                            >
                                                {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} Upload Center Logo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-extrabold text-slate-700 block mb-1">Center Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.full_name}
                                                    onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-extrabold text-slate-700 block mb-1">Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    value={profileData.phone}
                                                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-extrabold text-slate-700 block mb-1">Operational Address</label>
                                            <textarea
                                                rows={3}
                                                value={profileData.address}
                                                onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-extrabold text-slate-700 block mb-1">About Center / Facilities</label>
                                            <textarea
                                                rows={3}
                                                value={profileData.bio}
                                                onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Profile Changes
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ADD / EDIT TEST MODAL */}
            <AnimatePresence>
                {isAddTestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddTestModalOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <h3 className="text-xl font-black text-slate-900">Add New Test</h3>
                                <button onClick={() => setIsAddTestModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveNewTest(); }} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Test Name</label>
                                    <input type="text" required placeholder="e.g. Complete Blood Count (CBC)" value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹)</label>
                                        <input type="text" required placeholder="800" value={newTest.price} onChange={e => setNewTest({ ...newTest, price: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                                        <select value={newTest.category} onChange={e => setNewTest({ ...newTest, category: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500">
                                            <option>Blood Test</option>
                                            <option>Radiology</option>
                                            <option>Pathology</option>
                                            <option>Imaging</option>
                                            <option>Cardiology</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                                    <textarea rows={2} placeholder="Brief clinical details..." value={newTest.description} onChange={e => setNewTest({ ...newTest, description: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-700">Active Test Status</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={newTest.status === 'Active'} onChange={e => setNewTest({ ...newTest, status: e.target.checked ? 'Active' : 'Inactive' })} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsAddTestModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-md">Save Test</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SEND QUOTE MODAL */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequest(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Review & Send Price Quote</h3>
                                    <p className="text-xs text-slate-500">Patient: {selectedRequest.patient_name}</p>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Patient Document Inspector */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Uploaded Documents</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRequest.prescription_url ? (
                                        <a href={selectedRequest.prescription_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-blue-100">
                                            <FileText size={14} /> Open Prescription
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No prescription uploaded</span>
                                    )}

                                    {selectedRequest.insurance_policy_url && (
                                        <a href={selectedRequest.insurance_policy_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-emerald-100">
                                            <ShieldCheck size={14} /> Open Insurance Card
                                        </a>
                                    )}

                                    {selectedRequest.identity_card_url && (
                                        <a href={selectedRequest.identity_card_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-purple-100">
                                            <User size={14} /> Open Identity Card
                                        </a>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleSendQuote} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Enter Price Quote (₹)</label>
                                    <input type="number" required placeholder="800" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Scheduled Date</label>
                                        <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Time Slot</label>
                                        <select value={quoteSlot} onChange={e => setQuoteSlot(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500">
                                            <option>08:00 AM</option>
                                            <option>09:00 AM</option>
                                            <option>10:00 AM</option>
                                            <option>11:00 AM</option>
                                            <option>02:00 PM</option>
                                            <option>04:00 PM</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSendingQuote} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    {isSendingQuote ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Price Quote to Patient'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* UPLOAD REPORT MODAL */}
            <AnimatePresence>
                {reportingRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReportingRequest(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Upload Test Report</h3>
                                    <p className="text-xs text-slate-500">Patient: {reportingRequest.patient_name}</p>
                                </div>
                                <button onClick={() => setReportingRequest(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUploadReport} className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 rounded-2xl p-6 text-center transition-all cursor-pointer relative">
                                    <input type="file" accept="application/pdf, image/png, image/jpeg" onChange={e => setReportFile(e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <Upload size={32} className="text-teal-600 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-800">Select Test Result PDF or Image</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, or JPG up to 10MB</p>
                                </div>

                                {reportFile && (
                                    <div className="p-3 bg-teal-50 rounded-xl text-xs font-bold text-teal-800 flex items-center justify-between border border-teal-100">
                                        <span className="truncate">{reportFile.name}</span>
                                        <FileCheck size={16} />
                                    </div>
                                )}

                                <button type="submit" disabled={isUploadingReport} className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
                                    {isUploadingReport ? <><Loader2 size={16} className="animate-spin" /> Uploading Report...</> : 'Deliver Report to Patient'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PATIENT BOOKING HISTORY MODAL */}
            <AnimatePresence>
                {selectedPatientHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPatientHistory(null)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full relative z-10 p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{selectedPatientHistory.name}</h3>
                                    <p className="text-xs text-slate-500">{selectedPatientHistory.phone} · {selectedPatientHistory.email}</p>
                                </div>
                                <button onClick={() => setSelectedPatientHistory(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {selectedPatientHistory.requests.map((r, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-slate-900">
                                                {r.selection_mode === 'manual' ? Array.isArray(r.selected_tests) ? r.selected_tests.join(', ') : 'Test' : 'Prescription Upload'}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                                                {r.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Quoted Price: <strong className="text-slate-800">₹{r.price || 0}</strong></span>
                                            <span>Date: {new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setSelectedPatientHistory(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl">
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SIGN OUT CONFIRMATION MODAL */}
            <SignOutModal
                isOpen={isSignOutModalOpen}
                onClose={() => setIsSignOutModalOpen(false)}
                onConfirm={async () => {
                    setIsSignOutModalOpen(false);
                    await signOut();
                    navigate('/');
                }}
            />
        </div>
    );
}
