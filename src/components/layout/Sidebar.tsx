import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Package,
    Users,
    Truck,
    Settings,
    ChevronLeft,
    ChevronRight,
    UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
    label: string;
    icon: React.ElementType;
    href: string;
    roles?: ('admin' | 'manager' | 'staff')[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Dokumente', icon: FileText, href: '/documents' },
    { label: 'Warenbestand', icon: Package, href: '/inventory' },
    { label: 'Lieferanten', icon: Truck, href: '/suppliers' },
    { label: 'Benutzer', icon: Users, href: '/users', roles: ['admin'] },
    { label: 'Einstellungen', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();

    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true;
        if (!user) return false;
        if (user.role === 'admin') return true;
        return item.roles.includes(user.role);
    });

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-8 w-8 text-amber-400" />
                        <span className="font-bold text-lg">GastroWWS</span>
                    </div>
                )}
                {collapsed && (
                    <UtensilsCrossed className="h-8 w-8 text-amber-400 mx-auto" />
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "text-slate-400 hover:text-white hover:bg-slate-800",
                        collapsed && "absolute -right-3 top-5 bg-slate-800 border border-slate-700 rounded-full w-6 h-6"
                    )}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-2">
                <ul className="space-y-1">
                    {filteredNavItems.map((item) => (
                        <li key={item.href}>
                            <NavLink
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-amber-500/20 text-amber-400"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                        collapsed && "justify-center px-2"
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="absolute bottom-4 left-0 right-0 px-4">
                    <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">
                        <p className="font-medium text-slate-300">Demo-Version</p>
                        <p className="mt-1">Daten werden lokal gespeichert</p>
                    </div>
                </div>
            )}
        </aside>
    );
}
