
import { Link, useLocation } from 'react-router-dom';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    Stethoscope,
    FlaskConical,
    Hospital,
    FileText,
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctors', label: 'Find Doctors', icon: Stethoscope },
    { href: '/diagnostics', label: 'Diagnostics', icon: FlaskConical },
    { href: '/hospitals', label: 'Hospitals', icon: Hospital },
    { href: '/patient/diagnostic-bookings', label: 'My Tests', icon: FileText },
    { href: '/records', label: 'Health Records', icon: FileText },
];

export function MainNav() {
    const location = useLocation();
    const pathname = location.pathname;

    return (
        <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <Link to={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
