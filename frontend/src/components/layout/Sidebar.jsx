import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuthStore } from '../../store/auth';
import { useTranslation } from 'react-i18next'; // Hook
import Restricted from '../auth/Restricted';
import LanguageSwitcher from '../LanguageSwitcher';
import {
    LayoutDashboard,
    Server,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Activity,
    Terminal,
    Monitor,
    Box, // Docker Icon
    FileText, // Report Icon
    ShoppingBag // App Store Icon
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar, mobileOpen, closeMobile }) => {
    const [location] = useLocation();
    const logout = useAuthStore((state) => state.logout);
    const { t, i18n } = useTranslation(); // Init hook

    const navItems = [
        { name: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { name: t('sidebar.services'), path: '/services', icon: Server },
        { name: t('sidebar.docker'), path: '/docker', icon: Box },
        { name: t('sidebar.monitoring'), path: '/monitoring', icon: Activity },
        { name: t('sidebar.topology'), path: '/topology', icon: Server },
        { name: t('sidebar.appStore'), path: '/app-store', icon: ShoppingBag },
        { name: t('sidebar.terminal'), path: '/ssh', icon: Terminal },
        { name: t('sidebar.rdp'), path: '/rdp', icon: Monitor },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.startsWith('/dashboard') || location === '/';
        }
        return location === path;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="mobile-overlay"
                    onClick={closeMobile}
                    role="presentation"
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40
                    }}
                />
            )}

            <aside
                className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''} ${i18n.language === 'ar' ? 'rtl' : ''}`}
            >
                {/* Header */}
                <div className="sidebar-header">
                    {!isCollapsed && <span className="logo-text">Dallal</span>}
                    <button onClick={toggleSidebar} className="collapse-btn" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                        {isCollapsed ? (i18n.language === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />) : (i18n.language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)}
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link key={item.path} href={item.path}>
                            <div
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                title={isCollapsed ? item.name : ''}
                                aria-current={isActive(item.path) ? 'page' : undefined}
                            >
                                <item.icon size={22} />
                                {!isCollapsed && <span>{item.name}</span>}
                            </div>
                        </Link>
                    ))}

                    <Restricted to="admin">
                        <Link href="/reports">
                            <div
                                className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
                                title={isCollapsed ? "Reports" : ''}
                                aria-current={isActive('/reports') ? 'page' : undefined}
                            >
                                <FileText size={22} />
                                {!isCollapsed && <span>Reports</span>}
                            </div>
                        </Link>
                        <Link href="/settings">
                            <div
                                className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                                title={isCollapsed ? t('sidebar.settings') : ''}
                                aria-current={isActive('/settings') ? 'page' : undefined}
                            >
                                <Settings size={22} />
                                {!isCollapsed && <span>{t('sidebar.settings')}</span>}
                            </div>
                        </Link>
                    </Restricted>
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button onClick={logout} className="nav-item logout-btn" aria-label="Logout">
                        <LogOut size={22} />
                        {!isCollapsed && <span>{t('sidebar.logout')}</span>}
                    </button>

                    {/* Language Switcher */}
                    <div style={{ padding: isCollapsed ? '0.5rem' : '0.75rem 1rem', marginTop: '0.5rem' }}>
                        <LanguageSwitcher isCollapsed={isCollapsed} />
                    </div>
                    {!isCollapsed && <div className="version">v2.0.0</div>}
                </div>
            </aside>

            <style>{`
                .sidebar {
                    position: fixed; top: 0; left: 0; height: 100vh;
                    width: 260px; z-index: 50;
                    display: flex; flex-direction: column;
                    transition: width 0.3s ease, transform 0.3s ease;
                    border-right: 1px solid var(--glass-border);
                }
                
                .sidebar.collapsed { width: 80px; }

                .sidebar-header {
                    height: 64px; display: flex; align-items: center; justify-content: space-between;
                    padding: 0 1.5rem; border-bottom: 1px solid var(--glass-border);
                }
                
                .sidebar.collapsed .sidebar-header { justify-content: center; padding: 0; }
                
                .logo-text { font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; color: transparent; }

                .collapse-btn {
                    background: none; border: none; color: var(--text-secondary); cursor: pointer;
                    display: flex; align-items: center; padding: 4px; border-radius: 4px;
                }
                .collapse-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }

                .sidebar-nav { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
                
                .nav-item {
                    display: flex; align-items: center; gap: 1rem;
                    padding: 0.75rem 1rem; color: var(--text-secondary);
                    text-decoration: none; border-radius: 0.5rem;
                    transition: all 0.2s; cursor: pointer; border: none; background: none; font-size: 1rem; width: 100%; box-sizing: border-box;
                }
                
                .sidebar.collapsed .nav-item { justify-content: center; padding: 0.75rem 0; }
                
                .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
                .nav-item.active { background: rgba(59, 130, 246, 0.15); color: var(--accent); border: 1px solid rgba(59, 130, 246, 0.2); }

                .sidebar-footer { padding: 1rem; border-top: 1px solid var(--glass-border); }
                .logout-btn:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
                .version { text-align: center; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem; }

                /* Mobile Styles */
                @media (max-width: 768px) {
                    .sidebar { transform: translateX(-100%); width: 260px !important; }
                    .sidebar.mobile-open { transform: translateX(0); }
                    .sidebar.collapsed { width: 260px; } /* Disable collapse on mobile menu */
                    .collapse-btn { display: none; } /* Hide toggle on mobile nav */
                }
            `}</style>
        </>
    );
};

export default Sidebar;
