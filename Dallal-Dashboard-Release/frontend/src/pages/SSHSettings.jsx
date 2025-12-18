import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';

const DEFAULT_SETTINGS = {
    general: {
        autoReconnect: false,
        connectionTimeout: 30,
        showLogs: true
    },
    terminal: {
        fontSize: 14,
        theme: 'dark',
        lineHeight: 1.5,
        cursorStyle: 'block'
    },
    history: {
        enabled: true,
        maxEntries: 1000,
        autoDelete: true,
        includeTimestamps: true
    },
    sessions: {
        autoSave: true,
        retentionDays: 30,
        promptBeforeDisconnect: true
    }
};

const SSHSettings = () => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        const saved = localStorage.getItem('sshSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
    };

    const saveSettings = () => {
        localStorage.setItem('sshSettings', JSON.stringify(settings));
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            setSettings(DEFAULT_SETTINGS);
            localStorage.setItem('sshSettings', JSON.stringify(DEFAULT_SETTINGS));
            setSaveMessage('Settings reset to defaults!');
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const updateSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SettingsIcon size={32} />
                    SSH Settings
                </h1>

                {/* Save Message */}
                {saveMessage && (
                    <div style={{
                        background: '#238636',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {saveMessage}
                    </div>
                )}

                {/* General Settings */}
                <Section title="General Settings">
                    <SettingRow label="Auto-reconnect on disconnect">
                        <Toggle
                            checked={settings.general.autoReconnect}
                            onChange={(checked) => updateSetting('general', 'autoReconnect', checked)}
                        />
                    </SettingRow>

                    <SettingRow label="Connection timeout (seconds)">
                        <select
                            value={settings.general.connectionTimeout}
                            onChange={(e) => updateSetting('general', 'connectionTimeout', parseInt(e.target.value))}
                            style={selectStyle}
                        >
                            <option value={10}>10 seconds</option>
                            <option value={20}>20 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={45}>45 seconds</option>
                            <option value={60}>60 seconds</option>
                        </select>
                    </SettingRow>

                    <SettingRow label="Show connection logs">
                        <Toggle
                            checked={settings.general.showLogs}
                            onChange={(checked) => updateSetting('general', 'showLogs', checked)}
                        />
                    </SettingRow>
                </Section>

                {/* Terminal Appearance */}
                <Section title="Terminal Appearance">
                    <SettingRow label="Font size">
                        <select
                            value={settings.terminal.fontSize}
                            onChange={(e) => updateSetting('terminal', 'fontSize', parseInt(e.target.value))}
                            style={selectStyle}
                        >
                            <option value={12}>12px</option>
                            <option value={14}>14px</option>
                            <option value={16}>16px</option>
                            <option value={18}>18px</option>
                            <option value={20}>20px</option>
                        </select>
                    </SettingRow>

                    <SettingRow label="Theme">
                        <select
                            value={settings.terminal.theme}
                            onChange={(e) => updateSetting('terminal', 'theme', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </SettingRow>

                    <SettingRow label="Line height">
                        <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.1"
                            value={settings.terminal.lineHeight}
                            onChange={(e) => updateSetting('terminal', 'lineHeight', parseFloat(e.target.value))}
                            style={{ flex: 1, maxWidth: '200px' }}
                        />
                        <span style={{ marginLeft: '1rem', color: '#8b949e' }}>{settings.terminal.lineHeight}</span>
                    </SettingRow>

                    <SettingRow label="Cursor style">
                        <select
                            value={settings.terminal.cursorStyle}
                            onChange={(e) => updateSetting('terminal', 'cursorStyle', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="block">Block</option>
                            <option value="line">Line</option>
                            <option value="underline">Underline</option>
                        </select>
                    </SettingRow>
                </Section>

                {/* Command History */}
                <Section title="Command History">
                    <SettingRow label="Enable command logging">
                        <Toggle
                            checked={settings.history.enabled}
                            onChange={(checked) => updateSetting('history', 'enabled', checked)}
                        />
                    </SettingRow>

                    <SettingRow label="Maximum history entries">
                        <input
                            type="number"
                            min={100}
                            max={10000}
                            step={100}
                            value={settings.history.maxEntries}
                            onChange={(e) => updateSetting('history', 'maxEntries', parseInt(e.target.value))}
                            style={{
                                ...selectStyle,
                                width: '120px'
                            }}
                        />
                    </SettingRow>

                    <SettingRow label="Auto-delete old entries">
                        <Toggle
                            checked={settings.history.autoDelete}
                            onChange={(checked) => updateSetting('history', 'autoDelete', checked)}
                        />
                    </SettingRow>

                    <SettingRow label="Include timestamps">
                        <Toggle
                            checked={settings.history.includeTimestamps}
                            onChange={(checked) => updateSetting('history', 'includeTimestamps', checked)}
                        />
                    </SettingRow>
                </Section>

                {/* Session Management */}
                <Section title="Session Management">
                    <SettingRow label="Auto-save sessions on disconnect">
                        <Toggle
                            checked={settings.sessions.autoSave}
                            onChange={(checked) => updateSetting('sessions', 'autoSave', checked)}
                        />
                    </SettingRow>

                    <SettingRow label="Session retention (days)">
                        <input
                            type="number"
                            min={7}
                            max={365}
                            value={settings.sessions.retentionDays}
                            onChange={(e) => updateSetting('sessions', 'retentionDays', parseInt(e.target.value))}
                            style={{
                                ...selectStyle,
                                width: '120px'
                            }}
                        />
                    </SettingRow>

                    <SettingRow label="Prompt before disconnect">
                        <Toggle
                            checked={settings.sessions.promptBeforeDisconnect}
                            onChange={(checked) => updateSetting('sessions', 'promptBeforeDisconnect', checked)}
                        />
                    </SettingRow>
                </Section>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid #30363d',
                    position: 'sticky',
                    bottom: '0',
                    background: '#0d1117',
                    paddingBottom: '1rem'
                }}>
                    <button
                        onClick={saveSettings}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            background: '#238636',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        Save Settings
                    </button>

                    <button
                        onClick={resetToDefaults}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <RotateCcw size={18} />
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Section = ({ title, children }) => (
    <div style={{
        marginBottom: '2rem',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        padding: '1.5rem'
    }}>
        <h3 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '18px',
            color: '#c9d1d9'
        }}>
            {title}
        </h3>
        <div>
            {children}
        </div>
    </div>
);

const SettingRow = ({ label, children }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 0',
        borderBottom: '1px solid #21262d'
    }}>
        <label style={{
            color: '#c9d1d9',
            fontSize: '14px'
        }}>
            {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {children}
        </div>
    </div>
);

const Toggle = ({ checked, onChange }) => (
    <div
        onClick={() => onChange(!checked)}
        style={{
            width: '44px',
            height: '24px',
            background: checked ? '#238636' : '#30363d',
            borderRadius: '12px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s'
        }}
    >
        <div style={{
            width: '20px',
            height: '20px',
            background: 'white',
            borderRadius: '10px',
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            transition: 'left 0.2s'
        }} />
    </div>
);

const selectStyle = {
    padding: '0.5rem',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    cursor: 'pointer'
};

export default SSHSettings;
