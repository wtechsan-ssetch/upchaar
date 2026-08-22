import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { motionVariants } from '@/lib/animations';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext.jsx';

const SERVICES = ['doctors', 'hospitals', 'clinics', 'diagnostic services'];

export const Hero = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentServiceIndex((prev) => (prev + 1) % SERVICES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const handleBookAppointment = () => {
        if (!loading && user) {
            navigate('/doctors');
        } else {
            navigate('/appointment-options');
        }
    };

    return (
        <section className="container grid lg:grid-cols-2 items-center gap-8 md:gap-12 pt-8 md:pt-16 pb-12 overflow-hidden">
            <motion.div
                className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6"
                variants={motionVariants.staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* Platform Badge */}
                <motion.div 
                    variants={motionVariants.slideInLeft}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold shadow-xs"
                >
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span>Your Trusted Healthcare Platform</span>
                </motion.div>

                {/* Animated Heading with Auto-changing Text & Left-to-Right Slide */}
                <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 font-headline"
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    Find trusted{' '}
                    <span className="inline-block relative text-primary min-w-[160px] sm:min-w-[220px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={SERVICES[currentServiceIndex]}
                                initial={{ opacity: 0, x: -25, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: 25, filter: 'blur(4px)' }}
                                transition={{ duration: 0.45, ease: "easeInOut" }}
                                className="inline-block bg-gradient-to-r from-primary via-teal-600 to-emerald-500 bg-clip-text text-transparent underline decoration-primary/25 underline-offset-4"
                            >
                                {SERVICES[currentServiceIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    <br className="hidden sm:inline" />
                    {' '}with <span className="text-primary font-black">Upchar Health</span>.
                </motion.h1>

                {/* Subtitle / Descriptive Text */}
                <motion.p
                    className="text-slate-600 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-xl"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    Find trusted doctors, hospitals, clinics and diagnostic services with Upchar Health. Book appointments, manage healthcare and access digital health services in one platform.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2"
                    variants={motionVariants.slideUp(0.4)}
                >
                    <Button
                        size="lg"
                        variant="default"
                        className="w-full sm:w-auto shadow-[0_10px_30px_hsl(var(--primary)/0.25)] text-base font-semibold px-8 py-6 rounded-xl hover:scale-105 transition-all"
                        onClick={handleBookAppointment}
                    >
                        Book Appointment
                    </Button>
                    {!loading && !user && (
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-xl border-slate-300 hover:border-primary hover:bg-slate-50 transition-all" asChild>
                            <NavLink to="/login">Get Started for Free</NavLink>
                        </Button>
                    )}
                </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
                className="relative flex justify-center lg:justify-end"
                variants={motionVariants.slideInRight}
                initial="hidden"
                animate="show"
            >
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob hidden lg:block"></div>
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 hidden lg:block"></div>
                <img
                    src="/doctor.png"
                    alt="Friendly doctor"
                    width={600}
                    height={600}
                    className="relative rounded-full object-cover w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[480px] lg:h-[480px] shadow-2xl border-4 border-white"
                />
            </motion.div>
        </section>
    );
};
