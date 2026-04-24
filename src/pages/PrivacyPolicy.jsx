import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function PrivacyPolicyPage() {
    const { user } = useAuth();

    return (
        <AppLayout hideSidebar={!user} hideNavbar={!user}>
            <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                            Privacy Policy
                        </h1>
                        <p className="mt-4 text-xl text-slate-500">
                            Upchaar Health Privacy Policy and Data Handling.
                        </p>
                    </div>

                    <div className="bg-white shadow sm:rounded-2xl border border-slate-100 overflow-hidden text-slate-700">
                        <div className="px-6 py-8 prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-teal-600">
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
