import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Calendar, ArrowRight, Hash, Activity,
    Bell, BotMessageSquare, Sparkles, CheckCircle,
    XCircle, Clock, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/AuthContext.jsx';

const QUEUE_FEATURES = [
    {
        icon: <Hash className="h-5 w-5 text-emerald-500" />,
        title: 'Live Queue Number',
        desc: 'See your real-time position in the doctor\'s queue the moment you book.',
        color: 'bg-emerald-50',
    },
    {
        icon: <Activity className="h-5 w-5 text-blue-500" />,
        title: 'Live Queue Status',
        desc: 'Know exactly how many patients are ahead — no more guessing wait times.',
        color: 'bg-blue-50',
    },
    {
        icon: <Bell className="h-5 w-5 text-amber-500" />,
        title: 'Prescription Notifications',
        desc: 'Receive digital prescriptions and follow-up reminders directly to you.',
        color: 'bg-amber-50',
    },
    {
        icon: <BotMessageSquare className="h-5 w-5 text-violet-500" />,
        title: 'AI Calling Agent',
        desc: 'Our AI agent calls you automatically when your turn is just minutes away.',
        color: 'bg-violet-50',
    },
];

const COMPARISON = [
    { label: 'Book an appointment',    queue: true,  scheduled: true  },
    { label: 'Doctor can see you',     queue: true,  scheduled: true  },
    { label: 'Personal Dashboard',     queue: true,  scheduled: false },
    { label: 'Live Queue Number',      queue: true,  scheduled: false },
    { label: 'Real-time Queue Status', queue: true,  scheduled: false },
    { label: 'Prescription Alerts',    queue: true,  scheduled: false },
    { label: 'AI Turn Notification',   queue: true,  scheduled: false },
];

export default function AppointmentOptions() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading } = useAuth();

    const doctorId = searchParams.get('doctorId');
    const clinicId = searchParams.get('clinicId');

    const handleQueueBased = () => {
        const base = doctorId
            ? `/book-appointment-queued?doctorId=${doctorId}`
            : '/book-appointment-queued';
        const route = clinicId ? `${base}${base.includes('?') ? '&' : '?'}clinicId=${clinicId}` : base;
        if (!loading && !user) {
            navigate('/login', { state: { from: route } });
        } else {
            navigate(route);
        }
    };

    const handleNonQueueBased = () => {
        const base = doctorId ? `/book-appointment?doctorId=${doctorId}` : '/book-appointment';
        const route = clinicId ? `${base}${base.includes('?') ? '&' : '?'}clinicId=${clinicId}` : base;
        navigate(route);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                >
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-1 font-bold uppercase tracking-widest text-[10px]">
                        <Sparkles className="w-3 h-3 mr-1.5" /> Choose Your Experience
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                        How would you like to{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                            book?
                        </span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        Queue-Based gives you a fully connected experience. Simple booking gets you in fast.
                    </p>
                </motion.div>

                {/* Main Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Queue-Based — HERO card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                    >
                        {/* Recommended badge */}
                        <div className="absolute -top-3.5 left-6 z-10">
                            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                                ✦ Recommended
                            </span>
                        </div>

                        <div className="h-full rounded-3xl border-2 border-emerald-400/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col">
                            {/* Top section */}
                            <div className="p-8 pb-6 flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                                        <Users className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-extrabold">Queue-Based</h2>
                                        <p className="text-emerald-400 text-sm font-medium">Full smart experience</p>
                                    </div>
                                </div>

                                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                    Join the real-time clinic queue. Get live updates, AI notifications, and a personal patient dashboard — all in one place.
                                </p>

                                {/* Feature pills */}
                                <div className="grid grid-cols-1 gap-3">
                                    {QUEUE_FEATURES.map((f, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15 + i * 0.07 }}
                                            className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                                        >
                                            <div className={`shrink-0 h-8 w-8 rounded-lg ${f.color} flex items-center justify-center`}>
                                                {f.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{f.title}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="p-6 pt-0">
                                <Button
                                    onClick={handleQueueBased}
                                    className="w-full h-13 py-3.5 text-base bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-500/30 group"
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Book with Queue
                                    <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <p className="text-center text-slate-500 text-xs mt-3">
                                    {user ? 'You\'re logged in — ready to go!' : 'You\'ll be asked to log in or register'}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Simple / Without Queue */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex-1 rounded-3xl border-2 border-slate-100 bg-white shadow-xl shadow-slate-100/60 overflow-hidden flex flex-col">
                            <div className="p-8 pb-6 flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <Calendar className="h-7 w-7 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-slate-900">Simple Booking</h2>
                                        <p className="text-slate-400 text-sm font-medium">No account needed</p>
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                    Book a specific time slot quickly without signing up. Ideal for one-time visits where you don&apos;t need tracking.
                                </p>

                                {/* What's NOT included */}
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Not included in simple booking</p>
                                    {['Personal Dashboard', 'Live Queue Tracking', 'AI Turn Notification', 'Prescription Alerts'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                            <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <Button
                                    onClick={handleNonQueueBased}
                                    variant="outline"
                                    className="w-full h-12 font-bold rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 group"
                                >
                                    Continue without Queue
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>

                        {/* Feature Comparison Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                        >
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="col-span-1">Feature</span>
                                <span className="text-center text-emerald-600">Queue</span>
                                <span className="text-center">Simple</span>
                            </div>
                            {COMPARISON.map((row, i) => (
                                <div key={i} className={`grid grid-cols-3 px-5 py-2.5 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-50 last:border-0`}>
                                    <span className="text-slate-600 font-medium">{row.label}</span>
                                    <span className="flex justify-center">
                                        {row.queue
                                            ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            : <XCircle className="h-4 w-4 text-slate-200" />}
                                    </span>
                                    <span className="flex justify-center">
                                        {row.scheduled
                                            ? <CheckCircle className="h-4 w-4 text-slate-400" />
                                            : <XCircle className="h-4 w-4 text-slate-200" />}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
