import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, FlaskConical, UploadCloud, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function DiagnosticDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Retrieve center from location state if available, else null
    const center = location.state?.center || null;

    const [testsToBook, setTestsToBook] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!center) {
            // If user navigated here directly without state, we'd normally fetch the center by ID here.
            // For now, if no center is found in state, we go back.
            toast.error('Center details not found.');
            navigate('/diagnostics');
        }
    }, [center, navigate]);

    if (!center) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <h2 className="text-2xl font-bold text-slate-700">Loading Center...</h2>
            </div>
        );
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPrescriptionFile(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!testsToBook.trim() && !prescriptionFile) {
            toast.error('Please enter tests or upload a prescription to proceed.');
            return;
        }

        setIsSubmitting(true);
        // Simulate an API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success('Test Booking Request Submitted!', {
                description: 'The diagnostic center will contact you shortly.',
            });
            setTestsToBook('');
            setPrescriptionFile(null);
        }, 1500);
    };

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="space-y-8 max-w-4xl mx-auto pb-20 pt-8 px-4 sm:px-6 lg:px-8">
                
                {/* Back button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={16} /> Back to Diagnostics
                </button>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center p-4 border border-slate-100">
                        {center.logo ? (
                            <img src={center.logo} alt={center.name} className="w-full h-full object-contain" />
                        ) : (
                            <FlaskConical className="w-12 h-12 text-emerald-300" />
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-3 px-3 py-1 font-bold">Verified Partner</Badge>
                        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{center.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-500 font-medium">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span>{center.location}</span>
                        </div>
                        
                        <div className="mt-6">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Available Tests</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {center.tests.map(test => (
                                    <Badge key={test} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1">
                                        <FlaskConical className="w-3 h-3 mr-1.5 text-emerald-500" /> {test}
                                    </Badge>
                                ))}
                                {center.tests.length === 0 && (
                                    <span className="text-sm text-slate-400 italic">No tests listed yet.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Booking Form Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100"
                >
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                        Book Your Tests
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Option 1: Manual Entry */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-slate-700">Write Test Names</h3>
                                <p className="text-xs text-slate-500">Enter one or more tests you want to book.</p>
                            </div>
                            <Textarea 
                                placeholder="e.g. Complete Blood Count, Thyroid Profile, MRI Brain..."
                                className="min-h-[120px] resize-none bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-2xl"
                                value={testsToBook}
                                onChange={(e) => setTestsToBook(e.target.value)}
                            />
                        </div>

                        {/* Option 2: Upload Prescription */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-slate-700">Upload Prescription</h3>
                                <p className="text-xs text-slate-500">Have a doctor's prescription? Upload it directly.</p>
                            </div>
                            
                            <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-6 text-center hover:bg-slate-100 transition-colors flex flex-col items-center justify-center h-[120px] relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                />
                                <UploadCloud className="w-8 h-8 text-emerald-500 mb-2" />
                                <p className="text-sm font-medium text-slate-600">
                                    {prescriptionFile ? prescriptionFile.name : 'Click or drag file to upload'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                        <Button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-emerald-600/20"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
