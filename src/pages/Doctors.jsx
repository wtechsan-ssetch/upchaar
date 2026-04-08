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
    Loader2
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
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';

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
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-800 text-white pb-32 pt-20">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <Badge variant="outline" className="mb-4 text-white border-white/30 px-4 py-1.5 uppercase tracking-wider text-xs">
                            Trusted Healthcare
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 font-headline tracking-tight leading-tight">
                            Find the Right Doctor,<br /> Right When You Need One.
                        </h1>
                        <p className="text-xl text-teal-100 max-w-2xl mx-auto mb-10 font-light">
                            Connect with verified specialists, book appointments, and get the care you deserve.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-teal-50">
                            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-300" /><span className="font-semibold">Verified Doctors</span></div>
                            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-300" /><span className="font-semibold">Multiple Specialties</span></div>
                            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-300" /><span className="font-semibold">Instant Booking</span></div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Search */}
            <div className="container mx-auto px-4 -mt-24 relative z-20">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                    <Card className="shadow-2xl border-0 ring-1 ring-black/5">
                        <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Search Doctor or Specialty</label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <Input
                                            placeholder="e.g., Cardiologist, Dr. Sharma"
                                            className="pl-10 h-12 text-lg bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Location</label>
                                    <Select onValueChange={setLocation} value={location}>
                                        <SelectTrigger className="h-12 bg-gray-50 border-transparent focus:bg-white focus:border-primary/20">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <SelectValue placeholder="All Cities" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Cities</SelectItem>
                                            <SelectItem value="delhi">Delhi</SelectItem>
                                            <SelectItem value="mumbai">Mumbai</SelectItem>
                                            <SelectItem value="bangalore">Bangalore</SelectItem>
                                            <SelectItem value="pune">Pune</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Specialty</label>
                                    <Select onValueChange={setSelectedSpecialty} value={selectedSpecialty}>
                                        <SelectTrigger className="h-12 bg-gray-50 border-transparent focus:bg-white focus:border-primary/20">
                                            <SelectValue placeholder="Select Specialty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {specialties.map(spec => (
                                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <Button className="w-full h-12 text-lg shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 transition-shadow">
                                        Search
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2 items-center">
                                <span className="text-sm text-muted-foreground mr-2">Popular:</span>
                                {['Cardiologist', 'Dentist', 'Pediatrician', 'Neurologist'].map((chip) => (
                                    <Badge key={chip} variant="secondary"
                                        className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-3 py-1"
                                        onClick={() => setSearchTerm(chip)}>
                                        {chip}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Filters Sidebar */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <Filter className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-lg">Filters</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Availability</label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="today" />
                                        <label htmlFor="today" className="text-sm leading-none">Available Today</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="tomorrow" />
                                        <label htmlFor="tomorrow" className="text-sm leading-none">Available Tomorrow</label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Max Consultation Fee</label>
                                <Slider value={[maxPrice]} max={5000} step={100} className="py-4" onValueChange={(val) => setMaxPrice(val[0])} />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>₹0</span>
                                    <span>₹{maxPrice}{maxPrice === 5000 ? '+' : ''}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Gender</label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2"><Checkbox id="male" /><label htmlFor="male" className="text-sm">Male Doctor</label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="female" /><label htmlFor="female" className="text-sm">Female Doctor</label></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doctor Cards Grid */}
                <div className="lg:col-span-9">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold font-headline">
                            {loading ? 'Loading Doctors…' : 'Verified Doctors'}
                        </h2>
                        {!loading && (
                            <span className="text-muted-foreground text-sm">{filteredDoctors.length} doctors found</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground text-sm">Fetching verified doctors…</p>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <AnimatePresence>
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map((doctor) => (
                                        <motion.div key={doctor.id} variants={itemVariants} layout>
                                            <DoctorCard doctor={doctor} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div className="col-span-full py-12 text-center">
                                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                                            <Search className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold">No doctors found</h3>
                                        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                                        <Button variant="link" onClick={() => { setSearchTerm(''); setLocation('all'); setSelectedSpecialty('All'); setMaxPrice(5000); }} className="mt-2 text-primary">
                                            Clear all filters
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Trust Section */}
            <section className="bg-white py-20 border-t">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold font-headline mb-4">Why Patients Trust Upchaar</h2>
                        <p className="text-muted-foreground">We prioritize your health and convenience. Our rigorous verification process ensures you only see the best.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { icon: Shield, title: '100% Verified Doctors', desc: 'Every doctor on our platform undergoes a strict verification process for credentials and experience.' },
                            { icon: Clock, title: 'Instant Booking', desc: 'Book confirmed appointments in seconds. No waiting in queues or calling clinics.' },
                            { icon: Heart, title: 'Patient-First Care', desc: 'Read real reviews from other patients to choose the doctor that\'s right for you.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-teal-50/50 hover:bg-teal-50 transition-colors">
                                <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mb-6 text-teal-600">
                                    <Icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{title}</h3>
                                <p className="text-muted-foreground">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function DoctorCard({ doctor }) {
    const navigate = useNavigate();
    const initials = (doctor.name || '').replace(/Dr\.\s?/, '').charAt(0).toUpperCase();

    return (
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group ring-1 ring-slate-100">
            <CardContent className="p-0">
                <div className="flex p-5 gap-4">
                    <div className="relative shrink-0">
                        <div className="h-24 w-24 rounded-full p-[2px] bg-gradient-to-br from-teal-400 to-emerald-500">
                            {doctor.avatar ? (
                                <img src={doctor.avatar} alt={doctor.name}
                                    className="h-full w-full rounded-full object-cover border-2 border-white bg-white" />
                            ) : (
                                <div className="h-full w-full rounded-full border-2 border-white bg-white flex items-center justify-center text-2xl font-bold text-teal-600">
                                    {initials}
                                </div>
                            )}
                        </div>
                        {doctor.verified && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified Doctor">
                                <CheckCircle className="h-3 w-3" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{doctor.name}</h3>
                                <p className="text-teal-600 font-medium text-sm">{doctor.specialty}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">
                                <span>{doctor.rating}</span>
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="line-clamp-1">{doctor.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>{doctor.experience} years exp.</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                <span>₹{doctor.fees} Consultation Fee</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 pb-5">
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                        {doctor.languages && doctor.languages.map((lang, index) => (
                            <span key={index} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {lang}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <Button
                            className="flex-1 bg-primary hover:bg-teal-700 group-hover:shadow-lg transition-all"
                            onClick={() => navigate(`/doctors/${doctor.id}`)}
                        >
                            Book Appointment
                        </Button>
                        <Button
                            variant="outline"
                            className="px-3 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => navigate(`/doctors/${doctor.id}`)}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-green-700">Available Today</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
