import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, FileText, ShieldCheck } from 'lucide-react';
import { motionVariants } from '@/lib/animations';

export const Features = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const features = [
        { icon: Zap, title: 'Instant Telehealth', desc: 'Connect with certified doctors within minutes, anytime, anywhere.' },
        { icon: FileText, title: 'Digital Health Records', desc: 'Securely store and access all your medical history in one place.' },
        { icon: ShieldCheck, title: 'Private & Secure', desc: 'Your data is encrypted and protected with industry-leading security.' },
    ];

    return (
        <section id="features" ref={ref} className="container space-y-6 bg-teal-50/50 py-12 md:py-24 rounded-lg">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Everything You Need for Better Health</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                    Upchar provides powerful tools to make healthcare more accessible and convenient.
                </p>
            </div>
            <motion.div
                className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3"
                variants={motionVariants.staggerContainer}
                initial="hidden"
                animate={isInView ? 'show' : 'hidden'}
            >
                {features.map((feature, i) => (
                    <motion.div key={i} variants={motionVariants.slideUp(0)}>
                        <motion.div whileHover="scale" variants={motionVariants.cardHover}>
                            <Card className="h-full">
                                <CardHeader>
                                    <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.desc}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};
