export const doctors = [
  { id: '1', name: 'Dr. Anjali Sharma', specialty: 'Cardiologist', location: 'Apollo Hospital, Delhi', availability: 'Available Today', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'female doctor', experience: 12, rating: 4.8, reviews: 120, verified: true, fees: 1500, languages: ['English', 'Hindi'] },
  { id: '2', name: 'Dr. Vikram Singh', specialty: 'Neurologist', location: 'Fortis Hospital, Mumbai', availability: 'Available Today', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'male doctor', experience: 15, rating: 4.9, reviews: 85, verified: true, fees: 2000, languages: ['English', 'Marathi'] },
  { id: '3', name: 'Dr. Priya Desai', specialty: 'Dermatologist', location: 'Max Healthcare, Bangalore', availability: 'Next Available Tomorrow', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'female doctor portrait', experience: 8, rating: 4.7, reviews: 200, verified: true, fees: 1000, languages: ['English', 'Kannada'] },
  { id: '4', name: 'Dr. Rohan Mehra', specialty: 'Pediatrician', location: 'Artemis Hospital, Gurgaon', availability: 'Available Today', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'male doctor portrait', experience: 10, rating: 4.8, reviews: 150, verified: true, fees: 1200, languages: ['English', 'Hindi'] },
  { id: '5', name: 'Dr. Sunita Patel', specialty: 'Gynecologist', location: 'Cloudnine Hospital, Pune', availability: 'Next Available Tomorrow', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'doctor smiling', experience: 14, rating: 4.9, reviews: 300, verified: true, fees: 1800, languages: ['English', 'Marathi', 'Gujarati'] },
  { id: '6', name: 'Dr. Sameer Gupta', specialty: 'Orthopedic Surgeon', location: 'Medanta, Lucknow', availability: 'Available Today', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'indian doctor', experience: 20, rating: 5.0, reviews: 450, verified: true, fees: 2500, languages: ['English', 'Hindi'] },
  { id: '7', name: 'Dr. Neha Gupta', specialty: 'Dentist', location: 'Clove Dental, Delhi', availability: 'Available Today', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'female dentist', experience: 5, rating: 4.5, reviews: 50, verified: true, fees: 800, languages: ['English', 'Hindi'] },
  { id: '8', name: 'Dr. Amit Kumar', specialty: 'General Physician', location: 'AIIMS, Delhi', availability: 'Next Available Tomorrow', avatar: 'https://placehold.co/100x100.png', dataAiHint: 'male doctor generic', experience: 7, rating: 4.6, reviews: 90, verified: true, fees: 500, languages: ['English', 'Hindi'] },
];

export const diagnosticCenters = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Lal PathLabs', location: 'Koramangala, Bangalore', tests: ['Blood Test', 'Urine Test', 'MRI Scan'], logo: 'https://placehold.co/200x200.png', dataAiHint: 'laboratory building' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Metropolis Healthcare', location: 'Andheri, Mumbai', tests: ['CT Scan', 'X-Ray', 'ECG'], logo: 'https://placehold.co/200x200.png', dataAiHint: 'modern building' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'SRL Diagnostics', location: 'Connaught Place, Delhi', tests: ['Ultrasound', 'Thyroid Test', 'Vitamin D Test'], logo: 'https://placehold.co/200x200.png', dataAiHint: 'clinic exterior' },
];

export const hospitals = [
  { id: 'h1', name: 'Apollo Hospital', location: 'Sarita Vihar, Delhi', facilities: ['24/7 Emergency', 'ICU', 'Pharmacy'], image: 'https://placehold.co/400x250.png', dataAiHint: 'hospital building', lat: 28.5220, lng: 77.2848, type: 'hospital' },
  { id: 'h2', name: 'Fortis Hospital', location: 'Mulund, Mumbai', facilities: ['Multi-specialty', 'Ambulance Service', 'In-patient Care'], image: 'https://placehold.co/400x250.png', dataAiHint: 'modern hospital', lat: 19.1724, lng: 72.9463, type: 'hospital' },
  { id: 'h3', name: 'Manipal Hospital', location: 'Old Airport Road, Bangalore', facilities: ['Robotic Surgery', 'Cancer Care', 'Pediatrics'], image: 'https://placehold.co/400x250.png', dataAiHint: 'clinic building', lat: 12.9608, lng: 77.6756, type: 'hospital' },
  { id: 'h4', name: 'Max Healthcare', location: 'Saket, Delhi', facilities: ['Super Speciality', 'Advanced Cardiac Care', 'Organ Transplant'], image: 'https://placehold.co/400x250.png', dataAiHint: 'large hospital', lat: 28.5289, lng: 77.2117, type: 'hospital' },
];

export const clinics = [
    { id: 'c1', name: 'Dr. Sharma\'s Clinic', location: 'Greater Kailash, Delhi', doctor: 'Dr. R.K. Sharma', lat: 28.5482, lng: 77.2396, type: 'clinic' },
    { id: 'c2', name: 'Mumbai Family Clinic', location: 'Dadar, Mumbai', doctor: 'Dr. A. Joshi', lat: 19.0213, lng: 72.8424, type: 'clinic' },
    { id: 'c3', name: 'Bangalore Wellness Center', location: 'Indiranagar, Bangalore', doctor: 'Dr. S. Reddy', lat: 12.9784, lng: 77.6408, type: 'clinic' },
];

export const medicals = [
    { id: 'm1', name: 'Apollo Pharmacy', location: 'Lajpat Nagar, Delhi', isOpen247: true, lat: 28.5676, lng: 77.2435, type: 'medical' },
    { id: 'm2', name: 'Wellness Forever', location: 'Bandra, Mumbai', isOpen247: true, lat: 19.0596, lng: 72.8407, type: 'medical' },
    { id: 'm3', name: 'MedPlus', location: 'Jayanagar, Bangalore', isOpen247: false, lat: 12.9253, lng: 77.5807, type: 'medical' },
];

export const allFacilities = [...hospitals, ...clinics, ...medicals];


export const appointments = [
  { id: '1', doctor: 'Dr. Anjali Sharma', specialty: 'Cardiologist', date: '2024-08-15', time: '10:00 AM', type: 'Virtual' },
  { id: '2', doctor: 'Dr. Rohan Mehra', specialty: 'Pediatrician', date: '2024-08-16', time: '02:30 PM', type: 'In-Person' },
];

export const healthRecords = [
  { id: '1', name: 'Dr. Vikram - Consultation.pdf', type: 'Prescription', date: '2024-07-20' },
  { id: '2', name: 'Complete Blood Count.pdf', type: 'Test Report', date: '2024-07-22' },
  { id: '3', name: 'Dr. Anjali - Follow-up.pdf', type: 'Prescription', date: '2024-07-28' },
];
