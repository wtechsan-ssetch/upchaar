import React, { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, X, AlertTriangle } from 'lucide-react';
import { APIProvider } from "@vis.gl/react-google-maps";
import { Skeleton } from "@/components/ui/skeleton";
import NearestFacilitiesList from "@/components/NearestFacilitiesList";

// Load map only on the client
const HealthcareMap = React.lazy(() => import("@/components/HealthcareMap"));

export default function EmergencyPage() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [sortedFacilities, setSortedFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // If API key is missing or is just a placeholder, show the error state
    const isApiKeyMissing = !apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.length < 10;

    if (isApiKeyMissing) {
        return (
            <div className="flex flex-col h-screen bg-slate-50">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0">
                    <Link to="/" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900">Emergency Support</h1>
                </header>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        {/* <h2 className="text-2xl font-bold text-slate-900 mb-2">Maps API Key Required</h2> */}
                        <p className="text-slate-600 mb-8">
                            Currently Emergency support is not available in Upchar health we are working hardly on that
                        </p>
                        {/* <div className="p-4 bg-slate-900 rounded-xl text-left mb-8 font-mono text-sm">
                            <p className="text-slate-400 mb-1">Add to .env file:</p>
                            <code className="text-teal-400 break-all">VITE_GOOGLE_MAPS_API_KEY=&quot;YOUR_KEY&quot;</code>
                        </div> */}
                        <Link to="/" className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
            <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
                {/* Minimal Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0">
                    <Link to="/" className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Emergency Support</h1>
                        <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Nearby healthcare facilities</p>
                    </div>
                    <div className="ml-auto hidden xs:flex">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Live Radar</span>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 min-h-0">
                    <div className="md:col-span-1 lg:col-span-1 h-full overflow-hidden flex flex-col">
                        <NearestFacilitiesList
                            facilities={sortedFacilities}
                            onFacilitySelect={setSelectedFacility}
                            userLocation={userLocation}
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3 h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white relative">
                        <Suspense fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-slate-400 font-medium">Loading map area...</p>
                                </div>
                            </div>
                        }>
                            <HealthcareMap
                                onFacilitiesSorted={setSortedFacilities}
                                selectedFacility={selectedFacility}
                                onUserLocationChange={setUserLocation}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}
