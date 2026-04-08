import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Stethoscope, FlaskConical, Hospital,
    FileText, LogOut, X, Menu, ChevronLeft, ChevronRight, HeartPulse,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext.jsx';
import { Search, Bell } from 'lucide-react';

const NAV = [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctors',     icon: Stethoscope,     label: 'Find Doctors' },
    { to: '/diagnostics', icon: FlaskConical,     label: 'Diagnostics' },
    { to: '/hospitals',   icon: Hospital,         label: 'Hospitals' },
    { to: '/records',     icon: FileText,         label: 'Health Records' },
];

export default function AppLayout({ children }) {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer on route change
    useEffect(() => { setMobileOpen(false); }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const initials = user?.user_metadata?.full_name
        ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PA';

    const location = useLocation();

    // Shared sidebar nav content
    const SidebarContent = ({ onClose }) => (
        <div className="flex flex-col h-full">
            {/* Logo + close */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 h-16 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center flex-shrink-0">
                        <HeartPulse className="text-white" size={15} />
                    </div>
                    <AnimatePresence>
                        {(!collapsed || onClose) && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                                className="font-bold text-sm text-primary whitespace-nowrap">
                                Upchaar
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                {/* X button — always shown on mobile drawer, shown on desktop when expanded */}
                {onClose && (
                    <button onClick={onClose}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
                {NAV.map(({ to, icon: Icon, label }) => {
                    // Check if active: standard check OR if it's the dashboard link and we are on a portal dashboard
                    const isDashboard = to === '/dashboard';
                    const active = isDashboard
                        ? location.pathname === '/dashboard' || location.pathname.includes('/dashboard')
                        : location.pathname === to;

                    return (
                        <NavLink key={to} to={to} onClick={() => onClose?.()}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                                active
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            )}>
                            {({ isActive }) => {
                                // Fallback to our custom logic if NavLink's isActive is false for the dashboard
                                const effectiveActive = active || isActive;
                                return (
                                    <>
                                        <Icon size={17} className={cn('flex-shrink-0', effectiveActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
                                        <AnimatePresence>
                                            {(!collapsed || onClose) && (
                                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                                                    {label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </>
                                );
                            }}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-slate-100">
                <button onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-50 hover:text-red-500 w-full transition">
                    <LogOut size={14} className="flex-shrink-0" />
                    <AnimatePresence>
                        {(!collapsed || onClose) && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Sign Out</motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">

            {/* ── Mobile overlay drawer ─────────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 z-30 lg:hidden" />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 shadow-xl z-40 lg:hidden flex-shrink-0">
                            <SidebarContent onClose={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Desktop Sidebar ──────────────────────────────────── */}
            <motion.aside
                animate={{ width: collapsed ? 64 : 210 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="relative hidden lg:flex flex-col bg-white border-r border-slate-200 shadow-sm flex-shrink-0 overflow-hidden z-20">
                <SidebarContent onClose={null} />

                {/* Collapse toggle pill */}
                <button onClick={() => setCollapsed(c => !c)}
                    className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white shadow flex items-center justify-center text-slate-400 hover:text-primary transition-colors z-10">
                    {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
            </motion.aside>

            {/* ── Main content ─────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0">
                    {/* Mobile hamburger */}
                    <button onClick={() => setMobileOpen(true)}
                        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                        <Menu size={20} />
                    </button>

                    {/* Search */}
                    <div className="relative flex-1 max-w-xs hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search…"
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                    </div>

                    <div className="flex-1" />

                    {/* Bell */}
                    <button className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <Bell size={18} />
                    </button>

                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}