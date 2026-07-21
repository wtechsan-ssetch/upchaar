import React from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function TermsPage() {
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
                            Terms & Conditions
                        </h1>
                        <p className="mt-4 text-xl text-slate-500">
                            Upchaar Health Terms of Service and Conditions.
                        </p>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="bg-white shadow sm:rounded-2xl border border-slate-100 overflow-hidden text-slate-700">
                        <div className="px-6 py-8 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-teal-600">
                            <h2>1. Terms of Use for All Users (Patients)</h2>
                            
                            <h3>Platform as an Intermediary</h3>
                            <p>
                                The platform provides digital infrastructure to connect patients with independent medical practitioners, manage appointments, and streamline queues. It does not provide direct medical services and is strictly not for medical emergencies.
                            </p>

                            <h3>Consultation Integrity & Inputs</h3>
                            <p>
                                The quality of a teleconsultation depends entirely on the accuracy of the symptoms and medical history provided by the user. The platform is not liable for incorrect diagnoses stemming from incomplete or inaccurate patient inputs.
                            </p>

                            <h3>Booking, Tokens, and Cancellations</h3>
                            <ul className="list-none pl-0 space-y-2">
                                <li>Fees: Consultation and token generation fees must be clearly displayed prior to booking.</li>
                                <li>No-Shows: If a patient misses their digital slot or physical queue token window, the fee is non-refundable.</li>
                                <li>Doctor Cancellations: If a doctor is unavailable or cancels a session, the user is entitled to a full refund or a rescheduled token.</li>
                                <li>Prescription Limitations: Any digital prescription generated is the sole professional responsibility of the consulting doctor. The platform does not guarantee the local availability of the prescribed medications.</li>
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
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
