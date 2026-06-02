import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/auth/AuthContext.jsx';
import { 
    FlaskConical, Calendar, Clock, User, Phone, 
    FileText, CheckCircle2, XCircle, Search, 
    Filter, ExternalLink, Paperclip, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';

export default function DiagnosticDashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('organization_id', user.id)
                    .eq('organization_type', 'diagnostic')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setBookings(data || []);
            } catch (err) {
                console.error('Error fetching bookings:', err);
                toast.error('Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();

        // Real-time subscription for new bookings
        const channel = supabase
            .channel('diagnostic-bookings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `organization_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Real-time booking update:', payload);
                    if (payload.eventType === 'INSERT') {
                        setBookings(prev => [payload.new, ...prev]);
                        toast.success('New test booking received!');
                    } else if (payload.eventType === 'UPDATE') {
                        setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
                    } else if (payload.eventType === 'DELETE') {
                        setBookings(prev => prev.filter(b => b.id === payload.old.id));
                    }
                }
            )
            .subscribe();

<<<<<<< HEAD
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', bookingId);

            if (error) throw error;
            toast.success(`Booking ${newStatus.toLowerCase()} successfully`);
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Failed to update status');
=======
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
>>>>>>> 64023f85d45ed03e2297904c0ac5dabc376f1fe0
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = 
            b.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

<<<<<<< HEAD
=======
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

>>>>>>> 64023f85d45ed03e2297904c0ac5dabc376f1fe0
    return (
        <div className="space-y-8 pb-10">
            <Toaster richColors position="top-right" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <FlaskConical className="text-emerald-600 w-8 h-8" />
                            Diagnostic Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Manage your test bookings and prescriptions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl gap-2 font-bold bg-white border-slate-200">
                            <Bell size={18} className="text-slate-500" />
                            Notifications
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Bookings', value: bookings.length, color: 'bg-blue-500' },
                        { label: 'Pending', value: bookings.filter(b => b.status === 'Pending').length, color: 'bg-amber-500' },
                        { label: 'Confirmed', value: bookings.filter(b => b.status === 'Confirmed').length, color: 'bg-emerald-500' },
                        { label: 'Completed', value: bookings.filter(b => b.status === 'Completed').length, color: 'bg-slate-500' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                                <div className={`h-1.5 w-12 rounded-full mt-3 ${stat.color}`} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="border-none shadow-sm rounded-3xl bg-white">
                    <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search patient name or test..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-slate-700"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400" />
                            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            statusFilter === s 
                                                ? 'bg-white text-emerald-600 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bookings List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-slate-500 font-medium">Fetching bookings...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <Card className="border-none shadow-sm rounded-3xl bg-white py-20">
                            <CardContent className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <FlaskConical size={40} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-800">No bookings found</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-1">
                                        Try adjusting your filters or wait for new patient requests.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredBookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group"
                                >
                                    <Card className="border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col lg:flex-row">
                                                {/* Left: Patient & Test Info */}
                                                <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-50">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xl">
                                                                {booking.patient_name?.[0] || 'P'}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-bold text-slate-900">{booking.patient_name}</h4>
                                                                <div className="flex items-center gap-3 text-slate-500 text-sm mt-0.5">
                                                                    <span className="flex items-center gap-1"><Phone size={14} /> {booking.patient_phone}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                                                                        <FlaskConical size={14} /> {booking.specialization}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge className={`rounded-xl border-none font-bold uppercase tracking-wider text-[10px] ${
                                                            booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                            booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                            booking.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {booking.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Middle: Appointment Details */}
                                                <div className="p-6 lg:w-72 bg-slate-50/50 flex flex-col justify-center gap-3">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar size={16} className="text-slate-400" />
                                                        <span className="text-sm font-medium">
                                                            {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Clock size={16} className="text-slate-400" />
                                                        <span className="text-sm font-medium">{booking.time_slot}</span>
                                                    </div>
                                                </div>

                                                {/* Right: Prescription & Actions */}
                                                <div className="p-6 lg:w-80 flex flex-col justify-center gap-4">
                                                    {booking.prescription_url ? (
                                                        <a 
                                                            href={booking.prescription_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100 group/pres"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                    <Paperclip size={16} />
                                                                </div>
                                                                <span className="text-sm font-bold text-emerald-700">Prescription</span>
                                                            </div>
                                                            <ExternalLink size={16} className="text-emerald-400 group-hover/pres:text-emerald-600 transition-colors" />
                                                        </a>
                                                    ) : (
                                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-slate-400 italic">
                                                            <Paperclip size={16} />
                                                            <span className="text-xs font-medium">No prescription uploaded</span>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {booking.status === 'Pending' && (
                                                            <Button 
                                                                onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 font-bold"
                                                            >
                                                                Confirm
                                                            </Button>
                                                        )}
                                                        {booking.status === 'Confirmed' && (
                                                            <Button 
                                                                onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                                                                className="flex-1 bg-slate-900 hover:bg-black rounded-xl h-10 font-bold"
                                                            >
                                                                Mark Done
                                                            </Button>
                                                        )}
                                                        {['Pending', 'Confirmed'].includes(booking.status) && (
                                                            <Button 
                                                                variant="outline"
                                                                onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                                                className="px-3 rounded-xl h-10 border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all"
                                                            >
                                                                <XCircle size={18} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
        </div>
    );
}