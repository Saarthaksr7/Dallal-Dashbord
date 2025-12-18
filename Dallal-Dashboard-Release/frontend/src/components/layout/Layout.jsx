import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useUIStore } from '../../store/ui';
import CommandPalette from '../ui/CommandPalette';
import ThemeSwitcher from '../ThemeSwitcher';

const Layout = ({ children }) => {
    // Global State
    const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [location] = useLocation();

    // Auto-collapse on small/medium screens, expand on large (only on mount/resize)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            }
        };

        // Enforce auto-collapse on mobile/tablet init
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarCollapsed]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    return (
        <div className="app-container">
            <CommandPalette />

            <Sidebar
                isCollapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                mobileOpen={mobileOpen}
                closeMobile={() => setMobileOpen(false)}
            />

            <main
                className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}
                id="main-content"
                role="main"
                aria-label="Main content"
            >
                {/* Mobile Header */}
                <header className="mobile-header">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="menu-btn"
                        aria-label="Open navigation menu"
                        aria-expanded={mobileOpen}
                        aria-controls="sidebar-navigation"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="mobile-title">Dallal Dashboard</span>
                    <div style={{ marginLeft: 'auto' }}>
                        <ThemeSwitcher />
                    </div>
                </header>

                <div className="content-wrapper" style={{ paddingTop: mobileOpen ? '60px' : '' }}>
                    {children}
                </div>
            </main>

            <style>{`
                .app-container { min-height: 100vh; background: var(--bg-primary); }
                
                .main-content {
                    margin-left: 260px;
                    min-height: 100vh;
                    transition: margin-left 0.3s ease;
                    padding-top: 0;
                }
                
                .main-content.expanded { margin-left: 80px; }

                .content-wrapper { padding: 2rem; max-width: 1600px; margin: 0 auto; }

                .mobile-header {
                    display: none; height: 60px; align-items: center; padding: 0 1rem;
                    background: var(--bg-secondary); border-bottom: 1px solid var(--border);
                    position: sticky; top: 0; z-index: 30;
                }
                
                .menu-btn { background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 4px; }
                .mobile-title { margin-left: 1rem; font-weight: bold; font-size: 1.1rem; }

                @media (max-width: 768px) {
                    .main-content { margin-left: 0 !important; }
                    .mobile-header { display: flex; }
                    .content-wrapper { padding: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default Layout;
