export const BLOG_CATEGORIES = [
    'Technology', 'Health', 'Lifestyle', 'Business', 'Travel', 'Food', 'General'
];

export const COVER_GRADIENTS = [
    'from-emerald-500 to-teal-400',
    'from-blue-500 to-indigo-400',
    'from-violet-500 to-purple-400',
    'from-rose-500 to-pink-400',
    'from-amber-500 to-orange-400',
    'from-slate-700 to-slate-500'
];

export const SPECIALIZATIONS = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Dermatology', 'Psychiatry', 'Oncology', 'Gynecology',
    'Endocrinology', 'Gastroenterology', 'General Medicine'
];

export const DEFAULT_SETTINGS = {
    commissionPercent: 10,
    currency: 'INR',
    bookingFee: 50,
    minNoticeHours: 24,
    cancellationWindow: 12,
    specializations: SPECIALIZATIONS,
    banners: [
        { id: 1, title: 'Summer Health Camp Promo', active: true, url: '' },
        { id: 2, title: 'New Cardiologist Welcome', active: false, url: '' },
    ]
};

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Other',
];
