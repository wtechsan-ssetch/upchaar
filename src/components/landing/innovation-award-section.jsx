import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { motionVariants } from '@/lib/animations';

export const InnovationAwardSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <section ref={ref} className="w-full bg-teal-50/50 py-16 md:py-24">
            <div className="container grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                    variants={motionVariants.slideInLeft}
                    initial="hidden"
                    animate={isInView ? "show" : "hidden"}
                    className="flex justify-center"
                >
                    <img src="/medal.png" alt="All India Idea & Innovation Competition Medal" width={350} height={500} className="rounded-lg object-contain" />
                </motion.div>
                <motion.div
                    variants={motionVariants.slideInRight}
                    initial="hidden"
                    animate={isInView ? "show" : "hidden"}
                >
                    <Badge variant="destructive" className="mb-4 bg-primary/10 text-primary border-transparent hover:bg-primary/20">Top 10 Innovation</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground font-headline mb-4">
                        Recognized as One of India's Top Innovations
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        Upchaar Health was honored to be selected as one of the top 10 innovations in the prestigious <strong>All India Idea & Innovation Competition</strong>, organized by the Ministry of Defence. This award celebrates our dedication to transforming healthcare accessibility through technology.
                    </p>
                    <div className="flex items-center gap-3 text-primary font-semibold">
                        <Award className="h-6 w-6" />
                        <span>All India Idea & Innovation Competition</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
