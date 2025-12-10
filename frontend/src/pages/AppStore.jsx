import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Package, Server, Activity, Shield, HardDrive, Box, Settings, BarChart } from 'lucide-react';
import { availableApps } from '../store/opsCenter';
import AppWizard from '../components/apps/AppWizard';

const categoryIcons = {
    infrastructure: Server,
    monitoring: Activity,
    security: Shield,
    storage: HardDrive,
    virtualization: Box,
    automation: Settings,
    analytics: BarChart
};

const AppStore = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [wizardOpen, setWizardOpen] = useState(false);

    const categories = [
        { id: 'all', label: 'All Apps', icon: Package },
        { id: 'infrastructure', label: 'Infrastructure', icon: Server },
        { id: 'monitoring', label: 'Monitoring', icon: Activity },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'virtualization', label: 'Virtualization', icon: Box },
        { id: 'automation', label: 'Automation', icon: Settings },
        { id: 'analytics', label: 'Analytics', icon: BarChart }
    ];

    const filteredApps = useMemo(() => {
        return availableApps.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    const handleAppClick = (app) => {
        setSelectedApp(app);
        setWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
        setSelectedApp(null);
    };

    const getCategoryCount = (categoryId) => {
        if (categoryId === 'all') return availableApps.length;
        return availableApps.filter(app => app.category === categoryId).length;
    };

    return (
        <div className="app-store">
            {/* Header */}
            <div className="store-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1>
                            <Package size={32} />
                            App Store
                        </h1>
                        <p>Browse and install applications to your Ops Center</p>
                    </div>

                    {/* Search Bar */}
                    <div className="search-container">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search 400+ applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <span className="search-count">{filteredApps.length} results</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                <div className="tabs-scroll">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const count = getCategoryCount(cat.id);
                        return (
                            <button
                                key={cat.id}
                                className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <Icon size={18} />
                                <span>{cat.label}</span>
                                <span className="count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Apps Grid */}
            <div className="store-content">
                {filteredApps.length === 0 ? (
                    <div className="empty-state">
                        <Package size={64} />
                        <h3>No apps found</h3>
                        <p>Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="apps-grid">
                        {filteredApps.map(app => {
                            const isUrlIcon = app.iconIsUrl;
                            const IconComponent = !isUrlIcon && categoryIcons[app.category] ? categoryIcons[app.category] : Server;

                            return (
                                <div
                                    key={app.id}
                                    className="app-card"
                                    onClick={() => handleAppClick(app)}
                                >
                                    <div className="app-card-icon" style={{
                                        backgroundColor: isUrlIcon ? 'rgba(255, 255, 255, 0.05)' : app.color,
                                        padding: isUrlIcon ? '8px' : '16px'
                                    }}>
                                        {isUrlIcon ? (
                                            <img
                                                src={app.icon}
                                                alt={app.name}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    objectFit: 'contain'
                                                }}
                                                onError={(e) => {
                                                    // If image fails to load, hide it and show fallback
                                                    e.target.style.display = 'none';
                                                    const fallback = e.target.parentElement.querySelector('.fallback-icon');
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <IconComponent size={32} color="white" strokeWidth={1.5} />
                                        )}
                                        <div
                                            className="fallback-icon"
                                            style={{
                                                display: 'none',
                                                width: '100%',
                                                height: '100%',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <IconComponent size={32} color="white" strokeWidth={1.5} />
                                        </div>
                                    </div>

                                    <div className="app-card-info">
                                        <h3>{app.name}</h3>
                                        <p className="app-category">{app.category}</p>
                                        <div className="app-card-meta">
                                            <span className="port">Port: {app.webUiPort || 'N/A'}</span>
                                            {app.extraPorts && app.extraPorts.length > 0 && (
                                                <span className="extra-ports">
                                                    +{app.extraPorts.length} ports
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="app-card-action">
                                        <button className="configure-btn">Configure</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Wizard Modal */}
            <AppWizard
                app={selectedApp}
                isOpen={wizardOpen}
                onClose={handleCloseWizard}
            />

            <style>{`
                .app-store {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    padding-bottom: 2rem;
                }

                .store-header {
                    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.1) 100%);
                    border-bottom: 1px solid var(--border);
                    padding: 2rem 2rem 1.5rem 2rem;
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .header-text {
                    margin-bottom: 1.5rem;
                }

                .header-text h1 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: 0 0 0.5rem 0;
                    font-size: 2rem;
                    font-weight: 700;
                }

                .header-text p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 1.1rem;
                }

                .search-container {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    max-width: 600px;
                }

                .search-container input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 1rem;
                    outline: none;
                }

                .search-count {
                    color: var(--accent);
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .category-tabs {
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border);
                    padding: 0 2rem;
                    overflow-x: auto;
                }

                .tabs-scroll {
                    display: flex;
                    gap: 0.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .category-tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    font-weight: 500;
                }

                .category-tab:hover {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.05);
                }

                .category-tab.active {
                    color: var(--accent);
                    border-bottom-color: var(--accent);
                }

                .category-tab .count {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                }

                .category-tab.active .count {
                    background: rgba(59, 130, 246, 0.2);
                }

                .store-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .apps-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .app-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .app-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                    border-color: var(--accent);
                }

                .app-card-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .app-card-icon img {
                    width: 48px;
                    height: 48px;
                    object-fit: contain;
                }

                .fallback-icon {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .app-card-info {
                    flex: 1;
                }

                .app-card-info h3 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .app-category {
                    margin: 0 0 0.75rem 0;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    text-transform: capitalize;
                }

                .app-card-meta {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .port,
                .extra-ports {
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.05);
                }

                .configure-btn {
                    width: 100%;
                    padding: 0.75rem;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .configure-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .empty-state svg {
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.5rem;
                }

                .empty-state p {
                    margin: 0;
                    color: var(--text-secondary);
                }

                @media (max-width: 768px) {
                    .store-header {
                        padding: 1.5rem 1rem 1rem 1rem;
                    }

                    .header-text h1 {
                        font-size: 1.5rem;
                    }

                    .category-tabs {
                        padding: 0 1rem;
                    }

                    .store-content {
                        padding: 1.5rem 1rem;
                    }

                    .apps-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default AppStore;
