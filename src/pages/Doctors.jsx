import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Search,
    Star,
    Filter,
    CheckCircle,
    ChevronRight,
    Heart,
    Clock,
    Shield,
    Loader2,
    Calendar,
    Sparkles
} from 'lucide-react';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { select } from 'framer-motion/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext.jsx';
import { supabase } from '@/lib/supabase.js';
import Skeleton from 'react-loading-skeleton';

export default function DoctorsPage() {
    const [allDoctors, setAllDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState('all');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [maxPrice, setMaxPrice] = useState(5000);

    useEffect(() => {
        supabase
            .from('doctors')
            .select('*')
            .eq('status', 'Approved')
            .order('approved_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) {
                    setAllDoctors(data.map(d => ({
                        id: d.id,
                        name: d.full_name,
                        specialty: d.specialization,
                        location: [d.clinic_name, d.city, d.state].filter(Boolean).join(', '),
                        city: (d.city || '').toLowerCase(),
                        availability: 'Available Today',
                        avatar: d.avatar_url || null,
                        experience: d.experience || 0,
                        rating: Number(d.rating) || 4.5,
                        reviews: d.total_appointments || 0,
                        verified: true,
                        fees: d.consultation_fee || 0,
                        languages: d.languages || [],
                    })));
                }
                setLoading(false);
            });
    }, []);

    const specialties = ['All', ...new Set(allDoctors.map(d => d.specialty).filter(Boolean))];

    const filteredDoctors = allDoctors.filter(doctor => {
        const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = location === 'all' || doctor.city.includes(location);
        const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;
        const matchesPrice = doctor.fees <= maxPrice;
        return matchesSearch && matchesLocation && matchesSpecialty && matchesPrice;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - More Premium */}
            <section className="relative overflow-hidden bg-slate-900 text-white pb-40 pt-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-slate-900 to-slate-900"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 px-4 py-1 font-bold tracking-widest uppercase text-[10px]">
                                <Sparkles className="w-3 h-3 mr-2" /> Medical Excellence
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 font-headline tracking-tighter leading-[1.1]">
                                World-Class Care <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Just a click away.</span>
                            </h1>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                                Connect with India's top-rated medical specialists. <br className="hidden md:block" />
                                Verified, experienced, and dedicated to your well-being.
                            </p>
                        </motion.div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-1 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
            </section>

            {/* Premium Search Experience */}
            <div className="container mx-auto px-4 -mt-32 relative z-20">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-slate-100/50 rounded-[2.5rem] bg-white/80 backdrop-blur-3xl overflow-hidden">
                        <CardContent className="p-4 md:p-6 lg:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                <div className="lg:col-span-4 space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Specialist or Hospital</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            placeholder="Who are you looking for?"
                                            className="pl-12 h-14 text-base bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-emerald-500/10 transition-all font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-3 space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                    <Select onValueChange={setLocation} value={location}>
                                        <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-emerald-500" />
                                                <SelectValue placeholder="Everywhere" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="all">Everywhere</SelectItem>
                                            <SelectItem value="delhi">Delhi / NCR</SelectItem>
                                            <SelectItem value="mumbai">Mumbai</SelectItem>
                                            <SelectItem value="bangalore">Bangalore</SelectItem>
                                            <SelectItem value="pune">Pune</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="lg:col-span-3 space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                                    <Select onValueChange={setSelectedSpecialty} value={selectedSpecialty}>
                                        <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white font-medium text-slate-600">
                                            <SelectValue placeholder="All Specializations" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {specialties.map(spec => (
                                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="lg:col-span-2 flex flex-col gap-2 justify-end">
                                    <Button className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-emerald-600 shadow-xl shadow-slate-900/10 rounded-2xl transition-all">
                                        Search
                                    </Button>
                                    {(searchTerm || location !== 'all' || selectedSpecialty !== 'All' || maxPrice < 5000) && (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full h-10 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                            onClick={() => { setSearchTerm(''); setLocation('all'); setSelectedSpecialty('All'); setMaxPrice(5000); }}
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="container mx-auto px-4 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Modern Filter Sidebar */}
                <div className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-32 space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-extrabold text-xl font-headline">Filters</h3>
                                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 p-0" onClick={() => { setSearchTerm(''); setLocation('all'); setSelectedSpecialty('All'); setMaxPrice(5000); }}>
                                    Reset All
                                </Button>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Availability</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox id="today" className="rounded-md border-slate-200" />
                                                <label htmlFor="today" className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Available Today</label>
                                            </div>
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-0 h-5 px-1.5 font-bold">12</Badge>
                                        </div>
                                        <div className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox id="online" className="rounded-md border-slate-200" />
                                                <label htmlFor="online" className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Video Consultation</label>
                                            </div>
                                            <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-0 h-5 px-1.5 font-bold">08</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Price Range</label>
                                    <Slider value={[maxPrice]} max={5000} step={100} className="py-4" onValueChange={(val) => setMaxPrice(val[0])} />
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400">UP TO</span>
                                        <span className="text-lg font-bold text-slate-900">₹{maxPrice}+</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Gender</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="rounded-xl font-bold border-slate-100 text-slate-600 hover:bg-slate-50">Male</Button>
                                        <Button variant="outline" className="rounded-xl font-bold border-slate-100 text-slate-600 hover:bg-slate-50">Female</Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Promo Card in Sidebar */}
                        <Card className="bg-emerald-900 border-none rounded-3xl overflow-hidden text-white relative">
                            <div className="p-6 relative z-10">
                                <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                                <h4 className="font-bold text-lg mb-2 leading-snug">Priority Health Pass</h4>
                                <p className="text-xs text-emerald-100/70 mb-4">Get instant access to top specialists with our premium health vault.</p>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl h-10 text-xs">Upgrade Now</Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Refined Doctor Cards Grid */}
                <div className="lg:col-span-9">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold font-headline text-slate-900">
                                {loading ? 'Finding Best Matches…' : 'Available Specialists'}
                            </h2>
                            {!loading && (
                                <p className="text-slate-400 font-medium text-sm mt-1">Showing {filteredDoctors.length} verified professionals</p>
                            )}
                        </div>
                        <Select defaultValue="relevance">
                            <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 font-bold text-slate-600">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="relevance">Most Relevant</SelectItem>
                                <SelectItem value="rating">Top Rated</SelectItem>
                                <SelectItem value="experience">Most Experienced</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} height={400} borderRadius={32} />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map((doctor) => (
                                        <motion.div key={doctor.id} variants={itemVariants} layout transition={{ duration: 0.4 }}>
                                            <DoctorCard doctor={doctor} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl mb-6">
                                            <Search className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">We couldn't find any matches</h3>
                                        <p className="text-slate-500 font-medium max-w-xs mx-auto">Try broadening your search or clearing some filters to find your ideal specialist.</p>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => { setSearchTerm(''); setLocation('all'); setSelectedSpecialty('All'); setMaxPrice(5000); }} 
                                            className="mt-8 rounded-2xl font-bold border-slate-200 px-8 h-12"
                                        >
                                            Clear All Filters
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DoctorCard({ doctor }) {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const initials = (doctor.name || '').replace(/Dr\.\s?/, '').charAt(0).toUpperCase();

    const handleSelectDoctor = () => {
        if (!authLoading && user) {
            navigate(`/book-appointment-queued?doctorId=${doctor.id}`);
        } else {
            navigate(`/appointment-options?doctorId=${doctor.id}`);
        }
    };

    return (
        <Card className="overflow-hidden border-slate-100 hover:border-emerald-500/20 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group rounded-[2.5rem] bg-white flex flex-col h-full">
            <CardContent className="p-0 flex-grow flex flex-col">
                <div className="p-6 md:p-8 flex-grow">
                    <div className="flex gap-6 mb-6">
                        <div className="relative shrink-0">
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-3xl p-[2px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                                <div className="h-full w-full rounded-[1.4rem] overflow-hidden border-2 border-white bg-slate-50">
                                    {doctor.avatar ? (
                                        <img src={doctor.avatar} alt={doctor.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-3xl font-black text-emerald-600">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {doctor.verified && (
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white h-8 w-8 rounded-xl border-4 border-white flex items-center justify-center ring-1 ring-slate-100 shadow-lg" title="Premium Verified">
                                    <CheckCircle className="h-4 w-4" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-extrabold text-xl md:text-2xl text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">{doctor.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-0 h-5 px-2 text-[10px] font-black uppercase tracking-wider">
                                            {doctor.specialty}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-black">
                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                        {doctor.rating}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{doctor.reviews}+ reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                                <p className="text-sm font-bold text-slate-700">{doctor.experience} Years</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultation</p>
                                <p className="text-sm font-bold text-slate-700">₹{doctor.fees}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 group/loc">
                                <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover/loc:bg-emerald-50 transition-colors">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover/loc:text-emerald-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 line-clamp-1">{doctor.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Calendar className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-bold text-emerald-600">Available Today</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 pt-0 mt-auto">
                    <Button 
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold group/btn flex items-center justify-between px-8 shadow-xl shadow-slate-900/5 transition-all"
                        onClick={handleSelectDoctor}
                    >
                        <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 opacity-50" />
                            Book Appointment
                        </span>
                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
