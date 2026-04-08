import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { useNavigate } from 'react-router-dom';

const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Anjali Sharma', specialty: 'Cardiologist', fee: 'Rs. 800', online: true,
    avatar: 'https://ui-avatars.com/api/?name=Anjali+Sharma&background=0d9488&color=fff&size=80' },
  { id: 2, name: 'Dr. Rajesh Gupta', specialty: 'Pediatrician', fee: 'Rs. 600', online: true,
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Gupta&background=0d9488&color=fff&size=80' },
  { id: 3, name: 'Dr. Amali Gupta', specialty: 'Dermatologist', fee: 'Rs. 1000', online: false,
    avatar: 'https://ui-avatars.com/api/?name=Amali+Gupta&background=0d9488&color=fff&size=80' },
];

const MOCK_ACTIVITY = [
  { id: 1, title: 'Appt. Booked: Rahul Varma', sub: 'with Dr. Anjali Sharma', time: 'Today, 10:30 AM', badge: 'CONFIRMED', badgeClass: 'bg-teal-50 text-teal-700 border border-teal-100', isLast: false },
  { id: 2, title: 'Actioned: Dr. Rajesh Gupta', sub: 'Updated consultation fees', time: '2 hours ago', badge: 'UPDATED', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100', isLast: false },
  { id: 3, title: 'New Registration: Anita J.', sub: 'Patient ID: #UPCH-2940', time: 'Yesterday, 4:15 PM', badge: 'NEW USER', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100', isLast: true },
];

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard' },
  { icon: 'medical_information', label: 'Doctors' },
  { icon: 'person', label: 'Patients' },
  { icon: 'calendar_today', label: 'Appointments' },
  { icon: 'notifications', label: 'Notifications' },
  { icon: 'analytics', label: 'Analytics' },
  { icon: 'settings', label: 'Settings' },
];

export default function MedicalDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const sidebarRef = useRef(null);

  const [stats] = useState({ totalDoctors: 35, totalPatients: 1200, todayAppointments: 80, totalRevenue: '5,50,000' });
  const circumference = 2 * Math.PI * 54;

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (window.innerWidth < 1024 && sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target))
        setSidebarOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [sidebarOpen]);

  useEffect(() => { fetchMedicals(); }, []);

  const fetchMedicals = async () => {
    try {
      const { data, error } = await supabase.from('medicals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMedicals(data || []);
    } catch (err) {
      console.error('Error fetching medicals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const handleNavClick = (label) => {
    setActiveNav(label);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const displayName = profile?.full_name || 'Medical Center';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const STAT_CARDS = [
    { color: 'teal', icon: 'groups', label: 'Total Doctors', value: stats.totalDoctors },
    { color: 'cyan', icon: 'personal_injury', label: 'Total Patients', value: stats.totalPatients.toLocaleString() },
    { color: 'emerald', icon: 'event_available', label: "Today's Appts", value: stats.todayAppointments },
    { color: 'amber', icon: 'payments', label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}` },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0 w-64 shadow-2xl lg:shadow-none' : '-translate-x-full w-0 lg:w-0'} 
          lg:relative lg:translate-x-0 ${sidebarOpen ? 'lg:min-w-[256px]' : 'lg:min-w-0 lg:border-none overflow-hidden'}`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0 min-w-[256px]">
          <h1 className="text-xl font-bold text-teal-700 flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-3xl flex-shrink-0">medical_services</span>
            Upchaar Health
          </h1>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-all flex items-center justify-center border border-transparent hover:border-gray-200" 
            title="Close Sidebar"
          >
            <span className="material-symbols-outlined text-2xl font-bold">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-w-[256px]">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => handleNavClick(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors ${
                activeNav === item.label ? 'border-r-4 border-teal-500 bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1 min-w-[256px]">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            <span className="material-symbols-outlined text-xl">lock</span> Change Password
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
            <span className="material-symbols-outlined text-xl">logout</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 h-16 sticky top-0 z-20 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0" aria-label="Open sidebar">
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">Good Morning, {displayName.split(' ')[0]}</h2>
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide hidden sm:block">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block w-44 md:w-64 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Search..." />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold leading-tight">{displayName}</p>
                <p className="text-xs text-gray-500">Medical</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-teal-100 bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {STAT_CARDS.map((s) => (
              <div key={s.label}
                className={`bg-white p-4 sm:p-6 rounded-2xl border-l-4 border-${s.color}-500 flex items-center gap-3 sm:gap-4`}
                style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${s.color}-50 rounded-xl flex items-center justify-center text-${s.color}-600 flex-shrink-0`}>
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">{s.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{s.label}</p>
                  <h3 className="text-lg sm:text-2xl font-bold truncate">{s.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
            <div className="xl:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">health_and_safety</span> My Doctors
                </h3>
                <button className="bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span> New
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {MOCK_DOCTORS.map((doc) => (
                  <div key={doc.id}
                    className="bg-white p-5 sm:p-6 rounded-2xl text-center flex flex-col items-center"
                    style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                    <div className="relative mb-4">
                      <img src={doc.avatar} alt={doc.name} className="w-20 h-20 rounded-full border-4 border-teal-50 object-cover" />
                      <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${doc.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-teal-600 font-medium mb-1">{doc.specialty}</p>
                    <button className="w-full py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors mt-auto">
                      Profile
                    </button>
                  </div>
                ))}
              </div>

              {medicals.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-teal-600">local_pharmacy</span> Partner Stores
                  </h3>
                  <div className="bg-white rounded-2xl overflow-x-auto" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                    <table className="w-full text-sm min-w-[480px]">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left font-semibold">Store</th>
                          <th className="px-4 sm:px-6 py-3 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {medicals.map((med) => (
                          <tr key={med.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4">
                              <p className="font-semibold text-gray-900">{med.name}</p>
                              <p className="text-xs text-gray-500">{med.email}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                med.status === 'Approved' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                              }`}>{med.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-4 space-y-6">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">donut_small</span> Appointment Status
              </h3>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                <div className="flex items-center justify-center relative h-48">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#0d9488" strokeWidth="12"
                      strokeDasharray={`${circumference * 0.7} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" />
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#2dd4bf" strokeWidth="12"
                      strokeDasharray={`${circumference * 0.2} ${circumference}`} strokeDashoffset={`-${circumference * 0.7}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">80</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-50 pt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Confirmed</p>
                      <p className="text-sm font-bold text-gray-800">56 (70%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-300"></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Pending</p>
                      <p className="text-sm font-bold text-gray-800">16 (20%)</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">history</span> Activity
              </h3>
              <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                {MOCK_ACTIVITY.map((item) => (
                  <div key={item.id} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative flex-shrink-0">
                      {!item.isLast && <div className="w-0.5 bg-teal-100 absolute left-1.5 top-4 bottom-0" />}
                      <div className="w-3 h-3 bg-teal-500 rounded-full border-2 border-white relative z-10 mt-0.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.title}</p>
                      <p className="text-xs text-teal-600 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
