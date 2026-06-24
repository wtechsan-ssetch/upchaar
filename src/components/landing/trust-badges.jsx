import { motion } from 'framer-motion';
import { motionVariants } from '@/lib/animations';

const stats = [
    { value: '25+', label: 'Verified Doctors' },
    { value: '14+', label: 'Partner Hospitals' },
];

const diagnosticStats = [
    { value: '18+', label: 'Partner Diagnostic Centers' },
    { value: '10+', label: 'Partner Medical Clinics' },
];

export const TrustBadges = () => {
    return (
        <motion.div
            className="container mx-auto"
            variants={motionVariants.fadeIn}
            initial="hidden"
            animate="show"
        >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center items-center">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-4 rounded-lg shadow-md">
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
                <div className="bg-white p-4 rounded-lg shadow-md col-span-2 md:col-span-1 flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-gray-700 mb-2">About Us</p>
                    {/* <img src="/msme.png" alt="MSME Logo" width={80} height={40} /> */}
                </div>
                {diagnosticStats.map(stat => (
                    <div key={stat.label} className="bg-white p-4 rounded-lg shadow-md">
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
