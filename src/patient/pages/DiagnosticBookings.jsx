import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/auth/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Calendar, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DiagnosticBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            try {
                // Fetch appointments where type or organization_type is 'diagnostic'
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('patient_id', user.id)
                    .eq('type', 'diagnostic')
                    .order('date', { ascending: false });

                if (error) throw error;
                setBookings(data || []);
            } catch (err) {
                console.error('Error fetching diagnostic bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/patient/dashboard" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Diagnostic Tests</h1>
                    <p className="text-sm text-slate-500">View and manage your booked diagnostic tests and prescriptions.</p>
                </div>
            </div>

            {bookings.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none border-slate-200">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FlaskConical className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Tests Booked</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">You haven't booked any diagnostic tests yet.</p>
                        <Link 
                            to="/diagnostics" 
                            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Book a Test
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">{booking.doctor_name}</CardTitle>
                                        <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1">
                                            <FlaskConical size={14} /> 
                                            {booking.specialization === 'Prescription Uploaded' 
                                                ? 'Test via Prescription' 
                                                : booking.specialization}
                                        </p>
                                    </div>
                                    <Badge className={
                                        booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                        booking.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }>
                                        {booking.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="font-medium">{booking.time_slot}</span>
                                    </div>
                                </div>

                                {booking.notes && booking.notes.includes('http') && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attached Prescription</p>
                                        <a 
                                            href={booking.notes.split('\nPrescription: ')[1] || booking.notes.match(/https?:\/\/[^\s]+/)?.[0]} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-sm text-emerald-600 font-medium hover:underline inline-flex items-center gap-1"
                                        >
                                            View Uploaded File
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
