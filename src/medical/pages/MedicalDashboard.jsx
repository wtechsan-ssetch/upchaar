import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext.jsx';

import { supabase } from '@/lib/supabase.js';
import { useNavigate } from 'react-router-dom';
import DoctorAppointmentsModal from '@/components/dashboard/DoctorAppointmentsModal';
import EditProfileModal from '@/components/EditProfileModal.jsx';
import ChangePasswordModal from '@/components/ChangePasswordModal.jsx';
import ImageCropperModal from '@/components/ImageCropperModal.jsx';
import { toast, Toaster } from 'sonner';
import MedicalAnalytics from './MedicalAnalytics';
import { uploadAvatar, getStorageUrl } from '@/lib/uploadImage.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";


// Staff doctors will be fetched from database

const MOCK_ACTIVITY = [
  { id: 1, title: 'Appt. Booked: Rahul Varma', sub: 'with Dr. Anjali Sharma', time: 'Today, 10:30 AM', badge: 'CONFIRMED', badgeClass: 'bg-teal-50 text-teal-700 border border-teal-100', isLast: false },
  { id: 2, title: 'Actioned: Dr. Rajesh Gupta', sub: 'Updated consultation fees', time: '2 hours ago', badge: 'UPDATED', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100', isLast: false },
  { id: 3, title: 'New Registration: Anita J.', sub: 'Patient ID: #UPCH-2940', time: 'Yesterday, 4:15 PM', badge: 'NEW USER', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100', isLast: true },
];

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard' },
  { icon: 'medical_information', label: 'Doctors' },
  { icon: 'person', label: 'Patients' },
  { icon: 'analytics', label: 'Analytics' },
  { icon: 'settings', label: 'Settings' },
];

export default function MedicalDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [staffDoctors, setStaffDoctors] = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [signOutAlertOpen, setSignOutAlertOpen] = useState(false);
  const [unlinkDoctorId, setUnlinkDoctorId] = useState(null);
  const [removeAvatarAlertOpen, setRemoveAvatarAlertOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [doctorSecretKey, setDoctorSecretKey] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appointments, setAppointments] = useState(null);
  const [patientProfiles, setPatientProfiles] = useState({});
  const [timetables, setTimetables] = useState({});   // { doctorId: slots[] }
  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [selectedDoctorForAppointments, setSelectedDoctorForAppointments] = useState(null);
  const [internalOrgId, setInternalOrgId] = useState(null);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleQuickAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input value so re-selecting same works
  };

  const handleCropDone = async (croppedFile) => {
    setCropperOpen(false);
    try {
      setLoading(true);
      const avatarUrl = await uploadAvatar(croppedFile, profile.id);
      const { error: authErr } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });
      if (authErr) throw authErr;
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (dbErr) throw dbErr;
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Error updating profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      const { error: authErr } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });
      if (authErr) throw authErr;
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (dbErr) throw dbErr;
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Error removing picture');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!appointments) return { totalDoctors: staffDoctors.length, totalPatients: 0, todayAppointments: 0, totalRevenue: '0' };
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date?.startsWith(today));
    const totalRev = appointments.reduce((sum, a) => sum + (a.fee || 0), 0);
    return {
      totalDoctors: staffDoctors.length,
      totalPatients: [...new Set(appointments.map(a => a.patient_id))].length,
      todayAppointments: todayAppointments.length,
      totalRevenue: totalRev.toLocaleString()
    };
  }, [staffDoctors.length, appointments]);


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




  const fetchStaff = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // 1. Resolve internal medical ID for this profile
      const { data: medicalRow } = await supabase
        .from('medicals')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      const orgId = medicalRow?.id;
      setInternalOrgId(orgId);
      
      // Save for modal usage
      if (profile && orgId) {
        profile.internal_org_id = orgId;
      }

      // 2. Query staff_links using internal ID (new data) OR profile ID (legacy data)
      const searchIds = [profile.id, orgId].filter(Boolean);

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
        .in('organization_id', searchIds);

      if (error) throw error;
      const links = data || [];
      setStaffDoctors(links);

      // 3. Fetch timetables for all linked doctors for THIS org
      if (links.length > 0 && orgId) {
        const docIds = links.map(l => l.doctor_id).filter(Boolean);
        const { data: slots } = await supabase
          .from('doctor_timetables')
          .select('*')
          .in('doctor_id', docIds)
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('day')
          .order('time_from');

        // Group by doctor_id
        const grouped = {};
        (slots || []).forEach(s => {
          if (!grouped[s.doctor_id]) grouped[s.doctor_id] = [];
          grouped[s.doctor_id].push(s);
        });
        setTimetables(grouped);
      }
    } catch (err) {
      console.error('Error fetching staff:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const fetchMedicals = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('type', 'medical')
        .limit(10);
      if (error) throw error;
      setMedicals(data || []);
    } catch (err) {
      console.error('Error fetching medicals:', err.message);
    }
  }, [profile]);

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

      // 2. Insert link
      const { error: linkError } = await supabase
        .from('staff_links')
        .insert([{
          doctor_id: doctor.id,
          organization_id: profile?.id,
          organization_type: 'medical'
        }]);

      if (linkError) {
        if (linkError.code === '23505') throw new Error(`${doctor.full_name} is already linked to your center.`);
        throw linkError;
      }

      toast.success(`${doctor.full_name} is successfully added in your medical center`);
      setIsAddOpen(false);
      setDoctorSecretKey('');
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingDoctor(false);
    }
  }, [doctorSecretKey, profile, fetchStaff]);

  const handleUnlinkDoctor = useCallback(async () => {
    if (!unlinkDoctorId) return;
    try {
      const { error } = await supabase
        .from('staff_links')
        .delete()
        .eq('id', unlinkDoctorId);
      if (error) throw error;
      toast.success('Doctor unlinked successfully');
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUnlinkDoctorId(null);
    }
  }, [unlinkDoctorId, fetchStaff]);

  const fetchAppointments = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Resolve internal medicals.id for this profile
      const { data: medicalRow } = await supabase
        .from('medicals')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      const internalOrgId = medicalRow?.id;

      // Query appointments using internal org ID (new data) OR profile ID (legacy data)
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });

      if (internalOrgId) {
        query = query.or(`organization_id.eq.${internalOrgId},organization_id.eq.${profile.id}`);
      } else {
        query = query.eq('organization_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id && appointments === null) {
      fetchStaff();
      fetchMedicals();
      fetchAppointments();
    }
  }, [profile?.id, fetchStaff, fetchMedicals, fetchAppointments, appointments]);

  // Patient avatars (for "Patients" tab)
  useEffect(() => {
    const fetchPatientAvatars = async () => {
      const ids = [...new Set((appointments || []).map(a => a.patient_id).filter(Boolean))];
      if (!ids.length) {
        setPatientProfiles({});
        return;
      }

      // Avoid huge IN clauses in case of many appointments
      const limited = ids.slice(0, 100);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', limited);

      if (error) {
        console.error('Failed to load patient avatars:', error.message);
        return;
      }

      const map = {};
      (data || []).forEach(p => { map[p.id] = p; });
      setPatientProfiles(map);
    };

    if (appointments && appointments.length > 0) {
      void fetchPatientAvatars();
    }
  }, [appointments, profile?.id]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);
  const handleNavClick = useCallback((label) => {
    setActiveNav(label);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const displayName = useMemo(() => profile?.full_name || 'Medical Center', [profile?.full_name]);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const STAT_CARDS = useMemo(() => [
    { color: 'teal', icon: 'groups', label: 'Total Doctors', value: stats.totalDoctors },
    { color: 'cyan', icon: 'personal_injury', label: 'Total Patients', value: stats.totalPatients.toLocaleString() },
    { color: 'emerald', icon: 'event_available', label: "Today's Appointments", value: stats.todayAppointments },
    { color: 'amber', icon: 'payments', label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}` },
  ], [stats]);

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
          ${sidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-0'} 
          lg:relative lg:translate-x-0 ${sidebarOpen ? 'lg:w-64 lg:min-w-[256px]' : 'lg:w-20 lg:min-w-[80px]'} lg:shadow-none overflow-hidden`}
      >

        <div className={`p-5 flex items-center border-b border-gray-100 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'justify-between' : 'lg:justify-center justify-between'}`}>
          <div className={`flex items-center gap-2 transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden opacity-100 w-auto'}`}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/logo.png" alt="Upchar Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-1 tracking-tight">
                <span className="font-extrabold text-sm text-teal-600 leading-tight whitespace-nowrap">
                    Upchar
                </span>
                <span className="font-bold text-[10px] sm:text-xs text-red-600 whitespace-nowrap">Health</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-all flex items-center justify-center border border-transparent hover:border-gray-200 flex-shrink-0"
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined text-2xl font-bold">menu</span>
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => handleNavClick(item.label)}
              className={`w-full flex items-center py-3 text-sm font-medium transition-colors duration-200 relative group
                ${activeNav === item.label ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}
                ${sidebarOpen ? 'px-8 gap-3' : 'lg:justify-center lg:px-0 px-8 gap-3'}
              `}
              title={!sidebarOpen ? item.label : undefined}
            >
              {activeNav === item.label && (
                <div className="absolute left-0 top-0 h-full w-1 bg-teal-500 rounded-r-md transition-all duration-300" />
              )}
              <span className={`material-symbols-outlined text-xl flex-shrink-0 transition-colors ${activeNav === item.label ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span className={`whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden opacity-100 w-auto'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">

        {/* Header */}

        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 h-16 sticky top-0 z-20 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0" aria-label="Open sidebar">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl aspect-square overflow-hidden border-2 border-teal-100 bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    aria-label="Profile menu"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveNav('Settings');
                    }}
                    className="cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">settings</span>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSignOutAlertOpen(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {activeNav === 'Dashboard' ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
                      style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 flex-shrink-0`}>
                        <span className="material-symbols-outlined text-2xl sm:text-3xl">{s.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-tight mb-1">{s.label}</p>
                        <h3 className="text-lg sm:text-2xl font-bold truncate">{s.value}</h3>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
                <div className="xl:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-600">health_and_safety</span> My Doctors
                    </h3>
                    <button onClick={() => setIsAddOpen(true)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors">
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
                        const docInitial = doc?.full_name?.charAt(0).toUpperCase() || 'D';
                        const slots = timetables[link.doctor_id] || [];
                        const isExpanded = expandedDoctor === link.id;

                        // Group slots by day for display
                        const byDay = {};
                        slots.forEach(s => {
                          if (!byDay[s.day]) byDay[s.day] = [];
                          byDay[s.day].push(`${s.time_from}–${s.time_to}`);
                        });

                        return (
                          <div key={link.id}
                            className="bg-white rounded-2xl overflow-hidden group relative transition-shadow hover:shadow-md"
                            style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                            {/* Unlink button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setUnlinkDoctorId(link.id);
                              }}
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
                                    ? <img src={getStorageUrl(doc.avatar_url, 'doctor-avtar')} alt={doc.full_name} className="w-full h-full object-cover" />
                                    : docInitial}
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
                                <p className="text-[11px] text-gray-400 italic">Doctor hasn&apos;t set a timetable yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="sm:col-span-2 xl:col-span-3 py-10 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">person_add</span>
                    <p className="text-gray-500 text-xs font-medium">Link your partner doctors</p>
                    <button onClick={() => setIsAddOpen(true)} className="mt-2 text-teal-600 text-xs font-bold hover:underline">Get Started</button>
                  </div>
                )}
              </div>

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
                          {medicals.length > 0 ? (
                            medicals.map((med) => (
                              <tr key={med.id} className="hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="font-semibold text-gray-900">{med.name}</p>
                                  <p className="text-xs text-gray-500">{med.email}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${med.status === 'Approved' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                                    }`}>{med.status}</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="2" className="px-4 sm:px-6 py-8 text-center text-gray-500">
                                No partner stores linked yet.
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
                    <span className="material-symbols-outlined text-teal-600">history</span> Activity
                  </h3>
                  <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                    {appointments && appointments.length > 0 ? (
                      appointments.slice(0, 5).map((item, idx) => (
                        <div key={item.id} className="flex gap-4 mb-6 last:mb-0">
                          <div className="relative flex-shrink-0">
                            {idx !== appointments.slice(0, 5).length - 1 && <div className="w-0.5 bg-teal-100 absolute left-1.5 top-4 bottom-0" />}
                            <div className="w-3 h-3 bg-teal-500 rounded-full border-2 border-white relative z-10 mt-0.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Appt: {item.patient_name || item.patient}</p>
                            <p className="text-[10px] text-gray-500">with Dr. {item.doctor_name}</p>
                            <p className="text-xs text-teal-600 mt-1">{new Date(item.date).toLocaleDateString()} {item.time_slot}</p>
                          </div>
                          {item.status === 'Completed' && (
                              <button 
                                onClick={() => navigate(`/prescription/${item.id}`)}
                                className="h-8 px-3 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors flex items-center justify-center shrink-0 self-center"
                              >
                                View Rx
                              </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeNav === 'Notifications' ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[50vh]">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700">No Notifications</h3>
              <p className="text-gray-400 mt-2 text-sm max-w-sm text-center">You&apos;re all caught up! Check back later for new alerts and updates.</p>
            </div>
          ) : activeNav === 'Settings' ? (
            <div className="max-w-4xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-600">person</span> Profile Information
                    </h3>
                    <button onClick={() => setIsEditProfileOpen(true)} className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profile
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl aspect-square border-4 border-teal-50 bg-teal-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-sm">
                        {profile?.avatar_url ? (
                          <img src={getStorageUrl(profile.avatar_url, 'avatars')} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleQuickAvatarChange} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors uppercase tracking-wide">
                          Change Picture
                        </button>
                        {profile?.avatar_url && (
                          <button onClick={() => setRemoveAvatarAlertOpen(true)} className="text-[11px] font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors uppercase tracking-wide">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-5 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">{profile?.full_name || 'Medical Center'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 truncate">{profile?.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">{profile?.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Bio / Description</label>
                        <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 min-h-[100px]">
                          {profile?.bio || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-gray-50/50 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Account Actions</h4>
                    <p className="text-xs text-gray-500 mt-1">Manage your account security and session.</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setIsChangePasswordOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                      <span className="material-symbols-outlined text-[18px]">lock</span> Change Password
                    </button>
                    <button onClick={() => setSignOutAlertOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === 'Patients' ? (() => {
            const patientsMap = {};
            (appointments || []).forEach(apt => {
              const pid = apt.patient_id || apt.patient_name;
              if (!pid) return;
              if (!patientsMap[pid]) {
                patientsMap[pid] = {
                  id: pid,
                  name: apt.patient_name || 'Unknown Patient',
                  avatar_url: apt.patient_id ? patientProfiles[apt.patient_id]?.avatar_url || null : null,
                  visits: 0,
                  lastVisit: apt.date,
                  totalSpent: 0,
                  recentDoctor: apt.doctor_name,
                  latestApptId: apt.id,
                  latestStatus: apt.status
                };
              }
              patientsMap[pid].visits += 1;
              patientsMap[pid].totalSpent += (apt.fee || 0);
              if (new Date(apt.date) > new Date(patientsMap[pid].lastVisit)) {
                patientsMap[pid].lastVisit = apt.date;
                patientsMap[pid].recentDoctor = apt.doctor_name;
                patientsMap[pid].latestApptId = apt.id;
                patientsMap[pid].latestStatus = apt.status;
              }
            });
            const patientsList = Object.values(patientsMap).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

            return (
              <div className="space-y-6 animate-in fade-in duration-300 w-full mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-600">group</span> Patient Directory
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">View and manage patients who have visited this medical center.</p>
                  </div>
                  <div className="bg-teal-50 px-5 py-3 rounded-xl border border-teal-100 flex flex-col items-center sm:items-end w-full sm:w-auto">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Total Visitors</span>
                    <span className="text-2xl font-black text-teal-800">{patientsList.length}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                          <th className="py-4 px-6 font-semibold text-gray-600">Patient Details</th>
                          <th className="py-4 px-6 font-semibold text-gray-600">Total Visits</th>
                          <th className="py-4 px-6 font-semibold text-gray-600">Last Encounter</th>
                          <th className="py-4 px-6 font-semibold text-gray-600 text-right">Revenue</th>
                          <th className="py-4 px-6 font-semibold text-gray-600 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {patientsList.length > 0 ? patientsList.map((p, idx) => (
                          <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                  {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover rounded-full" />
                                  ) : (
                                    p.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{p.name}</div>
                                  <div className="text-xs text-gray-500">ID: {p.id?.substring?.(0, 8) || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                                <span className="material-symbols-outlined text-[14px]">calendar_month</span> {p.visits} {p.visits === 1 ? 'Visit' : 'Visits'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm font-medium text-gray-800">{new Date(p.lastVisit).toLocaleDateString()}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5 max-w-[120px] truncate">Dr. {p.recentDoctor || 'Unknown'}</div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-sm font-bold text-gray-900">₹{p.totalSpent.toLocaleString()}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {p.latestStatus === 'Completed' && p.latestApptId ? (
                                <button
                                  onClick={() => navigate(`/prescription/${p.latestApptId}`)}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors"
                                >
                                  View Latest Rx
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">No Rx</span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-gray-500 text-sm">
                              <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-4xl text-gray-300">group_off</span>
                                <p>No patients have visited yet.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })() : activeNav === 'Doctors' ? (
            <div className="space-y-6 animate-in fade-in duration-300 w-full mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600">health_and_safety</span> My Doctors
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">View and manage doctors who are linked to this medical center.</p>
                </div>
                <button onClick={() => setIsAddOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">add</span> Link New Doctor
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
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
                    const docInitial = doc?.full_name?.charAt(0).toUpperCase() || 'D';
                    const slots = timetables[link.doctor_id] || [];
                    const isExpanded = expandedDoctor === link.id;

                    // Group slots by day for display
                    const byDay = {};
                    slots.forEach(s => {
                      if (!byDay[s.day]) byDay[s.day] = [];
                      byDay[s.day].push(`${s.time_from}–${s.time_to}`);
                    });

                    return (
                      <div key={link.id}
                        className="bg-white rounded-2xl overflow-hidden group relative transition-shadow hover:shadow-md"
                        style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0/0.05)' }}>
                        {/* Unlink button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUnlinkDoctorId(link.id);
                          }}
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
                                ? <img src={getStorageUrl(doc.avatar_url, 'doctor-avtar')} alt={doc.full_name} className="w-full h-full object-cover" />
                                : docInitial}
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
                                    <span className="font-semibold text-slate-600 w-9 shrink-0">{day.slice(0, 3)}</span>
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
                                <p className="text-[11px] text-gray-400 italic">Doctor hasn&apos;t set a timetable yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">person_add</span>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">No Doctors Linked</h3>
                    <p className="text-gray-500 text-sm mb-4">Link your partner doctors to manage their schedules and appointments.</p>
                    <button onClick={() => setIsAddOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                      Link Doctor Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeNav === 'Analytics' ? (
            <MedicalAnalytics orgId={internalOrgId || profile?.id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[50vh]">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-teal-300">construction</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700">{activeNav}</h3>
              <p className="text-gray-400 mt-2 text-sm max-w-sm text-center">This section is currently under development. Please check back later.</p>
            </div>
          )}
        </div>
      </main>
      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} profile={profile} />

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} userEmail={profile?.email} />

      {/* Image Cropper Modal */}
      <ImageCropperModal isOpen={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropImageSrc} onCropDone={handleCropDone} />

      {/* Doctor Appointments Modal */}
      {selectedDoctorForAppointments && (
        <DoctorAppointmentsModal
          isOpen={true}
          onClose={() => setSelectedDoctorForAppointments(null)}
          doctor={selectedDoctorForAppointments}
          orgId={internalOrgId || profile?.id}
          orgProfileId={profile?.id}
        />
      )}

      {/* Link Doctor Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-teal-600 px-6 sm:px-8 py-5 text-white">
              <h2 className="text-lg font-bold">Link New Doctor</h2>
              <p className="text-teal-100 text-xs mt-1">Connect a professional to your medical center</p>
            </div>
            <form onSubmit={handleAddDoctor} className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Doctor&apos;s Secret Key *</label>
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
                <p className="text-[10px] text-gray-400 mt-2 ml-1 leading-relaxed">Ask the doctor for their unique secret key to establish a secure link.</p>
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

      {/* Sign Out Confirmation Modal */}
      <AlertDialog open={signOutAlertOpen} onOpenChange={setSignOutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Avatar Confirmation Modal */}
      <AlertDialog open={removeAvatarAlertOpen} onOpenChange={setRemoveAvatarAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile picture? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleRemoveAvatar();
              setRemoveAvatarAlertOpen(false);
            }} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Doctor Confirmation Modal */}
      <AlertDialog open={!!unlinkDoctorId} onOpenChange={(open) => !open && setUnlinkDoctorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: This doctor will be removed from your clinic staff and patients will no longer be able to see this doctor linked with your medical center. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkDoctor} className="bg-red-600 hover:bg-red-700">Unlink</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
