import React, { useState } from 'react';
import { Mail, Send, Plus, X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useEmailSettingsStore } from '../../store/emailSettings';
import { useUIStore } from '../../store/ui';

const EmailNotifications = () => {
    const {
        smtp,
        from,
        recipients,
        preferences,
        updateSMTP,
        updateFrom,
        addRecipient,
        removeRecipient,
        updatePreferences,
        sendTestEmail,
        saveToBackend
    } = useEmailSettingsStore();

    const addToast = useUIStore((state) => state.addToast);

    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newEmails, setNewEmails] = useState({
        critical: '',
        warning: '',
        info: ''
    });

    const handleTestEmail = async () => {
        setTesting(true);
        try {
            const result = await sendTestEmail(smtp.auth.user);
            if (result.success) {
                addToast('success', 'Test email sent successfully! Check your inbox.');
            } else {
                addToast('error', result.message || 'Failed to send test email');
            }
        } catch (error) {
            addToast('error', 'Failed to send test email');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveToBackend();
            if (result.success) {
                addToast('success', 'Email settings saved successfully!');
            } else {
                addToast('error', result.message || 'Failed to save settings');
            }
        } catch (error) {
            addToast('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRecipient = (severity) => {
        const email = newEmails[severity].trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (!recipients[severity].includes(email)) {
                addRecipient(severity, email);
                setNewEmails({ ...newEmails, [severity]: '' });
                addToast('success', `Added ${email} to ${severity} alerts`);
            } else {
                addToast('warning', 'Email already in list');
            }
        } else {
            addToast('error', 'Invalid email address');
        }
    };

    const severityConfig = {
        critical: { label: 'Critical', color: '#ef4444', emoji: '🔴' },
        warning: { label: 'Warning', color: '#f59e0b', emoji: '🟡' },
        info: { label: 'Info', color: '#3b82f6', emoji: '🔵' }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={24} style={{ color: 'var(--accent)' }} />
                Email Notifications
            </h2>

            {/* Enable Toggle */}
            <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                marginBottom: '1.5rem'
            }}>
                <label
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    onClick={() => updateSMTP({ enabled: !smtp.enabled })}
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        border: '2px solid',
                        borderColor: smtp.enabled ? 'var(--accent)' : 'var(--border)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: smtp.enabled ? 'var(--accent)' : 'transparent',
                        transition: 'all 0.2s'
                    }}>
                        {smtp.enabled && <Check size={16} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                        Enable Email Notifications
                    </span>
                </label>
            </div>

            {smtp.enabled && (
                <>
                    {/* SMTP Config */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>SMTP Configuration</h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={smtp.host}
                                        onChange={(e) => updateSMTP({ host: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={smtp.port}
                                        onChange={(e) => updateSMTP({ port: parseInt(e.target.value) })}
                                        style={{ width: '100px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    Email / Username
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={smtp.auth.user}
                                    onChange={(e) => updateSMTP({ auth: { ...smtp.auth, user: e.target.value } })}
                                    placeholder="your-email@gmail.com"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    Password / App Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field"
                                        value={smtp.auth.pass}
                                        onChange={(e) => updateSMTP({ auth: { ...smtp.auth, pass: e.target.value } })}
                                        placeholder="••••••••••••••••"
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    For Gmail, use an App Password (not your regular password)
                                </div>
                            </div>

                            <label
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                onClick={() => updateSMTP({ secure: !smtp.secure, port: !smtp.secure ? 465 : 587 })}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    minWidth: '20px',
                                    border: '2px solid',
                                    borderColor: smtp.secure ? 'var(--accent)' : 'var(--border)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: smtp.secure ? 'var(--accent)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    {smtp.secure && <Check size={14} color="white" strokeWidth={3} />}
                                </div>
                                <span style={{ cursor: 'pointer' }}>Use SSL/TLS (port 465) - Uncheck for STARTTLS (port 587)</span>
                            </label>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Alert Recipients by Severity</h3>

                        {Object.entries(severityConfig).map(([severity, config]) => (
                            <div key={severity} style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{config.emoji}</span>
                                    <strong style={{ color: config.color }}>{config.label} Alerts</strong>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {recipients[severity].map((email, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 0.75rem',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '6px',
                                                border: `1px solid ${config.color}30`
                                            }}
                                        >
                                            <span style={{ fontSize: '0.9rem' }}>{email}</span>
                                            <button
                                                onClick={() => {
                                                    removeRecipient(severity, email);
                                                    addToast('info', `Removed ${email}`);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={newEmails[severity]}
                                        onChange={(e) => setNewEmails({ ...newEmails, [severity]: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient(severity)}
                                        placeholder="email@example.com"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn"
                                        onClick={() => handleAddRecipient(severity)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Plus size={18} />
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preferences */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Email Preferences</h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Digest Settings */}
                            <div>
                                <label
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}
                                    onClick={() => updatePreferences({ sendDigest: !preferences.sendDigest })}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        minWidth: '20px',
                                        border: '2px solid',
                                        borderColor: preferences.sendDigest ? 'var(--accent)' : 'var(--border)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: preferences.sendDigest ? 'var(--accent)' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}>
                                        {preferences.sendDigest && <Check size={14} color="white" strokeWidth={3} />}
                                    </div>
                                    <span style={{ fontWeight: '500' }}>Send digest instead of individual alerts</span>
                                </label>

                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Digest Frequency
                                    </label>
                                    <select
                                        className="input-field"
                                        value={preferences.digestFrequency}
                                        onChange={(e) => updatePreferences({ digestFrequency: e.target.value })}
                                        disabled={!preferences.sendDigest}
                                        style={{
                                            width: '100%',
                                            opacity: preferences.sendDigest ? 1 : 0.5
                                        }}
                                    >
                                        <option value="hourly">Every Hour</option>
                                        <option value="daily">Daily (9:00 AM)</option>
                                        <option value="weekly">Weekly (Monday 9:00 AM)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                    Metrics to Include in Email Body
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={typeof preferences.includeMetrics === 'string' ? preferences.includeMetrics : 'response time, uptime, status'}
                                    onChange={(e) => updatePreferences({ includeMetrics: e.target.value })}
                                    placeholder="e.g., response time, uptime, status, error rate"
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Specify which metrics to include (comma-separated)
                                </div>
                            </div>

                            <label
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                onClick={() => updatePreferences({ includeCharts: !preferences.includeCharts })}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    minWidth: '20px',
                                    border: '2px solid',
                                    borderColor: preferences.includeCharts ? 'var(--accent)' : 'var(--border)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: preferences.includeCharts ? 'var(--accent)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    {preferences.includeCharts && <Check size={14} color="white" strokeWidth={3} />}
                                </div>
                                <span>Include charts (increases email size)</span>
                            </label>

                            {/* Email Format Dropdown */}
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                    Email Format
                                </label>
                                <select
                                    className="input-field"
                                    value={preferences.emailFormat || 'html'}
                                    onChange={(e) => updatePreferences({ emailFormat: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="html">HTML (Rich formatting with colors)</option>
                                    <option value="plain">Plain Text (Simple, lightweight)</option>
                                    <option value="both">Both (HTML with plain text fallback)</option>
                                </select>
                            </div>

                            {/* Priority Dropdown */}
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                    Minimum Alert Priority
                                </label>
                                <select
                                    className="input-field"
                                    value={preferences.minPriority || 'info'}
                                    onChange={(e) => updatePreferences({ minPriority: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="critical">Critical Only</option>
                                    <option value="warning">Warning and Above</option>
                                    <option value="info">All Alerts (Info and above)</option>
                                </select>
                            </div>

                            {/* Quiet Hours */}
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.quietHours || false}
                                        onChange={(e) => updatePreferences({ quietHours: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Enable Quiet Hours</span>
                                </label>
                                {preferences.quietHours && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginLeft: '2rem', marginTop: '0.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Start</label>
                                            <input
                                                type="time"
                                                className="input-field"
                                                value={preferences.quietStart || '22:00'}
                                                onChange={(e) => updatePreferences({ quietStart: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>End</label>
                                            <input
                                                type="time"
                                                className="input-field"
                                                value={preferences.quietEnd || '08:00'}
                                                onChange={(e) => updatePreferences({ quietEnd: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            className="btn"
                            onClick={handleTestEmail}
                            disabled={testing || !smtp.auth.user || !smtp.auth.pass}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {testing ? '...' : <Send size={18} />}
                            Send Test Email
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {saving ? '...' : <Check size={18} />}
                            Save Settings
                        </button>
                    </div>
                </>
            )}

            {!smtp.enabled && (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Email notifications are currently disabled.</p>
                    <p>Enable them above to configure SMTP settings and start receiving alerts via email.</p>
                </div>
            )}
        </div>
    );
};

export default EmailNotifications;
