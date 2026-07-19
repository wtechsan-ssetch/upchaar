import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { motionVariants } from '@/lib/animations';

const stats = [
    { value: '3', label: 'Verified Doctors' },
    { value: '2', label: 'Partner Hospitals' },
];

const diagnosticStats = [
    { value: '5', label: 'Partner Diagnostic Centers' },
    { value: '5', label: 'Partner Medical Clinics' },
];

export const TrustBadges = () => {
    const navigate = useNavigate();

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

                {/* About Us — clickable card linking to /about-us */}
                <button
                    onClick={() => navigate('/about-us')}
                    className="bg-white p-4 rounded-lg shadow-md col-span-2 md:col-span-1 flex flex-col items-center justify-center
                               cursor-pointer border-2 border-transparent
                               hover:border-primary hover:shadow-lg hover:scale-105
                               transition-all duration-200 group w-full"
                >
                    <span className="text-lg font-bold text-gray-700 group-hover:text-primary transition-colors duration-200">
                        About Us
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 group-hover:text-primary/70 transition-colors duration-200">
                        Learn more →
                    </span>
                </button>

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

