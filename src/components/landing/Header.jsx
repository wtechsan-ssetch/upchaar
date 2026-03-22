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
    const { signOut: patientSignOut } = usePatient();
    const isLoggedIn = !loading && !!user && !!profile;

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
    const ProfileDropdown = () => (
        <div className="relative" ref={profileRef}>
            <button
                onClick={() => setIsProfileOpen(s => !s)}
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-3 py-1.5 hover:bg-primary/10 transition focus:outline-none"
            >
                {/* Avatar circle with initials */}
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(profile?.full_name)}
                </div>
                <span className="text-sm font-semibold text-foreground max-w-[110px] truncate hidden lg:block">
                    {profile?.full_name?.split(' ')[0] ?? 'Account'}
                </span>
                <ChevronDown size={13} className={`text-primary/70 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                    >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                            <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name}</p>
                            <p className="text-xs text-teal-600 font-medium mt-0.5">
                                {ROLE_LABELS[profile?.profile_type] ?? profile?.profile_type}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                        </div>

                        {/* Dashboard link */}
                        <button
                            onClick={() => {
                                setIsProfileOpen(false);
                                navigate(ROLE_DASHBOARD[profile?.profile_type] ?? '/');
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
        <header className="w-full">
            <div className="container mx-auto flex h-20 items-center justify-between rounded-full bg-card/80 backdrop-blur-sm px-6 shadow-md">
                {/* Left Section - Logo */}
                <Link to="#footer" className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-card">
                        <img src="/logo.png" alt="Sanjiwani Health Logo" width={24} height={24} />
                    </div>
                    <span className="font-bold text-xl text-primary hidden sm:inline-block text-red-500">
                        Sanjiwani
                    </span>
                    <span className='font-bold text-xl text-primary hidden sm:inline-block'>Health</span>
                </Link>

                {/* Center/Right Section Logic */}
                <div className="flex flex-1 justify-end md:justify-center items-center gap-2">
                    {/* --- Desktop/Tablet Navigation Pill --- */}
                    <div className={cn(
                        "hidden md:flex items-center gap-2 rounded-full border border-primary/30 bg-card/50 p-1 transition-all duration-300 ease-in-out",
                        isSearchOpen ? 'w-full max-w-md' : 'w-auto'
                    )}>
                        <AnimatePresence initial={false}>
                            {isSearchOpen ? (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, width: '0%' }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0, width: '0%' }}
                                    transition={searchTransition}
                                    className="relative flex w-full items-center"
                                >
                                    <Search className="absolute left-3 h-5 w-5 text-primary" />
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search doctors, hospitals, services…"
                                        className="w-full rounded-full border-none bg-transparent pl-10 pr-10 text-primary placeholder:text-primary/70 focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setIsSearchOpen(false)
                                        }}
                                    />
                                    <Button onClick={() => setIsSearchOpen(false)} variant="ghost" size="icon" className="absolute right-1 rounded-full text-primary hover:bg-primary/10 hover:text-primary">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="nav"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center"
                                >
                                    <NavigationMenu>
                                        <NavigationMenuList>
                                            {navLinks.map(link => (
                                                <NavigationMenuItem key={link.name}>
                                                    <Link
                                                        to={link.href}
                                                        className={cn(navigationMenuTriggerStyle(), "bg-transparent text-foreground hover:bg-primary/10 rounded-full font-medium")}
                                                    >
                                                        {link.name}
                                                    </Link>
                                                </NavigationMenuItem>
                                            ))}
                                        </NavigationMenuList>
                                    </NavigationMenu>
                                    <Button onClick={() => setIsSearchOpen(true)} variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10 hover:text-primary">
                                        <Search className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- Mobile Icons --- */}
                    <div className="flex md:hidden items-center gap-2">
                        <Button onClick={() => setIsSearchOpen(true)} variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10">
                            <Search className="h-6 w-6" />
                        </Button>
                        <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10">
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Desktop Auth Buttons / Profile Icon */}
                <div className="hidden md:flex items-center gap-2 ml-4">
                    {isLoggedIn ? (
                        /* ── Logged-in: profile avatar dropdown ── */
                        <ProfileDropdown />
                    ) : (
                        /* ── Logged-out: Sign In + Sign Up buttons ── */
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsDoctorModalOpen(true)}
                                className="rounded-full border-primary/60 text-primary hover:bg-primary/10 hover:text-primary gap-1.5 text-sm"
                            >
                                <Stethoscope className="h-4 w-4" />
                                Join as a Doctor
                            </Button>
                            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary" asChild>
                                <Link to="/login">Sign In</Link>
                            </Button>
                            <Button className="rounded-full hover:bg-primary/90 shadow-[0_10px_30px_hsl(var(--primary)/0.15)]" asChild>
                                <Link to="/register">Sign Up</Link>
                            </Button>
                        </>
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
                            {navLinks.map(link => (
                                <Link key={link.href} to={link.href} className="text-foreground font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                                    {link.name}
                                </Link>
                            ))}
                            <div className="border-t border-border pt-4 flex flex-col gap-3">
                                {isLoggedIn ? (
                                    /* ── Logged-in mobile menu ── */
                                    <>
                                        {/* User info pill */}
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-teal-50 border border-teal-100">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {getInitials(profile?.full_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name}</p>
                                                <p className="text-xs text-teal-600 font-medium">{ROLE_LABELS[profile?.profile_type]}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-full border-teal-300 text-teal-700 gap-2"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                navigate(ROLE_DASHBOARD[profile?.profile_type] ?? '/');
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
