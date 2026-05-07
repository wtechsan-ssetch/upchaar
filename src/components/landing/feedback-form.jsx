import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, User, Phone, Mail, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';

export const FeedbackForm = () => {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        feedback: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const { error } = await supabase.functions.invoke('send-feedback', {
                body: form
            });

            if (error) throw error;

            setStatus({ type: 'success', msg: 'Thank you! Your feedback has been submitted.' });
            setForm({ name: '', phone: '', email: '', feedback: '' });
        } catch (err) {
            console.error('Feedback error:', err);
            setStatus({ type: 'error', msg: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-slate-50 border-t border-slate-100 py-16">
            <div className="container max-w-4xl">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Info */}
                    <div className="bg-slate-900 p-8 md:p-12 text-white md:w-1/3 flex flex-col justify-center">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-6">
                            <MessageSquare className="text-white" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Give us Feedback</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your insights help us improve Upchar Health. We&apos;d love to hear your thoughts or suggestions.
                        </p>
                    </div>

                    {/* Right: Form */}
                    <div className="p-8 md:p-12 flex-1">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <Input
                                            name="name"
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <Input
                                            name="phone"
                                            type="tel"
                                            required
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="+91 98765 43210"
                                            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        name="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Your Message</label>
                                <Textarea
                                    name="feedback"
                                    required
                                    value={form.feedback}
                                    onChange={handleChange}
                                    placeholder="Tell us what you think..."
                                    rows={4}
                                    className="rounded-xl bg-slate-50 border-slate-200 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            {status.msg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-xl text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                                >
                                    {status.msg}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending...' : <><Send size={16} /> Submit Feedback</>}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};
