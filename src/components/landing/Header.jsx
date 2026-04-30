import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Stethoscope, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { DoctorOnboardingModal } from './DoctorOnboardingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/auth/AuthContext.jsx';
import { usePatient } from '@/patient/context/PatientContext.jsx';

// ── Helper: get user's initials from full name ────────────
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

// ── Role label for display ────────────────────────────────
const ROLE_LABELS = {
    patient: 'Patient',
    doctor: 'Doctor',
    clinic: 'Clinic',
    medical: 'Medical Store',
    hospital: 'Hospital',
};

// ── Dashboard path per role ───────────────────────────────
const ROLE_DASHBOARD = {
    patient: '/patient/dashboard',
    doctor: '/doctor/dashboard',
    clinic: '/clinic/dashboard',
    medical: '/medical/dashboard',
    hospital: '/hospital/dashboard',
};

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const searchInputRef = useRef(null);
    const profileRef = useRef(null);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    const { user, profile, signOut, loading } = useAuth();
    const { patient, signOut: patientSignOut, loading: patientLoading } = usePatient();
    const activeProfile = profile ?? patient ?? null;
    const isLoggedIn = !loading && !patientLoading && !!user && !!activeProfile;

    // Close profile dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (isMobile && isMenuOpen) setIsSearchOpen(false);
    }, [isMenuOpen, isMobile]);

    useEffect(() => {
        if (isMobile && isSearchOpen) setIsMenuOpen(false);
    }, [isSearchOpen, isMobile]);

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) return;
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        // Sign out from both AuthContext (Supabase session) and PatientContext (local state)
        await signOut();
        await patientSignOut();
        navigate('/');
    };

    const navLinks = [
        { href: '/', name: 'Home' },
        { href: '/patient/dashboard', name: 'My Appointments' },
        { href: '/blogs', name: 'Blog' },
        { href: '#features', name: 'Our Services' },
    ];

    const searchTransition = { duration: 0.4, ease: 'easeInOut' };

    // ── Profile dropdown (desktop) ─────────────────────────
    const ProfileDropdown = ({ isMobileView = false }) => (
        <div className="relative" ref={profileRef}>
            <button
                onClick={() => setIsProfileOpen(s => !s)}
                className={cn(
                    "flex items-center rounded-full border border-primary/30 bg-card/60 transition focus:outline-none",
                    isMobileView ? "p-1" : "gap-2 px-3 py-1.5 hover:bg-primary/10"
                )}
            >
                {/* Avatar circle with initials */}
                <div className={cn(
                    "rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold flex-shrink-0",
                    isMobileView ? "h-8 w-8 text-[10px]" : "h-7 w-7 text-xs"
                )}>
                    {getInitials(activeProfile?.full_name)}
                </div>
                {!isMobileView && (
                    <>
                        <span className="text-sm font-semibold text-foreground max-w-[110px] truncate hidden sm:block">
                            {activeProfile?.full_name?.split(' ')[0] ?? 'Account'}
                        </span>
                        <ChevronDown size={13} className={`text-primary/70 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-[100] overflow-hidden"
                    >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                            <p className="text-sm font-bold text-slate-800 truncate">{activeProfile?.full_name}</p>
                            <p className="text-xs text-teal-600 font-medium mt-0.5">
                                {ROLE_LABELS[activeProfile?.profile_type] ?? activeProfile?.profile_type}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                        </div>

                        {/* Dashboard link */}
                        <button
                            onClick={() => {
                                setIsProfileOpen(false);
                                navigate(ROLE_DASHBOARD[activeProfile?.profile_type] ?? '/');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition text-left"
                        >
                            <LayoutDashboard size={15} className="text-slate-400" />
                            My Dashboard
                        </button>

                        {/* Sign out */}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition text-left border-t border-slate-100"
                        >
                            <LogOut size={15} className="text-red-400" />
                            Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <header className="relative z-50 w-full px-4 pt-4">
            <div className="relative z-50 w-full max-w-[1360px] mx-auto flex h-16 sm:h-20 items-center justify-between rounded-full bg-white/90 backdrop-blur-md px-3 sm:px-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/50 transition-all duration-300">
                {/* Left Section - Logo */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-teal-200 bg-white shadow-sm ring-4 ring-teal-50/50 group-hover:ring-teal-100/50 transition-all">
                        <img src="/logo.png" alt="Upchar Logo" className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-1 tracking-tight">
                        <span className="font-extrabold text-base sm:text-lg lg:text-xl text-teal-600 leading-tight">
                            Upchar
                        </span>
                        <span className='font-bold text-xs sm:text-lg lg:text-xl text-slate-400 sm:text-red-600 hidden md:block lg:hidden xl:block'>Health</span>
                    </div>
                </Link>

                {/* Center/Right Section Logic */}
                <div className="flex-1 flex justify-end md:justify-center items-center px-2 lg:px-4">
                    {/* --- Desktop Navigation --- */}
                    <div className={cn(
                        "hidden md:flex items-center gap-1 transition-all duration-300 ease-in-out w-full justify-center",
                        isSearchOpen ? 'max-w-md' : 'max-w-max'
                    )}>
                        <AnimatePresence initial={false}>
                            {isSearchOpen ? (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={searchTransition}
                                    className="relative flex w-full items-center bg-slate-50/80 rounded-full border border-primary/20 p-1"
                                >
                                    <Search className="absolute left-3 h-4 w-4 text-primary" />
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search doctors..."
                                        className="w-full rounded-full border-none bg-transparent pl-10 pr-10 text-primary placeholder:text-primary/70 focus:ring-0 h-9 text-xs sm:text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setIsSearchOpen(false)
                                        }}
                                    />
                                    <Button onClick={() => setIsSearchOpen(false)} variant="ghost" size="icon" className="absolute right-1 rounded-full text-primary hover:bg-primary/10 h-7 w-7">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="nav"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-0.5"
                                >
                                    <NavigationMenu>
                                        <NavigationMenuList className="gap-0 border-none bg-transparent">
                                            {navLinks.map(link => {
                                                if (link.href.startsWith('#')) {
                                                    return (
                                                        <NavigationMenuItem key={link.name}>
                                                            <a
                                                                href={link.href}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const target = document.querySelector(link.href);
                                                                    if (target) {
                                                                        target.scrollIntoView({ behavior: 'smooth' });
                                                                    }
                                                                    setIsMenuOpen(false);
                                                                }}
                                                                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-slate-600 hover:text-teal-600 hover:bg-teal-50/50 rounded-full font-bold px-3 lg:px-5 text-[11px] lg:text-sm transition-all")}
                                                            >
                                                                {link.name}
                                                            </a>
                                                        </NavigationMenuItem>
                                                    );
                                                }
                                                return (
                                                    <NavigationMenuItem key={link.name}>
                                                        <Link
                                                            to={link.href}
                                                            className={cn(navigationMenuTriggerStyle(), "bg-transparent text-slate-600 hover:text-teal-600 hover:bg-teal-50/50 rounded-full font-bold px-3 lg:px-5 text-[11px] lg:text-sm transition-all")}
                                                        >
                                                            {link.name}
                                                        </Link>
                                                    </NavigationMenuItem>
                                                );
                                            })}
                                        </NavigationMenuList>
                                    </NavigationMenu>
                                    <Button onClick={() => setIsSearchOpen(true)} variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors h-9 w-9">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- Mobile Controls --- */}
                    <div className="flex md:hidden items-center gap-2">
                        <Button
                            onClick={() => setIsSearchOpen(true)}
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-slate-50 text-slate-600 h-9 w-9 border border-slate-100"
                        >
                            <Search size={18} />
                        </Button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition shadow-sm border border-slate-100 active:scale-95"
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Desktop Auth Buttons / Profile Icon */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {isLoggedIn ? (
                        /* ── Logged-in: profile avatar dropdown ── */
                        <ProfileDropdown />
                    ) : (
                        /* ── Logged-out: Sign In + Sign Up buttons ── */
                        <div className="flex items-center gap-1 lg:gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDoctorModalOpen(true)}
                                className="hidden lg:flex rounded-full border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 gap-1.5 text-xs lg:text-sm h-8 lg:h-10 transition-all font-bold"
                            >
                                <Stethoscope className="h-3 w-3 lg:h-4 lg:w-4" />
                                Join as a Doctor
                            </Button>
                            <Button variant="ghost" className="rounded-full text-slate-600 hover:text-teal-600 hover:bg-teal-50 px-2 lg:px-4 text-[11px] lg:text-sm h-8 lg:h-10 font-bold" asChild>
                                <Link to="/login">Sign In</Link>
                            </Button>
                            <Button className="rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 px-3 lg:px-6 text-[11px] lg:text-sm h-8 lg:h-10 transition-all font-bold" asChild>
                                <Link to="/register">Sign Up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Mobile Menu / Search --- */}
            <AnimatePresence>
                {isMobile && isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="md:hidden mt-2 p-4"
                    >
                        <div className="relative flex w-full items-center rounded-full bg-card shadow-md p-1 border border-primary/30">
                            <Search className="absolute left-4 h-5 w-5 text-primary" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search..."
                                className="w-full rounded-full border-none bg-transparent pl-11 pr-10 h-12 text-base focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setIsSearchOpen(false)
                                }}
                            />
                            <Button onClick={() => setIsSearchOpen(false)} variant="ghost" size="icon" className="absolute right-2 rounded-full text-primary hover:bg-primary/10">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </motion.div>
                )}
                {isMobile && isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: -10 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: -10 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="md:hidden mt-2 p-4 bg-card rounded-lg shadow-lg"
                    >
                        <nav className="flex flex-col gap-4">
                            {navLinks.map(link => {
                                if (link.href.startsWith('#')) {
                                    return (
                                        <a 
                                            key={link.href} 
                                            href={link.href} 
                                            className="text-foreground font-medium py-2" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const target = document.querySelector(link.href);
                                                if (target) {
                                                    target.scrollIntoView({ behavior: 'smooth' });
                                                }
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            {link.name}
                                        </a>
                                    );
                                }
                                return (
                                    <Link key={link.href} to={link.href} className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                                        {link.name}
                                    </Link>
                                );
                            })}
                            <div className="border-t border-border pt-4 flex flex-col gap-3">
                                {isLoggedIn ? (
                                    /* ── Logged-in mobile menu ── */
                                    <>
                                        {/* User info pill */}
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-teal-50 border border-teal-100">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {getInitials(activeProfile?.full_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{activeProfile?.full_name}</p>
                                                <p className="text-xs text-teal-600 font-medium">{ROLE_LABELS[activeProfile?.profile_type]}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                                className="w-full rounded-full border-teal-300 text-teal-700 gap-2"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                navigate(ROLE_DASHBOARD[activeProfile?.profile_type] ?? '/');
                                            }}
                                        >
                                            <LayoutDashboard size={16} />
                                            My Dashboard
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-full border-red-200 text-red-600 gap-2"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </Button>
                                    </>
                                ) : (
                                    /* ── Logged-out mobile menu ── */
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setIsMenuOpen(false); setIsDoctorModalOpen(true); }}
                                            className="w-full rounded-full border-primary/60 text-primary gap-1.5"
                                        >
                                            <Stethoscope className="h-4 w-4" />
                                            Join as a Doctor
                                        </Button>
                                        <Button variant="outline" className="w-full rounded-full border-primary text-primary" asChild>
                                            <Link to="/login">Sign In</Link>
                                        </Button>
                                        <Button className="w-full rounded-full hover:bg-primary/90 shadow-[0_10px_30px_hsl(var(--primary)/0.15)]" asChild>
                                            <Link to="/register">Sign Up</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            <DoctorOnboardingModal
                isOpen={isDoctorModalOpen}
                onClose={() => setIsDoctorModalOpen(false)}
            />
        </header>
    );
};
