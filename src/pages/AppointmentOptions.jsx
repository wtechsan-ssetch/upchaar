import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function AppointmentOptions() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading } = useAuth();
    
    const doctorId = searchParams.get('doctorId');

    const handleQueueBased = () => {
        let route = '/book-appointment-queued';
        if (doctorId) route += `?doctorId=${doctorId}`;
        
        if (!loading && !user) {
            navigate('/login', { state: { from: route } });
        } else {
            navigate(route);
        }
    };

    const handleNonQueueBased = () => {
        let route = '/book-appointment';
        if (doctorId) route += `?doctorId=${doctorId}`;
        navigate(route);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-8 bg-slate-50/50">
                <div className="max-w-5xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl sm:text-5xl font-bold font-headline tracking-tight text-slate-900"
                        >
                            Choose Your <span className="text-primary text-emerald-600">Appointment Type</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 text-lg max-w-2xl mx-auto"
                        >
                            Select the way you want to visit your doctor today.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        {/* Option 1: Queue-Based */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="h-full border-2 border-transparent hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-slate-200/50 overflow-hidden group">
                                <CardHeader className="bg-emerald-50/50 pb-8">
                                    <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">Queue-Based Appointment</CardTitle>
                                    <CardDescription className="text-slate-600 text-base">
                                        Join the real-time clinic queue from your dashboard.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Clock className="h-3 w-3 text-emerald-600" />
                                            </div>
                                            <span className="text-sm text-slate-700">Live tracking of your queue position</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Users className="h-3 w-3 text-emerald-600" />
                                            </div>
                                            <span className="text-sm text-slate-700">Ideal for same-day walk-in consults</span>
                                        </li>
                                    </ul>
                                    <Button 
                                        onClick={handleQueueBased}
                                        className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 mt-4 group"
                                    >
                                        Select Queue Based
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Option 2: Without Queue Based */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="h-full border-2 border-transparent hover:border-blue-500/30 transition-all duration-300 shadow-xl shadow-slate-200/50 overflow-hidden group">
                                <CardHeader className="bg-blue-50/50 pb-8">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Calendar className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">Without Queue Based</CardTitle>
                                    <CardDescription className="text-slate-600 text-base">
                                        Book a specific time slot that suits your schedule.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <MapPin className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-slate-700">Find doctors in your specific city/state</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Calendar className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <span className="text-sm text-slate-700">Pre-booked scheduled appointments</span>
                                        </li>
                                    </ul>
                                    <Button 
                                        onClick={handleNonQueueBased}
                                        className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 mt-4 group"
                                    >
                                        Select Without Queue
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mt-12"
                    >
                        <p className="text-slate-400 text-sm italic">
                            All your health records will be safely synced across your chosen option.
                        </p>
                    </motion.div>
                </div>
            </div>
    );
}
