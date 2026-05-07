import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    Activity,
    X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase.js';
import { getStorageUrl } from '@/lib/uploadImage.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function MedicalsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [medicals, setMedicals] = useState([]);
    const navigate = useNavigate();

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [linkedDoctors, setLinkedDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    useEffect(() => {
        const fetchMedicals = async () => {
            setLoading(true);
            try {
                // Fetch all auth profiles that are medicals or clinics
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('profile_type', ['medical', 'clinic', 'hospital']);

                if (profilesError) throw profilesError;
                
                // Fetch internal tables for extra details (if any)
                const { data: medicalsData } = await supabase.from('medicals').select('*');
                const { data: clinicsData } = await supabase.from('clinics').select('*');

                const medicalsMap = new Map((medicalsData || []).map(m => [m.profile_id, m]));
                const clinicsMap = new Map((clinicsData || []).map(c => [c.profile_id, c]));

                const mergedWithAvatars = (profilesData || []).map(p => {
                    const internalData = medicalsMap.get(p.id) || clinicsMap.get(p.id) || {};
                    return {
                        ...p,
                        ...internalData,
                        profile_id: p.id,
                        id: internalData.id || p.id, // Prefer internal ID for staff_links, but fallback to profile_id
                        avatar_url: getStorageUrl(p.avatar_url, 'avatars'),
                        full_name: p.full_name || p.name || internalData.name,
                        profile_type: p.profile_type
                    };
                });

                setMedicals(mergedWithAvatars);
            } catch (err) {
                console.error("Error fetching facilities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedicals();
    }, []);

    // Fetch linked doctors for the selected facility
    useEffect(() => {
        const fetchLinkedDoctors = async () => {
            if (!detailsOpen || !selectedFacility) return;
            setLoadingDoctors(true);
            try {
                // staff_links.organization_id can store either:
                //   - the internal medicals/clinics table id (selectedFacility.id)
                //   - the auth profile UUID (selectedFacility.profile_id)
                // We query both via OR to cover all cases.
                const orgIdsToSearch = [selectedFacility.id, selectedFacility.profile_id].filter(Boolean);

                const { data, error } = await supabase
                    .from('staff_links')
                    .select(`
                        id,
                        doctor_id,
                        doctors (
                            id,
                            full_name,
                            specialization,
                            consultation_fee,
                            avatar_url,
                            status,
                            city,
                            state
                        )
                    `)
                    .eq('organization_type', selectedFacility.profile_type)
                    .in('organization_id', orgIdsToSearch);
                if (error) {
                    console.error('Supabase query error:', error);
                    throw error;
                }

                const next = (data || []).map(row => {
                    if (!row.doctors) return null;
                    return {
                        ...row.doctors,
                        avatar_url: getStorageUrl(row.doctors.avatar_url, 'doctor-avtar')
                    };
                }).filter(Boolean);
                setLinkedDoctors(next);
            } catch (err) {
                console.error('Failed to load linked doctors:', err.message);
                setLinkedDoctors([]);
            } finally {
                setLoadingDoctors(false);
            }
        };

        void fetchLinkedDoctors();
    }, [detailsOpen, selectedFacility]);

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
                                                {medical.avatar_url ? (
                                                    <img
                                                        src={medical.avatar_url}
                                                        alt={medical.full_name || medical.name || 'Facility'}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Store className="w-20 h-20 text-emerald-600/40 group-hover:scale-110 transition-transform duration-700" />
                                                )}
                                                
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
                                                <Button
                                                    className="flex-[2] h-12 rounded-2xl bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 group/btn shadow-xl shadow-emerald-900/20"
                                                    onClick={() => {
                                                        setSelectedFacility(medical);
                                                        setDetailsOpen(true);
                                                    }}
                                                >
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

            <AnimatePresence>
                {detailsOpen && selectedFacility && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => {
                                setDetailsOpen(false);
                                setSelectedFacility(null);
                                setLinkedDoctors([]);
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                        >
                            <div
                                className="pointer-events-auto w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 overflow-hidden flex-shrink-0 border border-emerald-100">
                                            {selectedFacility.avatar_url ? (
                                                <img
                                                    src={selectedFacility.avatar_url}
                                                    alt={selectedFacility.full_name || 'Facility'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Store className="h-8 w-8 text-emerald-600 m-3" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-bold text-slate-800 line-clamp-1">
                                                {selectedFacility.full_name || selectedFacility.name || 'Facility'}
                                            </h2>
                                            <p className="text-sm text-slate-500 capitalize">
                                                {selectedFacility.profile_type || 'medical/clinic'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailsOpen(false);
                                            setSelectedFacility(null);
                                            setLinkedDoctors([]);
                                        }}
                                        className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center"
                                        aria-label="Close"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="px-6 py-5 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                            <p className="text-sm font-semibold text-slate-800 mt-1">
                                                {selectedFacility.phone || selectedFacility.phone_number || '—'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{selectedFacility.email || '—'}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {selectedFacility.address || selectedFacility.clinic_address || selectedFacility.city || ''}
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-2xl border border-slate-100 p-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Doctors</p>
                                            <p className="text-sm font-semibold text-slate-800 mt-1">
                                                {loadingDoctors ? 'Loading...' : `${linkedDoctors.length} linked`}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Choose a doctor to book an appointment.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Store className="h-4 w-4 text-emerald-600" />
                                            Doctors you can book
                                        </h3>

                                        {loadingDoctors ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {['a', 'b', 'c', 'd'].map((sk) => (
                                                    <div key={sk} className="bg-white rounded-2xl border border-slate-100 p-4">
                                                        <div className="h-5 bg-slate-100 rounded w-2/3 mb-3 animate-pulse" />
                                                        <div className="h-3 bg-slate-100 rounded w-1/2 mb-3 animate-pulse" />
                                                        <div className="h-8 bg-slate-100 rounded w-full animate-pulse" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : linkedDoctors.length === 0 ? (
                                            <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                                                No linked doctors found for this facility.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {linkedDoctors.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start justify-between gap-4"
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="h-11 w-11 rounded-2xl overflow-hidden border border-teal-50 bg-teal-50 flex items-center justify-center flex-shrink-0">
                                                                {doc.avatar_url ? (
                                                                    <img src={doc.avatar_url} alt={doc.full_name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-bold text-teal-700">
                                                                        {(doc.full_name || 'D').split(' ')[0]?.[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 line-clamp-1">
                                                                    {doc.full_name || 'Doctor'}
                                                                </p>
                                                                <p className="text-xs text-teal-700 mt-0.5 line-clamp-1">
                                                                    {doc.specialization || 'Specialization'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    Fee: ₹{doc.fees || doc.consultation_fee || 500}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex-shrink-0">
                                                            <Button
                                                                onClick={() => {
                                                                    navigate(`/appointment-options?doctorId=${doc.id}&clinicId=${selectedFacility.id || selectedFacility.profile_id}`);
                                                                    setDetailsOpen(false);
                                                                }}
                                                                className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                                                            >
                                                                Book Appointment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
