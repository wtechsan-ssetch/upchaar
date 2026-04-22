import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Store,
    Search,
    Star,
    ArrowUpRight,
    PhoneCall,
    ChevronRight,
    Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function MedicalsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [medicals, setMedicals] = useState([]);

    useEffect(() => {
        // Fetch registered medicals & clinics directly from their respective tables
        const fetchMedicals = async () => {
            setLoading(true);
            try {
                // Fetch from medicals table
                const { data: medicalsData, error: medicalsError } = await supabase
                    .from('medicals')
                    .select('*');

                // Fetch from clinics table
                const { data: clinicsData, error: clinicsError } = await supabase
                    .from('clinics')
                    .select('*');
                
                let merged = [];
                
                if (!medicalsError && medicalsData) {
                    const mappedMedicals = medicalsData.map(m => ({
                        ...m,
                        full_name: m.name,
                        profile_type: 'medical'
                    }));
                    merged = [...merged, ...mappedMedicals];
                }

                if (!clinicsError && clinicsData) {
                    const mappedClinics = clinicsData.map(c => ({
                        ...c,
                        full_name: c.name,
                        profile_type: 'clinic'
                    }));
                    merged = [...merged, ...mappedClinics];
                }

                // If fetching from those tables isn't returning anything, fallback to profiles for backward compatibility
                if (merged.length === 0) {
                     const { data: profileData, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('profile_type', ['medical', 'clinic', 'hospital']);
                     if (!error && profileData) {
                         merged = profileData;
                     }
                }

                setMedicals(merged);
            } catch (err) {
                console.error("Error fetching facilities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedicals();
    }, []);

    const filteredMedicals = medicals.filter(m => {
        const nameMatch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = m.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = m.profile_type?.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || emailMatch || typeMatch;
    });

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header / Hero */}
            <div className="flex flex-col gap-6 pt-10 px-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline text-slate-900">
                        Nearby <span className="text-emerald-600">Medicals & Clinics</span>
                    </h1>
                    <p className="text-slate-500 text-lg mt-2 font-medium">
                        Find verified medical stores, pharmacies, and clinics in your area.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Find medicals by name..."
                            className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium border-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="px-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="space-y-3">
                                <Skeleton height={200} borderRadius="2.5rem" />
                                <Skeleton height={30} width="80%" />
                                <Skeleton height={20} width="60%" />
                                <Skeleton height={50} borderRadius="1rem" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredMedicals.length > 0 ? (
                                filteredMedicals.map((medical, index) => (
                                    <motion.div
                                        key={medical.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        layout
                                    >
                                        <Card className="group h-full border-slate-100 hover:border-emerald-500/20 transition-all duration-300 shadow-sm hover:shadow-2xl overflow-hidden rounded-[2.5rem] bg-white flex flex-col">
                                            <div className="relative h-48 bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-600/20" />
                                                <Store className="w-20 h-20 text-emerald-600/40 group-hover:scale-110 transition-transform duration-700" />
                                                
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="bg-emerald-500 text-white border-0 font-bold px-3 py-1 shadow-md">
                                                            <Star className="w-3 h-3 mr-1 fill-white inline" /> 4.8
                                                        </Badge>
                                                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
                                                            <ArrowUpRight className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <CardHeader className="space-y-1">
                                                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">
                                                    <Activity className="w-3.5 h-3.5" />
                                                    {medical.profile_type}
                                                </div>
                                                <CardTitle className="text-2xl font-extrabold text-slate-800 line-clamp-1">
                                                    {medical.full_name || 'Unnamed Facility'}
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5 text-slate-400 font-medium text-sm line-clamp-1">
                                                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                                                    {medical.email}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4 flex-grow">
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-500 flex items-center gap-1 font-medium bg-slate-50/50">
                                                        <span className={medical.status === 'active' ? 'w-2 h-2 rounded-full bg-emerald-500 mr-1' : 'w-2 h-2 rounded-full bg-amber-500 mr-1'} />
                                                        {medical.status && typeof medical.status === 'string' 
                                                            ? medical.status.charAt(0).toUpperCase() + medical.status.slice(1) 
                                                            : 'Active'}
                                                    </Badge>
                                                    {medical.phone && (
                                                        <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-500 flex items-center gap-1 font-medium bg-slate-50/50">
                                                            <PhoneCall className="w-3 h-3 mr-1" /> Contact Available
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>

                                            <CardFooter className="pt-0 p-6 flex gap-3 mt-auto">
                                                <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50 gap-2 border-2">
                                                    <PhoneCall className="w-4 h-4" /> Call
                                                </Button>
                                                <Button className="flex-[2] h-12 rounded-2xl bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 group/btn shadow-xl shadow-emerald-900/20">
                                                    View Details
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md mb-6">
                                        <Search className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">No medicals found</h3>
                                    <p className="text-slate-500 font-medium">Try adjusting your search criteria.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
