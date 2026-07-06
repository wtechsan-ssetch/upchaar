import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    CircleDollarSign, IndianRupee, Landmark, Send, ShieldAlert,
    Clock, CheckCircle2, XCircle, ChevronRight, AlertTriangle,
    Building2, CreditCard, Hash, User, RefreshCw, ArrowLeft, Copy, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_STYLE = {
    Pending:  'bg-amber-50  text-amber-700  border-amber-200',
    Released: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50    text-red-600    border-red-200',
};

const STATUS_ICON = {
    Pending:  <Clock size={12} />,
    Released: <CheckCircle2 size={12} />,
    Rejected: <XCircle size={12} />,
};

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ value }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={copy} title="Copy" className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-teal-600 transition">
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
        </button>
    );
}

const STEP_BANK = 'bank';
const STEP_CONFIRM = 'confirm';
const STEP_AMOUNT = 'amount';

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DoctorReleaseRequests() {
    const { doctorRecord } = useDoctor();

    // Data
    const [appointments, setAppointments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [step, setStep] = useState(STEP_BANK); // bank → confirm → amount
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
    });
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ── Fetch data ────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!doctorRecord?.id) return;
        setLoading(true);
        try {
            const [{ data: apts }, { data: reqs }] = await Promise.all([
                supabase.from('appointments').select('*').eq('doctor_id', doctorRecord.id),
                supabase.from('fee_release_requests')
                    .select('*')
                    .eq('doctor_id', doctorRecord.id)
                    .order('requested_at', { ascending: false }),
            ]);
            setAppointments(apts || []);
            setRequests(reqs || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [doctorRecord?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Derived financials ────────────────────────────────────────────────────
    const totalEarned = useMemo(() =>
        appointments.filter(a => a.status === 'Completed')
            .reduce((s, a) => s + Number(a.fee || 0), 0),
        [appointments]);

    const totalReleased = useMemo(() =>
        requests.filter(r => r.status === 'Released')
            .reduce((s, r) => s + Number(r.amount || 0), 0),
        [requests]);

    const totalPendingRequests = useMemo(() =>
        requests.filter(r => r.status === 'Pending')
            .reduce((s, r) => s + Number(r.amount || 0), 0),
        [requests]);

    const completedAppointments = useMemo(() =>
        appointments.filter(a => a.status === 'Completed').length,
        [appointments]);

    const availableToRelease = Math.max(totalEarned - totalReleased - totalPendingRequests, 0);

    // ── 24hr cooldown check ───────────────────────────────────────────────────
    const lastRequest = requests[0];
    const cooldownRemaining = useMemo(() => {
        if (!lastRequest) return 0;
        const elapsed = Date.now() - new Date(lastRequest.requested_at).getTime();
        const remaining = 24 * 60 * 60 * 1000 - elapsed;
        return remaining > 0 ? remaining : 0;
    }, [lastRequest]);

    const formatCooldown = (ms) => {
        const hrs = Math.floor(ms / (1000 * 60 * 60));
        const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };

    // ── Bank form handlers ────────────────────────────────────────────────────
    const handleBankChange = (field) => (e) => {
        setBankDetails(prev => ({ ...prev, [field]: e.target.value }));
        setError('');
    };

    const validateBankDetails = () => {
        const { bankName, accountNumber, ifscCode, accountHolderName } = bankDetails;
        if (!bankName.trim()) return 'Please enter bank name.';
        if (!accountNumber.trim() || accountNumber.trim().length < 9)
            return 'Please enter a valid account number (min 9 digits).';
        if (!ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim()))
            return 'Please enter a valid IFSC code (e.g., HDFC0001234).';
        if (!accountHolderName.trim()) return 'Please enter account holder name.';
        return null;
    };

    const handleBankNext = () => {
        const err = validateBankDetails();
        if (err) { setError(err); return; }
        setError('');
        setStep(STEP_CONFIRM);
    };

    const handleConfirmNext = () => {
        setStep(STEP_AMOUNT);
    };

    const handleSubmit = async () => {
        if (cooldownRemaining > 0) {
            setError(`You can submit another request after ${formatCooldown(cooldownRemaining)}.`);
            return;
        }
        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (numericAmount > availableToRelease) {
            setError(`Amount exceeds available balance of ${formatINR(availableToRelease)}.`);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const { error: insertError } = await supabase.from('fee_release_requests').insert({
                doctor_id: doctorRecord.id,
                doctor_name: doctorRecord.full_name,
                doctor_email: doctorRecord.email,
                amount: numericAmount,
                bank_name: bankDetails.bankName.trim(),
                account_number: bankDetails.accountNumber.trim(),
                ifsc_code: bankDetails.ifscCode.trim().toUpperCase(),
                account_holder_name: bankDetails.accountHolderName.trim(),
                note: note.trim() || null,
                status: 'Pending',
            });

            if (insertError) throw insertError;

            setSuccess('Release request submitted successfully!');
            setAmount('');
            setNote('');
            setStep(STEP_BANK);
            setBankDetails({ bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' });
            await loadData();
        } catch (err) {
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Stat cards ────────────────────────────────────────────────────────────
    const statCards = [
        { label: 'Total Earned', value: formatINR(totalEarned), icon: CircleDollarSign, tone: 'text-teal-600 bg-teal-50' },
        { label: 'Total Released', value: formatINR(totalReleased), icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
        { label: 'Pending Requests', value: formatINR(totalPendingRequests), icon: Clock, tone: 'text-amber-600 bg-amber-50' },
        { label: 'Available to Release', value: formatINR(availableToRelease), icon: IndianRupee, tone: 'text-blue-600 bg-blue-50' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Fee Release</h1>
                <p className="text-sm text-slate-500 mt-1">Request payout of your earned consultation fees.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5"
                    >
                        <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center mb-3', card.tone)}>
                            <card.icon size={18} />
                        </div>
                        <p className="text-xs text-slate-500">{card.label}</p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">{card.value}</p>
                        {card.label === 'Total Earned' && (
                            <p className="text-[10px] text-slate-400 mt-1">{completedAppointments} completed appts</p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Success message */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200"
                    >
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <p className="text-sm font-medium text-emerald-700">{success}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Form */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h2 className="font-bold text-slate-800 text-lg">Request Release</h2>
                        {/* Step Indicator */}
                        <div className="ml-auto flex items-center gap-1.5">
                            {[STEP_BANK, STEP_CONFIRM, STEP_AMOUNT].map((s, i) => (
                                <div key={s} className={cn(
                                    'h-2 rounded-full transition-all',
                                    step === s ? 'w-6 bg-teal-500' : 'w-2 bg-slate-200'
                                )} />
                            ))}
                        </div>
                    </div>

                    {/* ── STEP 1: Bank Details ── */}
                    {step === STEP_BANK && (
                        <motion.div
                            key="bank"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Step 1 — Bank Details</p>

                            {[
                                { field: 'accountHolderName', label: 'Account Holder Name', placeholder: 'As per bank records', icon: User },
                                { field: 'bankName', label: 'Bank Name', placeholder: 'e.g., HDFC Bank', icon: Building2 },
                                { field: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number', icon: CreditCard },
                                { field: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g., HDFC0001234', icon: Hash },
                            ].map(({ field, label, placeholder, icon: Icon }) => (
                                <div key={field}>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        {label} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={field === 'accountNumber' ? 'text' : 'text'}
                                            value={bankDetails[field]}
                                            onChange={handleBankChange(field)}
                                            placeholder={placeholder}
                                            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition"
                                        />
                                    </div>
                                </div>
                            ))}

                            {error && (
                                <p className="text-xs text-red-500 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> {error}
                                </p>
                            )}

                            <button
                                onClick={handleBankNext}
                                className="w-full h-11 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Confirm & Warning ── */}
                    {step === STEP_CONFIRM && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Step 2 — Verify Details</p>

                            {/* Bank details summary */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2.5">
                                {[
                                    ['Account Holder', bankDetails.accountHolderName],
                                    ['Bank Name', bankDetails.bankName],
                                    ['Account Number', bankDetails.accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ')],
                                    ['IFSC Code', bankDetails.ifscCode.toUpperCase()],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{label}</span>
                                        <span className="text-sm font-semibold text-slate-800">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ⚠️ Warning Note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-bold text-amber-800">⚠️ Important Notice</p>
                                        <ul className="space-y-1 text-xs text-amber-700 list-disc list-inside">
                                            <li>Please verify your bank details carefully before proceeding.</li>
                                            <li>Once you request a release, <strong>bank details cannot be changed</strong> for this payment. You may update them for your next payment cycle.</li>
                                            <li><strong>Upchar Health will not be responsible</strong> for any payment made to incorrect account details entered by you.</li>
                                            <li>After releasing, you must wait <strong>24 hours</strong> before submitting another request.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* 24hr Cooldown Notice */}
                            {cooldownRemaining > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
                                    <Clock size={16} className="text-red-500 shrink-0" />
                                    <p className="text-xs font-medium text-red-700">
                                        You can submit another request in <strong>{formatCooldown(cooldownRemaining)}</strong>.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(STEP_BANK)}
                                    className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={15} /> Edit
                                </button>
                                <button
                                    onClick={handleConfirmNext}
                                    disabled={cooldownRemaining > 0}
                                    className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    I Confirm <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Amount Entry ── */}
                    {step === STEP_AMOUNT && (
                        <motion.div
                            key="amount"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Step 3 — Enter Amount</p>

                            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-3 flex items-center justify-between">
                                <span className="text-xs text-teal-700 font-medium">Available to Release</span>
                                <span className="text-base font-bold text-teal-700">{formatINR(availableToRelease)}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Release Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={availableToRelease}
                                        value={amount}
                                        onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                        placeholder="0.00"
                                        className="w-full h-11 pl-8 pr-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Note (optional)</label>
                                <textarea
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Any note for the finance team..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> {error}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(STEP_CONFIRM)}
                                    className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    <ArrowLeft size={15} />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !amount || Number(amount) <= 0}
                                    className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><RefreshCw size={14} className="animate-spin" /> Submitting...</>
                                    ) : (
                                        <><Send size={14} /> Submit Request</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Request History */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-slate-800 text-lg">Request History</h2>
                        <button
                            onClick={loadData}
                            className="h-8 w-8 rounded-xl border border-slate-200 text-slate-400 hover:text-teal-600 hover:bg-teal-50 flex items-center justify-center transition"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <Landmark size={20} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No release requests yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Your requests will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                            {requests.map((req, i) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-base font-bold text-slate-800">{formatINR(req.amount)}</p>
                                        <span className={cn(
                                            'flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold',
                                            STATUS_STYLE[req.status] || STATUS_STYLE.Pending
                                        )}>
                                            {STATUS_ICON[req.status]}
                                            {req.status}
                                        </span>
                                    </div>

                                    {/* Transaction ID — shown when Released */}
                                    {req.status === 'Released' && (req.transaction_id || req.razorpay_payout_id) && (
                                        <div className="mb-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
                                                {req.payment_mode === 'razorpay' ? 'Razorpay UTR / Transaction ID' : 'Transaction ID'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-mono font-bold text-emerald-800 flex-1 truncate">
                                                    {req.transaction_id || req.razorpay_payout_id}
                                                </p>
                                                <CopyBtn value={req.transaction_id || req.razorpay_payout_id} />
                                            </div>
                                            {req.razorpay_payout_id && req.razorpay_payout_id !== req.transaction_id && (
                                                <p className="text-[10px] text-emerald-600 mt-1 font-mono">Payout: {req.razorpay_payout_id}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                                        <span>Bank: <strong className="text-slate-700">{req.bank_name}</strong></span>
                                        <span>IFSC: <strong className="text-slate-700">{req.ifsc_code}</strong></span>
                                        <span>Acct: <strong className="text-slate-700">
                                            {'•'.repeat(req.account_number.length - 4) + req.account_number.slice(-4)}
                                        </strong></span>
                                        <span>Holder: <strong className="text-slate-700">{req.account_holder_name}</strong></span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        Requested: {new Date(req.requested_at).toLocaleString('en-IN')}
                                    </p>
                                    {req.released_at && (
                                        <p className="text-[11px] text-emerald-600 mt-0.5">
                                            Released: {new Date(req.released_at).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                    {req.admin_note && (
                                        <p className="text-xs text-slate-600 mt-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
                                            Admin note: {req.admin_note}
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
