import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SignOutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
                    >
                        {/* Header Decoration */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-rose-500" />
                        
                        <div className="p-8">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Icon */}
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/50">
                                <LogOut size={32} />
                            </div>

                            {/* Text */}
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                Sign Out?
                            </h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Are you sure you want to sign out of your account? You'll need to sign in again to access your dashboard.
                            </p>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 h-12 font-semibold"
                                >
                                    Stay Logged In
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 h-12 font-semibold gap-2"
                                >
                                    <LogOut size={18} />
                                    Confirm Sign Out
                                </Button>
                            </div>
                        </div>

                        {/* Footer Hint */}
                        <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-100 flex items-center gap-2 text-[13px] text-slate-400">
                            <AlertCircle size={14} />
                            <span>Your session data will be cleared securely.</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
