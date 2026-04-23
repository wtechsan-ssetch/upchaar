import { useAuth } from '@/auth/AuthContext.jsx';
import { motion } from 'framer-motion';
import { Activity, Clock, DollarSign, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DiagnosticDashboard() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const stats = [
        { title: "Today's Tests", value: "0", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Today's Revenue", value: "₹0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Lifetime Tests", value: "0", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Lifetime Revenue", value: "₹0", icon: Users, color: "text-orange-600", bg: "bg-orange-100" }
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
            <div className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                    <p className="text-slate-500">Your diagnostic center activity at a glance.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

                {/* Empty State Area */}
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Activity size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No tests recorded yet</h3>
                    <p className="text-slate-500 max-w-sm">When you start managing patient tests, your recent activity and reports will appear here.</p>
                </div>
            </div>
        </div>
    );
}
