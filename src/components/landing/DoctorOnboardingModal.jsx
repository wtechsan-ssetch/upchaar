import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Stethoscope, Building2, ShieldCheck,
    ChevronRight, ChevronLeft, Upload, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase.js';
import { withAuthTimeout } from '@/lib/auth.js';

/* ─── constants ─────────────────────────────────────────── */
const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'ENT Specialist', 'Gastroenterologist', 'Gynaecologist', 'Neurologist',
    'Nephrologist', 'Oncologist', 'Ophthalmologist', 'Orthopaedic Surgeon',
    'Paediatrician', 'Psychiatrist', 'Pulmonologist', 'Radiologist',
    'Rheumatologist', 'Urologist', 'Dentist', 'Physiotherapist', 'Other',
];

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Other',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi', 'Odia', 'Urdu'];

const STEPS = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Credentials', icon: Stethoscope },
    { id: 3, label: 'Practice', icon: Building2 },
    { id: 4, label: 'Verify', icon: ShieldCheck },
];

/* ─── helpers ────────────────────────────────────────────── */
const initialData = {
    // Step 1
    fullName: '', email: '', phone: '', dob: '', gender: '', photo: null,
    password: '', confirmPassword: '',
    // Step 2
    licenseNo: '', nmcNo: '', specialization: '', subSpecialization: '',
    degree: '', passingYear: '', institution: '', additionalQualifications: '',
    // Step 3
    experience: '', languages: [],
    clinics: [{ name: '', address: '', city: '', state: '', fee: '', availableDays: [], hoursFrom: '', hoursTo: '' }],
    // Step 4
    govtId: null, licenseDoc: null, degreeCert: null,
    acceptTerms: false, declaration: false,
};

function validate(step, data) {
    const errors = {};
    if (step === 1) {
        if (!data.fullName.trim()) errors.fullName = 'Full name is required';
        if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Valid email required';
        if (!data.phone.match(/^[6-9]\d{9}$/)) errors.phone = 'Valid 10-digit mobile number required';
        if (!data.dob) errors.dob = 'Date of birth is required';
        if (!data.gender) errors.gender = 'Gender is required';
        if (!data.photo) errors.photo = 'Profile photo is required';
        // Password validation
        if (!data.password) {
            errors.password = 'Password is required';
        } else if (data.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(data.password)) {
            errors.password = 'Must contain at least one uppercase letter';
        } else if (!/[0-9]/.test(data.password)) {
            errors.password = 'Must contain at least one number';
        } else if (!/[^A-Za-z0-9]/.test(data.password)) {
            errors.password = 'Must contain at least one special character';
        }
        if (!data.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
    }
    if (step === 2) {
        if (!data.licenseNo.trim()) errors.licenseNo = 'License number is required';
        if (!data.nmcNo.trim()) errors.nmcNo = 'Registration number is required';
        if (!data.specialization) errors.specialization = 'Specialization is required';
        if (!data.degree.trim()) errors.degree = 'Degree is required';
        if (!data.passingYear || data.passingYear < 1970 || data.passingYear > new Date().getFullYear())
            errors.passingYear = 'Valid passing year required';
        if (!data.institution.trim()) errors.institution = 'Institution name is required';
    }
    if (step === 3) {
        if (!data.experience || data.experience < 0) errors.experience = 'Years of experience is required';
        if (data.languages.length === 0) errors.languages = 'Select at least one language';
        data.clinics.forEach((clinic, index) => {
            if (!clinic.name.trim()) errors[`clinicName_${index}`] = 'Medical/Clinic name is required';
            if (!clinic.address.trim()) errors[`clinicAddress_${index}`] = 'Address is required';
            if (!clinic.city.trim()) errors[`clinicCity_${index}`] = 'City is required';
            if (!clinic.state) errors[`clinicState_${index}`] = 'State is required';
            if (!clinic.fee || clinic.fee < 0) errors[`clinicFee_${index}`] = 'Consultation fee is required';
            if (clinic.availableDays.length === 0) errors[`clinicDays_${index}`] = 'Select at least one available day';
            if (!clinic.hoursFrom) errors[`clinicHoursFrom_${index}`] = 'Start time is required';
            if (!clinic.hoursTo) errors[`clinicHoursTo_${index}`] = 'End time is required';
        });
    }
    if (step === 4) {
        if (!data.govtId) errors.govtId = 'Government ID is required';
        if (!data.licenseDoc) errors.licenseDoc = 'License document is required';
        if (!data.acceptTerms) errors.acceptTerms = 'You must accept the terms';
        if (!data.declaration) errors.declaration = 'Declaration is required';
    }
    return errors;
}

/* ─── sub-components ─────────────────────────────────────── */
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <span className="flex items-center gap-1 text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />{msg}
        </span>
    );
}

function FormLabel({ children, required }) {
    return (
        <Label className="text-sm font-medium text-foreground/80 mb-1 block">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
    );
}

function FileUpload({ label, required, value, onChange, error, accept = '.pdf,.jpg,.jpeg,.png' }) {
    return (
        <div>
            <FormLabel required={required}>{label}</FormLabel>
            <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                ${value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/40'}`}>
                <input type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files[0] || null)} />
                {value ? (
                    <>
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <span className="text-xs text-primary font-medium truncate max-w-[180px]">{value.name}</span>
                    </>
                ) : (
                    <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload ({accept})</span>
                    </>
                )}
            </label>
            <FieldError msg={error} />
        </div>
    );
}

/* ─── step panels ─────────────────────────────────────────── */
function Step1({ data, onChange, errors }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
                <FormLabel required>Full Name</FormLabel>
                <Input id="fullName" placeholder="Dr. Ravi Kumar" value={data.fullName}
                    onChange={e => onChange('fullName', e.target.value)} className={errors.fullName ? 'border-red-400' : ''} />
                <FieldError msg={errors.fullName} />
            </div>
            <div>
                <FormLabel required>Email Address</FormLabel>
                <Input id="email" type="email" placeholder="doctor@email.com" value={data.email}
                    onChange={e => onChange('email', e.target.value)} className={errors.email ? 'border-red-400' : ''} />
                <FieldError msg={errors.email} />
            </div>
            <div>
                <FormLabel required>Phone Number</FormLabel>
                <Input id="phone" type="tel" placeholder="9XXXXXXXXX" value={data.phone}
                    onChange={e => onChange('phone', e.target.value)} className={errors.phone ? 'border-red-400' : ''} />
                <FieldError msg={errors.phone} />
            </div>
            <div>
                <FormLabel required>Date of Birth</FormLabel>
                <Input id="dob" type="date" value={data.dob}
                    onChange={e => onChange('dob', e.target.value)} className={errors.dob ? 'border-red-400' : ''} />
                <FieldError msg={errors.dob} />
            </div>
            <div>
                <FormLabel required>Gender</FormLabel>
                <select id="gender" value={data.gender} onChange={e => onChange('gender', e.target.value)}
                    className={`w-full h-10 rounded-md border px-3 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none
                        ${errors.gender ? 'border-red-400' : 'border-input'}`}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not">Prefer not to say</option>
                </select>
                <FieldError msg={errors.gender} />
            </div>
            <div className="sm:col-span-2">
                <FormLabel required>Profile Photo</FormLabel>
                <label className={`flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                    ${data.photo ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/40'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => onChange('photo', e.target.files[0] || null)} />
                    {data.photo ? (
                        <><CheckCircle2 className="h-5 w-5 text-primary" /><span className="text-xs text-primary font-medium">{data.photo.name}</span></>
                    ) : (
                        <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload profile photo</span></>
                    )}
                </label>
                <FieldError msg={errors.photo} />
            </div>

            {/* ─── Password Section ─────────────────────── */}
            <div className="sm:col-span-2">
                <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                        <span className="inline-block h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">🔒</span>
                        Create Your Login Password
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <FormLabel required>Password</FormLabel>
                            <Input id="password" type="password" placeholder="Min 8 chars, A-Z, 0-9, symbol"
                                value={data.password} onChange={e => onChange('password', e.target.value)}
                                className={errors.password ? 'border-red-400' : ''} />
                            <FieldError msg={errors.password} />
                        </div>
                        <div>
                            <FormLabel required>Confirm Password</FormLabel>
                            <Input id="confirmPassword" type="password" placeholder="Re-enter password"
                                value={data.confirmPassword} onChange={e => onChange('confirmPassword', e.target.value)}
                                className={errors.confirmPassword ? 'border-red-400' : ''} />
                            <FieldError msg={errors.confirmPassword} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">You will use this password to log in after your application is approved.</p>
                </div>
            </div>
        </div>
    );
}

function Step2({ data, onChange, errors }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <FormLabel required>Medical License No.</FormLabel>
                <Input id="licenseNo" placeholder="MH-2015-123456" value={data.licenseNo}
                    onChange={e => onChange('licenseNo', e.target.value)} className={errors.licenseNo ? 'border-red-400' : ''} />
                <FieldError msg={errors.licenseNo} />
            </div>
            <div>
                <FormLabel required>NMC / MCI Registration No.</FormLabel>
                <Input id="nmcNo" placeholder="NMC-XXXXXXX" value={data.nmcNo}
                    onChange={e => onChange('nmcNo', e.target.value)} className={errors.nmcNo ? 'border-red-400' : ''} />
                <FieldError msg={errors.nmcNo} />
            </div>
            <div>
                <FormLabel required>Specialization</FormLabel>
                <select id="specialization" value={data.specialization} onChange={e => onChange('specialization', e.target.value)}
                    className={`w-full h-10 rounded-md border px-3 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none
                        ${errors.specialization ? 'border-red-400' : 'border-input'}`}>
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError msg={errors.specialization} />
            </div>
            <div>
                <FormLabel>Sub-specialization</FormLabel>
                <Input id="subSpecialization" placeholder="e.g. Interventional Cardiology" value={data.subSpecialization}
                    onChange={e => onChange('subSpecialization', e.target.value)} />
            </div>
            <div>
                <FormLabel required>Primary Degree</FormLabel>
                <Input id="degree" placeholder="MBBS / BDS / BAMS / etc." value={data.degree}
                    onChange={e => onChange('degree', e.target.value)} className={errors.degree ? 'border-red-400' : ''} />
                <FieldError msg={errors.degree} />
            </div>
            <div>
                <FormLabel required>Year of Passing</FormLabel>
                <Input id="passingYear" type="number" placeholder="2012" min="1970" max={new Date().getFullYear()} value={data.passingYear}
                    onChange={e => onChange('passingYear', e.target.value)} className={errors.passingYear ? 'border-red-400' : ''} />
                <FieldError msg={errors.passingYear} />
            </div>
            <div className="sm:col-span-2">
                <FormLabel required>College / University</FormLabel>
                <Input id="institution" placeholder="AIIMS New Delhi" value={data.institution}
                    onChange={e => onChange('institution', e.target.value)} className={errors.institution ? 'border-red-400' : ''} />
                <FieldError msg={errors.institution} />
            </div>
            <div className="sm:col-span-2">
                <FormLabel>Additional Qualifications</FormLabel>
                <Input id="additionalQualifications" placeholder="MD, MS, DM, MCh, DNB, Fellowships…" value={data.additionalQualifications}
                    onChange={e => onChange('additionalQualifications', e.target.value)} />
            </div>
        </div>
    );
}

function Step3({ data, onChange, errors }) {
    const toggleMulti = (field, val) => {
        const arr = data[field];
        onChange(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    };

    const addClinic = () => {
        onChange('clinics', [...data.clinics, { name: '', address: '', city: '', state: '', availableDays: [], hoursFrom: '', hoursTo: '' }]);
    };

    const removeClinic = (index) => {
        const newClinics = data.clinics.filter((_, i) => i !== index);
        onChange('clinics', newClinics);
    };

    const updateClinic = (index, field, val) => {
        const newClinics = [...data.clinics];
        newClinics[index] = { ...newClinics[index], [field]: val };
        onChange('clinics', newClinics);
    };

    const toggleClinicDay = (index, day) => {
        const arr = data.clinics[index].availableDays;
        const newDays = arr.includes(day) ? arr.filter(x => x !== day) : [...arr, day];
        updateClinic(index, 'availableDays', newDays);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <FormLabel required>Years of Experience</FormLabel>
                    <Input id="experience" type="number" placeholder="5" min="0" max="60" value={data.experience}
                        onChange={e => onChange('experience', e.target.value)} className={errors.experience ? 'border-red-400' : ''} />
                    <FieldError msg={errors.experience} />
                </div>

                {/* Languages */}
                <div className="sm:col-span-2">
                    <FormLabel required>Languages Spoken</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {LANGUAGES.map(lang => (
                            <button key={lang} type="button"
                                onClick={() => toggleMulti('languages', lang)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                                    ${data.languages.includes(lang)
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}>
                                {lang}
                            </button>
                        ))}
                    </div>
                    <FieldError msg={errors.languages} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-foreground/90">Medical/Clinic Details</h3>
                    <Button type="button" onClick={addClinic} variant="outline" size="sm" className="h-8">
                        + Add More
                    </Button>
                </div>

                {data.clinics.map((clinic, index) => (
                    <div key={index} className="p-4 bg-muted/40 border rounded-xl space-y-4 relative">
                        {data.clinics.length > 1 && (
                            <button type="button" onClick={() => removeClinic(index)}
                                className="absolute right-3 top-3 h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition">
                                <X size={12} />
                            </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <FormLabel required>Medical/Clinic Name</FormLabel>
                                <Input placeholder="Apollo Clinic" value={clinic.name}
                                    onChange={e => updateClinic(index, 'name', e.target.value)} className={errors[`clinicName_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicName_${index}`]} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormLabel required>Consultation Fee (₹)</FormLabel>
                                <Input type="number" placeholder="500" min="0" value={clinic.fee}
                                    onChange={e => updateClinic(index, 'fee', e.target.value)} className={errors[`clinicFee_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicFee_${index}`]} />
                            </div>
                            <div className="sm:col-span-2">
                                <FormLabel required>Clinic Address</FormLabel>
                                <Input placeholder="Street, Area, Locality" value={clinic.address}
                                    onChange={e => updateClinic(index, 'address', e.target.value)} className={errors[`clinicAddress_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicAddress_${index}`]} />
                            </div>
                            <div>
                                <FormLabel required>City</FormLabel>
                                <Input placeholder="Mumbai" value={clinic.city}
                                    onChange={e => updateClinic(index, 'city', e.target.value)} className={errors[`clinicCity_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicCity_${index}`]} />
                            </div>
                            <div>
                                <FormLabel required>State</FormLabel>
                                <select value={clinic.state} onChange={e => updateClinic(index, 'state', e.target.value)}
                                    className={`w-full h-10 rounded-md border px-3 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none
                                        ${errors[`clinicState_${index}`] ? 'border-red-400' : 'border-input'}`}>
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <FieldError msg={errors[`clinicState_${index}`]} />
                            </div>

                            {/* Available Days */}
                            <div className="sm:col-span-2">
                                <FormLabel required>Available Days</FormLabel>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {DAYS.map(day => (
                                        <button key={day} type="button"
                                            onClick={() => toggleClinicDay(index, day)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                                                ${clinic.availableDays.includes(day)
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}>
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                <FieldError msg={errors[`clinicDays_${index}`]} />
                            </div>

                            {/* Consultation Hours */}
                            <div>
                                <FormLabel required>Consultation From</FormLabel>
                                <Input type="time" value={clinic.hoursFrom}
                                    onChange={e => updateClinic(index, 'hoursFrom', e.target.value)} className={errors[`clinicHoursFrom_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicHoursFrom_${index}`]} />
                            </div>
                            <div>
                                <FormLabel required>Consultation To</FormLabel>
                                <Input type="time" value={clinic.hoursTo}
                                    onChange={e => updateClinic(index, 'hoursTo', e.target.value)} className={errors[`clinicHoursTo_${index}`] ? 'border-red-400' : ''} />
                                <FieldError msg={errors[`clinicHoursTo_${index}`]} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Step4({ data, onChange, errors }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <FileUpload label="Aadhaar / Govt. Photo ID" required value={data.govtId}
                    onChange={v => onChange('govtId', v)} error={errors.govtId} />
            </div>
            <div>
                <FileUpload label="Medical License Document" required value={data.licenseDoc}
                    onChange={v => onChange('licenseDoc', v)} error={errors.licenseDoc} />
            </div>
            <div className="sm:col-span-2">
                <FileUpload label="Degree / Marksheet (Optional)" value={data.degreeCert}
                    onChange={v => onChange('degreeCert', v)} error={errors.degreeCert} />
            </div>

            <div className="sm:col-span-2 space-y-3 pt-2">
                <label className={`flex items-start gap-3 cursor-pointer group rounded-xl p-3 border transition-colors
                    ${errors.acceptTerms ? 'border-red-300 bg-red-50/50' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}>
                    <input type="checkbox" checked={data.acceptTerms} onChange={e => onChange('acceptTerms', e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">
                        I have read and agree to the{' '}
                        <a href="#" className="text-primary underline underline-offset-2 hover:opacity-80">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="text-primary underline underline-offset-2 hover:opacity-80">Privacy Policy</a> of Upchaar Health.
                        <span className="text-red-500 ml-0.5">*</span>
                    </span>
                </label>
                <FieldError msg={errors.acceptTerms} />

                <label className={`flex items-start gap-3 cursor-pointer group rounded-xl p-3 border transition-colors
                    ${errors.declaration ? 'border-red-300 bg-red-50/50' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}>
                    <input type="checkbox" checked={data.declaration} onChange={e => onChange('declaration', e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">
                        I hereby declare that all information provided is true and accurate to the best of my knowledge.
                        I understand that providing false information may result in permanent disqualification.
                        <span className="text-red-500 ml-0.5">*</span>
                    </span>
                </label>
                <FieldError msg={errors.declaration} />
            </div>
        </div>
    );
}

/* ─── success screen ─────────────────────────────────────── */
function SuccessScreen({ onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-8 text-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-2xl">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
                <p className="text-muted-foreground max-w-sm">
                    Thank you for joining Upchaar Health. Our team will review your credentials and reach out within 2–3 business days.
                </p>
            </div>
            <Button onClick={onClose} className="rounded-full px-8 shadow-[0_8px_24px_hsl(var(--primary)/0.3)]">
                Back to Home
            </Button>
        </motion.div>
    );
}

/* ─── main modal ─────────────────────────────────────────── */
export function DoctorOnboardingModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const onChange = useCallback((field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Upload a single file to storage, returns the storage path or null
    const uploadFile = async (file, folder, fieldName) => {
        if (!file) return null;
        const ext = file.name.split('.').pop();
        const path = `${folder}/${fieldName}.${ext}`;
        const { error } = await supabase.storage
            .from('doctor-docs')
            .upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
        return path;
    };

    const savePendingDoctorApplication = async ({ folder, govtIdPath, licenseDocPath, degreeCertPath }) => {
        const { data: existingSessionData } = await supabase.auth.getSession();
        const existingSession = existingSessionData.session;
        try {
            const { data: signUpData, error: signUpError } = await withAuthTimeout(
                supabase.auth.signUp({
                    email: data.email.trim(),
                    password: data.password,
                    options: {
                        data: {
                            full_name: data.fullName.trim(),
                            phone: data.phone.trim(),
                            profile_type: 'doctor',
                        },
                    },
                }),
                'Sign up is taking too long. Please check your connection and try again.'
            );

            if (signUpError) {
                const message = signUpError.message || 'Unable to create doctor account.';
                if (message.toLowerCase().includes('already registered')) {
                    throw new Error('An account with this email already exists.');
                }
                throw new Error(message);
            }

            const userId = signUpData.user?.id;
            if (!userId) {
                throw new Error('Registration failed. Please try again.');
            }

            const primaryClinic = data.clinics[0] || {};
            const now = new Date().toISOString();

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: data.email.trim(),
                    full_name: data.fullName.trim(),
                    phone: data.phone.trim(),
                    profile_type: 'doctor',
                    status: 'pending',
                    updated_at: now,
                }, {
                    onConflict: 'id',
                });

            if (profileError) {
                throw new Error(`Failed to create profile: ${profileError.message}`);
            }

            const { error: pendingDoctorError } = await supabase
                .from('pending_doctors')
                .insert({
                    profile_id: userId,
                    full_name: data.fullName.trim(),
                    email: data.email.trim(),
                    phone: data.phone.trim(),
                    dob: data.dob || null,
                    gender: data.gender || null,
                    specialization: data.specialization || null,
                    sub_specialization: data.subSpecialization || null,
                    degree: data.degree.trim(),
                    additional_qualifications: data.additionalQualifications || null,
                    passing_year: data.passingYear ? Number(data.passingYear) : null,
                    institution: data.institution.trim(),
                    license_no: data.licenseNo.trim(),
                    nmc_no: data.nmcNo.trim(),
                    clinic_name: primaryClinic.name?.trim() || null,
                    clinic_address: primaryClinic.address?.trim() || null,
                    city: primaryClinic.city?.trim() || null,
                    state: primaryClinic.state || null,
                    languages: data.languages,
                    available_days: primaryClinic.availableDays || [],
                    hours_from: primaryClinic.hoursFrom || null,
                    hours_to: primaryClinic.hoursTo || null,
                    experience: data.experience ? Number(data.experience) : 0,
                    consultation_fee: data.consultationFee ? Number(data.consultationFee) : 500,
                    status: 'Pending',
                    applied_at: now,
                    metadata: {
                        clinics: data.clinics,
                        documents: {
                            govtId: govtIdPath,
                            licenseDoc: licenseDocPath,
                            degreeCert: degreeCertPath,
                        },
                        storageFolder: folder,
                        source: 'landing-modal',
                    },
                });

            if (pendingDoctorError) {
                throw new Error(`Failed to save application: ${pendingDoctorError.message}`);
            }
        } finally {
            await supabase.auth.signOut();

            if (existingSession?.access_token && existingSession?.refresh_token) {
                const { error: restoreError } = await supabase.auth.setSession({
                    access_token: existingSession.access_token,
                    refresh_token: existingSession.refresh_token,
                });

                if (restoreError) {
                    console.warn('Could not restore previous session after doctor application submit:', restoreError.message);
                }
            }
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        try {
            const emailSlug = data.email.trim().replace(/[^a-z0-9]/gi, '_');
            const folder = `${emailSlug}_${Date.now()}`;

            // 1. Upload documents to Supabase Storage anonymously (bucket must allow anon uploads,
            //    or we use a signed URL). Paths are passed to the Edge Function.
            const [govtIdPath, licenseDocPath, degreeCertPath] = await Promise.all([
                uploadFile(data.govtId, folder, 'govt_id'),
                uploadFile(data.licenseDoc, folder, 'license_doc'),
                uploadFile(data.degreeCert, folder, 'degree_cert'),
            ]);

            // 2. Call the register-doctor Edge Function (service-role, bypasses RLS)
            //    — creates auth user, profile, and pending_doctors row server-side
            const payload = {
                email: data.email.trim(),
                password: data.password,
                fullName: data.fullName.trim(),
                phone: data.phone.trim(),
                dob: data.dob || null,
                gender: data.gender || null,
                licenseNo: data.licenseNo.trim(),
                nmcNo: data.nmcNo.trim(),
                specialization: data.specialization,
                subSpecialization: data.subSpecialization || null,
                degree: data.degree.trim(),
                passingYear: data.passingYear || null,
                institution: data.institution.trim(),
                additionalQualifications: data.additionalQualifications || null,
                experience: data.experience || 0,
                consultationFee: data.consultationFee || 500,
                languages: data.languages,
                clinics: data.clinics,
                metadata: {
                    documents: {
                        govtId: govtIdPath,
                        licenseDoc: licenseDocPath,
                        degreeCert: degreeCertPath,
                    },
                    storageFolder: folder,
                },
            };

            try {
                const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-doctor`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify(payload),
                    }
                );

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Registration failed. Please try again.');
            } catch (edgeFunctionError) {
                const message = edgeFunctionError.message?.toLowerCase?.() || '';
                const shouldFallback = ['failed to fetch', 'fetch failed', 'networkerror', 'load failed']
                    .some(pattern => message.includes(pattern));

                if (!shouldFallback) {
                    throw edgeFunctionError;
                }

                await savePendingDoctorApplication({
                    folder,
                    govtIdPath,
                    licenseDocPath,
                    degreeCertPath,
                });
            }

            setSubmitted(true);
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const goNext = () => {
        const errs = validate(step, data);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setDirection(1);
        if (step === 4) { handleSubmit(); return; }
        setStep(s => s + 1);
        setErrors({});
    };

    const goBack = () => {
        setDirection(-1);
        setStep(s => s - 1);
        setErrors({});
        setSubmitError('');
    };

    const handleClose = () => {
        onClose();
        // reset after animation
        setTimeout(() => { setStep(1); setData(initialData); setErrors({}); setSubmitted(false); setSubmitError(''); setSubmitting(false); }, 300);
    };

    const variants = {
        enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
    };

    const stepComponents = [Step1, Step2, Step3, Step4];
    const CurrentStep = stepComponents[step - 1];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">

                            {/* Gradient header */}
                            <div className="relative bg-gradient-to-br from-primary via-teal-500 to-teal-400 px-6 pt-6 pb-8 flex-shrink-0">
                                <button onClick={handleClose}
                                    className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>

                                {!submitted && (
                                    <>
                                        <p className="text-white/80 text-sm font-medium mb-1">Doctor Registration</p>
                                        <h1 className="text-white text-2xl font-bold">Join as a Doctor</h1>

                                        {/* Step indicator */}
                                        <div className="flex items-center gap-1.5 mt-5">
                                            {STEPS.map((s, i) => {
                                                const Icon = s.icon;
                                                const isActive = s.id === step;
                                                const isDone = s.id < step;
                                                return (
                                                    <div key={s.id} className="flex items-center gap-1.5">
                                                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300
                                                            ${isActive ? 'bg-white text-primary shadow-lg' : isDone ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'}`}>
                                                            <Icon className="h-3 w-3 flex-shrink-0" />
                                                            <span className="hidden sm:inline">{s.label}</span>
                                                            <span className="sm:hidden">{s.id}</span>
                                                        </div>
                                                        {i < STEPS.length - 1 && (
                                                            <div className={`h-0.5 w-4 sm:w-6 rounded-full transition-colors ${isDone ? 'bg-white/60' : 'bg-white/20'}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto">
                                {submitted ? (
                                    <SuccessScreen onClose={handleClose} />
                                ) : (
                                    <>
                                        <div className="overflow-hidden relative">
                                            <AnimatePresence custom={direction} mode="wait">
                                                <motion.div
                                                    key={step}
                                                    custom={direction}
                                                    variants={variants}
                                                    initial="enter"
                                                    animate="center"
                                                    exit="exit"
                                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                                    className="px-6 py-6">
                                                    <CurrentStep data={data} onChange={onChange} errors={errors} />
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>

                                        {/* Submit error */}
                                        {submitError && (
                                            <div className="mx-6 mb-2 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                <span>{submitError}</span>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0 sticky bottom-0">
                                            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
                                            <div className="flex gap-3">
                                                {step > 1 && (
                                                    <Button variant="outline" onClick={goBack} disabled={submitting} className="rounded-full gap-1">
                                                        <ChevronLeft className="h-4 w-4" /> Back
                                                    </Button>
                                                )}
                                                <Button onClick={goNext} disabled={submitting} className="rounded-full gap-1 shadow-[0_8px_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_8px_24px_hsl(var(--primary)/0.4)] transition-shadow">
                                                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : step === 4 ? 'Submit Application' : 'Next'}
                                                    {!submitting && step < 4 && <ChevronRight className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
