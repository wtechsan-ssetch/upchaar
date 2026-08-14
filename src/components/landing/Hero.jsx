import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { motionVariants } from '@/lib/animations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext.jsx';

/* ── Inline SVG sub-components for decorations ─────────────── */

const IndianFlag = ({ className = '' }) => (
    <svg viewBox="0 0 60 40" className={className} fill="none">
        <rect width="60" height="13.3" fill="#FF9933" rx="2" />
        <rect y="13.3" width="60" height="13.4" fill="#FFFFFF" />
        <rect y="26.7" width="60" height="13.3" fill="#138808" rx="2" />
        <circle cx="30" cy="20" r="4" fill="#000080" opacity="0.8" />
        <circle cx="30" cy="20" r="3" fill="#FFFFFF" />
        <circle cx="30" cy="20" r="1.2" fill="#000080" />
        {/* Ashoka Chakra spokes */}
        {Array.from({ length: 24 }).map((_, i) => (
            <line
                key={i}
                x1="30"
                y1="20"
                x2={30 + 3 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={20 + 3 * Math.sin((i * 15 * Math.PI) / 180)}
                stroke="#000080"
                strokeWidth="0.3"
            />
        ))}
    </svg>
);

const Balloon = ({ color, x, delay = 0 }) => (
    <motion.div
        className="absolute"
        style={{ right: x, top: -10 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
        <svg width="32" height="48" viewBox="0 0 32 48">
            <ellipse cx="16" cy="16" rx="12" ry="16" fill={color} opacity="0.85" />
            <ellipse cx="16" cy="16" rx="12" ry="16" fill="url(#shine)" opacity="0.3" />
            <polygon points="16,32 14,35 18,35" fill={color} opacity="0.7" />
            <line x1="16" y1="35" x2="16" y2="48" stroke={color} strokeWidth="0.8" opacity="0.5" />
            <defs>
                <radialGradient id="shine" cx="40%" cy="30%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
            </defs>
        </svg>
    </motion.div>
);

const MonumentSilhouette = () => (
    <svg viewBox="0 0 1200 120" className="w-full h-auto" preserveAspectRatio="none" fill="none">
        {/* India Gate silhouette - center */}
        <g opacity="0.08" fill="#138808">
            {/* India Gate main structure */}
            <rect x="540" y="40" width="120" height="80" rx="2" />
            <rect x="550" y="50" width="100" height="60" rx="40" fill="#f7f9fb" />
            <rect x="545" y="35" width="110" height="8" rx="1" />
            <rect x="548" y="28" width="104" height="8" rx="1" />
            {/* Left pillar */}
            <rect x="540" y="40" width="15" height="80" />
            {/* Right pillar */}
            <rect x="645" y="40" width="15" height="80" />
            {/* Dome on top */}
            <ellipse cx="600" cy="28" rx="20" ry="8" />
            {/* Taj Mahal left */}
            <rect x="200" y="60" width="80" height="60" rx="2" />
            <ellipse cx="240" cy="60" rx="30" ry="20" />
            <rect x="195" y="50" width="6" height="70" />
            <rect x="279" y="50" width="6" height="70" />
            {/* Qutub Minar right */}
            <polygon points="900,120 910,30 920,120" />
            <rect x="907" y="25" width="6" height="10" rx="1" />
            {/* Trees/foliage */}
            <ellipse cx="150" cy="100" rx="30" ry="20" />
            <ellipse cx="170" cy="95" rx="25" ry="22" />
            <ellipse cx="1050" cy="100" rx="30" ry="20" />
            <ellipse cx="1030" cy="95" rx="25" ry="22" />
        </g>
    </svg>
);

const TricolorWave = () => (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 120" className="w-full" preserveAspectRatio="none" fill="none">
            {/* Saffron wave */}
            <path
                d="M0,60 C180,20 360,80 540,50 C720,20 900,70 1080,40 C1200,25 1320,55 1440,30 L1440,45 C1320,70 1200,40 1080,55 C900,85 720,35 540,65 C360,95 180,35 0,75 Z"
                fill="#FF9933"
                opacity="0.5"
            />
            {/* White wave */}
            <path
                d="M0,75 C180,35 360,95 540,65 C720,35 900,85 1080,55 C1200,40 1320,70 1440,45 L1440,65 C1320,90 1200,60 1080,75 C900,105 720,55 540,85 C360,115 180,55 0,95 Z"
                fill="#FFFFFF"
                opacity="0.85"
            />
            {/* Green wave */}
            <path
                d="M0,95 C180,55 360,115 540,85 C720,55 900,105 1080,75 C1200,60 1320,90 1440,65 L1440,120 L0,120 Z"
                fill="#138808"
                opacity="0.55"
            />
        </svg>
    </div>
);

const QuoteCard = () => (
    <motion.div
        className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg p-5 max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
    >
        {/* Quote marks */}
        <span className="absolute -top-3 -left-1 text-4xl text-emerald-400 font-serif leading-none select-none">"</span>
        <p className="text-sm md:text-base text-slate-700 leading-relaxed pl-4 border-l-2 border-emerald-300">
            Take care of your health today,
            <br />
            so you can enjoy the freedom of a stronger tomorrow.
        </p>
        {/* Heart icon */}
        <motion.div
            className="absolute -bottom-3 -right-3"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="#10b981"
                    opacity="0.7"
                />
            </svg>
        </motion.div>
    </motion.div>
);

export const Hero = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const handleBookAppointment = () => {
        if (!loading && user) {
            navigate('/doctors');
        } else {
            navigate('/appointment-options');
        }
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50/60 via-white to-emerald-50/40">
            {/* Saffron corner wash - top left */}
            <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-gradient-to-br from-orange-200/40 via-orange-100/20 to-transparent rounded-br-full pointer-events-none" />
            {/* Green corner wash - top right */}
            <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-gradient-to-bl from-emerald-100/30 to-transparent pointer-events-none" />

            {/* ── Independence Day Banner ──────────────────────────── */}
            <div className="container relative z-20 pt-6 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: 15 August badge */}
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="relative flex items-center gap-2 bg-gradient-to-r from-orange-100 to-green-100 border border-orange-200/60 rounded-xl px-4 py-2 shadow-sm">
                            <span className="text-3xl md:text-4xl font-black text-orange-600 leading-none">15</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] md:text-xs font-bold text-orange-700 uppercase tracking-wider">August</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-green-700 uppercase tracking-widest">Independence Day</span>
                            </div>
                            <IndianFlag className="w-8 h-6 ml-1" />
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-500 italic hidden sm:block">
                            Freedom to Health, Freedom to Live
                        </p>
                    </motion.div>

                    {/* Center: Happy Independence Day */}
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <span className="text-sm text-slate-500 uppercase tracking-wider font-medium hidden md:inline">Happy</span>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold italic bg-gradient-to-r from-orange-500 via-blue-700 to-green-600 bg-clip-text text-transparent">
                            Independence Day
                        </h2>
                        {/* Decorative tricolor feathers */}
                        <div className="flex flex-col gap-0 ml-1 hidden md:flex">
                            <div className="w-6 h-1 bg-orange-400 rounded-full" />
                            <div className="w-5 h-1 bg-white border border-slate-200 rounded-full" />
                            <div className="w-6 h-1 bg-green-500 rounded-full" />
                        </div>
                    </motion.div>

                    {/* Right: Proud to Serve */}
                    <motion.div
                        className="text-right hidden lg:block"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <p className="text-sm md:text-base font-semibold text-slate-700">
                            Proud to <span className="text-green-600 font-bold">Serve.</span>
                        </p>
                        <p className="text-sm md:text-base font-semibold text-slate-700">
                            Honored to <span className="text-green-600 font-bold">Care.</span>
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Main Hero Content ────────────────────────────────── */}
            <div className="container relative z-20 grid lg:grid-cols-2 items-center gap-8 md:gap-12 pt-6 md:pt-10 pb-24 md:pb-32">
                {/* Left Column — Text */}
                <motion.div
                    className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6"
                    variants={motionVariants.staggerContainer}
                    initial="hidden"
                    animate="show"
                >
                    <motion.h1
                        className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl font-headline"
                        variants={motionVariants.slideInLeft}
                    >
                        Your <span className="text-primary font-extrabold">Health,</span> <br />
                        Connected With Care.
                    </motion.h1>

                    <motion.div
                        className="flex items-center gap-4 max-w-md text-muted-foreground sm:text-lg"
                        variants={motionVariants.slideUp(0.2)}
                    >
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <p>
                            Find trusted clinics and hospitals near you in just a few taps
                        </p>
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                        variants={motionVariants.slideUp(0.4)}
                    >
                        <Button
                            size="lg"
                            variant="default"
                            className="w-full sm:w-auto shadow-[0_10px_30px_hsl(var(--primary)/0.15)] rounded-full px-8"
                            onClick={handleBookAppointment}
                        >
                            Book Appointment
                        </Button>
                        {!loading && !user && (
                            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8" asChild>
                                <NavLink to="/login">Get Started for Free</NavLink>
                            </Button>
                        )}
                    </motion.div>

                    {/* Quote card */}
                    <div className="mt-4 hidden md:block">
                        <QuoteCard />
                    </div>
                </motion.div>

                {/* Right Column — Doctor Image + Decorations */}
                <motion.div
                    className="relative flex justify-center lg:justify-end"
                    variants={motionVariants.slideInRight}
                    initial="hidden"
                    animate="show"
                >
                    {/* Balloons */}
                    <Balloon color="#FF9933" x="20px" delay={0} />
                    <Balloon color="#FFFFFF" x="60px" delay={0.5} />
                    <Balloon color="#138808" x="0px" delay={1} />

                    {/* Doctor image — natural/non-circular */}
                    <img
                        src="/doctor.png"
                        alt="Friendly doctor"
                        width={550}
                        height={550}
                        className="relative z-10 object-contain w-[280px] sm:w-[350px] lg:w-[480px] xl:w-[520px] drop-shadow-2xl"
                    />

                    {/* Subtle glow behind doctor */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-orange-100/50 via-white/30 to-emerald-100/50 rounded-full blur-3xl -z-0" />
                </motion.div>
            </div>

            {/* ── Monument silhouettes ──────────────────────────────── */}
            <div className="absolute bottom-16 md:bottom-20 left-0 right-0 pointer-events-none z-0">
                <MonumentSilhouette />
            </div>

            {/* ── Tricolor wave at bottom ──────────────────────────── */}
            <TricolorWave />
        </section>
    );
};
