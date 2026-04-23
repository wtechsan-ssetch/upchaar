import React from 'react';
import { ShieldCheck, Mail, Phone, MessageSquare } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';

export default function TermsPage() {
    return (
        <AppLayout>
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
                            <h3>1. Information We Collect</h3>
                            <p>We collect information to provide and improve our scheduling and teleconsultation services.</p>
                            <ul>
                                <li><strong>From Patients:</strong> Profile Data: Name, age, gender, phone number, and email address. Health Data: Medical history, current symptoms, previous prescriptions, and any diagnostic reports uploaded to facilitate the consultation.</li>
                                <li><strong>From Doctors:</strong> Professional Data: Name, medical registration number, qualifications, specialization, and clinic/hospital affiliation. Financial Data: Bank account details required strictly for processing consultation payouts.</li>
                                <li><strong>Automatically Collected Data:</strong> IP addresses, device types, operating systems, and app usage metrics (e.g., time spent on the app, crash logs) to ensure platform stability and security.</li>
                            </ul>

                            <h3>2. How We Use Your Information</h3>
                            <p>We do not sell user data. We use the collected information strictly for the following purposes:</p>
                            <ul>
                                <li><strong>Service Delivery:</strong> To create queue tokens, schedule appointments, and connect patients with their chosen doctors via our digital platform.</li>
                                <li><strong>Medical Context:</strong> To provide doctors with the necessary health background to conduct an effective teleconsultation.</li>
                                <li><strong>Transactions:</strong> To process payments, issue refunds, and disburse payouts to medical professionals.</li>
                                <li><strong>Communication:</strong> To send appointment reminders, queue updates, and platform notifications.</li>
                            </ul>

                            <h3>3. How We Share Your Information</h3>
                            <p>We restrict access to your personal data. Information is only shared under the following circumstances:</p>
                            <ul>
                                <li><strong>Between Patient and Doctor:</strong> A patient's health data and medical records are shared exclusively with the specific doctor they have booked for a consultation.</li>
                                <li><strong>Service Providers:</strong> We may share minimal necessary data with secure third-party infrastructure providers (e.g., cloud hosting, payment gateways, SMS gateways) who are bound by strict confidentiality agreements.</li>
                                <li><strong>Legal Compliance:</strong> We may disclose information if required to do so by law, court order, or statutory government authorities.</li>
                            </ul>

                            <h3>4. Data Security</h3>
                            <p>We implement robust, industry-standard security measures to protect your data. All medical records, chat logs, and personal details are encrypted both in transit and at rest. While no digital system is 100% impenetrable, we continuously monitor our infrastructure to prevent unauthorized access, alteration, or destruction of your data.</p>

                            <h3>5. Data Retention</h3>
                            <p>We retain personal and health data only for as long as your account is active or as necessary to fulfill the purposes outlined in this policy. Medical records may be retained for a longer duration if mandated by national healthcare regulations or legal compliance requirements.</p>

                            <h3>6. Your Privacy Rights</h3>
                            <p>Users maintain control over their digital footprint on our platform:</p>
                            <ul>
                                <li><strong>Access & Correction:</strong> You can review and update your profile information and medical history at any time through your dashboard.</li>
                                <li><strong>Right to Erasure:</strong> You may request the deletion of your account and associated personal data. Upon request, we will erase your data, except for logs or records we are legally required to maintain.</li>
                                <li><strong>Withdrawal of Consent:</strong> You may withdraw your consent for data processing at any time, though this will result in the termination of access to our teleconsultation services.</li>
                            </ul>

                            <h3>7. Grievance Officer</h3>
                            <p>In compliance with data protection laws, any concerns regarding data privacy, security breaches, or policy violations can be directed to our designated Grievance Officer at:</p>
                            <ul>
                                <li><strong>Email:</strong> <a href="mailto:mainupchaarhealth@gmail.com">mainupchaarhealth@gmail.com</a></li>
                                <li><strong>Response Time:</strong> We are committed to addressing all privacy-related concerns within 15 days of receipt.</li>
                            </ul>
                            <p className="text-sm text-slate-500 mt-4 italic">
                                (Disclaimer: As an AI, I provide this as a structural template. You should have a legal professional review this policy to ensure it perfectly aligns with your specific technical architecture and local data protection regulations.)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
