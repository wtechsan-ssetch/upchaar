import { useState, useMemo, useEffect, useCallback } from 'react';
import { SPECIALIZATIONS } from '@/lib/constants.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { fetchDoctors, fetchPendingDoctors, updateDoctorStatus, approvePendingDoctor, rejectPendingDoctor } from '@/lib/adminApi.js';
import {
    Search, Eye, CheckCircle, XCircle, ShieldAlert,
    ChevronLeft, ChevronRight, ExternalLink, X, FileText, Phone, Mail, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected', 'Suspended'];
const PAGE_SIZE = 8;

const STATUS_STYLES = {
    Pending: 'bg-amber-50 text-amber-600 border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Rejected: 'bg-red-50 text-red-500 border-red-200',
    Suspended: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY_DOCTOR_FORM = { fullName: '', email: '', phone: '', specialization: SPECIALIZATIONS[0], city: 'Delhi', consultationFee: 500, experience: 5 };

export default function DoctorManagement() {
    const { isSuperAdmin, admin } = useAdmin();
    const [dataLoading, setDataLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('All');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, doc: null });
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_DOCTOR_FORM);
    const [approving, setApproving] = useState(null); // doctorId being approved
    const [docUrls, setDocUrls] = useState({}); // { govtId: url, licenseDoc: url, degreeCert: url }

    // pendingDoctors: from pending_doctors table (Pending/Rejected applications)
    // approvedDoctors: from doctors table (Approved/Suspended)
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [approvedDoctors, setApprovedDoctors] = useState([]);

    // Combined view for the table — pending first, then approved/suspended
    const doctors = useMemo(() => [
        ...pendingDoctors.map(d => ({ ...d, _source: 'pending' })),
        ...approvedDoctors.map(d => ({ ...d, _source: 'approved' })),
    ], [pendingDoctors, approvedDoctors]);

    const normalize = (d) => ({
        ...d,
        fullName: d.full_name,
        appliedAt: d.applied_at,
        approvedAt: d.approved_at,
        consultationFee: d.consultation_fee,
        consultationType: d.consultation_type,
        clinicName: d.clinic_name,
        clinicAddress: d.clinic_address,
        licenseNo: d.license_no,
        nmcNo: d.nmc_no,
        rejectionReason: d.rejection_reason,
        totalAppointments: d.total_appointments,
        totalRevenue: d.total_revenue,
        availableDays: d.available_days || [],
        hoursFrom: d.hours_from || '09:00',
        hoursTo: d.hours_to || '17:00',
        additionalQualifications: d.additional_qualifications || '',
        subSpecialization: d.sub_specialization || '',
        passingYear: d.passing_year,
        documents: d.metadata?.documents || {},
    });

    useEffect(() => {
        Promise.all([fetchPendingDoctors(), fetchDoctors()])
            .then(([pending, approved]) => {
                setPendingDoctors(pending.map(normalize));
                setApprovedDoctors(approved.map(normalize));
            })
            .catch(console.error)
            .finally(() => setDataLoading(false));
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateStatus = async (id, status, extra = {}) => {
        try {
            await updateDoctorStatus(id, status, extra.rejectionReason || '');
            setDoctors(prev => prev.map(d => d.id === id ? { ...d, status, ...extra } : d));
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const filtered = useMemo(() => {
        return doctors.filter(d => {
            const matchStatus = activeStatus === 'All' || d.status === activeStatus;
            const matchSearch = !search || (d.fullName || '').toLowerCase().includes(search.toLowerCase())
                || (d.specialization || '').toLowerCase().includes(search.toLowerCase())
                || (d.email || '').toLowerCase().includes(search.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [doctors, activeStatus, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleApprove = async (doc) => {
        setApproving(doc.id);
        try {
            if (doc._source === 'pending') {
                // Move from pending_doctors → doctors
                const rawPending = pendingDoctors.find(d => d.id === doc.id);
                const approved = await approvePendingDoctor(rawPending);
                // Remove from pending list, add to approved list
                setPendingDoctors(prev => prev.filter(d => d.id !== doc.id));
                setApprovedDoctors(prev => [normalize(approved), ...prev]);
                if (selectedDoc?.id === doc.id) setSelectedDoc(null);
                showToast(`${doc.fullName} approved ✓ — application moved to doctors`);
            } else {
                // Already in doctors table — just update status (e.g. unsuspend)
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-doctor`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`,
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify({
                            doctorId: doc.id,
                            doctorEmail: doc.email,
                            doctorName: doc.fullName,
                        }),
                    }
                );
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Approval failed');
                const approvedAt = new Date().toISOString();
                setApprovedDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'Approved', approvedAt } : d));
                if (selectedDoc?.id === doc.id) setSelectedDoc(p => ({ ...p, status: 'Approved', approvedAt }));
                showToast(`${doc.fullName} approved ✓`);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setApproving(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        const doc = rejectModal.doc;
        try {
            if (doc._source === 'pending') {
                // Update status in pending_doctors
                await rejectPendingDoctor(doc.id, rejectReason);
                setPendingDoctors(prev => prev.map(d => d.id === doc.id
                    ? { ...d, status: 'Rejected', rejectionReason: rejectReason }
                    : d
                ));
            } else {
                await updateStatus(doc.id, 'Rejected', { rejectionReason: rejectReason });
            }
            showToast(`${doc.fullName} rejected`, 'error');
            if (selectedDoc?.id === doc.id) setSelectedDoc(p => ({ ...p, status: 'Rejected' }));
        } catch (err) {
            showToast(err.message, 'error');
        }
        setRejectModal({ open: false, doc: null });
        setRejectReason('');
    };

    const handleSuspend = (doc) => {
        const newStatus = doc.status === 'Suspended' ? 'Approved' : 'Suspended';
        updateStatus(doc.id, newStatus);
        setApprovedDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
        showToast(`${doc.fullName} ${newStatus === 'Suspended' ? 'suspended' : 'unsuspended'}`, newStatus === 'Suspended' ? 'warn' : 'success');
        if (selectedDoc?.id === doc.id) setSelectedDoc(p => ({ ...p, status: newStatus }));
    };

    const handleDeleteDoctor = async () => {
        try {
            if (deleteTarget._source === 'pending') {
                await supabase.from('pending_doctors').delete().eq('id', deleteTarget.id);
                setPendingDoctors(prev => prev.filter(d => d.id !== deleteTarget.id));
            } else {
                await supabase.from('doctors').delete().eq('id', deleteTarget.id);
                setApprovedDoctors(prev => prev.filter(d => d.id !== deleteTarget.id));
            }
            showToast(`${deleteTarget.fullName} deleted`, 'error');
            if (selectedDoc?.id === deleteTarget.id) setSelectedDoc(null);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeleteTarget(null);
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.from('doctors').insert([{
                full_name: addForm.fullName.trim(),
                email: addForm.email.trim(),
                phone: addForm.phone.trim(),
                specialization: addForm.specialization,
                city: addForm.city.trim(),
                consultation_fee: Number(addForm.consultationFee),
                experience: Number(addForm.experience),
                status: 'Pending',
                applied_at: new Date().toISOString(),
            }]).select().single();
            if (error) throw error;
            setDoctors(prev => [{
                ...data,
                fullName: data.full_name,
                appliedAt: data.applied_at,
                consultationFee: data.consultation_fee,
                availableDays: [], hoursFrom: '09:00', hoursTo: '17:00',
                languages: [], documents: {},
            }, ...prev]);
            setShowAdd(false);
            setAddForm(EMPTY_DOCTOR_FORM);
            showToast(`${addForm.fullName} added ✓`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const statusCounts = STATUSES.reduce((acc, s) => {
        acc[s] = s === 'All' ? doctors.length : doctors.filter(d => d.status === s).length;
        return acc;
    }, {});

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Doctor Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{doctors.length} registered doctors</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg transition-all">
                        <Plus size={16} /> Add Doctor
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                    <button key={s} onClick={() => { setActiveStatus(s); setPage(1); }}
                        className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                            activeStatus === s
                                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30'
                        )}>
                        {s}
                        <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                            activeStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                            {statusCounts[s]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search by name, specialty, email…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                {['Doctor', 'Specialization', 'Experience', 'Fee', 'Status', 'Applied', 'Actions', ...(isSuperAdmin ? [''] : [])].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paged.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                                {doc.fullName.replace('Dr. ', '')[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{doc.fullName}</p>
                                                <p className="text-xs text-slate-400">{doc.id} · {doc.city}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{doc.specialization}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{doc.experience} yrs</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">₹{doc.consultationFee}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', STATUS_STYLES[doc.status])}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                        {format(new Date(doc.appliedAt), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setSelectedDoc(doc)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all" title="View Details">
                                                <Eye size={14} />
                                            </button>
                                            {doc.status === 'Pending' && (
                                                <button onClick={() => handleApprove(doc)} disabled={approving === doc.id}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-all" title="Approve">
                                                    {approving === doc.id
                                                        ? <span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                        : <CheckCircle size={14} />}
                                                </button>
                                            )}
                                            {(doc.status === 'Pending' || doc.status === 'Approved') && (
                                                <button onClick={() => setRejectModal({ open: true, doc })}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Reject">
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                            {doc.status === 'Approved' && (
                                                <button onClick={() => handleSuspend(doc)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-600 hover:text-white transition-all" title="Suspend">
                                                    <ShieldAlert size={14} />
                                                </button>
                                            )}
                                            {doc.status === 'Suspended' && (
                                                <button onClick={() => handleSuspend(doc)}
                                                    className="h-8 px-2 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-medium" title="Unsuspend">
                                                    Unsuspend
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleteTarget(doc)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete Doctor">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {paged.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No doctors found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition">
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={cn('h-8 w-8 rounded-lg text-xs font-medium transition',
                                        page === p ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary')}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 transition">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Doctor Detail Drawer ──────────────────────────────── */}
            <AnimatePresence>
                {selectedDoc && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">

                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
                                <h2 className="font-semibold text-slate-800">Doctor Profile</h2>
                                <button onClick={() => setSelectedDoc(null)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* Profile top */}
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-2xl flex-shrink-0">
                                        {selectedDoc.fullName.replace('Dr. ', '')[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800">{selectedDoc.fullName}</h3>
                                        <p className="text-sm text-primary font-medium">{selectedDoc.specialization}</p>
                                        {selectedDoc.subSpecialization && <p className="text-xs text-slate-500">{selectedDoc.subSpecialization}</p>}
                                        <span className={cn('inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border', STATUS_STYLES[selectedDoc.status])}>
                                            {selectedDoc.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Info grid */}
                                {[
                                    { label: 'Doctor ID', value: selectedDoc.id },
                                    { label: 'Email', value: selectedDoc.email, icon: Mail },
                                    { label: 'Phone', value: selectedDoc.phone, icon: Phone },
                                    { label: 'Date of Birth', value: selectedDoc.dob },
                                    { label: 'Gender', value: selectedDoc.gender },
                                    { label: 'License No.', value: selectedDoc.licenseNo },
                                    { label: 'NMC/MCI Reg.', value: selectedDoc.nmcNo },
                                    { label: 'Degree', value: `${selectedDoc.degree} (${selectedDoc.passingYear})` },
                                    { label: 'Institution', value: selectedDoc.institution },
                                    { label: 'Additional Quals', value: selectedDoc.additionalQualifications || '—' },
                                    { label: 'Experience', value: `${selectedDoc.experience} years` },
                                    { label: 'Consultation Fee', value: `₹${selectedDoc.consultationFee}` },
                                    { label: 'Consultation Type', value: selectedDoc.consultationType },
                                    { label: 'Clinic', value: selectedDoc.clinicName },
                                    { label: 'Address', value: `${selectedDoc.clinicAddress}, ${selectedDoc.city}, ${selectedDoc.state}` },
                                    { label: 'Languages', value: selectedDoc.languages.join(', ') },
                                    { label: 'Available Days', value: selectedDoc.availableDays.join(', ') },
                                    { label: 'Hours', value: `${selectedDoc.hoursFrom} – ${selectedDoc.hoursTo}` },
                                    { label: 'Applied On', value: format(new Date(selectedDoc.appliedAt), 'dd MMM yyyy') },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-start py-2 border-b border-slate-50 gap-4">
                                        <span className="text-xs font-medium text-slate-400 flex-shrink-0 w-32">{label}</span>
                                        <span className="text-xs text-slate-700 text-right">{value}</span>
                                    </div>
                                ))}

                                {/* Documents */}
                                <DocumentViewer documents={selectedDoc.documents} supabase={supabase} />

                                {/* Rejection reason if any */}
                                {selectedDoc.rejectionReason && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                                        <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason:</p>
                                        <p className="text-xs text-red-500">{selectedDoc.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Actions */}
                            {(selectedDoc.status === 'Pending' || selectedDoc.status === 'Approved') && (
                                <div className="p-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                                    {selectedDoc.status === 'Pending' && (
                                        <button onClick={() => handleApprove(selectedDoc)} disabled={approving === selectedDoc.id}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                            {approving === selectedDoc.id
                                                ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Approving…</>
                                                : <><CheckCircle size={15} /> Approve</>}
                                        </button>
                                    )}
                                    <button onClick={() => setRejectModal({ open: true, doc: selectedDoc })}
                                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                                        <XCircle size={15} /> Reject
                                    </button>
                                    {selectedDoc.status === 'Approved' && (
                                        <button onClick={() => handleSuspend(selectedDoc)}
                                            className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                            <ShieldAlert size={15} /> Suspend
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Add Doctor Modal ──────────────────────────────── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg">Add New Doctor</h3>
                                <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_DOCTOR_FORM); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleAddDoctor} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                {[
                                    { key: 'fullName', label: 'Full Name', placeholder: 'Dr. Priya Sharma', type: 'text' },
                                    { key: 'email', label: 'Email', placeholder: 'doctor@clinic.com', type: 'email' },
                                    { key: 'phone', label: 'Phone', placeholder: '9876543210', type: 'tel' },
                                    { key: 'city', label: 'City', placeholder: 'Delhi', type: 'text' },
                                    { key: 'consultationFee', label: 'Consultation Fee (₹)', placeholder: '500', type: 'number' },
                                    { key: 'experience', label: 'Experience (years)', placeholder: '5', type: 'number' },
                                ].map(({ key, label, placeholder, type }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                                        <input required type={type} value={addForm[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Specialization</label>
                                    <select value={addForm.specialization} onChange={e => setAddForm(f => ({ ...f, specialization: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                                        {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setShowAdd(false); setAddForm(EMPTY_DOCTOR_FORM); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition">Add Doctor</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ──────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Doctor?</h3>
                            <p className="text-sm text-slate-500 mb-5">{deleteTarget?.fullName}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleDeleteDoctor} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Reject Reason Modal ──────────────────────────────── */}
            <AnimatePresence>
                {rejectModal.open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Reject Application</h3>
                                <p className="text-sm text-slate-500 mb-4">{rejectModal.doc?.fullName}</p>
                                <textarea
                                    autoFocus
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Enter rejection reason (required)…"
                                    rows={4}
                                    className="w-full p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                                />
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => { setRejectModal({ open: false, doc: null }); setRejectReason(''); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                                        Cancel
                                    </button>
                                    <button onClick={handleReject} disabled={!rejectReason.trim()}
                                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition">
                                        Confirm Rejection
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className={cn(
                            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2',
                            toast.type === 'success' ? 'bg-emerald-500 text-white' :
                                toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'
                        )}>
                        <CheckCircle size={15} /> {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Document Viewer Component ─────────────────────────── */
function DocumentViewer({ documents = {}, supabase }) {
    const [urls, setUrls] = useState({});
    const [loading, setLoading] = useState(true);

    const DOCS = [
        { label: 'Govt ID', key: 'govtId' },
        { label: 'License', key: 'licenseDoc' },
        { label: 'Degree', key: 'degreeCert' },
    ];

    useEffect(() => {
        async function loadUrls() {
            setLoading(true);
            const entries = await Promise.all(
                DOCS.map(async ({ label, key }) => {
                    const path = documents?.[key];
                    if (!path) return { key, label, url: null };
                    const { data } = await supabase.storage
                        .from('doctor-docs')
                        .createSignedUrl(path, 3600);
                    return { key, label, url: data?.signedUrl || null };
                })
            );
            const map = {};
            entries.forEach(e => { map[e.key] = e; });
            setUrls(map);
            setLoading(false);
        }
        loadUrls();
    }, [JSON.stringify(documents)]);

    return (
        <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Uploaded Documents</h4>
            <div className="grid grid-cols-3 gap-2">
                {DOCS.map(({ label, key }) => {
                    const entry = urls[key];
                    const hasDoc = !!documents?.[key];
                    const hasUrl = !!entry?.url;
                    return (
                        <a
                            key={key}
                            href={hasUrl ? entry.url : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={!hasUrl ? (e) => e.preventDefault() : undefined}
                            className={`rounded-xl border-2 border-dashed p-3 flex flex-col items-center gap-1 transition-colors no-underline
                                ${hasUrl ? 'border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer' : 'border-slate-200 cursor-default'}`}
                        >
                            <FileText size={20} className={hasUrl ? 'text-primary' : 'text-slate-300'} />
                            <span className="text-[10px] text-slate-500 text-center">{label}</span>
                            {loading && hasDoc ? (
                                <span className="text-[10px] text-slate-400">Loading…</span>
                            ) : hasUrl ? (
                                <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">View <ExternalLink size={8} /></span>
                            ) : (
                                <span className="text-[10px] text-slate-300">{hasDoc ? 'Error' : 'N/A'}</span>
                            )}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
