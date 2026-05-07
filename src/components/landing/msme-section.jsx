import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { motionVariants } from '@/lib/animations';

export const MsmeSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <section ref={ref} className="w-full bg-background py-16 px-6 md:px-20">
            <motion.div
                initial="hidden"
                animate={isInView ? "show" : "hidden"}
                variants={motionVariants.slideUp(0)}
                className="max-w-5xl mx-auto text-center"
            >
                <img src="/msme.png" alt="MSME Logo" width={150} height={150} className="mx-auto mb-8" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground font-headline">
                    Government Recognised MSME
                </h2>

                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                    Upchar Health is officially registered under the{" "}
                    <span className="font-semibold text-foreground">
                        MSME (Udyam) Scheme, Government of India
                    </span>.
                    This certification validates our commitment to building innovative
                    and impactful solutions in the Indian health-tech ecosystem.
                </p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10 mx-auto w-fit bg-destructive/10 text-destructive px-6 py-3 rounded-2xl text-lg font-semibold shadow-sm border border-destructive/20 flex items-center gap-2"
                >
                    <ShieldCheck className="h-6 w-6" />
                    <span>MSME Registered (UDYAM-XX-XX-XXXX8280)</span>
                </motion.div>

                <p className="text-sm text-muted-foreground mt-4">
                    *For security reasons, our complete Udyam number is not displayed publicly.
                </p>
            </motion.div>
        </section>
    );
}
