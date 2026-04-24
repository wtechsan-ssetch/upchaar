import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MessageSquare } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function TermsPage() {
    const { user } = useAuth();

    return (
        <AppLayout hideSidebar={!user} hideNavbar={!user}>
            <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                            Terms & Support
                        </h1>
                        <p className="mt-4 text-xl text-slate-500">
                            Upchaar Health Support Information and Terms of Service.
                        </p>
                    </div>

                    {/* Support Information */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-2xl mb-12 border border-slate-100">
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
                                        7029823013
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-slate-50">
                                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-slate-400" /> Support WhatsApp
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-semibold">
                                        9434655390
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <Mail size={18} className="text-slate-400" /> Support Email
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-semibold">
                                        <a href="mailto:mainupchaarhealth@gmail.com" className="text-teal-600 hover:text-teal-500 hover:underline">
                                            mainupchaarhealth@gmail.com
                                        </a>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Terms of Service */}
                    <div className="bg-white shadow sm:rounded-2xl border border-slate-100 overflow-hidden text-slate-700">
                        <div className="px-6 py-8 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-teal-600">
                            <h2>1. Terms of Use for All Users (Patients)</h2>
                            
                            <h3>Platform as an Intermediary</h3>
                            <p>
                                The platform provides digital infrastructure to connect patients with independent medical practitioners, manage appointments, and streamline queues. It does not provide direct medical services and is <strong>strictly not for medical emergencies</strong>.
                            </p>

                            <h3>Consultation Integrity & Inputs</h3>
                            <p>
                                The quality of a teleconsultation depends entirely on the accuracy of the symptoms and medical history provided by the user. The platform is not liable for incorrect diagnoses stemming from incomplete or inaccurate patient inputs.
                            </p>

                            <h3>Booking, Tokens, and Cancellations</h3>
                            <ul>
                                <li><strong>Fees:</strong> Consultation and token generation fees must be clearly displayed prior to booking.</li>
                                <li><strong>No-Shows:</strong> If a patient misses their digital slot or physical queue token window, the fee is non-refundable.</li>
                                <li><strong>Doctor Cancellations:</strong> If a doctor is unavailable or cancels a session, the user is entitled to a full refund or a rescheduled token.</li>
                                <li><strong>Prescription Limitations:</strong> Any digital prescription generated is the sole professional responsibility of the consulting doctor. The platform does not guarantee the local availability of the prescribed medications.</li>
                            </ul>

                            <h3>Data Security</h3>
                            <p>
                                Patient records, uploaded diagnostic reports, and consultation logs are encrypted and stored in compliance with applicable digital privacy laws, accessible only to the patient and their authorized doctor.
                            </p>

                            <hr className="my-8 border-slate-200" />

                            <h2>2. Terms of Service for Doctors (Healthcare Providers)</h2>
                            
                            <h3>Verified Credentials</h3>
                            <p>
                                Doctors must hold valid registration with the respective national medical council and submit verifiable proof of their credentials before platform activation.
                            </p>

                            <h3>Telemedicine Guidelines Compliance</h3>
                            <p>
                                Practitioners must strictly abide by national Telemedicine Practice Guidelines, ensuring they only prescribe permissible medications (e.g., adhering to restrictions on prescribing habit-forming drugs via telephonic or video consultations).
                            </p>

                            <h3>Independent Operation</h3>
                            <p>
                                Doctors operate on the platform as independent service providers, not employees. The platform supplies the digital dashboard and appointment management system, but exercises no control over medical decisions.
                            </p>

                            <h3>Platform Fees & Settlements</h3>
                            <p>
                                This section details the commission structure (e.g., a flat platform convenience fee per token or a percentage of the consultation fee) and the specific payout cycles to the doctors as documented in their specific tier agreement.
                            </p>

                            <h3>Indemnity</h3>
                            <p>
                                The doctor indemnifies the platform against any patient lawsuits, claims of medical negligence, or adverse reactions resulting from their specific diagnosis, treatment plan, or conduct during the consultation.
                            </p>

                            <hr className="my-8 border-slate-200" />

                            <h2>Privacy Policy</h2>
                            <p>
                                We value your privacy. Please read our complete privacy policy to understand how we collect, use, and share your information.
                            </p>
                            <Link to="/privacy-policy" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 mt-4 no-underline">
                                Read Full Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
