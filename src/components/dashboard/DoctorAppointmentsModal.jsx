import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase.js';
import { 
  X, CalendarDays, Clock, Users, ChevronLeft, 
  ChevronRight, Phone, Stethoscope, CheckCircle,
  Clock3, XCircle, FileText
} from 'lucide-react';
import { format, addDays, startOfToday, parseISO } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const STATUS_COLORS = {
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  Scheduled: 'bg-slate-50 text-slate-700 border-slate-200',
};

const STATUS_ICONS = {
  Confirmed: <CheckCircle size={14} className="mt-0.5" />,
  Pending: <Clock3 size={14} className="mt-0.5" />,
  Completed: <CheckCircle size={14} className="mt-0.5" />,
  Cancelled: <XCircle size={14} className="mt-0.5" />,
  Scheduled: <CalendarDays size={14} className="mt-0.5" />,
};

export default function DoctorAppointmentsModal({ 
  isOpen, 
  onClose, 
  doctor, 
  orgId,
  orgProfileId
}) {
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Generate an array of next 14 days for date selection
  const upcomingDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(startOfToday(), i));
    }
    return dates;
  }, []);

  // Use effect to fetch slots when doctor or date changes
  useEffect(() => {
    if (!isOpen || !doctor || !orgId) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      setAppointments([]);

      try {
        const dayOfWeek = format(selectedDate, 'EEEE'); // 'Monday' format
        const { data, error } = await supabase
          .from('doctor_timetables')
          .select('*')
          .eq('doctor_id', doctor.id)
          .eq('org_id', orgId)
          .eq('day', dayOfWeek)
          .eq('is_active', true)
          .order('time_from');

        if (error) throw error;
        setSlots(data || []);
      } catch (err) {
        console.error("Error fetching slots:", err.message);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, doctor?.id, orgId, selectedDate]);

  // Use effect to fetch appointments when slot changes
  useEffect(() => {
    if (!selectedSlot) {
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // Fetch all appointments for the day/doctor/org
        let query = supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctor.id)
          .eq('date', dateStr);

        // Support both Entry ID and Profile ID filtering
        if (orgId && orgProfileId) {
          query = query.or(`organization_id.eq.${orgId},organization_id.eq.${orgProfileId}`);
        } else if (orgId) {
          query = query.eq('organization_id', orgId);
        } else if (orgProfileId) {
          query = query.eq('organization_id', orgProfileId);
        }

        const { data, error } = await query.order('queue_number', { ascending: true });

        if (error) throw error;
        
        // Helper to convert time string (HH:MM or HH:MM AM/PM) to minutes
        const toMinutes = (t) => {
          if (!t) return 0;
          // Check if it has AM/PM
          const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (!match) return 0;
          let [_, h, m, p] = match;
          h = parseInt(h);
          m = parseInt(m);
          if (p) {
            if (p.toUpperCase() === 'PM' && h < 12) h += 12;
            if (p.toUpperCase() === 'AM' && h === 12) h = 0;
          }
          return h * 60 + m;
        };

        const rangeStart = toMinutes(selectedSlot.time_from);
        const rangeEnd = toMinutes(selectedSlot.time_to);

        // Filter appointments that fall within this slot's range
        const filtered = (data || []).filter(apt => {
          const aptTime = toMinutes(apt.time_slot);
          return aptTime >= rangeStart && aptTime < rangeEnd;
        });

        setAppointments(filtered);
      } catch (err) {
        console.error("Error fetching appointments:", err.message);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [selectedSlot, selectedDate, doctor?.id, orgId, orgProfileId]);

  // Handle closing modal and resetting state
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedDate(startOfToday());
      setSlots([]);
      setSelectedSlot(null);
      setAppointments([]);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:px-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center overflow-hidden">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt={doctor.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-teal-600 font-bold text-xl">{doctor?.full_name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{doctor?.full_name}</h3>
                <p className="text-xs font-medium text-teal-600">{doctor?.specialization || 'Doctor'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="h-9 w-9 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 bg-slate-50/50">
            
            {/* Sidebar Data/Slot Picker */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
              
              {/* Date Selection */}
              <div className="p-5 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Select Date
                </h4>
                
                <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 snap-x scrollbar-hide">
                  {upcomingDates.map((date, idx) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isToday = idx === 0;
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          snap-start shrink-0 flex flex-col items-center justify-center rounded-2xl border transition-all p-3 min-w-[72px]
                          ${isSelected 
                            ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                          }
                        `}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wide opacity-80 ${isSelected ? 'text-teal-50' : 'text-slate-400'}`}>
                          {format(date, 'EEE')}
                        </span>
                        <span className="text-lg font-bold my-0.5">
                          {format(date, 'dd')}
                        </span>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                          {isToday ? 'Today' : format(date, 'MMM')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slot Selection */}
              <div className="p-5 flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  Available Slots
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 capitalize">
                    {format(selectedDate, 'EEEE')}
                  </span>
                </h4>
                
                {loadingSlots ? (
                  <div className="space-y-3">
                    <Skeleton height={60} borderRadius={16} />
                    <Skeleton height={60} borderRadius={16} />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CalendarDays className="mx-auto text-slate-300 mb-2 h-8 w-8" />
                    <p className="text-sm font-semibold text-slate-600">No Schedule</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Doctor has no active schedule for this day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group
                            ${isSelected
                              ? 'bg-teal-50 border-teal-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              h-10 w-10 rounded-full flex items-center justify-center transition-colors
                              ${isSelected ? 'bg-teal-100 text-teal-600' : 'bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500'}
                            `}>
                              <Clock size={18} />
                            </div>
                            <div>
                              <p className={`font-bold ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>
                                {slot.time_from} - {slot.time_to}
                              </p>
                              {slot.notes && (
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{slot.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight size={18} className={isSelected ? 'text-teal-500' : 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'} />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Patients List Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
              
              {!selectedSlot ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                    <Users className="h-8 w-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Slot Selected</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">
                    Select a time slot from the left pane to view patients booked for that schedule.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {loadingAppointments ? 'Loading Patients...' : `${appointments.length} Patients Booked`}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <CalendarDays size={12} /> {format(selectedDate, 'PP')}
                        <span className="mx-1 text-slate-300">|</span>
                        <Clock size={12} /> {selectedSlot.time_from} - {selectedSlot.time_to}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    {loadingAppointments ? (
                      [1, 2, 3].map(i => <Skeleton key={i} height={88} borderRadius={16} />)
                    ) : appointments.length === 0 ? (
                      <div className="py-16 text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-medium text-slate-500">No appointments</p>
                        <p className="text-sm text-slate-400 mt-1">No patients have booked in this slot yet.</p>
                      </div>
                    ) : (
                      appointments.map((apt, index) => (
                        <div 
                          key={apt.id} 
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          <div className="shrink-0 flex items-center justify-center h-16 w-16 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100/50">
                            <span className="text-xl font-black text-teal-700/80">
                              #{apt.queue_number || (index + 1)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800 text-lg line-clamp-1">
                                {apt.patient_name || apt.patient}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                {apt.patient_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} className="text-teal-500" /> 
                                    {apt.patient_phone}
                                  </span>
                                )}
                                {apt.issue && (
                                  <span className="flex items-center gap-1">
                                    <Stethoscope size={12} className="text-teal-500" />
                                    <span className="line-clamp-1">{apt.issue}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 mt-2 sm:mt-0">
                              <span className={`
                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                                ${STATUS_COLORS[apt.status] || STATUS_COLORS.Scheduled}
                              `}>
                                {STATUS_ICONS[apt.status] || STATUS_ICONS.Scheduled}
                                {apt.status}
                              </span>
                              
                              <p className="text-[11px] font-medium text-slate-400">
                                Booked via {apt.type || 'App'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
