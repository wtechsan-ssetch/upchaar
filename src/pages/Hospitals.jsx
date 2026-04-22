import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HospitalsPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8 max-w-3xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="relative"
            >
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-50 scale-150 -z-10" />
                <div className="h-32 w-32 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-slate-50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                    <Building2 className="w-14 h-14 text-emerald-600 relative z-10" />
                    <div className="absolute bottom-4 right-4 bg-amber-400 text-white rounded-full p-1.5 shadow-md z-20">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-slate-900 tracking-tight">
                    Hospitals Integration is <span className="text-emerald-600 block sm:inline">Coming Soon!</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
                    We are working hard to bring you the best network of multi-specialty hospitals. Soon you'll be able to discover, book, and coordinate care at top-rated facilities directly from our platform.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
            >
                <Button 
                    onClick={() => navigate('/')}
                    className="h-14 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-lg shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Return Home
                </Button>
            </motion.div>
        </div>
    );
}
