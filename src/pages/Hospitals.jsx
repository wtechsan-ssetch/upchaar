import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hospitals } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    Building2, 
    Search, 
    Star, 
    Navigation, 
    ShieldCheck, 
    PhoneCall, 
    Ambulance,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HospitalsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Multi-Specialty', 'Super Specialty', 'General', 'Trauma Care'];

    const filteredHospitals = hospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header / Hero */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline text-slate-900">
                        Top Rated <span className="text-emerald-600">Hospitals</span>
                    </h1>
                    <p className="text-slate-500 text-lg mt-2 font-medium">Discover world-class healthcare facilities with advanced medical technology and specialist care.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <Input 
                            placeholder="Find hospitals by name or specialty..." 
                            className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredHospitals.map((hospital, index) => (
                        <motion.div
                            key={hospital.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="group h-full border-slate-100 hover:border-emerald-500/20 transition-all duration-300 shadow-sm hover:shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
                                <div className="relative h-56 overflow-hidden">
                                    <img 
                                        src={hospital.image} 
                                        alt={hospital.name} 
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                        data-ai-hint={hospital.dataAiHint} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-emerald-500 text-white border-0 font-bold px-3 py-1">
                                                <Star className="w-3 h-3 mr-1 fill-white" /> 4.9
                                            </Badge>
                                            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <CardHeader className="space-y-1">
                                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">
                                        <Building2 className="w-3.5 h-3.5" />
                                        Hospital
                                    </div>
                                    <CardTitle className="text-2xl font-extrabold text-slate-800 line-clamp-1">{hospital.name}</CardTitle>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-medium text-sm">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {hospital.location}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-center flex-1 border-r border-slate-200">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Beds</p>
                                            <p className="text-base font-bold text-slate-800">500+</p>
                                        </div>
                                        <div className="text-center flex-1 border-r border-slate-200">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Doctors</p>
                                            <p className="text-base font-bold text-slate-800">120+</p>
                                        </div>
                                        <div className="text-center flex-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Specialties</p>
                                            <p className="text-base font-bold text-slate-800">45</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-500 flex items-center gap-1 font-medium bg-slate-50/50">
                                            <Ambulance className="w-3 h-3" /> 24/7 ER
                                        </Badge>
                                        <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-500 flex items-center gap-1 font-medium bg-slate-50/50">
                                            <ShieldCheck className="w-3 h-3" /> NABH Cert.
                                        </Badge>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0 p-6 flex gap-3">
                                    <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50 gap-2">
                                        <PhoneCall className="w-4 h-4" /> Call
                                    </Button>
                                    <Button className="flex-[2] h-12 rounded-2xl bg-slate-900 border-slate-900 hover:bg-slate-800 text-white font-bold gap-2 group/btn shadow-xl shadow-slate-900/10">
                                        View Details
                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
