import React, { useState } from 'react';
import { availableApps } from '../../store/opsCenter';
import { Search, X, GripVertical, Server, Box, Shield, Activity, Film, Tv, Search as SearchIcon, HardDrive, Network, Camera, Lock } from 'lucide-react';

const iconMap = {
    Server, Box, Shield, Activity, Film, Tv, Search: SearchIcon, HardDrive, Network, Camera, Lock
};

const AppDirectory = ({ isOpen, onClose, onAddApp, activeTab }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryLabel = (category) => {
        const labels = {
            'infrastructure': 'Infrastructure Management',
            'monitoring': 'Network Monitoring',
            'security': 'Security & Firewall',
            'storage': 'Data Storage & Backup',
            'virtualization': 'Virtualization & Containers',
            'automation': 'Automation & Orchestration',
            'analytics': 'Performance Analytics'
        };
        return labels[category] || category;
    };

    const getCategoryApps = () => {
        return availableApps.filter(app =>
            app.category === activeTab &&
            app.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const apps = getCategoryApps();

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay for mobile */}
            <div className="directory-overlay" onClick={onClose} />

            <div className="app-directory">
                {/* Header */}
                <div className="directory-header">
                    <h3>App Directory</h3>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="directory-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search apps..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* App List */}
                <div className="directory-list">
                    <div className="category-label">{getCategoryLabel(activeTab)}</div>

                    {apps.length === 0 ? (
                        <div className="empty-state">No apps found</div>
                    ) : (
                        apps.map(app => {
                            const Icon = iconMap[app.icon] || Server;
                            return (
                                <div
                                    key={app.id}
                                    className="app-item"
                                    onClick={() => onAddApp(app.id)}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('appId', app.id)}
                                >
                                    <GripVertical size={16} className="drag-handle" />
                                    <div
                                        className="app-icon"
                                        style={{ backgroundColor: app.color }}
                                    >
                                        <Icon size={18} color="white" />
                                    </div>
                                    <div className="app-info">
                                        <div className="app-name">{app.name}</div>
                                        <div className="app-url">{new URL(app.url).hostname}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <style>{`
                    .directory-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 49;
                        display: none;
                    }

                    .app-directory {
                        position: fixed;
                        left: 260px;
                        top: 64px;
                        bottom: 0;
                        width: 300px;
                        background: var(--bg-card);
                        border-right: 1px solid var(--border);
                        z-index: 50;
                        display: flex;
                        flex-direction: column;
                        transition: transform 0.3s ease;
                    }

                    .directory-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 1rem;
                        border-bottom: 1px solid var(--border);
                    }

                    .directory-header h3 {
                        margin: 0;
                        font-size: 1.1rem;
                        font-weight: 600;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        cursor: pointer;
                        padding: 0.25rem;
                        border-radius: 4px;
                        display: flex;
                    }

                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-primary);
                    }

                    .directory-search {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 1rem;
                        border-bottom: 1px solid var(--border);
                    }

                    .directory-search input {
                        flex: 1;
                        background: var(--bg-secondary);
                        border: 1px solid var(--border);
                        color: var(--text-primary);
                        padding: 0.5rem;
                        border-radius: 4px;
                        font-size: 0.9rem;
                    }

                    .directory-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1rem;
                    }

                    .category-label {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: var(--text-secondary);
                        margin-bottom: 0.75rem;
                        letter-spacing: 0.5px;
                    }

                    .app-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem;
                        background: var(--bg-secondary);
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        margin-bottom: 0.5rem;
                        cursor: grab;
                        transition: all 0.2s;
                    }

                    .app-item:hover {
                        background: rgba(59, 130, 246, 0.1);
                        border-color: var(--accent);
                        transform: translateX(4px);
                    }

                    .app-item:active {
                        cursor: grabbing;
                    }

                    .drag-handle {
                        color: var(--text-secondary);
                        flex-shrink: 0;
                    }

                    .app-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .app-info {
                        flex: 1;
                        min-width: 0;
                    }

                    .app-name {
                        font-weight: 600;
                        font-size: 0.9rem;
                        margin-bottom: 0.25rem;
                    }

                    .app-url {
                        font-size: 0.75rem;
                        color: var(--text-secondary);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .empty-state {
                        text-align: center;
                        color: var(--text-secondary);
                        padding: 2rem 1rem;
                    }

                    @media (max-width: 1024px) {
                        .directory-overlay {
                            display: block;
                        }

                        .app-directory {
                            left: 0;
                        }
                    }

                    @media (max-width: 768px) {
                        .app-directory {
                            width: 100%;
                            max-width: 320px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default AppDirectory;
