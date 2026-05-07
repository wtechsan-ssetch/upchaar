import { useState, useEffect } from 'react';
import {
    Map,
    AdvancedMarker,
    InfoWindow,
    useMap,
} from '@vis.gl/react-google-maps';
import { allFacilities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { LocateFixed, MapPinOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateDistance } from '@/lib/utils';

const facilityIcons = {
    hospital: {
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 9.8c0 7.3-8 11.8-8 11.8Z" />
                <path d="M12 10h.01" />
                <path d="M12 14h.01" />
                <path d="m10 12 h4" />
            </svg>
        ),
        bgColor: '#dc2626', // red-600
    },
    clinic: {
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 9.8c0 7.3-8 11.8-8 11.8Z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
            </svg>
        ),
        bgColor: '#2563eb', // blue-600
    },
    medical: {
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 9.8c0 7.3-8 11.8-8 11.8Z" />
                <path d="M14 10h-4v4h4v-4Z" />
                <path d="M12 8v2" />
                <path d="M12 14v2" />
                <path d="m14 12 h2" />
                <path d="m8 12 h2" />
            </svg>
        ),
        bgColor: '#16a34a', // green-600
    },
};

const CustomMarker = ({
    facility,
    onClick,
    isSelected,
}) => {
    const { icon, bgColor } = facilityIcons[facility.type];

    return (
        <AdvancedMarker position={{ lat: facility.lat, lng: facility.lng }} onClick={onClick}>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isSelected ? 'ring-4 ring-offset-2 ring-primary' : ''}`}
                style={{ backgroundColor: bgColor }}
            >
                {icon}
            </div>
        </AdvancedMarker>
    );
};

const RecenterControl = ({ onClick }) => {
    return (
        <div className="absolute bottom-4 right-4 z-10">
            <Button variant="outline" size="icon" onClick={onClick} className="bg-card shadow-md">
                <LocateFixed className='w-5 h-5' />
            </Button>
        </div>
    );
}

const LocationPermissionPrompt = ({ onAllow }) => {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-2">
                        <LocateFixed className="w-8 h-8 text-primary" />
                        Show Nearby Facilities
                    </CardTitle>
                    <CardDescription>
                        To find the nearest emergency services, please allow Upchar Health to access your current location.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={onAllow} size="lg">Allow Location Access</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        You can change this permission in your browser settings at any time.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

const LocationError = () => {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-2">
                        <MapPinOff className="w-8 h-8 text-destructive" />
                        Location Access Denied
                    </CardTitle>
                    <CardDescription>
                        You have denied location access. To use this feature, please enable location permissions for this site in your browser settings.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}

export default function HealthcareMap({ onFacilitiesSorted, selectedFacility, onUserLocationChange }) {
    const [userLocation, setUserLocation] = useState(null);
    const [activeFacility, setActiveFacility] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const map = useMap();

    const fetchUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const location = { lat: latitude, lng: longitude };
                    setUserLocation(location);
                    onUserLocationChange(location);
                    setPermissionStatus('granted');
                },
                (error) => {
                    console.error("Error getting user location:", error);
                    if (userLocation === null) {
                        // fallback to a default location if user denies permission
                        setUserLocation({ lat: 28.6139, lng: 77.209 });
                    }
                    setPermissionStatus('denied');
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            setUserLocation({ lat: 28.6139, lng: 77.209 }); // fallback
            setPermissionStatus('denied');
        }
    }

    useEffect(() => {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
                fetchUserLocation();
            } else {
                setPermissionStatus(result.state);
            }
            result.onchange = () => {
                setPermissionStatus(result.state);
                if (result.state === 'granted') {
                    fetchUserLocation();
                }
            };
        });
    }, []);

    useEffect(() => {
        if (userLocation) {
            const sorted = [...allFacilities]
                .map(f => ({
                    ...f,
                    distance: calculateDistance(userLocation.lat, userLocation.lng, f.lat, f.lng)
                }))
                .filter(f => f.distance <= 10)
                .sort((a, b) => a.distance - b.distance);
            onFacilitiesSorted(sorted);
        }
    }, [userLocation, onFacilitiesSorted]);

    useEffect(() => {
        if (selectedFacility && map) {
            map.panTo({ lat: selectedFacility.lat, lng: selectedFacility.lng });
            setActiveFacility(selectedFacility);
        }
    }, [selectedFacility, map]);

    useEffect(() => {
        if (userLocation && map && permissionStatus === 'granted') {
            map.panTo(userLocation);
        }
    }, [userLocation, map, permissionStatus]);


    const handleMarkerClick = (facility) => {
        setActiveFacility(facility);
    };

    const handleRecenter = () => {
        if (userLocation && map) {
            map.panTo(userLocation);
            map.setZoom(14);
        }
    };


    return (
        <div className="w-full h-full relative">
            {permissionStatus === 'prompt' && <LocationPermissionPrompt onAllow={fetchUserLocation} />}
            {permissionStatus === 'denied' && !userLocation && <LocationError />}
            <Map
                defaultCenter={userLocation || { lat: 28.6139, lng: 77.209 }}
                defaultZoom={14}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="sanjiwani_map"
            >
                {userLocation && (
                    <AdvancedMarker position={userLocation} title="Your Location">
                        <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/30" />
                    </AdvancedMarker>
                )}
                {allFacilities.map((facility) => (
                    <CustomMarker
                        key={facility.id}
                        facility={facility}
                        onClick={() => handleMarkerClick(facility)}
                        isSelected={activeFacility?.id === facility.id}
                    />
                ))}

                {activeFacility && (
                    <InfoWindow
                        position={{ lat: activeFacility.lat, lng: activeFacility.lng }}
                        onCloseClick={() => setActiveFacility(null)}
                        pixelOffset={[0, -40]}
                    >
                        <div className="p-2">
                            <h3 className="font-bold text-base">{activeFacility.name}</h3>
                            <p className="text-sm text-muted-foreground">{activeFacility.location}</p>
                        </div>
                    </InfoWindow>
                )}
            </Map>
            <RecenterControl onClick={handleRecenter} />
        </div>
    );
}
