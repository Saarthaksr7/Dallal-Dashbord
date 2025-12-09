import React, { useState } from 'react';
import { useUIStore } from '../store/ui';
import Card from '../components/ui/Card';
import { Moon, Sun, Monitor, Check, Key, Activity, Webhook as WebhookIcon, Save, Shield, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ScanningSettings from '../components/settings/ScanningSettings';
import KeyManager from '../components/settings/KeyManager';
import ApiKeyManager from '../components/settings/ApiKeyManager';
import VcsManager from '../components/settings/VcsManager';
import WebhookManager from '../components/settings/WebhookManager';
import AuditLogViewer from '../components/settings/AuditLogViewer';
import BackupRestore from '../components/settings/BackupRestore';

const Settings = () => {
    const { t } = useTranslation();
    const { theme, setTheme, accentColor, setAccentColor } = useUIStore();
    const [activeTab, setActiveTab] = useState('general');

    const themes = [
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'system', icon: Monitor, label: 'System' },
    ];

    const colors = [
        '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'
    ];

    const tabs = [
        { id: 'general', label: 'General', icon: Monitor },
        { id: 'scanning', label: 'Scanning', icon: Activity },
        { id: 'keys', label: 'Credentials', icon: Key },
        { id: 'api_keys', label: 'API Access', icon: Shield },
        { id: 'vcs', label: 'Version Control', icon: GitBranch },
        { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
        { id: 'audit', label: 'Audit Logs', icon: Activity },
        { id: 'backup', label: 'Backup', icon: Save },
    ];

    return (
        <div>
            <h1 className="page-title">{t('sidebar.settings')}</h1>

            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'general' && (
                        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <Card title="Appearance">
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Theme</h3>
                                    <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                        {themes.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                                            >
                                                <t.icon size={18} />
                                                <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Accent Color</h3>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setAccentColor(color)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: color, border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transform: accentColor === color ? 'scale(1.1)' : 'scale(1)',
                                                    boxShadow: accentColor === color ? `0 0 0 2px var(--bg-secondary), 0 0 0 4px ${color}` : 'none'
                                                }}
                                            >
                                                {accentColor === color && <Check size={16} color="white" strokeWidth={3} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card title="About">
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <h2 style={{ margin: '0 0 0.5rem 0' }}>Dallal Dashboard</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>v2.0.0 Alpha</p>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '1rem' }}>
                                        Designed for advanced home lab monitoring.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'scanning' && <ScanningSettings />}
                    {activeTab === 'keys' && <KeyManager />}
                    {activeTab === 'api_keys' && <ApiKeyManager />}
                    {activeTab === 'vcs' && <VcsManager />}
                    {activeTab === 'webhooks' && <WebhookManager />}
                    {activeTab === 'audit' && <AuditLogViewer />}
                    {activeTab === 'backup' && <BackupRestore />}
                </div>
            </div>

            <style>{`
                .theme-btn {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    padding: 0.75rem; border: none; background: none; color: var(--text-secondary);
                    cursor: pointer; border-radius: 0.375rem; transition: all 0.2s;
                }
                .theme-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
                .theme-btn.active { background: var(--bg-secondary); color: var(--accent); font-weight: 600; shadow: 0 1px 3px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
}

export default Settings;
