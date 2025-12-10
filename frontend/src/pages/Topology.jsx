import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { LayoutGrid, Eye, EyeOff, RefreshCw, PanelLeftClose, ShoppingBag } from 'lucide-react';
import IframeCard from '../components/ops/IframeCard';
import { useOpsCenterStore, availableApps } from '../store/opsCenter';

const OpsCenter = () => {
    const { t } = useTranslation();
    const [, setLocation] = useLocation();

    const {
        activeTab,
        setActiveTab,
        openIframes,
        addIframe,
        removeIframe,
        toggleIframeExpanded,
        updateIframeSize,
        focusMode,
        setFocusMode,
        showAppDirectory,
        toggleAppDirectory,
        clearAllIframes
    } = useOpsCenterStore();

    const [focusedIframe, setFocusedIframe] = useState(null);

    const tabs = [
        { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
        { id: 'monitoring', label: 'Monitoring', icon: '📊' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'storage', label: 'Storage', icon: '💾' },
        { id: 'virtualization', label: 'Virtualization', icon: '📦' },
        { id: 'automation', label: 'Automation', icon: '⚙️' },
        { id: 'analytics', label: 'Analytics', icon: '📈' }
    ];

    const getActiveTabIframes = () => {
        const categoryMap = {
            'infrastructure': 'infrastructure',
            'monitoring': 'monitoring',
            'security': 'security',
            'storage': 'storage',
            'virtualization': 'virtualization',
            'automation': 'automation',
            'analytics': 'analytics'
        };

        return openIframes.filter(iframe => {
            const app = availableApps.find(a => a.id === iframe.appId);
            return app && app.category === categoryMap[activeTab];
        });
    };

    const handleRefreshAll = () => {
        const currentIframes = [...openIframes];
        clearAllIframes();
        setTimeout(() => {
            currentIframes.forEach(iframe => {
                const app = availableApps.find(a => a.id === iframe.appId);
                if (app) addIframe(iframe.appId);
            });
        }, 100);
    };

    const activeIframes = getActiveTabIframes();

    return (
        <div className="ops-center">
            {/* Header */}
            <div className="ops-header">
                <div className="header-left">
                    <LayoutGrid size={28} />
                    <div>
                        <h1 className="ops-title">Ops Center</h1>
                        <p className="ops-subtitle">
                            Single Pane of Glass for your home lab ecosystem
                        </p>
                    </div>
                </div>

                <div className="header-controls">
                    <button
                        onClick={() => setLocation('/app-store')}
                        className="control-button browse-store"
                        title="Browse App Store"
                    >
                        <ShoppingBag size={18} />
                        <span>Browse App Store</span>
                    </button>

                    <button
                        onClick={() => setFocusMode(!focusMode)}
                        className={`control-button ${focusMode ? 'active' : ''}`}
                        title={focusMode ? "Disable Focus Mode" : "Enable Focus Mode"}
                    >
                        {focusMode ? <Eye size={18} /> : <EyeOff size={18} />}
                        <span>Focus</span>
                    </button>

                    <button
                        onClick={handleRefreshAll}
                        className="control-button"
                        title="Refresh All Iframes"
                    >
                        <RefreshCw size={18} />
                        <span>Refresh All</span>
                    </button>

                    <button
                        onClick={clearAllIframes}
                        className="control-button danger"
                        title="Close All Iframes"
                    >
                        <PanelLeftClose size={18} />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="ops-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="ops-content">
                {/* Iframe Grid */}
                <div className="iframe-grid">
                    {activeIframes.length === 0 ? (
                        <div className="empty-state">
                            <LayoutGrid size={64} opacity={0.3} />
                            <h3>No apps open yet</h3>
                            <p>Visit the App Store to add applications to this workspace</p>
                            <button
                                onClick={() => setLocation('/app-store')}
                                className="empty-action-btn"
                            >
                                <ShoppingBag size={20} />
                                Browse App Store
                            </button>
                        </div>
                    ) : (
                        activeIframes.map(iframe => (
                            <IframeCard
                                key={iframe.id}
                                iframe={iframe}
                                onRemove={() => removeIframe(iframe.id)}
                                onToggleExpand={() => toggleIframeExpanded(iframe.id)}
                                onUpdateSize={(size) => updateIframeSize(iframe.id, size)}
                                isFocused={focusMode && focusedIframe === iframe.id}
                                onFocus={() => setFocusedIframe(iframe.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .ops-center {
                    width: 100%;
                    height: calc(100vh - 64px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .ops-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-secondary);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .ops-title {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(to right, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                   -webkit-text-fill-color: transparent;
                }

                .ops-subtitle {
                    margin: 0.25rem 0 0 0;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .header-controls {
                    display: flex;
                    gap: 0.75rem;
                }

                .control-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    color: var(--text-secondary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .control-button:hover {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: var(--accent);
                    color: var(--text-primary);
                }

                .control-button.active {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: var(--accent);
                    color: var(--accent);
                }

                .ops-tabs {
                    display: flex;
                    gap: 0.5rem;
                    padding: 1rem 2rem 0 2rem;
                    background: var(--bg-secondary);
                }

                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .tab-button:hover {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.05);
                }

                .tab-button.active {
                    color: var(--accent);
                    border-bottom-color: var(--accent);
                }

                .tab-icon {
                    font-size: 1.1rem;
                }

                .ops-content {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: var(--bg-primary);
                }

                .iframe-grid {
                    height: 100%;
                    overflow-y: auto;
                    padding: 2rem;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    align-content: start;
                }

                .empty-state {
                    grid-column: span 3;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem 2rem;
                    text-align: center;
                    min-height: 400px;
                }

                .empty-state h3 {
                    margin: 1rem 0 0.5rem 0;
                    font-size: 1.25rem;
                    color: var(--text-primary);
                }

                .empty-state p {
                    margin: 0 0 1.5rem 0;
                    color: var(--text-secondary);
                }

                .open-directory-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .open-directory-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                @media (max-width: 1400px) {
                    .iframe-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 900px) {
                    .iframe-grid {
                        grid-template-columns: 1fr;
                        padding: 1rem;
                    }

                    .ops-header {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }

                    .header-controls {
                        width: 100%;
                        justify-content: flex-end;
                    }

                    .control-button span {
                        display: none;
                    }
                }
            `}</style>
        </div >
    );
};

export default OpsCenter;
