import React, { useState } from 'react';
import { useUIStore } from '../store/ui';
import { useAuthStore } from '../store/auth';
import Card from '../components/ui/Card';
import { Moon, Sun, Monitor, Check, Key, Activity, Webhook as WebhookIcon, Save, Shield, GitBranch, Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadSettings, parseImportedSettings } from '../utils/settingsBackup';

import ScanningSettings from '../components/settings/ScanningSettings';
import KeyManager from '../components/settings/KeyManager';
import ApiKeyManager from '../components/settings/ApiKeyManager';
import VcsManager from '../components/settings/VcsManager';
import WebhookManager from '../components/settings/WebhookManager';
import AuditLogViewer from '../components/settings/AuditLogViewer';
import BackupRestore from '../components/settings/BackupRestore';
import TagManager from '../components/TagManager';
import { resetOnboarding } from '../components/OnboardingTour';
import { useTagStore } from '../store/tags';
import { Tag, PlayCircle } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const { theme, setTheme, accentColor, setAccentColor } = useUIStore();
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('general');
    const [showTagManager, setShowTagManager] = useState(false);
    const { tags, setTags } = useTagStore();

    const handleExportSettings = () => {
        const settings = {
            theme,
            accentColor,
            preferences: user?.preferences || {}
        };
        downloadSettings(settings);
    };

    const handleImportSettings = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = parseImportedSettings(event.target.result);
                if (importedSettings.theme) setTheme(importedSettings.theme);
                if (importedSettings.accentColor) setAccentColor(importedSettings.accentColor);
                alert('Settings imported successfully!');
            } catch (error) {
                alert('Failed to import settings: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    const handleRestartTour = () => {
        resetOnboarding();
        alert('Onboarding tour reset! Refresh the page to start the tour again.');
    };

    const handleSaveTags = (updatedTags) => {
        setTags(updatedTags);
    };

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
                <div
                    role="tablist"
                    aria-label="Settings sections"
                    style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-label={`${tab.label} settings`}
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
                            <tab.icon size={18} aria-hidden="true" />
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
                                    <div
                                        role="group"
                                        aria-label="Theme selection"
                                        style={{ display: 'flex', gap: '1rem', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                        {themes.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                                                aria-label={`Set ${t.label} theme`}
                                                aria-pressed={theme === t.id}
                                            >
                                                <t.icon size={18} aria-hidden="true" />
                                                <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Accent Color</h3>
                                    <div
                                        role="group"
                                        aria-label="Accent color selection"
                                        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setAccentColor(color)}
                                                aria-label={`Set accent color to ${color}`}
                                                aria-pressed={accentColor === color}
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
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>v2.0.0</p>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '1rem' }}>
                                        Production-ready service management platform for homelabs
                                    </p>

                                    {/* SR7 Branding */}
                                    <div style={{
                                        marginTop: '1.5rem',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid var(--glass-border)'
                                    }}>
                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Created by
                                        </p>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, var(--accent), #667eea)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            marginBottom: '1rem'
                                        }}>
                                            SR7
                                        </div>

                                        {/* GitHub Link */}
                                        <a
                                            href="https://github.com/Saarthaksr7/Dallal-Dashbord"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                background: 'var(--glass-bg)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '0.375rem',
                                                color: 'var(--text-primary)',
                                                textDecoration: 'none',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--accent)';
                                                e.currentTarget.style.borderColor = 'var(--accent)';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--glass-bg)';
                                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                            </svg>
                                            View on GitHub
                                        </a>

                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '1rem',
                                            opacity: 0.6
                                        }}>
                                            Open Source • MIT License
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Backup & Restore">
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                        Backup your settings to a file or restore from a previous backup.
                                    </p>

                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={handleExportSettings}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1.5rem',
                                                background: 'var(--accent)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                        >
                                            <Download size={18} />
                                            Export Settings
                                        </button>

                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1.5rem',
                                                background: 'var(--glass-bg)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                        >
                                            <Upload size={18} />
                                            Import Settings
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleImportSettings}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    </div>

                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        💡 Settings include theme, accent color, and user preferences.
                                    </div>
                                </div>
                            </Card>

                            <Card title="Service Tags">
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                        Manage tags to organize and categorize your services.
                                    </p>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '1rem'
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                Current Tags ({tags.length})
                                            </h4>
                                            <button
                                                onClick={() => setShowTagManager(true)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    background: 'var(--accent)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 500,
                                                    fontSize: '0.875rem'
                                                }}
                                                aria-label="Manage tags"
                                            >
                                                <Tag size={16} />
                                                Manage Tags
                                            </button>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem',
                                            minHeight: '3rem',
                                            padding: '0.75rem',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            {tags.length === 0 ? (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                    No tags created yet. Click "Manage Tags" to create some.
                                                </span>
                                            ) : (
                                                tags.map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        style={{
                                                            padding: '0.375rem 0.75rem',
                                                            background: tag.color,
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem'
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        💡 Tags help organize services by category, environment, or any custom criteria.
                                    </div>
                                </div>
                            </Card>

                            <Card title="Onboarding Tour">
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                        Restart the interactive tour to learn about dashboard features.
                                    </p>

                                    <button
                                        onClick={handleRestartTour}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            background: 'var(--glass-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)'
                                        }}
                                        aria-label="Restart onboarding tour"
                                    >
                                        <PlayCircle size={18} />
                                        Restart Tour
                                    </button>

                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        💡 The tour will automatically start when you refresh the page.
                                    </div>
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

            {/* TagManager Modal */}
            <TagManager
                isOpen={showTagManager}
                onClose={() => setShowTagManager(false)}
                tags={tags}
                onSave={handleSaveTags}
            />

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
