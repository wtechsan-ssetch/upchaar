import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase.js';
import {
  X, CalendarDays, Clock, Users,
  ChevronRight, Phone, Stethoscope, CheckCircle,
  Clock3, XCircle, FileText, Bell, Check, X as CloseIcon,
  Building2
} from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function DoctorAppointmentsModal({
  isOpen,
  onClose,
  doctor,
  orgId,
  orgProfileId,
  orgName
}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [loadingSlots, setLoadingSlots]  = useState(false);
  const [slots, setSlots]                = useState([]);

  // 14-day date strip
  const upcomingDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) dates.push(addDays(startOfToday(), i));
    return dates;
  }, []);

  // Fetch timetable slots for selected date
  useEffect(() => {
    if (!isOpen || !doctor || !orgId) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      try {
        const dayOfWeek = format(selectedDate, 'EEEE');
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
        console.error('Error fetching slots:', err.message);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, doctor, orgId, selectedDate]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedDate(startOfToday());
      setSlots([]);
    }, 300);
  };

  // Navigate to dedicated full-page patient list for this slot
  const handleSlotClick = (slot) => {
    const p = new URLSearchParams({
      doctorId:     doctor?.id ?? '',
      orgId:        orgId ?? '',
      orgProfileId: orgProfileId ?? '',
      date:         format(selectedDate, 'yyyy-MM-dd'),
      timeFrom:     slot.time_from,
      timeTo:       slot.time_to,
      orgName:      orgName || doctor?.clinic_name || doctor?.full_name || 'Clinic',
    });
    handleClose();
    navigate(`/doctor/slot-patients?${p.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center overflow-hidden shrink-0">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt={doctor.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-teal-600 font-bold text-lg">{doctor?.full_name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{doctor?.full_name}</h3>
                <p className="text-xs font-medium text-teal-600 flex items-center gap-1">
                  <Building2 size={12} />
                  {orgName || 'Clinic'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="h-9 w-9 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Date strip ── */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Select Date</h4>
            <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 snap-x scrollbar-hide">
              {upcomingDates.map((date, idx) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`snap-start shrink-0 flex flex-col items-center rounded-2xl border transition-all px-3 py-2.5 min-w-[62px]
                      ${isSelected
                        ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-400/25'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                      }`}
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                      {format(date, 'EEE')}
                    </span>
                    <span className="text-base font-bold leading-tight my-0.5">{format(date, 'dd')}</span>
                    <span className={`text-[9px] font-medium ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                      {idx === 0 ? 'Today' : format(date, 'MMM')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Slot list ── */}
          <div className="p-5 flex-1 overflow-y-auto">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              Time Slots
              <span className="font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 normal-case text-[10px]">
                Tap a slot to see patients
              </span>
            </h4>

            {loadingSlots ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} height={64} borderRadius={16} />)}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CalendarDays className="mx-auto text-slate-300 mb-2 h-8 w-8" />
                <p className="text-sm font-semibold text-slate-600">No Schedule</p>
                <p className="text-xs text-slate-400 mt-1">No active slots for {format(selectedDate, 'EEEE')}.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 active:scale-[0.98] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 flex items-center justify-center transition-colors shrink-0">
                        <Clock size={17} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-teal-800 text-sm transition-colors">
                          {slot.time_from} – {slot.time_to}
                        </p>
                        {slot.notes && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{slot.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                      View Patients <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
