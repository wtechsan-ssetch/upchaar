import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, DollarSign, Users, LogOut, FileText, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function DiagnosticDashboard() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [centerId, setCenterId] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!profile?.id) return;
            setLoading(true);
            
            // First we need to get the diagnostic center ID linked to this profile
            const { data: diagData, error: diagError } = await supabase
                .from('diagnostics')
                .select('id')
                .eq('profile_id', profile.id)
                .maybeSingle();

            const fetchedCenterId = diagData?.id || profile.id; // Fallback to profile id
            setCenterId(fetchedCenterId);

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('organization_id', fetchedCenterId)
                .eq('organization_type', 'diagnostic')
                .order('date', { ascending: false });

            if (!error && data) {
                setAppointments(data);
            }
            setLoading(false);
        };

        fetchAppointments();
    }, [profile]);

    // Real-time subscription for appointments
    useEffect(() => {
        if (!centerId) return;

        const channel = supabase
            .channel('public:appointments')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'appointments',
                filter: `organization_id=eq.${centerId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Prepend new appointment
                    setAppointments(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setAppointments(prev => prev.map(app => 
                        app.id === payload.new.id ? payload.new : app
                    ));
                } else if (payload.eventType === 'DELETE') {
                    setAppointments(prev => prev.filter(app => app.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [centerId]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleUpdateStatus = async (id, status) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);
        
        if (!error) {
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        }
    };

    const todayDate = new Date().toISOString().split('T')[0];
    const todayTests = appointments.filter(a => a.date === todayDate).length;
    const lifetimeTests = appointments.length;
    const lifetimeRevenue = appointments.filter(a => a.status === 'Completed').reduce((acc, curr) => acc + (curr.fee || 0), 0);
    const todayRevenue = appointments.filter(a => a.date === todayDate && a.status === 'Completed').reduce((acc, curr) => acc + (curr.fee || 0), 0);

    const stats = [
        { title: "Today's Tests", value: todayTests.toString(), icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Today's Revenue", value: `₹${todayRevenue}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Lifetime Tests", value: lifetimeTests.toString(), icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Lifetime Revenue", value: `₹${lifetimeRevenue}`, icon: Users, color: "text-orange-600", bg: "bg-orange-100" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Topbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Diagnostic Dashboard</h1>
                        <p className="text-sm text-slate-500">Welcome back, {profile?.full_name || 'Diagnostic Centre'}</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                    <p className="text-slate-500">Your diagnostic center activity at a glance.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
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
                        </motion.div>
                    ))}
                </div>

                {/* Test Bookings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">Recent Test Bookings</h2>
                    
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Activity size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No tests recorded yet</h3>
                            <p className="text-slate-500 max-w-sm">When patients book tests, they will appear here along with their prescriptions.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {appointments.map((appt) => {
                                    let notes = {};
                                    try {
                                        if (appt.notes) notes = JSON.parse(appt.notes);
                                    } catch(e) {}

                                    return (
                                        <motion.div
                                            key={appt.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <Card className="overflow-hidden border-slate-200 hover:border-emerald-500/30 transition-colors shadow-sm hover:shadow-md">
                                                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg font-bold text-slate-800">{appt.patient_name}</CardTitle>
                                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {format(new Date(appt.date), 'MMM dd, yyyy')} • {appt.time_slot}
                                                            </p>
                                                        </div>
                                                        <Badge className={
                                                            appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            appt.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }>
                                                            {appt.status}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-4">
                                                    {notes.prescription_url && (
                                                        <a 
                                                            href={notes.prescription_url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group"
                                                        >
                                                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-blue-900 group-hover:text-blue-700 transition-colors">View Prescription</p>
                                                                <p className="text-xs text-blue-600/70">Uploaded by patient</p>
                                                            </div>
                                                        </a>
                                                    )}
                                                    
                                                    {appt.status === 'Pending' && (
                                                        <div className="flex gap-2 pt-2">
                                                            <Button 
                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                                                                onClick={() => handleUpdateStatus(appt.id, 'Confirmed')}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => handleUpdateStatus(appt.id, 'Cancelled')}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {appt.status === 'Confirmed' && (
                                                        <Button 
                                                            variant="outline"
                                                            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                                                        >
                                                            Mark as Completed
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
