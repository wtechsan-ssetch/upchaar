import React from 'react';
import PrescriptionView from '@/components/PrescriptionView';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PrescriptionPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 print:pb-0 px-3 sm:px-4 md:px-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6 print:hidden flex-wrap gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
                    >
                        <Printer size={14} /> Print
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-slate-500/20 hover:bg-slate-900 transition"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                </div>
            </div>
            
            <PrescriptionView appointmentId={id} />
        </div>
    );
}
