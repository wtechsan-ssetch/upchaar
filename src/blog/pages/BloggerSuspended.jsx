import { useState } from 'react';
import { useBlog } from '../context/BlogContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { ShieldAlert, Send, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BloggerSuspended() {
    const { blogger, logoutBlogger } = useBlog();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        setError('');
        try {
            const { error: err } = await supabase.from('admin_notifications').insert([{
                type: 'blogger_appeal',
                from_id: blogger?.id || null,
                from_name: blogger?.name || 'Unknown Blogger',
                from_email: blogger?.email || '',
                subject: `Suspension Appeal from ${blogger?.name || 'Blogger'}`,
                message: message.trim(),
            }]);
            if (err) throw new Error(err.message);
            setSent(true);
            setMessage('');
        } catch (e) {
            setError(e.message || 'Failed to send. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-red-100/50 overflow-hidden border border-red-100">
                    {/* Red top banner */}
                    <div className="h-2 bg-gradient-to-r from-red-400 to-red-500" />

                    <div className="p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                                <ShieldAlert size={36} className="text-red-400" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Suspended</h1>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Your blogger account has been temporarily suspended by the admin team.
                                You cannot publish or edit posts until your account is reinstated.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 mb-6" />

                        {/* Appeal form */}
                        <AnimatePresence mode="wait">
                            {sent ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6"
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle size={28} className="text-emerald-500" />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-slate-800 mb-1">Message Sent!</p>
                                    <p className="text-sm text-slate-500">
                                        Your appeal has been sent to the admin team. They will review it shortly.
                                    </p>
                                    <button
                                        onClick={() => setSent(false)}
                                        className="mt-4 text-xs text-primary hover:underline"
                                    >
                                        Send another message
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        Submit an Appeal
                                    </p>
                                    <textarea
                                        rows={5}
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Write your message to the admin team here. Explain your situation and request reinstatement…"
                                        className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-slate-400"
                                    />
                                    {error && (
                                        <div className="flex items-center gap-2 mt-2 text-red-500 text-xs">
                                            <AlertCircle size={12} /> {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSend}
                                        disabled={!message.trim() || sending}
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition shadow-md shadow-primary/20"
                                    >
                                        {sending ? (
                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={14} />
                                        )}
                                        {sending ? 'Sending…' : 'Send Message'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sign out */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
                            <button
                                onClick={logoutBlogger}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={14} /> Sign out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-400 mt-4">
                    Sanjiwani Health · Blogger Portal · For support contact your administrator
                </p>
            </motion.div>
        </div>
    );
}
