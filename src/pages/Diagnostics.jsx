import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { diagnosticCenters } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    FlaskConical, 
    Search, 
    Filter, 
    Navigation, 
    Star, 
    Clock, 
    Phone,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DiagnosticsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Pathology', 'Radiology', 'MRI/CT Scan', 'Blood Test'];

    const filteredCenters = diagnosticCenters.filter(center => {
        const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            center.tests.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-16">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <FlaskConical className="w-full h-full text-emerald-500 translate-x-1/4" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 px-4 py-1">Premium Partners</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
                        Precision Diagnostics <br />
                        <span className="text-emerald-400 text-3xl md:text-4xl">At Your Doorstep</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 font-medium">Compare prices, book home collection, and receive digital reports from India's top-rated NABL labs.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                            <Input 
                                placeholder="Search tests (e.g. CBC, Liver Function...)" 
                                className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:bg-white/20 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Categories */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeCategory === cat 
                                ? 'bg-white text-emerald-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredCenters.map((center, index) => (
                        <motion.div
                            key={center.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="group h-full flex flex-col border-slate-100 hover:border-emerald-500/20 transition-all duration-300 shadow-md hover:shadow-2xl overflow-hidden rounded-3xl">
                                <div className="relative h-40 bg-slate-50 overflow-hidden">
                                    <img 
                                        src={center.logo} 
                                        alt={center.name} 
                                        className="h-full w-full object-contain p-8 group-hover:scale-110 transition-transform duration-500" 
                                        data-ai-hint={center.dataAiHint} 
                                    />
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white/90 backdrop-blur text-emerald-600 border-emerald-100 flex items-center gap-1 font-bold">
                                            <Star className="w-3 h-3 fill-emerald-600" /> 4.8
                                        </Badge>
                                    </div>
                                </div>
                                
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-extrabold text-slate-800">{center.name}</CardTitle>
                                            <div className="flex items-center gap-1.5 text-slate-500 mt-1 text-sm font-medium">
                                                <MapPin className="w-4 h-4 text-emerald-500" />
                                                <span>{center.location}</span>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="text-emerald-500 h-6 w-6" />
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-grow space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Tests</p>
                                        <div className="flex flex-wrap gap-2">
                                            {center.tests.map((test) => (
                                                <Badge key={test} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-default">
                                                    {test}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                            <Clock className="w-3.5 h-3.5" /> 60-Min Collection
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                            <Navigation className="w-3.5 h-3.5" /> 2.4 KM Home
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0 p-6">
                                    <Button className="w-full h-12 bg-emerald-600 hover:bg-slate-900 transition-all rounded-2xl font-bold gap-2 text-base group/btn shadow-lg shadow-emerald-600/10 hover:shadow-slate-900/20">
                                        Book a Test
                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
