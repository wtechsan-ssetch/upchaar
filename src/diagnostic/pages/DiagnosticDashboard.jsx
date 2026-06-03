import { useAuth } from '@/auth/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';
import { SignOutModal } from '@/components/landing/SignOutModal';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Clock, DollarSign, Users, LogOut, CheckCircle, XCircle,
    Search, Edit, LayoutDashboard, TestTubes, FileText, Settings,
    ChevronLeft, ChevronRight, Menu, Plus, X, Filter, Trash2,
    Camera, Loader2, User, Phone, MapPin, Globe, Save
} from 'lucide-react';


import { supabase } from '@/lib/supabase.js';
import { uploadAvatar, getStorageUrl } from '@/lib/uploadImage.js';
import { toast, Toaster } from 'sonner';

export default function DiagnosticDashboard() {
    const { profile, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [testToDelete, setTestToDelete] = useState(null);
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileRef = useRef(null);
    const [newTest, setNewTest] = useState({
        name: '',
        price: '',
        category: 'Blood Test',
        description: '',
        status: 'Active'
    });

    // Profile/Settings State
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
            
            // Refresh global auth state
            await refreshProfile();
            toast.success('Profile updated successfully!');
        } catch (err) {
            console.error('Detailed error updating profile:', err);
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
            toast.success('Profile picture updated!');
        } catch (err) {
            console.error('Error uploading avatar:', err);
            toast.error('Failed to upload image.');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        setIsSignOutModalOpen(true);
    };

    const handleConfirmSignOut = async () => {
        setIsSignOutModalOpen(false);
        setIsProfileDropdownOpen(false);
        await signOut();
        navigate('/');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const stats = useMemo(() => [
        { title: "Today's Tests", value: "0", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Today's Revenue", value: "₹0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Lifetime Tests", value: "0", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Lifetime Revenue", value: "₹0", icon: DollarSign, color: "text-orange-600", bg: "bg-orange-100" }
    ], []);


    const [tests, setTests] = useState([]);
    const [testsLoading, setTestsLoading] = useState(true);
    const [dcId, setDcId] = useState(null); // diagnostic_centers.id

    // Load tests from Supabase on mount
    useEffect(() => {
        if (!profile?.id) return;
        const loadTests = async () => {
            setTestsLoading(true);
            try {
                // Get the current user ID directly from Supabase session as a backup
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const userId = authUser?.id || profile?.id;

                if (!userId) {
                    console.log('No user ID found, skipping loadTests');
                    setTestsLoading(false);
                    return;
                }

                // Get all diagnostic_centers rows for this profile
                const { data: centers, error: fetchError } = await supabase
                    .from('diagnostic_centers')
                    .select('*')
                    .eq('profile_id', userId);

                if (fetchError) {
                    console.error('Fetch error in loadTests:', fetchError);
                    toast.error('Error loading data: ' + fetchError.message);
                    setTestsLoading(false);
                    return;
                }

                console.log('Centers found for profile:', profile.id, centers);

                // Find a row that already has tests, otherwise take the first one
                let dc = centers?.find(c => Array.isArray(c.tests) && c.tests.length > 0) || (centers && centers.length > 0 ? centers[0] : null);

                if (!dc) {
                    console.log('No diagnostic center row found. Attempting to create one...');
                    const { data: created, error: createError } = await supabase
                        .from('diagnostic_centers')
                        .insert([{ 
                            profile_id: userId, 
                            name: profile.full_name || 'Diagnostic Center',
                            email: profile.email || '',
                            status: 'Active'
                        }])
                        .select()
                        .single();
                    
                    if (createError) {
                        console.error('Error creating diagnostic center:', createError);
                        // If it's a constraint error, maybe it was created in the meantime? 
                        // Let's not toast error yet, just log it.
                    } else {
                        dc = created;
                    }
                }

                if (dc) {
                    console.log('Using diagnostic center row:', dc.id);
                    setDcId(dc.id);
                    
                    let rawTests = [];
                    if (typeof dc.tests === 'string') {
                        try {
                            rawTests = JSON.parse(dc.tests);
                        } catch (e) {
                            console.error('Error parsing tests string:', e);
                            rawTests = [];
                        }
                    } else if (Array.isArray(dc.tests)) {
                        rawTests = dc.tests;
                    }
                    
                    // Handle case where tests might be stored as strings (including stringified JSON)
                    const validTests = rawTests.map((t, index) => {
                        if (t && typeof t === 'object' && t.name) return t;
                        
                        if (typeof t === 'string') {
                            // Try to parse it as JSON first (Supabase might serialize objects into a text[] column)
                            try {
                                const parsed = JSON.parse(t);
                                if (parsed && typeof parsed === 'object' && parsed.name) {
                                    return parsed;
                                }
                            } catch (e) {
                                // Not JSON, treat as regular string
                            }
                            
                            // Fallback for simple string tests
                            return {
                                id: index + 1,
                                name: t,
                                price: '₹0',
                                category: 'Other',
                                status: 'Active',
                                description: ''
                            };
                        }
                        return null;
                    }).filter(Boolean);
                    
                    setTests(validTests);
                }
            } catch (err) {
                console.error('Unexpected error in loadTests:', err);
            } finally {
                setTestsLoading(false);
            }
        };
        loadTests();
    }, [profile?.id, refreshProfile]); // Added refreshProfile to dependencies

    // Persist updated tests array back to Supabase
    const persistTests = async (updatedTests) => {
        // Optimistically update local state
        const previousTests = [...tests];
        setTests(updatedTests);
        
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userId = authUser?.id || profile?.id;

            if (!userId) {
                toast.error('You must be logged in to save tests.');
                setTests(previousTests);
                return;
            }

            console.log('Saving tests for profile:', userId, 'dcId:', dcId, updatedTests);
            
            let query = supabase
                .from('diagnostic_centers')
                .update({ 
                    tests: updatedTests,
                    name: profile.full_name || 'Diagnostic Center'
                });

            if (dcId) {
                query = query.eq('id', dcId);
            } else {
                query = query.eq('profile_id', userId);
            }

            const { data, error } = await query.select();

            if (error) throw error;
            
            if (!data || data.length === 0) {
                console.log('No row found to update. Attempting to insert...');
                const { data: inserted, error: insertError } = await supabase
                    .from('diagnostic_centers')
                    .insert([{ 
                        profile_id: userId, 
                        tests: updatedTests,
                        name: profile.full_name || 'Diagnostic Center'
                    }])
                    .select();
                
                if (insertError) throw insertError;
                if (!inserted || inserted.length === 0) throw new Error('No data returned from insert operation.');
                
                console.log('Insert success:', inserted[0]);
                if (inserted[0].id) setDcId(inserted[0].id);
            } else {
                console.log('Update success:', data[0]);
                if (data[0].id) setDcId(data[0].id);
            }

            toast.success('Changes saved successfully');
            
        } catch (err) {
            console.error('Error persisting tests:', err);
            toast.error('Failed to save changes: ' + err.message);
            // Rollback local state
            setTests(previousTests);
        }
    };

    const filteredTests = tests.filter(test => {
        const name = test?.name || '';
        const category = test?.category || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleStatus = (id) => {
        const updated = tests.map(test =>
            test.id === id ? { ...test, status: test.status === 'Active' ? 'Inactive' : 'Active' } : test
        );
        persistTests(updated);
    };

    const handleDeleteTest = () => {
        if (testToDelete) {
            persistTests(tests.filter(t => t.id !== testToDelete.id));
            setTestToDelete(null);
        }
    };

    const handleSaveNewTest = () => {
        if (!newTest.name || !newTest.price) {
            toast.error('Please provide at least a Test Name and Price.');
            return;
        }
        
        // Ensure price has the currency symbol if not already present
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

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Available Tests', icon: TestTubes },
        { name: 'Patients', icon: Users },
        { name: 'Reports', icon: FileText },
        { name: 'Settings', icon: Settings }
    ];

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            {/* Sidebar */}
            <motion.div
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="bg-white border-r border-slate-200 h-full flex flex-col shadow-sm relative z-20 flex-shrink-0 transition-all duration-300"
            >
                {/* Sidebar Header */}
                <div className="h-24 flex items-center px-4 border-b border-slate-50/50">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-12 h-12 min-w-[48px] rounded-full border-2 border-[#a7f3d0] flex items-center justify-center p-1.5 bg-white overflow-hidden shadow-sm"
                        >
                            <img src="/logo.png" alt="Upchar Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-baseline gap-1 select-none"
                                >
                                    <span className="text-xl sm:text-2xl font-black text-[#0d9488] tracking-tighter leading-none">Upchar</span>
                                    <span className="text-xl sm:text-2xl font-black text-[#dc2626] tracking-tighter leading-none">Health</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200 shadow-sm z-30 transition-colors"
                >
                    {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Sidebar Links */}
                <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.name
                                    ? 'bg-teal-50 text-teal-700 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            title={!isSidebarOpen ? item.name : ''}
                        >
                            <item.icon
                                size={20}
                                className={`min-w-[20px] transition-colors ${activeTab === item.name ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                            />
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {activeTab === item.name && isSidebarOpen && (
                                <motion.div
                                    layoutId="sidebar-active-indicator"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Topbar */}
                <div className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{activeTab}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 hover:border-teal-500 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                                    {profile?.full_name?.charAt(0) || 'D'}
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isProfileDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                                >
                                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || 'Diagnostic Admin'}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Diagnostic Center Manager</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsProfileDropdownOpen(false);
                                            handleSignOut();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 w-full">
                    <div className="max-w-7xl mx-auto w-full">

                        {activeTab === 'Dashboard' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-slate-800">Overview</h3>
                                    <p className="text-slate-500">Your diagnostic center activity at a glance.</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    {stats.map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={24} />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {(activeTab === 'Dashboard' || activeTab === 'Available Tests') && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Available Tests</h2>
                                        <p className="text-sm text-slate-500">Manage and view your diagnostic test catalogue</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                value={filterCategory}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                                className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white appearance-none cursor-pointer"
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
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search tests..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsAddTestModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap ml-auto"
                                        >
                                            <Plus size={18} />
                                            Add Test
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                                <th className="px-6 py-4 font-medium">Test Name</th>
                                                <th className="px-6 py-4 font-medium">Category</th>
                                                <th className="px-6 py-4 font-medium">Price</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {testsLoading ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                                            Loading tests...
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : tests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                                <TestTubes size={32} className="text-slate-400" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-slate-700 mb-1">No tests available yet</h3>
                                                            <p className="text-slate-500 mb-4 max-w-sm">You haven't added any diagnostic tests to your catalogue. Click 'Add Test' to get started.</p>
                                                            <button
                                                                onClick={() => setIsAddTestModalOpen(true)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                                                            >
                                                                <Plus size={18} />
                                                                Add Test
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredTests.length > 0 ? (
                                                filteredTests.map((test) => (
                                                    <tr key={test.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-semibold text-slate-800">{test.name}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                                {test.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-700">
                                                            {test.price}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${test.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                }`}>
                                                                {test.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                {test.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                                                                    <span className={`text-xs font-medium ${test.status === 'Active' ? 'text-teal-600' : 'text-slate-400'}`}>
                                                                        {test.status === 'Active' ? 'On' : 'Off'}
                                                                    </span>
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="sr-only peer"
                                                                            checked={test.status === 'Active'}
                                                                            onChange={() => handleToggleStatus(test.id)}
                                                                        />
                                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                                                                    </label>
                                                                </div>
                                                                <button
                                                                    onClick={() => setEditingTest(test)}
                                                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                    title="Edit Test"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setTestToDelete(test)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Delete Test"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                        No tests found matching your search or filter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'Settings' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-4xl mx-auto pb-10"
                            >
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                    {/* Profile Header */}
                                    <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-8 py-12 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                                        
                                        <div className="relative flex flex-col md:flex-row items-center gap-8">
                                            {/* Avatar Section */}
                                            <div className="relative group">
                                                <div className="w-36 h-36 rounded-[2rem] bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                                                    {profileData.avatar_url ? (
                                                        <img 
                                                            src={getStorageUrl(profileData.avatar_url, 'avatars')} 
                                                            alt="Profile" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-300 flex items-center justify-center text-white text-4xl font-bold">
                                                            {profileData.full_name?.charAt(0) || 'D'}
                                                        </div>
                                                    )}
                                                    
                                                    {isUploadingAvatar && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                            <Loader2 size={32} className="text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploadingAvatar}
                                                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-teal-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 z-10"
                                                    title="Change Center Photo"
                                                >
                                                    <Camera size={20} />
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={handleAvatarUpload} 
                                                />
                                            </div>

                                            {/* Header Info */}
                                            <div className="text-center md:text-left space-y-3">
                                                <div className="space-y-1">
                                                    <h2 className="text-4xl font-black tracking-tight">{profileData.full_name || 'Diagnostic Center'}</h2>
                                                    <p className="text-teal-50/80 font-medium flex items-center justify-center md:justify-start gap-2 text-lg">
                                                        <MapPin size={18} className="text-teal-200" /> {profileData.address || 'Location not set'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest border border-white/10">
                                                        Healthcare Provider
                                                    </span>
                                                    <span className="px-4 py-1.5 bg-emerald-400/20 backdrop-blur-md text-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-400/20">
                                                        Verified Diagnostic Center
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings Form */}
                                    <form onSubmit={handleUpdateProfile} className="p-10 space-y-12">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            {/* Left Column: Core Info */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                                                        <User size={18} />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-500 ml-1">Center Name</label>
                                                        <input 
                                                            type="text" 
                                                            value={profileData.full_name}
                                                            onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                                                            className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                                                            placeholder="e.g. LifeCare Diagnostics"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-500 ml-1">Contact Number</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="tel" 
                                                                value={profileData.phone}
                                                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                                className="w-full px-6 py-4 pl-14 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                                                                placeholder="+91 00000 00000"
                                                            />
                                                            <Phone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Location */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800">Location Details</h3>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-500 ml-1">Full Office Address</label>
                                                    <textarea 
                                                        rows={5}
                                                        value={profileData.address}
                                                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                                        className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 resize-none leading-relaxed"
                                                        placeholder="Enter the complete operational address..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Section: Description */}
                                        <div className="space-y-8 pt-4">
                                            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <FileText size={18} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">Center Description</h3>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-500 ml-1">About the Center</label>
                                                <textarea 
                                                    rows={4}
                                                    value={profileData.bio}
                                                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 resize-none leading-relaxed"
                                                    placeholder="Highlight your specialties, high-end equipment, or center history..."
                                                />
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex justify-end pt-8 border-t border-slate-50">
                                            <button 
                                                type="submit"
                                                disabled={isSavingProfile}
                                                className="group relative flex items-center gap-3 bg-slate-900 hover:bg-teal-600 text-white px-10 py-4 rounded-[1.5rem] font-black text-lg transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-teal-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <span className="relative flex items-center gap-3">
                                                    {isSavingProfile ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                                                    Update Profile
                                                </span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {['Patients', 'Reports'].includes(activeTab) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-16 text-center mt-10"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    {activeTab === 'Patients' && <Users size={40} className="text-slate-400" />}
                                    {activeTab === 'Reports' && <FileText size={40} className="text-slate-400" />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">{activeTab} Module</h3>
                                <p className="text-slate-500 max-w-sm">This section is currently under development. Check back later for updates.</p>
                            </motion.div>
                        )}

                    </div>
                </div>
            </div>

            {/* Add Test Modal */}
            <AnimatePresence>
                {isAddTestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddTestModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-800">Add New Test</h3>
                                <button
                                    onClick={() => setIsAddTestModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                                        <input
                                            type="text"
                                            value={newTest.name}
                                            onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Complete Blood Count"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                value={newTest.price}
                                                onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                                placeholder="500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select
                                                value={newTest.category}
                                                onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white"
                                            >
                                                <option>Blood Test</option>
                                                <option>Radiology</option>
                                                <option>Pathology</option>
                                                <option>Imaging</option>
                                                <option>Cardiology</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            rows="3"
                                            value={newTest.description}
                                            onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                                            placeholder="Brief description about the test..."
                                        ></textarea>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Status</p>
                                            <p className="text-xs text-slate-500">Determine if this test is currently available</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={newTest.status === 'Active'}
                                                onChange={(e) => setNewTest({ ...newTest, status: e.target.checked ? 'Active' : 'Inactive' })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setIsAddTestModalOpen(false)}
                                    type="button"
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNewTest}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Save Test
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Test Modal */}
            <AnimatePresence>
                {editingTest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingTest(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-800">Edit Test</h3>
                                <button
                                    onClick={() => setEditingTest(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                                        <input 
                                            type="text" 
                                            value={editingTest.name} 
                                            onChange={(e) => setEditingTest({...editingTest, name: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                                            <input 
                                                type="text" 
                                                value={editingTest.price} 
                                                onChange={(e) => setEditingTest({...editingTest, price: e.target.value})}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select 
                                                value={editingTest.category} 
                                                onChange={(e) => setEditingTest({...editingTest, category: e.target.value})}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white"
                                            >
                                                <option>Blood Test</option>
                                                <option>Radiology</option>
                                                <option>Pathology</option>
                                                <option>Imaging</option>
                                                <option>Cardiology</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Status</p>
                                            <p className="text-xs text-slate-500">Determine if this test is currently available</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={editingTest.status === 'Active'}
                                                onChange={(e) => setEditingTest({...editingTest, status: e.target.checked ? 'Active' : 'Inactive'})}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setEditingTest(null)}
                                    type="button"
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const updated = tests.map(t => t.id === editingTest.id ? editingTest : t);
                                        persistTests(updated);
                                        setEditingTest(null);
                                    }}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {testToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTestToDelete(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Test</h3>
                                <p className="text-slate-500 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-700">{testToDelete.name}</span>? This action cannot be undone.</p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setTestToDelete(null)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteTest}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toaster & Modals */}
            <Toaster position="top-right" richColors />
            <SignOutModal
                isOpen={isSignOutModalOpen}
                onClose={() => setIsSignOutModalOpen(false)}
                onConfirm={handleConfirmSignOut}
            />
        </div>
    );
}
