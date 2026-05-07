import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { 
    Upload, 
    FileText, 
    Download, 
    MoreVertical, 
    Shield, 
    Clock, 
    Search,
    File,
    Trash2,
    Eye,
    History
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { usePatient } from '../patient/context/PatientContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { useNavigate } from 'react-router-dom';

export default function RecordsPage() {
    const { patient } = usePatient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [formattedRecords, setFormattedRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecords() {
            if (!patient?.id) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('patient_id', patient.id)
                    .eq('status', 'Completed')
                    .order('date', { ascending: false });
                    
                if (error) throw error;
                
                if (data) {
                    const validPrescriptions = data.filter(apt => 
                        (apt.diagnosis && apt.diagnosis.trim() !== '') || 
                        (apt.medicines && apt.medicines.length > 0) || 
                        (apt.issue && apt.issue.trim() !== '')
                    );
                    
                    const mappedRecords = validPrescriptions.map(apt => ({
                        id: apt.id,
                        name: `Prescription - ${apt.doctor_name || 'Doctor'}`,
                        type: 'Prescription',
                        date: new Date(apt.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }),
                        fileSize: 'Digital PDF',
                        rawDate: new Date(apt.date),
                        doctorId: apt.doctor_id
                    }));
                    
                    setFormattedRecords(mappedRecords);
                }
            } catch (err) {
                console.error("Error fetching records:", err);
            } finally {
                setLoading(false);
            }
        }
        
        fetchRecords();
    }, [patient?.id]);

    const filteredRecords = formattedRecords.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const prescriptions = filteredRecords.filter(r => r.type === 'Prescription');
    const testReports = filteredRecords.filter(r => r.type === 'Test Report');

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline text-slate-900 flex items-center gap-2">
                        <Shield className="text-emerald-500 h-8 w-8" />
                        Medical Vault
                    </h1>
                    <p className="text-slate-500 text-lg mt-1 font-medium">Your health data, encrypted and accessible anywhere.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <Input 
                            placeholder="Search records..." 
                            className="pl-10 h-10 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="rounded-xl h-10 px-5 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 whitespace-nowrap">
                        <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                </div>
            </div>

            {/* Quick Stats / Latest Activities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 border-none shadow-xl shadow-indigo-500/20 rounded-2xl text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <History className="h-5 w-5" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0">All Time</Badge>
                        </div>
                        <div className="text-3xl font-bold mb-1">{formattedRecords.length}</div>
                        <div className="text-sm text-indigo-100 font-medium">Total Records Stored</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white border-slate-100 shadow-lg shadow-slate-200/50 rounded-2xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Storage</span>
                        </div>
                        <div className="text-3xl font-bold mb-1 text-slate-900">{prescriptions.length}</div>
                        <div className="text-sm text-slate-500 font-medium">Prescriptions Uploaded</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-lg shadow-slate-200/50 rounded-2xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reports</span>
                        </div>
                        <div className="text-3xl font-bold mb-1 text-slate-900">{testReports.length}</div>
                        <div className="text-sm text-slate-500 font-medium">Lab Reports Available</div>
                    </CardContent>
                </Card>
            </div>

            {/* Records Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 p-1 bg-slate-100 rounded-xl h-11 w-full md:w-auto flex justify-start">
                    <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">All Files</TabsTrigger>
                    <TabsTrigger value="prescriptions" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Prescriptions</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Test Reports</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="all" className="mt-0">
                        <RecordGrid records={filteredRecords} navigate={navigate} />
                    </TabsContent>
                    <TabsContent value="prescriptions" className="mt-0">
                        <RecordGrid records={prescriptions} navigate={navigate} />
                    </TabsContent>
                    <TabsContent value="reports" className="mt-0">
                        <RecordGrid records={testReports} navigate={navigate} />
                    </TabsContent>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}

function RecordGrid({ records, navigate }) {
    if (records.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100"
            >
                <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <File className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No records found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Upload your first health record to start your digital medical vault.</p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {records.map((record, index) => (
                <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="group relative overflow-hidden border-slate-100 hover:border-emerald-500/20 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 rounded-2xl">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${record.type === 'Prescription' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => navigate(`/prescription/${record.id}`)}>
                                            <Eye className="h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.open(`/prescription/${record.id}`, '_blank')}>
                                            <Download className="h-4 w-4" /> Download PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                            <Trash2 className="h-4 w-4" /> Delete Permanently
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardTitle className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                {record.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold h-5">
                                    {record.type}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{record.fileSize}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{record.date}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/prescription/${record.id}`)}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
