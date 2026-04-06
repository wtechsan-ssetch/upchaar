import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useDoctor } from '../context/DoctorContext.jsx';
import DoctorPendingPage from '../pages/DoctorPendingPage.jsx';
import {
    LayoutDashboard, Calendar, Users, ClipboardList,
    UserCircle, LogOut, ChevronLeft, ChevronRight, Stethoscope,
    Bell, Search, MessageSquare, Menu, X, KeyRound, Landmark,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ChangePasswordModal from '@/components/ChangePasswordModal.jsx';

const NAV = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/doctor/prescriptions', icon: ClipboardList, label: 'Prescriptions' },
    { to: '/doctor/release', icon: Landmark, label: 'Fee Release' },
    { to: '/doctor/profile', icon: UserCircle, label: 'Profile' },
];

export default function DoctorLayout() {
    const { doctor, doctorRecord, logout, loading } = useDoctor();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [changePwOpen, setChangePwOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            </div>
        );
    }

    if (!doctor) return <Navigate to="/doctor/login" replace />;

    // Doctor is logged in but not yet approved by admin → show pending page
    if (doctorRecord && doctorRecord.status !== 'Approved') {
        return <DoctorPendingPage />;
    }

    const initials = doctor.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

    const handleLogout = () => {
        logout();
    };

    return (
        <>
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl opacity-50" />
            </div>

            {/* ── Mobile overlay drawer ───────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 z-30 lg:hidden" />
                        <motion.aside
                            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-white/50 shadow-2xl z-40 lg:hidden flex flex-col">
                            {/* Mobile drawer header */}
                            <div className="flex items-center justify-between px-6 py-6 h-20 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/20 flex items-center justify-center">
                                        <Stethoscope size={20} className="text-white" />
                                    </div>
                                    <span className="font-bold text-base text-slate-800">Upchaar<span className="text-teal-500">.</span>Doctor</span>
                                </div>
                                <button onClick={() => setMobileOpen(false)}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            {/* Mobile doctor card */}
                            <div className="px-6 pb-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                                        style={{ backgroundColor: doctor.avatarColor || '#0d9488' }}>
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{doctor.fullName}</p>
                                        <p className="text-[11px] text-slate-500">{doctor.specialization || 'Doctor'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Mobile nav */}
                            <nav className="flex flex-col gap-2 px-4 py-2 flex-1 overflow-y-auto">
                                {NAV.map(({ to, icon: Icon, label }) => (
                                    <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                                        end={to === '/doctor/dashboard'}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                                            isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        )}>
                                        {({ isActive }) => (
                                            <>
                                                <Icon className={cn(isActive ? 'text-teal-600' : 'text-slate-400')} size={20} />
                                                <span>{label}</span>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </nav>
                            <div className="p-4">
                                <button onClick={() => { setMobileOpen(false); setChangePwOpen(true); }}
                                    className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all w-full mb-1">
                                    <KeyRound size={20} /> Change Password
                                </button>
                                <button onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full">
                                    <LogOut size={20} /> Sign Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar (Glassmorphic) — desktop only */}
            <motion.aside
                animate={{ width: collapsed ? 80 : 260 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="relative hidden lg:flex flex-col bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] flex-shrink-0 overflow-visible z-20 m-3 mr-0 rounded-3xl"
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 h-20 flex-shrink-0">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/20 flex-shrink-0 flex items-center justify-center">
                        <Stethoscope size={20} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                                className="font-bold text-base text-slate-800 whitespace-nowrap tracking-tight">
                                Upchaar<span className="text-teal-500">.</span> Doctor
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Doctor indicator */}
                <div className={cn('px-6 py-3', collapsed && 'flex justify-center px-0')}>
                    <AnimatePresence>
                        {!collapsed ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-3 p-2 bg-white/50 border border-white rounded-2xl shadow-sm">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                                    style={{ backgroundColor: doctor.avatarColor || '#0d9488' }}>
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{doctor.fullName}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{doctor.specialization || 'Doctor'}</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-sm"
                                style={{ backgroundColor: doctor.avatarColor || '#0d9488' }}>
                                {initials}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-2 px-4 py-4 flex-1 overflow-y-auto">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/doctor/dashboard'}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group relative',
                                isActive
                                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-800'
                            )}>
                            {({ isActive }) => (
                                <>
                                    {/* Active indicator dot */}
                                    {isActive && !collapsed && (
                                        <motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full" />
                                    )}
                                    <div className={cn("flex items-center justify-center shrink-0 w-8", collapsed && "w-10")}>
                                        <Icon className={cn('transition-colors', isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600')} size={20} />
                                    </div>
                                    <AnimatePresence>
                                        {!collapsed && (
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="whitespace-nowrap flex-1">
                                                {label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 mt-auto">
                    <button onClick={() => setChangePwOpen(true)}
                        className={cn('flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all w-full group mb-1', collapsed && 'justify-center')}>
                        <div className={cn("flex items-center justify-center shrink-0 w-8", collapsed && "w-10")}>
                            <KeyRound size={20} />
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                                    Change Password
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                    <button onClick={handleLogout}
                        className={cn('flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full group', collapsed && 'justify-center')}>
                        <div className={cn("flex items-center justify-center shrink-0 w-8", collapsed && "w-10")}>
                            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                    className="absolute -right-3.5 top-24 h-7 w-7 rounded-full border border-slate-200/60 bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 hover:text-teal-600 hover:shadow-md hover:scale-105 transition-all z-30">
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </motion.aside>

            {/* Main content */}
            <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden z-10">
                {/* Topbar */}
                <header className="h-20 bg-white/60 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-20 sticky top-0">
                    {/* Hamburger — mobile only */}
                    <button onClick={() => setMobileOpen(true)}
                        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                        <Menu size={20} />
                    </button>

                    {/* Welcome Text */}
                    <div className="hidden sm:block">
                        <h2 className="font-bold text-slate-800 text-lg tracking-tight">Welcome, Dr. {doctor.fullName?.split(' ')[1] || doctor.fullName?.split(' ')[0]}</h2>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 tracking-wide uppercase">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-5 ml-auto">
                        {/* Global Search */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                placeholder="Search patients, ID..."
                                className="w-56 pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all shadow-sm placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white/80 border border-slate-200/60 px-4 py-2 rounded-full shadow-sm">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                            <span className="text-xs font-semibold text-slate-600">Offline Consult</span>
                        </div>

                        {/* Notifications */}
                        <button className="relative w-10 h-10 rounded-full bg-white/80 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:shadow-md transition-all">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                    {/* Add subtle fade at the top for smooth scrolling effect */}
                    <div className="fixed top-20 left-0 right-0 h-6 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10" />
                    <Outlet />
                </main>

                {/* Secure Chat FAB */}
                <button className="fixed bottom-6 right-8 h-14 w-14 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center hover:shadow-xl hover:scale-110 hover:-translate-y-1 transition-all z-40 group">
                    <MessageSquare size={24} className="group-hover:animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            </div>
        </div>

        <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
        </>
    );
}
