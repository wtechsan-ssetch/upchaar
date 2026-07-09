import React from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Stethoscope, Building2, TestTubes, Store, 
    CalendarCheck, FileText, ArrowRight, ShieldCheck, 
    Clock, HeartPulse, Smartphone, ArrowDown, CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const motionVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    staggerContainer: {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }
};

const QUICK_SERVICES = [
    { id: 'doctors', icon: Stethoscope, label: 'Doctors', color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'clinics', icon: Building2, label: 'Clinics', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 'diagnostics', icon: TestTubes, label: 'Diagnostics', color: 'text-teal-600', bg: 'bg-teal-100' },
    { id: 'medicals', icon: Store, label: 'Medical Stores', color: 'text-rose-600', bg: 'bg-rose-100' },
    { id: 'appointments', icon: CalendarCheck, label: 'Appointments', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'records', icon: FileText, label: 'Health Records', color: 'text-purple-600', bg: 'bg-purple-100' },
];

const WHY_CHOOSE_US = [
    { icon: HeartPulse, title: 'Connected Ecosystem', desc: 'Seamlessly link doctors, labs, and pharmacies.' },
    { icon: Smartphone, title: 'User-Friendly', desc: 'Intuitive interface designed for all ages.' },
    { icon: Clock, title: 'Organized Management', desc: 'Efficient scheduling and health tracking.' },
    { icon: ShieldCheck, title: 'Secure Digital System', desc: 'Your medical data is encrypted and safe.' },
];

export default function ServicesPage() {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A] font-inter overflow-hidden">
            <Header />

            <main className="flex-1">
                {/* 1. HERO SECTION */}
                <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-3xl" />
                        <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-50/50 blur-3xl" />
                    </div>

                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            {/* Left Side */}
                            <motion.div 
                                className="flex-1 text-center lg:text-left z-10"
                                initial="hidden" animate="show" variants={motionVariants.staggerContainer}
                            >
                                <motion.h1 variants={motionVariants} className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-slate-900 mb-6">
                                    One Platform for <span className="text-blue-600">Complete Healthcare</span> Access
                                </motion.h1>
                                <motion.p variants={motionVariants} className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                    Upchar Health helps patients connect with doctors, clinics, diagnostic centers, and medical stores through one simple and organized healthcare platform.
                                </motion.p>
                                
                                <motion.div variants={motionVariants} className="max-w-xl mx-auto lg:mx-0 mb-10">
                                    <div className="relative flex items-center bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
                                        <Search className="absolute left-4 text-slate-400" size={20} />
                                        <Input 
                                            placeholder="Search doctors, clinics, diagnostics, pharmacies..." 
                                            className="w-full border-none shadow-none pl-12 h-12 text-base focus-visible:ring-0 bg-transparent"
                                        />
                                        <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 h-12 px-6">
                                            Search
                                        </Button>
                                    </div>
                                </motion.div>

                                <motion.div variants={motionVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                    <Button onClick={() => scrollToSection('doctors')} size="lg" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-8 h-12">
                                        Explore Services
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 px-8 h-12">
                                        <Link to="/doctors">Find Doctors</Link>
                                    </Button>
                                </motion.div>
                            </motion.div>

                            {/* Right Side */}
                            <motion.div 
                                className="flex-1 relative w-full max-w-lg lg:max-w-none"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center">
                                    {/* Decorative floating elements */}
                                    <motion.div 
                                        animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3"
                                    >
                                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CalendarCheck size={20} /></div>
                                        <div>
                                            <div className="text-xs text-slate-500 font-medium">Next Appt</div>
                                            <div className="text-sm font-bold text-slate-800">Today, 4:30 PM</div>
                                        </div>
                                    </motion.div>
                                    <motion.div 
                                        animate={{ y: [10, -10, 10] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                        className="absolute bottom-20 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3"
                                    >
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Stethoscope size={20} /></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Dr. Sharma</div>
                                            <div className="text-xs text-slate-500 font-medium">Cardiologist</div>
                                        </div>
                                    </motion.div>
                                    
                                    {/* Main abstract UI preview */}
                                    <div className="w-full h-full max-h-[500px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/50 overflow-hidden relative z-10 flex flex-col">
                                        <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                                            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                        </div>
                                        <div className="p-6 flex-1 bg-slate-50/30 flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <div className="w-32 h-6 bg-slate-200 rounded-md"></div>
                                                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-24 bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center">
                                                    <div className="w-8 h-8 bg-blue-200 rounded-lg mb-2"></div>
                                                    <div className="w-20 h-4 bg-blue-200 rounded"></div>
                                                </div>
                                                <div className="h-24 bg-teal-50 border border-teal-100 rounded-xl p-4 flex flex-col justify-center">
                                                    <div className="w-8 h-8 bg-teal-200 rounded-lg mb-2"></div>
                                                    <div className="w-20 h-4 bg-teal-200 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                                <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                                                <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                                                <div className="w-full h-10 bg-slate-100 rounded-lg"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 2. QUICK SERVICES NAVIGATION */}
                <section className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-md border-y border-slate-200 py-4 shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
                            {QUICK_SERVICES.map((s) => (
                                <button 
                                    key={s.id}
                                    onClick={() => scrollToSection(s.id)}
                                    className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all rounded-full px-4 py-2 shrink-0"
                                >
                                    <span className={`${s.bg} ${s.color} p-1.5 rounded-full`}><s.icon size={16} /></span>
                                    <span className="font-medium text-sm text-slate-700">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. HEALTHCARE ECOSYSTEM SECTION */}
                <section className="py-20 bg-white border-b border-slate-100">
                    <div className="container mx-auto px-4 text-center">
                        <div className="max-w-3xl mx-auto mb-12">
                            <h2 className="font-poppins text-3xl font-bold text-slate-900 mb-4">A Connected Healthcare Ecosystem</h2>
                            <p className="text-slate-600 text-lg">Upchar Health simplifies the complete healthcare journey by connecting essential healthcare services into one accessible platform.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 relative z-10 max-w-5xl mx-auto">
                            {['Patients', 'Doctors', 'Diagnostics', 'Prescriptions', 'Medical Stores'].map((step, idx, arr) => (
                                <React.Fragment key={step}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                                        className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm w-full md:w-auto flex-1 font-semibold text-slate-800"
                                    >
                                        {step}
                                    </motion.div>
                                    {idx < arr.length - 1 && (
                                        <div className="hidden md:block text-slate-300">
                                            <ArrowRight size={24} />
                                        </div>
                                    )}
                                    {idx < arr.length - 1 && (
                                        <div className="block md:hidden text-slate-300 py-1">
                                            <ArrowDown size={20} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. SERVICES SECTION */}
                <div className="py-16 md:py-24 bg-[#F8FAFC] space-y-24 md:space-y-32">
                    
                    {/* SERVICE 1 — DOCTOR CONSULTATIONS */}
                    <section id="doctors" className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
                                    <Stethoscope size={16} /> Doctor Consultations
                                </div>
                                <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-4">Connect with Top Doctors</h2>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                    Find and connect with healthcare professionals easily through a seamless appointment experience. Patients can search doctors by specialty, availability, and healthcare needs while managing appointments digitally.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {['Find doctors easily', 'Online & offline consultations', 'Specialty-based search', 'Organized appointment management', 'Better patient-doctor connectivity'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 className="text-blue-500" size={20} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-full h-12 px-8">
                                    <Link to="/doctors">Find Doctors <ArrowRight className="ml-2" size={18}/></Link>
                                </Button>
                            </div>
                            <div className="flex-1 order-1 lg:order-2 w-full">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
                                    <div className="space-y-4">
                                        <div className="h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4 gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                            <div className="w-32 h-4 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-32 bg-blue-50 rounded-xl border border-blue-100"></div>
                                            <div className="h-32 bg-blue-50 rounded-xl border border-blue-100"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SERVICE 2 — CLINICS & HEALTHCARE CENTERS */}
                    <section id="clinics" className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 w-full">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-100">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="h-40 bg-indigo-50 rounded-xl border border-indigo-100"></div>
                                        <div className="h-40 bg-indigo-50 rounded-xl border border-indigo-100"></div>
                                        <div className="sm:col-span-2 h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-6">
                                    <Building2 size={16} /> Clinics & Centers
                                </div>
                                <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-4">Organized Clinic Access</h2>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                    Explore clinics and healthcare centers with better accessibility and organized healthcare management. Patients can view clinic details, doctor availability, and healthcare services conveniently.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {['Discover clinics nearby', 'Doctor-clinic connectivity', 'Organized healthcare access', 'Appointment coordination', 'Better healthcare management'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 className="text-indigo-500" size={20} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-12 px-8">
                                    <Link to="/medicals">Explore Clinics <ArrowRight className="ml-2" size={18}/></Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* SERVICE 3 — DIAGNOSTIC SERVICES */}
                    <section id="diagnostics" className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm mb-6">
                                    <TestTubes size={16} /> Diagnostic Services
                                </div>
                                <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simplified Medical Testing</h2>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                    Book diagnostic tests and access reports digitally through an organized healthcare system designed to simplify medical testing and report management.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {['Diagnostic test booking', 'Digital reports access', 'Organized test management', 'Lab connectivity', 'Easy report storage'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 className="text-teal-500" size={20} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 rounded-full h-12 px-8">
                                    <Link to="/diagnostics">Book Diagnostics <ArrowRight className="ml-2" size={18}/></Link>
                                </Button>
                            </div>
                            <div className="flex-1 order-1 lg:order-2 w-full">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 flex flex-col gap-4">
                                    <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
                                         <div className="w-24 h-4 bg-slate-200 rounded"></div>
                                         <div className="w-16 h-8 bg-teal-100 rounded-lg"></div>
                                    </div>
                                    <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
                                         <div className="w-32 h-4 bg-slate-200 rounded"></div>
                                         <div className="w-16 h-8 bg-teal-100 rounded-lg"></div>
                                    </div>
                                    <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4">
                                         <div className="w-20 h-4 bg-slate-200 rounded"></div>
                                         <div className="w-16 h-8 bg-teal-100 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SERVICE 4 — MEDICAL STORE CONNECTIVITY */}
                    <section id="medicals" className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 w-full">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-rose-900/5 border border-slate-100 flex flex-col gap-4">
                                     <div className="h-32 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-center text-rose-200"><Store size={48} /></div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="h-12 bg-slate-50 rounded-lg border border-slate-100"></div>
                                        <div className="h-12 bg-slate-50 rounded-lg border border-slate-100"></div>
                                     </div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-sm mb-6">
                                    <Store size={16} /> Medical Stores
                                </div>
                                <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-4">Connected Pharmacy Network</h2>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                    Connect with nearby medical stores and simplify prescription-related healthcare support through a connected pharmacy network.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {['Nearby pharmacy access', 'Prescription support', 'Medicine availability', 'Organized pharmacy connectivity', 'Simplified healthcare assistance'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 className="text-rose-500" size={20} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-700 rounded-full h-12 px-8">
                                    <Link to="/medicals">Find Medical Stores <ArrowRight className="ml-2" size={18}/></Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* SERVICE 5 — SMART APPOINTMENT BOOKING */}
                    <section id="appointments" className="container mx-auto px-4 lg:px-8">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 text-center max-w-5xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm mb-6">
                                <CalendarCheck size={16} /> Appointments
                            </div>
                            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-6">Smart Appointment Booking</h2>
                            <p className="text-slate-600 text-lg mb-12 max-w-2xl mx-auto">
                                Manage healthcare appointments through a smooth and organized booking experience across doctors, diagnostics, and healthcare services.
                            </p>

                            {/* Centered clean timeline UI */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 relative">
                                {/* Desktop connecting line */}
                                <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-slate-100 -z-10"></div>
                                
                                {['Search', 'Select', 'Book', 'Consult', 'Follow-up'].map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-3 z-10 bg-white md:bg-transparent px-2 w-32">
                                        <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="font-medium text-slate-800 text-sm">{step}</div>
                                    </div>
                                ))}
                            </div>

                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-10 text-left">
                                {['Real-time scheduling', 'Organized bookings', 'Appointment reminders', 'Better coordination', 'Simplified experience'].map((f, i) => (
                                    <li key={i} className="flex flex-col items-center text-center gap-2 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-medium">
                                        <CheckCircle2 className="text-emerald-500" size={18} /> {f}
                                    </li>
                                ))}
                            </ul>

                            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 rounded-full h-12 px-8">
                                <Link to="/appointment-options">Book Appointment</Link>
                            </Button>
                        </div>
                    </section>

                    {/* SERVICE 6 — DIGITAL HEALTH RECORDS */}
                    <section id="records" className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6">
                                    <FileText size={16} /> Health Records
                                </div>
                                <h2 className="font-poppins text-3xl md:text-4xl font-bold text-slate-900 mb-4">Digital Health Records</h2>
                                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                    Securely manage prescriptions, reports, and consultation history through organized digital healthcare records accessible anytime.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {['Secure healthcare storage', 'Digital prescriptions', 'Medical history management', 'Organized reports', 'Easy healthcare access'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 className="text-purple-500" size={20} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full h-12 px-8">
                                    <Link to="/records">Manage Records <ArrowRight className="ml-2" size={18}/></Link>
                                </Button>
                            </div>
                            <div className="flex-1 order-1 lg:order-2 w-full">
                                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-purple-900/5 border border-slate-100 relative">
                                     <div className="absolute top-8 right-8 w-16 h-16 bg-purple-100 rounded-full blur-2xl opacity-50"></div>
                                     <div className="space-y-4 relative z-10">
                                        <div className="flex gap-4 mb-6">
                                            <div className="h-8 w-20 bg-slate-100 rounded-full"></div>
                                            <div className="h-8 w-20 bg-purple-100 rounded-full"></div>
                                            <div className="h-8 w-20 bg-slate-100 rounded-full"></div>
                                        </div>
                                        <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4 gap-4">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><FileText size={20}/></div>
                                            <div className="flex-1">
                                                <div className="w-24 h-3 bg-slate-300 rounded mb-2"></div>
                                                <div className="w-16 h-2 bg-slate-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4 gap-4">
                                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center"><TestTubes size={20}/></div>
                                            <div className="flex-1">
                                                <div className="w-32 h-3 bg-slate-300 rounded mb-2"></div>
                                                <div className="w-20 h-2 bg-slate-200 rounded"></div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* 5. WHY CHOOSE UPCHAR HEALTH */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="font-poppins text-3xl font-bold text-slate-900 mb-4">Why Choose Upchar Health</h2>
                            <p className="text-slate-600 text-lg">Technology-driven healthcare management built for modern needs.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {WHY_CHOOSE_US.map((item, idx) => (
                                <div key={idx} className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mb-5">
                                        <item.icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. CTA SECTION */}
                <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <h2 className="font-poppins text-3xl md:text-5xl font-bold text-white mb-6">
                            Healthcare Made Simpler & More Connected
                        </h2>
                        <p className="text-blue-50 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                            Experience smarter healthcare access through one connected platform designed to make healthcare easier for everyone.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button onClick={() => scrollToSection('doctors')} size="lg" className="bg-white text-blue-600 hover:bg-slate-50 rounded-full h-14 px-8 font-semibold">
                                Explore Services
                            </Button>
                            <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 rounded-full h-14 px-8 font-semibold">
                                <Link to="/doctors">Find Doctors</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
