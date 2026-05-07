import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthContext.jsx';
import { getStorageUrl } from '@/lib/uploadImage.js';

export function Header() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const initials = profile?.full_name 
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
        : 'U';
    
    const bucket = profile?.profile_type === 'doctor' ? 'doctor-avtar' : 'avatars';

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) return;
        await signOut();
        navigate('/');
    };

    return (
        <Card className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6 rounded-none md:rounded-lg md:m-4 md:top-2">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <form className="ml-auto flex-1 sm:flex-initial">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                        />
                    </div>
                </form>
                <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10 hover:text-primary">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                {profile?.avatar_url && (
                                    <AvatarImage 
                                        src={getStorageUrl(profile.avatar_url, bucket)} 
                                        alt={profile.full_name || 'User'} 
                                        className="object-cover"
                                    />
                                )}
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Support</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}
   