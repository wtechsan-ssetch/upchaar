import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Users, ArrowUpRight, CheckCircle2, 
    AlertCircle, Timer, Bell, ChevronRight,
    Activity, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * QueueStatusCard
 * A premium tracking card for patient dashboard to show real-time queue status.
 */
export default function QueueStatusCard({ appointment, currentServing, onAction }) {
    // Helper to parse "09:00 AM" or "09:00" and add minutes
    const getExpectedTime = (timeStr, queueNum) => {
        if (!timeStr) return '--:--';
        
        // Match HH:MM AM/PM
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return timeStr;
        
        let [_, h, m, p] = match;
        h = parseInt(h);
        m = parseInt(m);
        
        if (p) {
            if (p.toUpperCase() === 'PM' && h < 12) h += 12;
            if (p.toUpperCase() === 'AM' && h === 12) h = 0;
        }
        
        // Total minutes from start of day
        let totalMins = h * 60 + m + (Math.max(0, queueNum - 1) * 10);
        
        let rh = Math.floor(totalMins / 60) % 24;
        let rm = totalMins % 60;
        let rp = rh >= 12 ? 'PM' : 'AM';
        let dh = rh % 12 || 12;
        
        return `${dh.toString().padStart(2, '0')}:${rm.toString().padStart(2, '0')} ${rp}`;
    };

    // Check if appointment is today
    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const today = new Date().toISOString().split('T')[0];
        const appDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        return today === appDate;
    };
    const apptIsToday = isToday(appointment.date);

    const expectedTime = getExpectedTime(appointment.time_slot, appointment.queue_number);
    const estimatedWait = Math.max(0, ((appointment.queue_number || 1) - currentServing) * 10); // minutes

    const myNumber = appointment.queue_number || 1;
    const isServing = apptIsToday && myNumber === currentServing;
    const isNext = apptIsToday && myNumber === currentServing + 1;
    const hasPassed = apptIsToday && myNumber < currentServing;
    const position = apptIsToday ? myNumber - currentServing : myNumber - 1;

    if (hasPassed) return null; // Or show "Completed" state

    const titleText = !apptIsToday 
        ? `Scheduled for ${new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
        : isServing ? "It's your turn!" : isNext ? "You're next!" : `${position}${position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} in line`;

    const subText = !apptIsToday
        ? "We'll notify you on the day of your visit"
        : isServing ? "Proceed to the doctor's cabin" : "Please stay nearby the clinic";

    const expectedText = !apptIsToday ? 'On Date' : (isServing ? 'NOW' : expectedTime);
    const currentQueueDisplay = !apptIsToday ? '-' : currentServing;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-xl shadow-teal-500/5 group"
        >
            {/* Immersive Accent Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
            
            <div className="p-6 relative z-10">
                {/* Header: Status & Live Badge */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {apptIsToday ? (
                            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${apptIsToday ? 'text-teal-600' : 'text-slate-500'}`}>
                            {apptIsToday ? 'Live Status' : 'Upcoming'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <Timer size={12} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-500">
                            {apptIsToday ? 'Updated just now' : 'Queue tracking starts on date'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left Side: Large Queue Display */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                <motion.circle
                                    cx="48"
                                    cy="48"
                                    r="44"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="276"
                                    initial={{ strokeDashoffset: 276 }}
                                    animate={{ strokeDashoffset: 276 - (276 * (apptIsToday ? (currentServing / myNumber) : 0)) }}
                                    className={apptIsToday ? "text-teal-500" : "text-slate-300"}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">#{myNumber}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Your #</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-800 leading-tight">
                                {titleText}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {subText}
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={14} className={apptIsToday ? "text-teal-500" : "text-slate-400"} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Current</span>
                            </div>
                            <p className="text-lg font-bold text-slate-700">#{currentQueueDisplay}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className={apptIsToday ? "text-amber-500" : "text-slate-400"} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Expected At</span>
                            </div>
                            <p className="text-lg font-bold text-slate-700">{expectedText}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Progress / Action */}
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                                <User size={10} className="text-slate-400" />
                            </div>
                        ))}
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-teal-500 flex items-center justify-center text-[8px] font-bold text-white">
                            +{position}
                        </div>
                    </div>

                    <button
                        onClick={onAction}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        View Details <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* In-app Notification Banner for Movement */}
            <AnimatePresence>
                {position <= 3 && position > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-0 left-0 right-0 py-2 bg-amber-500 text-white text-center text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        Your turn is approaching — Please be ready!
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function User({ size, className }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
