import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const patientFaqs = [
    {
        question: "Is this platform suitable for medical emergencies?",
        answer: "No. Our platform is strictly for non-emergent consultations and booking appointments. If you are experiencing a life-threatening medical emergency, please call your local emergency services or visit the nearest hospital immediately."
    },
    {
        question: "How do I book an appointment or get a queue token?",
        answer: "Simply log in to the app, search for a doctor by specialty or name, select an available time slot, and confirm your booking by completing the payment. You will receive a digital token and a notification when your consultation time approaches."
    },
    {
        question: "What happens if I miss my scheduled consultation window?",
        answer: "Because doctors block out specific time for your appointment, missed slots or \"no-shows\" are generally non-refundable. Please ensure you are logged in and ready at least 5 minutes before your scheduled time."
    },
    {
        question: "Will I receive a valid prescription?",
        answer: "Yes. If the doctor determines that medication or diagnostic tests are necessary during your teleconsultation, they will generate a secure digital prescription that you can download directly from your dashboard and use at your local pharmacy."
    },
    {
        question: "Can I get a refund if the doctor cancels?",
        answer: "Absolutely. In the rare event that a doctor has an emergency and cancels your session, you will automatically be issued a full refund to your original payment method, or you can choose to reschedule."
    }
];

const doctorFaqs = [
    {
        question: "How do I register as a practitioner on the platform?",
        answer: "You can sign up via the provider portal by submitting your basic details, a copy of your valid medical license, and your medical council registration number. Once our team verifies your credentials, your profile will go live."
    },
    {
        question: "Am I considered an employee of the platform?",
        answer: "No. All medical professionals on our platform operate as independent contractors. You maintain complete autonomy over your medical decisions, working hours, and treatment plans."
    },
    {
        question: "How and when do I receive my payments?",
        answer: "Patient consultation fees are collected securely by the platform. After deducting our standard convenience/platform fee, the remainder is credited to your registered bank account on a regular settlement cycle (e.g., weekly or bi-weekly)."
    },
    {
        question: "What if a patient requires a physical examination?",
        answer: "If you determine during a teleconsultation that a physical examination is required to make an accurate diagnosis, you should advise the patient to visit a local clinic or hospital. You can log this recommendation in the patient's digital record."
    },
    {
        question: "Is patient data secure on this platform?",
        answer: "Yes. We use end-to-end encryption to protect all health records, chat logs, and diagnostic reports, ensuring full compliance with national data protection regulations."
    }
];

export function FaqSection() {
    return (
        <section id="faq" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-100/50 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10 max-w-5xl mx-auto">
                <div className="text-center space-y-4 mb-16">
                    <div className="mx-auto w-16 h-16 bg-teal-100 text-teal-600 flex items-center justify-center rounded-2xl shadow-sm mb-4">
                        <HelpCircle size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-slate-900">
                        Frequently Asked Questions
                    </h2>
                    <p className="max-w-[700px] mx-auto text-slate-500 md:text-xl">
                        Everything you need to know about navigating the platform, whether you&apos;re a patient looking for care or a doctor providing it.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-start">
                    {/* Patient FAQs */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">
                            FAQs for Patients
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                            {patientFaqs.map((faq, i) => (
                                <AccordionItem key={i} value={`patient-${i}`}>
                                    <AccordionTrigger className="text-left font-semibold text-slate-700 hover:text-teal-600">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    {/* Doctor FAQs */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">
                            FAQs for Doctors
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                            {doctorFaqs.map((faq, i) => (
                                <AccordionItem key={i} value={`doctor-${i}`}>
                                    <AccordionTrigger className="text-left font-semibold text-slate-700 hover:text-teal-600">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
