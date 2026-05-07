import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { Send, Megaphone, Mail, Users, CheckCircle, X, Bell, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Notification detail modal ── */
function NotificationDetailModal({ note, onClose }) {
    if (!note) return null;

    const typeConfig = {
        fee_change_request: { icon: IndianRupee, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Fee Change Request' },
        broadcast:          { icon: Megaphone,   color: 'text-primary',   bg: 'bg-primary/10', border: 'border-primary/20', label: 'Broadcast' },
        individual:         { icon: Mail,        color: 'text-blue-500',  bg: 'bg-blue-50',    border: 'border-blue-200',   label: 'Direct Message' },
    };
    const cfg = typeConfig[note.type] || typeConfig.broadcast;
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-start justify-between gap-3 p-6 border-b ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                            <Icon size={18} className={cfg.color} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cfg.label}</p>
                            <p className="font-bold text-slate-800 text-base leading-tight mt-0.5">
                                {note.subject || 'Notification'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition shrink-0"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Meta */}
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    {note.from_name  && <span><span className="font-semibold text-slate-600">From:</span> {note.from_name}</span>}
                    {note.from_email && <span><span className="font-semibold text-slate-600">Email:</span> {note.from_email}</span>}
                    {(note.created_at || note.sentAt) && (
                        <span>
                            <span className="font-semibold text-slate-600">Time:</span>{' '}
                            {format(new Date(note.created_at || note.sentAt), 'dd MMM yyyy · HH:mm')}
                        </span>
                    )}
                    {note.audience && <span><span className="font-semibold text-slate-600">To:</span> {note.audience}</span>}
                </div>

                {/* Full message */}
                <div className="p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Full Message</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {note.message || note.body || '(No message body)'}
                        </p>
                    </div>
                </div>

                <div className="px-6 pb-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function NotificationCenter() {
    const [tab, setTab] = useState('broadcast');
    const [sentNotifications, setSentNotifications] = useState([]);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [broadcast, setBroadcast] = useState({ audience: 'All Doctors', subject: '', body: '' });
    const [individual, setIndividual] = useState({ search: '', selected: null, subject: '', body: '' });
    const [doctorSearch, setDoctorSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [docsRes, patsRes, notifRes] = await Promise.all([
                supabase.from('doctors').select('id, full_name, email, specialization, status'),
                supabase.from('profiles').select('id, full_name, email'),
                supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50),
            ]);
            const docs = (docsRes.data || []).map(d => ({ ...d, type: 'Doctor' }));
            const pats = (patsRes.data || []).map(p => ({ ...p, type: 'Patient' }));
            setUsers([...docs, ...pats]);
            setAdminNotifications(notifRes.data || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const markRead = async (id) => {
        await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
        setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const searchResults = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(doctorSearch.toLowerCase())
        || (u.email || '').toLowerCase().includes(doctorSearch.toLowerCase())
    ).slice(0, 6);

    const sendBroadcast = () => {
        if (!broadcast.subject.trim() || !broadcast.body.trim()) return;
        setSentNotifications(prev => [{
            id: Date.now(), type: 'broadcast', audience: broadcast.audience,
            subject: broadcast.subject, body: broadcast.body,
            sentAt: new Date().toISOString(),
        }, ...prev]);
        setBroadcast({ audience: 'All Doctors', subject: '', body: '' });
        showToast('Broadcast sent successfully!');
    };

    const sendIndividual = () => {
        if (!individual.selected || !individual.subject.trim() || !individual.body.trim()) return;
        setSentNotifications(prev => [{
            id: Date.now(), type: 'individual',
            audience: individual.selected.full_name,
            from_email: individual.selected.email,
            subject: individual.subject, body: individual.body,
            sentAt: new Date().toISOString(),
        }, ...prev]);
        setIndividual({ search: '', selected: null, subject: '', body: '' });
        setDoctorSearch('');
        showToast('Email sent successfully!');
    };

    const unreadCount = adminNotifications.filter(n => !n.is_read).length;

    const typeIcon = (type) => {
        if (type === 'fee_change_request') return <IndianRupee size={14} className="text-amber-500" />;
        if (type === 'individual') return <Mail size={14} className="text-blue-500" />;
        return <Megaphone size={14} className="text-primary" />;
    };

    const handleNoteClick = (note) => {
        setSelectedNote(note);
        if (!note.is_read && note.id && typeof note.id === 'string') {
            markRead(note.id);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Notification Center</h1>
                <p className="text-sm text-slate-500 mt-0.5">Send broadcasts and view incoming notifications</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* ── Compose ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        {[
                            { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
                            { key: 'individual', label: 'Individual Email', icon: Mail },
                        ].map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => setTab(key)}
                                className={cn('flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition border-b-2',
                                    tab === key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                                <Icon size={15} /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="p-5 space-y-4">
                        {tab === 'broadcast' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Audience</label>
                                    <select value={broadcast.audience} onChange={e => setBroadcast(b => ({ ...b, audience: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition">
                                        <option>All Doctors</option>
                                        <option>All Patients</option>
                                        <option>All Users (Doctors + Patients)</option>
                                        <option>Pending Doctors Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Subject</label>
                                    <input type="text" placeholder="Email subject line…" value={broadcast.subject}
                                        onChange={e => setBroadcast(b => ({ ...b, subject: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Message</label>
                                    <textarea rows={5} placeholder="Compose your message…" value={broadcast.body}
                                        onChange={e => setBroadcast(b => ({ ...b, body: e.target.value }))}
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                </div>
                                <button onClick={sendBroadcast} disabled={!broadcast.subject.trim() || !broadcast.body.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition">
                                    <Send size={14} /> Send Broadcast
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Recipient</label>
                                    {individual.selected ? (
                                        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/30 bg-primary/5">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                                {(individual.selected.full_name || '?')[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">{individual.selected.full_name}</p>
                                                <p className="text-xs text-slate-500">{individual.selected.email}</p>
                                            </div>
                                            <button onClick={() => { setIndividual(i => ({ ...i, selected: null })); setDoctorSearch(''); }}
                                                className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input placeholder="Search doctor or patient…" value={doctorSearch}
                                                onChange={e => setDoctorSearch(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                            {doctorSearch && searchResults.length > 0 && (
                                                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                                    {searchResults.map(u => (
                                                        <button key={u.id} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition text-left"
                                                            onClick={() => { setIndividual(i => ({ ...i, selected: u })); setDoctorSearch(''); }}>
                                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                                                                {(u.full_name || '?')[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-slate-800">{u.full_name}</p>
                                                                <p className="text-xs text-slate-400">{u.email} · {u.specialization || 'Patient'}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Subject</label>
                                    <input type="text" placeholder="Email subject…" value={individual.subject}
                                        onChange={e => setIndividual(i => ({ ...i, subject: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Message</label>
                                    <textarea rows={5} placeholder="Compose email body…" value={individual.body}
                                        onChange={e => setIndividual(i => ({ ...i, body: e.target.value }))}
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                </div>
                                <button onClick={sendIndividual} disabled={!individual.selected || !individual.subject.trim() || !individual.body.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition">
                                    <Send size={14} /> Send Email
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Inbox — real admin_notifications from DB ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Bell size={15} className="text-primary" />
                            Incoming Notifications
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                                    {unreadCount} new
                                </span>
                            )}
                        </h2>
                        <span className="text-xs text-slate-400">{adminNotifications.length} total</span>
                    </div>
                    <div className="divide-y divide-slate-50 overflow-y-auto max-h-[420px]">
                        {adminNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell size={28} className="text-slate-300 mb-3" />
                                <p className="text-sm text-slate-400">No notifications yet</p>
                            </div>
                        ) : adminNotifications.map(n => (
                            <button
                                key={n.id}
                                onClick={() => handleNoteClick(n)}
                                className={cn(
                                    'w-full px-5 py-4 hover:bg-slate-50 transition-colors text-left flex items-start gap-3',
                                    !n.is_read && 'bg-primary/[0.03]'
                                )}
                            >
                                <div className={cn(
                                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                                    n.type === 'fee_change_request' ? 'bg-amber-50' : 'bg-primary/10'
                                )}>
                                    {typeIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {n.subject || 'Notification'}
                                        </p>
                                        {!n.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                        )}
                                    </div>
                                    {n.from_name && (
                                        <p className="text-xs text-slate-500 mt-0.5">From: {n.from_name}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                        {n.message || '(click to read full message)'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {n.created_at ? format(new Date(n.created_at), 'dd MMM yyyy · HH:mm') : ''}
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-300 shrink-0 mt-1">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Sent history ── */}
            {sentNotifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800">Sent Notifications</h2>
                        <span className="text-xs text-slate-400">{sentNotifications.length} sent</span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                        {sentNotifications.map(n => (
                            <button key={n.id} onClick={() => setSelectedNote({ ...n, created_at: n.sentAt })}
                                className="w-full px-5 py-4 hover:bg-slate-50 transition-colors text-left flex items-start gap-3">
                                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                                    n.type === 'broadcast' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500')}>
                                    {n.type === 'broadcast' ? <Megaphone size={14} /> : <Mail size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{n.subject}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                            n.type === 'broadcast' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500')}>
                                            {n.type === 'broadcast' ? <Users size={8} /> : <Mail size={8} />}
                                            {n.audience}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{format(new Date(n.sentAt), 'dd MMM · HH:mm')}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-300 shrink-0 mt-1">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedNote && (
                    <NotificationDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
                )}
            </AnimatePresence>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg bg-emerald-500 text-white text-sm font-medium flex items-center gap-2">
                        <CheckCircle size={15} /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
