import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, IndianRupee, Landmark, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase.js';
import { useDoctor } from '../context/DoctorContext.jsx';

const storageKeyFor = (doctorId) => `upchaar-release-requests-${doctorId}`;

export default function DoctorReleaseRequests() {
    const { doctorRecord } = useDoctor();
    const [appointments, setAppointments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!doctorRecord?.id) return;

        const fetchAppointments = async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', doctorRecord.id);

            if (!error) setAppointments(data || []);
        };

        fetchAppointments();
        try {
            const stored = localStorage.getItem(storageKeyFor(doctorRecord.id));
            setRequests(stored ? JSON.parse(stored) : []);
        } catch {
            setRequests([]);
        }
    }, [doctorRecord?.id]);

    const completedAmount = useMemo(() => appointments
        .filter(item => item.status === 'Completed')
        .reduce((sum, item) => sum + Number(item.fee || 0), 0), [appointments]);

    const requestedAmount = useMemo(() => requests.reduce((sum, item) => sum + Number(item.amount || 0), 0), [requests]);
    const releasableAmount = Math.max(completedAmount - requestedAmount, 0);

    const submitRequest = () => {
        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            setMessage('Enter a valid release amount.');
            return;
        }
        if (numericAmount > releasableAmount) {
            setMessage('Requested amount is greater than available fee.');
            return;
        }

        const nextRequest = {
            id: crypto.randomUUID(),
            amount: numericAmount,
            note: note.trim(),
            status: 'Pending',
            requestedAt: new Date().toISOString(),
        };

        const nextRequests = [nextRequest, ...requests];
        setRequests(nextRequests);
        localStorage.setItem(storageKeyFor(doctorRecord.id), JSON.stringify(nextRequests));
        setAmount('');
        setNote('');
        setMessage('Release request submitted.');
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Fee Release</h1>
                <p className="text-sm text-slate-500 mt-1">Request payout of your completed consultation fees from a separate page.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Completed Fees', value: completedAmount, icon: CircleDollarSign },
                    { label: 'Already Requested', value: requestedAmount, icon: Landmark },
                    { label: 'Available To Release', value: releasableAmount, icon: IndianRupee },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                        <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                            <card.icon size={20} />
                        </div>
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">Rs. {card.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4">Request Release</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Amount</label>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter release amount"
                                className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Note</label>
                            <textarea
                                rows={4}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optional note for the admin or finance team"
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                            />
                        </div>
                        {message && <p className="text-sm text-teal-600">{message}</p>}
                        <button
                            type="button"
                            onClick={submitRequest}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-teal-400 text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                            <Send size={16} /> Request Release
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4">Previous Requests</h2>
                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <p className="text-sm text-slate-500">No release requests yet.</p>
                        ) : requests.map(request => (
                            <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-800">Rs. {Number(request.amount).toLocaleString()}</p>
                                    <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700">
                                        {request.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Requested on {new Date(request.requestedAt).toLocaleString('en-IN')}
                                </p>
                                {request.note && <p className="text-sm text-slate-600 mt-2">{request.note}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
