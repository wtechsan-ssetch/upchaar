import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Stethoscope, Hospital, FlaskConical, Heart } from 'lucide-react';
import { motionVariants } from '@/lib/animations';
import { useAuth } from '@/auth/AuthContext.jsx';

export const QuickAccess = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const quickAccessItems = [
        { icon: Stethoscope, title: 'Find Doctors', desc: 'Consult with verified specialists.', href: "/doctors", requireAuth: true },
        { icon: Hospital, title: 'Hospitals', desc: 'Real-time bed availability', href: "/hospitals", requireAuth: true },
        { icon: FlaskConical, title: 'Diagnostics', desc: 'Book lab tests & health checkups', href: "/diagnostics", requireAuth: true },
        { icon: Heart, title: 'Emergency', desc: '24/7 emergency services', href: "/emergency", requireAuth: false },
    ];

    const handleClick = (href, requireAuth) => {
        if (requireAuth && !loading && !user) {
            // Not logged in → go to sign in, come back here after
            navigate('/login', { state: { from: href } });
            return;
        }
        navigate(href);
    };

    return (
        <section id="quick-access" ref={ref} className="container space-y-6 py-12 md:py-24">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary">Quick Access to Healthcare</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                    Everything you need for your health journey in one place.
                </p>
            </div>
            <motion.div
                className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:grid-cols-4"
                style={{ perspective: '1000px' }}
                variants={motionVariants.staggerContainer}
                initial="hidden"
                animate={isInView ? 'show' : 'hidden'}
            >
                {quickAccessItems.map((item, i) => (
                    <motion.div key={i} variants={motionVariants.slideUp(0)}>
                        <button
                            onClick={() => handleClick(item.href, item.requireAuth)}
                            className="block h-full w-full text-left"
                        >
                            <motion.div
                                whileHover="hover"
                                variants={motionVariants.card3DHover}
                                className="h-full"
                            >
                                <Card className="h-full text-center p-6 flex flex-col items-center justify-center transition-shadow duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/20 rounded-2xl cursor-pointer">
                                    <motion.div
                                        variants={{
                                            hover: { scale: 1.1, y: -5 },
                                        }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className="mb-4 text-primary"
                                    >
                                        <item.icon className="h-10 w-10" />
                                    </motion.div>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-800">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                                </Card>
                            </motion.div>
                        </button>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};
