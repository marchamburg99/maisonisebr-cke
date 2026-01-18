import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useState } from 'react';

export function Layout() {
    const [sidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <Header sidebarCollapsed={sidebarCollapsed} />
            <main
                className={`pt-16 transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-64'
                    }`}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
