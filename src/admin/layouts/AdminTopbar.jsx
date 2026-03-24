import { useAdmin } from '../context/AdminContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Shield, ChevronDown, X, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase.js';
import { format } from 'date-fns';

export default function AdminTopbar() {
    const { admin, logout, isSuperAdmin } = useAdmin();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [bellOpen, setBellOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const bellRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Load notifications
    const loadNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (!error) setNotifications(data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        loadNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Mark all as read when bell opens
    const openBell = async () => {
        setBellOpen(o => !o);
        if (!bellOpen && unreadCount > 0) {
            await supabase
                .from('admin_notifications')
                .update({ is_read: true })
                .eq('is_read', false);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const initials = admin?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 flex-shrink-0 z-10">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search doctors, patients…"
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
            </div>

            <div className="flex-1" />

            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
                <button
                    onClick={openBell}
                    className="relative h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {bellOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-20 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{notifications.length} total</span>
                                    <button onClick={() => setBellOpen(false)} className="h-6 w-6 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
                                ) : notifications.map(notif => (
                                    <div key={notif.id}
                                        className={cn('px-4 py-3 hover:bg-slate-50 transition-colors', !notif.is_read && 'bg-primary/5')}>
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <MessageSquare size={14} className="text-amber-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{notif.subject}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                                        {notif.from_name || 'Blogger'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(notif.created_at), 'dd MMM · HH:mm')}
                                                    </span>
                                                    {!notif.is_read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {notifications.length > 0 && (
                                <div className="px-4 py-2 border-t border-slate-100">
                                    <button
                                        onClick={() => { loadNotifications(); }}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Admin avatar dropdown */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/40 hover:bg-slate-50 transition-all"
                >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-xs font-semibold text-slate-800 leading-none">{admin?.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{isSuperAdmin ? 'Super Admin' : 'Support Admin'}</p>
                    </div>
                    <ChevronDown size={14} className={cn('text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-800">{admin?.name}</p>
                                <p className="text-xs text-slate-500">{admin?.email}</p>
                                <span className={cn(
                                    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                    isSuperAdmin ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'
                                )}>
                                    <Shield size={9} /> {isSuperAdmin ? 'Super Admin' : 'Support Admin'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={15} /> Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
