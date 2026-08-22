import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { motionVariants } from '@/lib/animations';

const stats = [
    { value: '100+', label: 'Doctors Onboarding' },
    { value: '50+', label: 'Medical Partners Coming' },
];

const diagnosticStats = [
    { value: '20+', label: 'Diagnostic Centers Joining' },
    { value: 'Coming Soon', label: 'Partner Hospitals' },
];

export const TrustBadges = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            className="container mx-auto px-4"
            variants={motionVariants.fadeIn}
            initial="hidden"
            animate="show"
        >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center items-center">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-center h-full min-h-[90px]">
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">{stat.label}</p>
                    </div>
                ))}

                {/* About Us — clickable card linking to /about-us */}
                <button
                    onClick={() => navigate('/about-us')}
                    className="bg-white p-4 rounded-xl shadow-sm border-2 border-slate-100 col-span-2 md:col-span-1 flex flex-col items-center justify-center
                               cursor-pointer hover:border-primary hover:shadow-md hover:scale-105
                               transition-all duration-200 group w-full h-full min-h-[90px]"
                >
                    <span className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors duration-200">
                        About Us
                    </span>
                    <span className="text-xs font-semibold text-primary/80 mt-1 group-hover:text-primary transition-colors duration-200">
                        Learn more →
                    </span>
                </button>

                {diagnosticStats.map(stat => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-center h-full min-h-[90px]">
                        <p className={stat.value.length > 5 ? "text-lg sm:text-xl font-extrabold text-primary" : "text-2xl sm:text-3xl font-extrabold text-primary"}>
                            {stat.value}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
