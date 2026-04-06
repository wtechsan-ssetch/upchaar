import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Star,
    CalendarDays,
    CheckCircle,
    Shield,
    Briefcase,
    Video,
    ArrowLeft,
    Loader2,
    PartyPopper,
    Hash,
    Clock,
    CalendarCheck2,
    AlertTriangle,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { usePatient } from '@/patient/context/PatientContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

/* ── helpers ─────────────────────────────────────── */
const today = () => new Date().toISOString().split('T')[0];

const parseClinicNames = (clinicValue) => {
    if (!clinicValue) return [];
    return [...new Set(
        String(clinicValue)
            .split(/\r?\n|,|;/)
            .map(item => item.trim())
            .filter(Boolean)
    )];
};

function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─────────────────────────────────────────────────────
   ① PRE-BOOKING WARNING MODAL
   Shows before the actual booking is made.
   User must confirm to proceed.
───────────────────────────────────────────────────── */
function BookingWarningModal({ isOpen, date, time, onConfirm, onCancel, loading }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 24 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
                        >
                            <X size={15} />
                        </button>

                        {/* Icon */}
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
                            Confirm Your Appointment
                        </h2>

                        {/* Warning message */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                            <p className="text-sm text-amber-800 font-semibold text-center leading-relaxed">
                                ⚠️ You <span className="underline">cannot change</span> your selected date and time after booking.
                            </p>
                        </div>

                        {/* Selected slot summary */}
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                                    <CalendarCheck2 size={15} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Date</p>
                                    <p className="font-semibold text-gray-800 text-sm">
                                        {date === today() ? `Today — ${formatDateLabel(date)}` : formatDateLabel(date)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                                    <Clock size={15} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Time Slot</p>
                                    <p className="font-semibold text-gray-800 text-sm">{time}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Go Back
                            </Button>
                            <Button
                                className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20"
                                onClick={onConfirm}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {loading ? 'Booking…' : 'Yes, Confirm'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ─────────────────────────────────────────────────────
   ② BOOKING CONFIRMATION MODAL
   Shows AFTER the booking is successfully created.
───────────────────────────────────────────────────── */
function ConfirmationModal({ booking, onClose }) {
    return (
        <AnimatePresence>
            {booking && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Success ring */}
                        <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-400/40">
                            <PartyPopper className="h-9 w-9 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Booking Confirmed!</h2>
                        <p className="text-sm text-gray-500 mb-6">Your appointment is all set 🎉</p>

                        <div className="bg-teal-50 rounded-2xl p-5 space-y-3 text-left mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <CalendarCheck2 className="h-4 w-4 text-teal-600 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Date</p>
                                    <p className="font-semibold text-gray-800">{formatDateLabel(booking.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Time Slot</p>
                                    <p className="font-semibold text-gray-800">{booking.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Hash className="h-4 w-4 text-teal-600 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Queue Number</p>
                                    <p className="text-3xl font-extrabold text-teal-600">#{booking.queue}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 mb-5">
                            Please arrive a few minutes early. Your queue number will be called at the clinic.
                        </p>

                        <Button
                            onClick={onClose}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 font-bold rounded-xl"
                        >
                            Done
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ─────────────────────────────────────────────────────
   ③ MAIN DOCTOR DETAIL PAGE
───────────────────────────────────────────────────── */
export default function DoctorDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { patient } = usePatient();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState(today());
    const [bookingType, setBookingType] = useState('In-person');
    const [selectedClinic, setSelectedClinic] = useState('');

    // Step 1: pre-booking warning modal
    const [showWarning, setShowWarning] = useState(false);
    // Step 2: post-booking confirmation modal
    const [confirmed, setConfirmed] = useState(null);   // { date, time, queue }
    // Booking in-progress spinner
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            .eq('status', 'Approved')
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    setDoctor({
                        id: data.id,
                        name: data.full_name,
                        specialty: data.specialization,
                        subSpecialty: data.sub_specialization,
                        location: [data.clinic_name, data.clinic_address, data.city, data.state].filter(Boolean).join(', '),
                        avatar: data.avatar_url || null,
                        experience: data.experience || 0,
                        rating: Number(data.rating) || 4.5,
                        reviews: data.total_appointments || 0,
                        verified: true,
                        fees: data.consultation_fee || 0,
                        clinicName: data.clinic_name || '',
                        clinicNames: parseClinicNames(data.clinic_name),
                        languages: data.languages || [],
                        availableDays: data.available_days || [],
                        hoursFrom: data.hours_from || '09:00',
                        hoursTo: data.hours_to || '17:00',
                        licenseNo: data.license_no,
                        nmcNo: data.nmc_no,
                        degree: data.degree,
                        institution: data.institution,
                        city: data.city,
                    });
                }
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (doctor?.clinicNames?.length) {
            setSelectedClinic(prev => prev || doctor.clinicNames[0]);
        } else if (doctor?.clinicName) {
            setSelectedClinic(prev => prev || doctor.clinicName);
        }
    }, [doctor]);

    /* ── Step 1: open warning modal ── */
    const handleBookClick = (type) => {
        if (!selectedSlot) return;
        if (!patient) {
            navigate('/patient/login');
            return;
        }
        setBookingType(type);
        setShowWarning(true);
    };

    /* ── Step 2: user confirmed → actually save booking ── */
    const handleConfirmBooking = async () => {
        setBooking(true);
        try {
            // Build a full timestamptz from the selected date (normalize to midnight UTC)
            const appointmentDate = new Date(selectedDate + 'T00:00:00').toISOString();

            // Count existing appointments for this doctor on this date to compute queue#
            const { count, error: countErr } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('doctor_id', id)
                .gte('date', new Date(selectedDate + 'T00:00:00').toISOString())
                .lt('date', new Date(selectedDate + 'T23:59:59').toISOString());

            if (countErr) throw countErr;

            const queueNumber = (count ?? 0) + 1;

            const appointmentPayload = {
                patient_id: patient.id,
                doctor_id: id,
                patient_name: patient.full_name || patient.email,
                doctor_name: doctor.name,
                specialization: doctor.specialty,
                date: appointmentDate,
                time_slot: selectedSlot,
                queue_number: queueNumber,
                status: 'Confirmed',
                type: bookingType,
                clinic_name: selectedClinic || doctor.clinicName || null,
                fee: doctor.fees,
                platform_revenue: 50,
            };

            let { error: insertErr } = await supabase
                .from('appointments')
                .insert(appointmentPayload);

            if (insertErr?.message?.includes("Could not find the 'clinic_name' column")) {
                const { clinic_name, ...fallbackPayload } = appointmentPayload;
                ({ error: insertErr } = await supabase
                    .from('appointments')
                    .insert(fallbackPayload));
            }

            if (insertErr) throw insertErr;

            // Close warning → open success modal
            setShowWarning(false);
            setConfirmed({ date: selectedDate, time: selectedSlot, queue: queueNumber });
            setSelectedSlot('');
        } catch (err) {
            console.error('[DoctorDetail] booking error:', err.message);
            alert('Booking failed: ' + err.message);
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-teal-50/30">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                    <p className="text-muted-foreground text-sm">Loading doctor profile…</p>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold font-headline">Doctor not found</h2>
                    <p className="text-muted-foreground">This profile does not exist or is not yet approved.</p>
                    <Button onClick={() => navigate('/doctors')} className="mt-4 bg-teal-600 hover:bg-teal-700">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Doctors
                    </Button>
                </div>
            </div>
        );
    }

    const initials = (doctor.name || '').replace(/Dr\.\s?/, '').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-teal-50/30 font-sans pb-20">

            {/* ① Warning modal (before booking) */}
            <BookingWarningModal
                isOpen={showWarning}
                date={selectedDate}
                time={selectedSlot}
                onConfirm={handleConfirmBooking}
                onCancel={() => setShowWarning(false)}
                loading={booking}
            />

            {/* ② Success modal (after booking) */}
            <ConfirmationModal booking={confirmed} onClose={() => setConfirmed(null)} />

            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6 hover:bg-teal-50 text-teal-800" onClick={() => navigate('/doctors')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Doctors
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Left Column: Profile */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-lg ring-1 ring-black/5 overflow-hidden rounded-2xl bg-white">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl p-1 bg-gradient-to-br from-teal-400 to-emerald-500 shadow-md">
                                            {doctor.avatar ? (
                                                <img src={doctor.avatar} alt={doctor.name}
                                                    className="h-full w-full rounded-xl object-cover border-4 border-white bg-white" />
                                            ) : (
                                                <div className="h-full w-full rounded-xl border-4 border-white bg-white flex items-center justify-center text-4xl font-bold text-teal-600">
                                                    {initials}
                                                </div>
                                            )}
                                        </div>
                                        {doctor.verified && (
                                            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Verified Doctor">
                                                <CheckCircle className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-headline">{doctor.name}</h1>
                                                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200 shadow-sm">
                                                    <span>{doctor.rating}</span>
                                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                </div>
                                            </div>
                                            <p className="text-teal-600 font-semibold text-lg mt-1">{doctor.specialty}</p>
                                            {doctor.subSpecialty && <p className="text-gray-400 text-sm">{doctor.subSpecialty}</p>}
                                            <p className="text-gray-500 mt-2 flex items-center gap-2 font-medium">
                                                <MapPin className="h-4 w-4 text-gray-400" /> {doctor.location}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-gray-100/80 text-sm text-gray-600">
                                            {doctor.licenseNo && (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg shadow-sm"><Shield className="h-4 w-4" /></div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">License</p>
                                                        <p className="font-semibold text-gray-700">{doctor.licenseNo}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg shadow-sm"><Briefcase className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Experience</p>
                                                    <p className="font-semibold text-gray-700">{doctor.experience} Years</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 flex-wrap">
                                            {doctor.languages.map((lang, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium px-3 py-1 rounded-full">{lang}</Badge>
                                            ))}
                                            {doctor.languages.length === 0 && (
                                                <>
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full">English</Badge>
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full">Hindi</Badge>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Availability info */}
                        {doctor.availableDays.length > 0 && (
                            <Card className="border-0 shadow-sm ring-1 ring-black/5 rounded-2xl bg-white">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">Availability</h3>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {doctor.availableDays.map(day => (
                                            <Badge key={day} variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100">{day}</Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500">{doctor.hoursFrom} – {doctor.hoursTo}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="border border-gray-100 shadow-xl shadow-teal-900/5 bg-white rounded-2xl overflow-hidden sticky top-24">
                            <div className="p-6 text-center space-y-1">
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Book an Appointment</h2>
                                <p className="text-sm text-gray-500 font-medium">Book in just 2 clicks!</p>
                            </div>

                            <div className="px-6 pb-5 text-center">
                                <p className="text-[11px] text-teal-600/80 uppercase tracking-widest font-bold mb-1">Consultation Fee</p>
                                <p className="text-4xl font-bold text-teal-600">₹{doctor.fees}</p>
                            </div>

                            {/* In-Clinic Section */}
                            <div className="border-t border-gray-100 px-6 py-6 space-y-4">
                                <div className="flex items-center gap-2 text-teal-700 font-semibold mb-2">
                                    <CalendarDays className="h-5 w-5" />
                                    <h3 className="tracking-tight text-lg">In-Clinic Appointment</h3>
                                </div>

                                <div className="space-y-3">
                                    {/* ── Date picker ── */}
                                    <div>
                                        <label htmlFor="appt-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                            Select Date
                                        </label>
                                        <input
                                            id="appt-date"
                                            type="date"
                                            min={today()}
                                            value={selectedDate}
                                            onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition cursor-pointer"
                                        />
                                        {selectedDate && (
                                            <p className="mt-1 text-xs text-teal-600 font-medium">
                                                {selectedDate === today() ? '📅 Today' : `📅 ${formatDateLabel(selectedDate)}`}
                                            </p>
                                        )}
                                    </div>

                                    {/* ── Time slots ── */}
                                    <p className="text-[13px] text-gray-500 font-semibold text-center bg-gray-50 py-1.5 rounded-full">
                                        Select Time Slot
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((time) => (
                                            <Button
                                                key={time}
                                                variant={selectedSlot === time ? 'default' : 'outline'}
                                                className={selectedSlot === time
                                                    ? 'bg-teal-600 hover:bg-teal-700 shadow-md font-semibold text-white ring-1 ring-teal-700'
                                                    : 'border-gray-200 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 text-gray-600 font-medium'
                                                }
                                                onClick={() => setSelectedSlot(time)}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 h-12 text-base font-bold transition-all disabled:opacity-50"
                                    disabled={!selectedSlot}
                                    onClick={() => handleBookClick('In-person')}
                                >
                                    Book In-Clinic Visit
                                </Button>

                                {!patient && (
                                    <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                        ⚠ Please <a href="/patient/login" className="underline font-semibold">sign in</a> to book an appointment.
                                    </p>
                                )}
                            </div>

                            {/* Video Consultation Section */}
                            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-5 space-y-4">
                                <div className="flex items-center justify-center gap-2 text-teal-700 font-semibold">
                                    <Video className="h-5 w-5" />
                                    <h3 className="tracking-tight">Video Consultation</h3>
                                </div>
                                <p className="text-xs text-center text-gray-500">Consult from the comfort of your home.</p>
                                <Button 
                                    variant="outline" 
                                    className="w-full h-11 bg-white border-gray-200 hover:border-teal-600 hover:text-teal-700 hover:bg-teal-50 hover:shadow-sm transition-all font-semibold disabled:opacity-50"
                                    disabled={!selectedSlot}
                                    onClick={() => handleBookClick('Online')}
                                >
                                    Request Video Consultation
                                </Button>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="border-t border-gray-100 px-6 py-5 space-y-3 bg-gray-50">
                                <div className="flex justify-between text-sm text-gray-600 font-medium">
                                    <span>Consultation Fee:</span>
                                    <span>₹{doctor.fees}.00</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 font-medium">
                                    <span>Platform Fee:</span>
                                    <span>₹50.00</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 mt-3 text-base">
                                    <span>Total Payable:</span>
                                    <span className="text-teal-600">₹{parseInt(doctor.fees) + 50}.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
