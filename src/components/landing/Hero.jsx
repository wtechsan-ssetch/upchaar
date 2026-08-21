import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { motionVariants } from '@/lib/animations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext.jsx';



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
        <section className="container grid lg:grid-cols-2 items-center gap-8 md:gap-12 pt-8 md:pt-16 pb-12 overflow-hidden">
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
                    Your <span className="text-primary">Health,</span> <br />
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
                        className="w-full sm:w-auto shadow-[0_10px_30px_hsl(var(--primary)/0.15)]"
                        onClick={handleBookAppointment}
                    >
                        Book Appointment
                    </Button>
                    {!loading && !user && (
                        <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                            <NavLink to="/login">Get Started for Free</NavLink>
                        </Button>
                    )}
                </motion.div>
            </motion.div>
            <motion.div
                className="relative flex justify-center lg:justify-end"
                variants={motionVariants.slideInRight}
                initial="hidden"
                animate="show"
            >
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob hidden lg:block"></div>
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-destructive/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 hidden lg:block"></div>
                <img
                    src="/doctor.png"
                    alt="Friendly doctor"
                    width={600}
                    height={600}
                    className="relative rounded-full object-cover w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px]"
                />
            </motion.div>
        </section>
    );
};
