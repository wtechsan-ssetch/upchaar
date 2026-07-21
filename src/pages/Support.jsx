import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, ShieldCheck } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function SupportPage() {
    const { user } = useAuth();

    return (
        <AppLayout hideSidebar={!user} hideNavbar={!user}>
            <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <Link to="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                            ← Back to Home
                        </Link>
                    </div>
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                            Help & Support
                        </h1>
                        <p className="mt-4 text-xl text-slate-500">
                            Get in touch with the Upchaar Health team for any queries or assistance.
                        </p>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-2xl border border-slate-100 max-w-2xl mx-auto">
                        <div className="px-4 py-5 sm:px-6 bg-slate-900 flex items-center gap-3">
                            <ShieldCheck className="text-teal-400" size={24} />
                            <h3 className="text-lg leading-6 font-medium text-white">Support Contact Information</h3>
                        </div>
                        <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-slate-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <Phone size={18} className="text-slate-400" /> Support Phone
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-semibold">
                                        <a href="tel:7029823013" className="hover:text-teal-600">
                                            7029823013
                                        </a>
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-slate-50">
                                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-slate-400" /> Support WhatsApp
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-semibold">
                                        <a href="https://wa.me/919434655390" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600">
                                            9434655390
                                        </a>
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <Mail size={18} className="text-slate-400" /> Support Email
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-semibold">
                                        <a href="mailto:support@upcharhealth.com" className="text-teal-600 hover:text-teal-500 hover:underline">
                                            support@upcharhealth.com
                                        </a>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
