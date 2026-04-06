import { useState } from 'react';
import { useDoctor } from '../context/DoctorContext.jsx';
import { Save, Loader2, CheckCircle, User, Stethoscope, Clock, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
    'Gastroenterologist', 'Gynaecologist', 'Neurologist', 'Oncologist',
    'Ophthalmologist', 'Orthopaedic', 'Paediatrician', 'Psychiatrist',
    'Pulmonologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AVATAR_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#ef4444'];

export default function DoctorProfile() {
    const { doctor, updateProfile } = useDoctor();
    const [form, setForm] = useState({
        fullName: doctor.fullName || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        city: doctor.city || '',
        specialization: doctor.specialization || '',
        experience: doctor.experience || '',
        fee: doctor.fee || '',
        degree: doctor.degree || '',
        clinicName: doctor.clinicName || '',
        bio: doctor.bio || '',
        gender: doctor.gender || '',
        hoursFrom: doctor.hoursFrom || '09:00',
        hoursTo: doctor.hoursTo || '17:00',
        availableDays: doctor.availableDays || [],
        languages: (doctor.languages || []).join(', '),
        avatarColor: doctor.avatarColor || '#0d9488',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const toggleDay = (day) => setForm(f => ({
        ...f,
        availableDays: f.availableDays.includes(day)
            ? f.availableDays.filter(d => d !== day)
            : [...f.availableDays, day],
    }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({
                ...form,
                experience: Number(form.experience) || 0,
                fee: Number(form.fee) || 0,
                languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const initials = form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
                <p className="text-sm text-slate-500 mt-0.5">Update your clinic details, fee and consultation timing</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4">Avatar Color</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-md" style={{ backgroundColor: form.avatarColor }}>
                            {initials}
                        </div>
                        <div className="flex gap-2.5">
                            {AVATAR_COLORS.map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                                    style={{ backgroundColor: c }}
                                    className={cn('h-8 w-8 rounded-full transition-all', form.avatarColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105')}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><User size={15} /> Personal Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: 'fullName', label: 'Full Name', placeholder: 'Dr. Priya Sharma', type: 'text' },
                            { name: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel' },
                            { name: 'email', label: 'Email', placeholder: 'doctor@clinic.com', type: 'email' },
                            { name: 'city', label: 'City', placeholder: 'Delhi', type: 'text' },
                        ].map(({ name, label, placeholder, type }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                <input
                                    name={name}
                                    type={type}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={placeholder}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
                            <textarea
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Write a short bio..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Stethoscope size={15} /> Professional Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Specialization</label>
                            <select
                                name="specialization"
                                value={form.specialization}
                                onChange={handleChange}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                            >
                                <option value="">Select...</option>
                                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        {[
                            { name: 'degree', label: 'Degree', placeholder: 'MBBS, MD (Cardiology)' },
                            { name: 'experience', label: 'Experience (years)', placeholder: '10', type: 'number' },
                            { name: 'fee', label: 'Consultation Fee (Rs.)', placeholder: '1500', type: 'number' },
                            { name: 'languages', label: 'Languages (comma-separated)', placeholder: 'English, Hindi' },
                        ].map(({ name, label, placeholder, type }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                <input
                                    name={name}
                                    type={type || 'text'}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={placeholder}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Building2 size={15} /> Clinic Information</h2>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clinic / Medical Name</label>
                        <input
                            name="clinicName"
                            value={form.clinicName}
                            onChange={handleChange}
                            placeholder="Heart Care Clinic"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Clock size={15} /> Availability</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Available Days</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        className={cn(
                                            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                                            form.availableDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                                        )}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {[{ name: 'hoursFrom', label: 'From' }, { name: 'hoursTo', label: 'To' }].map(({ name, label }) => (
                                <div key={name} className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                    <input
                                        type="time"
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                        'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-md',
                        saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gradient-to-r from-primary to-teal-400 text-white shadow-primary/25 hover:opacity-90 disabled:opacity-60'
                    )}
                >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                        : saved ? <><CheckCircle size={16} /> Saved!</>
                            : <><Save size={16} /> Save Profile</>}
                </button>
            </form>
        </div>
    );
}
