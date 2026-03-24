import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext.jsx';
import {
    PenLine, LayoutDashboard, FileText, User, LogOut,
    ExternalLink, X, Menu, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import BloggerSuspended from '../pages/BloggerSuspended.jsx';

const NAV = [
    { to: '/blogger/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/blogger/write',     icon: PenLine,         label: 'Write New' },
    { to: '/blogger/posts',     icon: FileText,        label: 'My Posts' },
    { to: '/blogger/profile',   icon: User,            label: 'Profile' },
];

export default function BloggerLayout() {
    const { blogger, logoutBlogger, loading } = useBlog();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);

    const handleLogout = async () => {
        await logoutBlogger();
        navigate('/blogger/login', { replace: true });
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#f1f5f9]">
            <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
        </div>
    );

    if (!blogger) return <Navigate to="/blogger/login" replace />;

    if (blogger.status === 'suspended' || blogger.status === 'Suspended') {
        return <BloggerSuspended />;
    }

    const initials = blogger.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Shared sidebar inner
    const SidebarInner = ({ onClose }) => (
        <div className="flex flex-col h-full">
            {/* Logo + X */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 h-16 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center flex-shrink-0">
                        <PenLine className="text-white" size={15} />
                    </div>
                    <AnimatePresence>
                        {(!collapsed || onClose) && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                                className="font-bold text-sm text-primary whitespace-nowrap">
                                Blogger Studio
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                {/* X close — only in mobile drawer */}
                {onClose && (
                    <button onClick={onClose}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 p-3 flex-1">
                {NAV.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => onClose?.()}
                        className={({ isActive }) => cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                            isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        )}>
                        {({ isActive }) => (
                            <>
                                <Icon size={17} className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
                                <AnimatePresence>
                                    {(!collapsed || onClose) && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                                            {label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-slate-100 space-y-1">
                <a href="/blogs" target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition group">
                    <ExternalLink size={14} className="flex-shrink-0" />
                    <AnimatePresence>
                        {(!collapsed || onClose) && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>View Blog</motion.span>
                        )}
                    </AnimatePresence>
                </a>
                <button onClick={handleLogout}
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

            {/* ── Mobile drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 z-30 lg:hidden" />
                        <motion.aside
                            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 shadow-xl z-40 lg:hidden">
                            <SidebarInner onClose={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Desktop sidebar ──────────────────────────────────── */}
            <motion.aside
                animate={{ width: collapsed ? 64 : 210 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="relative hidden lg:flex flex-col bg-white border-r border-slate-200 shadow-sm flex-shrink-0 overflow-hidden z-20">
                <SidebarInner onClose={null} />

                {/* Collapse toggle pill */}
                <button onClick={() => setCollapsed(c => !c)}
                    className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white shadow flex items-center justify-center text-slate-400 hover:text-primary transition-colors z-10">
                    {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
            </motion.aside>

            {/* ── Main ─────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0">
                    {/* Hamburger — mobile only */}
                    <button onClick={() => setMobileOpen(true)}
                        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                        <Menu size={20} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{blogger.name}</p>
                        {blogger.specialty && (
                            <p className="text-[11px] text-slate-400 hidden sm:block">{blogger.specialty}</p>
                        )}
                    </div>

                    <NavLink to="/blogger/write"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all flex-shrink-0">
                        <PenLine size={14} />
                        <span className="hidden sm:inline">New Post</span>
                    </NavLink>

                    {/* Avatar with dropdown */}
                    <div className="relative">
                        <button onClick={() => setAvatarOpen(o => !o)}
                            className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ring-2 ring-transparent hover:ring-primary/30 transition-all"
                            style={{ background: blogger.avatarColor || blogger.avatar_color || '#0d9488' }}>
                            {initials}
                        </button>
                        {avatarOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setAvatarOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                                    <div className="px-3 py-2.5 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-700 truncate">{blogger.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{blogger.email}</p>
                                    </div>
                                    <button onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                        <LogOut size={14} /> Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
