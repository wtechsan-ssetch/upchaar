import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext.jsx';
import { supabase } from '@/lib/supabase.js';
import { useNavigate } from 'react-router-dom';
import DoctorAppointmentsModal from '@/components/dashboard/DoctorAppointmentsModal';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard' },
  { icon: 'person', label: 'Patients' },
  { icon: 'calendar_today', label: 'Appointments' },
  { icon: 'notifications', label: 'Notifications' },
  { icon: 'analytics', label: 'Analytics' },
  { icon: 'settings', label: 'Settings' },
];

// Linked staff will be fetched from database

const MOCK_ACTIVITY = [
  { id: 1, title: 'Walk-in: Priya Mehta', sub: 'Assigned to Dr. Patel', time: 'Today, 09:15 AM', badge: 'CHECKED IN', badgeClass: 'bg-teal-50 text-teal-700 border border-teal-100', isLast: false },
  { id: 2, title: 'Report Uploaded: Kiran S.', sub: 'Blood work — Lab results', time: '1 hour ago', badge: 'REPORT', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100', isLast: false },
  { id: 3, title: 'Discharge: Ramesh Kumar', sub: 'OPD visit complete', time: 'Yesterday, 6:30 PM', badge: 'DISCHARGED', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100', isLast: true },
];

export default function ClinicDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [staffDoctors, setStaffDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [doctorSecretKey, setDoctorSecretKey] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [appointments, setAppointments] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [selectedDoctorForAppointments, setSelectedDoctorForAppointments] = useState(null);
  const sidebarRef = useRef(null);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = appointments.filter(a => a.date?.startsWith(today)).length;
    const totalRev = appointments.reduce((sum, a) => sum + (a.fee || 0), 0);
    return { 
      doctors: staffDoctors.length, 
      patients: [...new Set(appointments.map(a => a.patient_id))].length, 
      todayVisits: todayVisits, 
      revenue: totalRev.toLocaleString() 
    };
  }, [staffDoctors.length, appointments]);
  const circumference = useMemo(() => 2 * Math.PI * 54, []);

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

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);




  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_links')
        .select(`
          id,
          doctor_id,
          doctors (
            id,
            full_name,
            specialization,
            consultation_fee,
            avatar_url,
            status
          )
        `)
        .eq('organization_id', profile?.id);

      if (error) throw error;
      const links = data || [];
      setStaffDoctors(links);

      // Fetch timetables
      if (links.length > 0) {
        const { data: clinicRow } = await supabase.from('clinics').select('id').eq('profile_id', profile?.id).maybeSingle();
        const orgId = clinicRow?.id;
        
        // Save the orgId to the profile so we can use it for the modal
        if (profile && orgId) {
            profile.internal_org_id = orgId;
        }

        if (orgId) {
          const docIds = links.map(l => l.doctor_id).filter(Boolean);
          const { data: slots } = await supabase
            .from('doctor_timetables')
            .select('*')
            .in('doctor_id', docIds)
            .eq('org_id', orgId)
            .eq('is_active', true)
            .order('day')
            .order('time_from');
          
          const grouped = {};
          (slots || []).forEach(s => {
            if (!grouped[s.doctor_id]) grouped[s.doctor_id] = [];
            grouped[s.doctor_id].push(s);
          });
          setTimetables(grouped);
        }
      }
    } catch (err) {
      console.error('Error fetching staff:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchClinics = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('type', 'clinic')
        .limit(10);
      if (error) throw error;
      setClinics(data || []);
    } catch (err) {
      console.error('Error fetching clinics:', err.message);
    }
  }, [profile?.id]);

  const handleAddDoctor = useCallback(async (e) => {
    e.preventDefault();
    if (!doctorSecretKey.trim()) return;

    setAddingDoctor(true);
    let cleanKey = doctorSecretKey.trim().toUpperCase();
    if (cleanKey && !cleanKey.startsWith('UPC-')) {
      cleanKey = `UPC-${cleanKey}`;
    }

    try {
      // 1. Find doctor by secret key
      const { data: doctor, error: findError } = await supabase
        .from('doctors')
        .select('id, full_name')
        .eq('secret_key', cleanKey)
        .maybeSingle();

      if (findError) throw findError;
      if (!doctor) throw new Error('Wrong Key. Please ask the doctor for the right key.');

      // 2. Link doctor
      const { error: linkError } = await supabase
        .from('staff_links')
        .insert([{
          doctor_id: doctor.id,
          organization_id: profile?.id,
          organization_type: 'clinic'
        }]);

      if (linkError) {
        if (linkError.code === '23505') throw new Error(`${doctor.full_name} is already linked to your clinic.`);
        throw linkError;
      }

      alert(`${doctor.full_name} is successfully added in your clinic`);
      setIsAddOpen(false);
      setDoctorSecretKey('');
      fetchStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingDoctor(false);
    }
  }, [doctorSecretKey, profile?.id, fetchStaff]);

  const handleUnlinkDoctor = useCallback(async (e, linkId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Warning: This doctor will be removed from your clinic and patients will no longer be able to see this doctor linked with your clinic. Do you want to continue?')) return;
    try {
      const { error } = await supabase
        .from('staff_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
      fetchStaff();
    } catch (err) {
      alert(err.message);
    }
  }, [fetchStaff]);

  const fetchAppointments = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', profile.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
    }
  }, [profile?.id]);

  useEffect(() => { 
    if (profile?.id) {
      fetchStaff();
      fetchClinics();
      fetchAppointments();
    }
  }, [profile?.id, fetchStaff, fetchClinics, fetchAppointments]);

  const handleSignOut = useCallback(async () => { await signOut(); navigate('/login'); }, [signOut, navigate]);
  const handleNavClick = useCallback((label) => {
    setActiveNav(label);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const displayName = useMemo(() => profile?.full_name || 'Clinic Admin', [profile?.full_name]);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const STAT_CARDS = useMemo(() => [
    { color: 'teal', icon: 'stethoscope', label: 'Total Doctors', value: stats.doctors },
    { color: 'cyan', icon: 'personal_injury', label: 'Total Patients', value: stats.patients },
    { color: 'emerald', icon: 'event_available', label: "Today's Visits", value: stats.todayVisits },
    { color: 'amber', icon: 'payments', label: 'Total Revenue', value: `Rs. ${stats.revenue}` },
  ], [stats]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Overlay */}
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
            <span className="material-symbols-outlined text-3xl flex-shrink-0">local_hospital</span>
            Upchaar Clinic
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
              <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate">Welcome, {displayName}</h2>
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide hidden sm:block">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block w-44 md:w-64 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Search patients..." />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold leading-tight">{displayName}</p>
                <p className="text-xs text-gray-500">Clinic Admin</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-teal-100 bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="material-symbols-outlined text-gray-400 text-xl hidden sm:inline">keyboard_arrow_down</span>
            </div>
          </div>
        </header>

        {/* Mobile search */}
        <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-100">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Search patients, clinics, or reports..." />
          </div>
        </div>

        {/* Page Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl border-l-4 border-teal-500 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
                      <div className="h-6 bg-gray-100 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              STAT_CARDS.map((s) => (
                <div key={s.label}
                  className={`bg-white p-4 sm:p-6 rounded-2xl border-l-4 border-teal-500 flex items-center gap-3 sm:gap-4`}
                  style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05),0 2px 4px -2px rgb(0 0 0/0.05)' }}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0`}>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl">{s.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{s.label}</p>
                    <h3 className="text-lg sm:text-2xl font-bold truncate">{s.value}</h3>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">

            {/* Staff Doctors */}
            <div className="xl:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">stethoscope</span> Staff Doctors
                </h3>
                <button onClick={() => setIsAddOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span> Link Doctor
                </button>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl text-center flex flex-col items-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-gray-100 mb-4 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-32 mb-2 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-24 mb-4 animate-pulse" />
                        <div className="w-full h-8 bg-gray-50 rounded-lg animate-pulse" />
                      </div>
                    ))
                  ) : staffDoctors.length > 0 ? (
                    staffDoctors.map((link) => {
                      const doc = link.doctors;
                      const isExpanded = expandedDoctor === link.id;
                      const slots = timetables[doc?.id] || [];
                      // Group slots by day
                      const byDay = {};
                      slots.forEach(s => {
                        if (!byDay[s.day]) byDay[s.day] = [];
                        byDay[s.day].push(`${s.time_from} - ${s.time_to}`);
                      });

                      return (
                        <div key={link.id}
                          className="bg-white rounded-2xl flex flex-col group relative transition-all duration-300 hover:shadow-xl border border-gray-100 overflow-hidden"
                          style={{ boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}>
                          
                          {/* Unlink button */}
                          <button
                            type="button"
                            onClick={(e) => handleUnlinkDoctor(e, link.id)}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-20"
                            title="Unlink Doctor"
                          >
                            <span className="material-symbols-outlined text-lg">link_off</span>
                          </button>

                          {/* Doctor Info */}
                          <div className="p-5 flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <div className="w-16 h-16 rounded-full border-4 border-teal-50 overflow-hidden bg-teal-600 flex items-center justify-center text-white text-xl font-bold">
                                {doc?.avatar_url
                                  ? <img src={doc.avatar_url} alt={doc.full_name} className="w-full h-full object-cover" />
                                  : (doc?.full_name?.charAt(0).toUpperCase() || 'D')}
                              </div>
                              <span className="absolute bottom-1 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{doc?.full_name}</h4>
                            <p className="text-xs text-teal-600 font-medium">{doc?.specialization}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-bold uppercase tracking-wide">verified</p>
                            
                            <button 
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedDoctorForAppointments(doc);
                              }}
                              className="w-full mt-3 py-2 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors tracking-wide uppercase"
                            >
                              View Appointments
                            </button>
                          </div>

                          {/* Timetable toggle */}
                          <div className="border-t border-gray-50">
                            <button
                              type="button"
                              onClick={() => setExpandedDoctor(isExpanded ? null : link.id)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-teal-500">schedule</span>
                                {slots.length > 0 ? `${slots.length} slot${slots.length !== 1 ? 's' : ''}` : 'No schedule set'}
                              </span>
                              <span className="material-symbols-outlined text-sm">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>

                            {/* Schedule detail */}
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-1.5">
                                {Object.keys(byDay).length > 0 ? (
                                  Object.entries(byDay).map(([day, times]) => (
                                    <div key={day} className="flex items-start gap-2 text-xs">
                                      <span className="font-semibold text-slate-600 w-9 shrink-0">{day.slice(0,3)}</span>
                                      <div className="flex flex-wrap gap-1">
                                        {times.map((t, i) => (
                                          <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 font-medium">
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-gray-400 italic">Doctor hasn't set a timetable yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="sm:col-span-2 xl:col-span-3 py-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                      <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_add</span>
                      <p className="text-gray-500 text-sm font-medium">No linked doctors yet</p>
                      <button onClick={() => setIsAddOpen(true)} className="mt-2 text-teal-600 text-xs font-bold hover:underline">Link your first doctor</button>
                    </div>
                  )}
                </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-gray-700">
                      <span className="material-symbols-outlined text-teal-600">table_view</span> Registered Nodes
                    </h3>
                    <div className="bg-white rounded-2xl overflow-x-auto" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                      <table className="w-full text-sm min-w-[480px]">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left font-semibold">Branch</th>
                            <th className="px-4 sm:px-6 py-3 text-left font-semibold">City</th>
                            <th className="px-4 sm:px-6 py-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {clinics.length > 0 ? (
                            clinics.map((clinic) => (
                              <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="font-semibold text-gray-900">{clinic.name}</p>
                                  <p className="text-xs text-gray-500">{clinic.email}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-gray-600">{clinic.city || '—'}</td>
                                <td className="px-4 sm:px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    clinic.status === 'Approved' ? 'bg-teal-50 text-teal-700' :
                                    clinic.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                  }`}>{clinic.status}</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-4 sm:px-6 py-8 text-center text-gray-500">
                                No registered nodes yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">donut_small</span> Patient Distribution
              </h3>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                <div className="flex items-center justify-center relative h-48">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#14b8a6" strokeWidth="12"
                      strokeDasharray={`${circumference * 0.65} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" />
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#f87171" strokeWidth="12"
                      strokeDasharray={`${circumference * 0.20} ${circumference}`} strokeDashoffset={`-${circumference * 0.65}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{stats.patients}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-50 pt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Regular</p>
                      <p className="text-sm font-bold text-gray-800">292 (65%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Emergency</p>
                      <p className="text-sm font-bold text-gray-800">90 (20%)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">history</span> Recent Activity
                </h3>
                <a href="#" className="text-xs font-semibold text-teal-600 hover:underline">View All</a>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                {appointments.length > 0 ? (
                  appointments.slice(0, 5).map((item, idx) => (
                    <div key={item.id} className="flex gap-4 mb-6 last:mb-0">
                      <div className="relative flex-shrink-0">
                        {idx !== appointments.slice(0, 5).length - 1 && <div className="w-0.5 bg-teal-100 absolute left-1.5 top-4 bottom-0" />}
                        <div className="w-3 h-3 bg-teal-500 rounded-full border-2 border-white relative z-10 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Visit: {item.patient_name}</p>
                        <p className="text-[10px] text-gray-500">with Dr. {item.doctor_name}</p>
                        <p className="text-xs text-teal-600 mt-1">{new Date(item.date).toLocaleDateString()} {item.time_slot}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'Completed' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'
                        }`}>{item.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center">No recent activity</p>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Link Doctor Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-teal-600 px-6 sm:px-8 py-5 text-white">
              <h2 className="text-lg font-bold">Link New Doctor</h2>
              <p className="text-teal-100 text-xs mt-1">Add a verified professional to your clinic team</p>
            </div>
            <form onSubmit={handleAddDoctor} className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Doctor's Unique Secret Key *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">key</span>
                  <input 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                    value={doctorSecretKey} 
                    onChange={e => setDoctorSecretKey(e.target.value.toUpperCase())} 
                    placeholder="e.g. UPC-7B2A91" 
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 ml-1 leading-relaxed">Ask the doctor for their secret key from their Professional Profile settings.</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  disabled={addingDoctor}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingDoctor}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingDoctor ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Linking...
                    </>
                  ) : 'Verify & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
