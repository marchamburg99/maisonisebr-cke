import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

import { DEMO_ANOMALIES, DEMO_PRODUCTS } from '@/lib/mockData';

interface HeaderProps {
    sidebarCollapsed?: boolean;
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const openAnomalies = DEMO_ANOMALIES.filter(a => !a.resolved);
    const lowStockCount = DEMO_PRODUCTS.filter(p => p.currentStock < p.minStock).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <header
            className={`fixed top-0 right-0 z-30 h-16 border-b bg-white transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'
                }`}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Page Title - can be dynamic */}
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        Restaurant Warenwirtschaft
                    </h1>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5 text-slate-600" />
                                {(openAnomalies.length > 0 || lowStockCount > 0) && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                    >
                                        {openAnomalies.length + lowStockCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Benachrichtigungen</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                {openAnomalies.length === 0 && lowStockCount === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        Keine neuen Benachrichtigungen
                                    </div>
                                ) : (
                                    <>
                                        {openAnomalies.map((anomaly) => (
                                            <DropdownMenuItem
                                                key={anomaly.id}
                                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                                onClick={() => navigate('/documents')}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                                    <span className="font-medium text-sm">Auffälligkeit erkannt</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {anomaly.title}: {anomaly.description}
                                                </p>
                                            </DropdownMenuItem>
                                        ))}
                                        {lowStockCount > 0 && (
                                            <DropdownMenuItem
                                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                                onClick={() => navigate('/inventory')}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                    <span className="font-medium text-sm">Niedriger Bestand</span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {lowStockCount} Produkte unter Mindestbestand
                                                </p>
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-3 px-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-amber-100 text-amber-700">
                                        {user ? getInitials(user.name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {user ? getRoleLabel(user.role) : ''}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/settings')}>
                                <User className="mr-2 h-4 w-4" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                Abmelden
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
