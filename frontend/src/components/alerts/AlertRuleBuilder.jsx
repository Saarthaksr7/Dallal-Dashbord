import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Save, TestTube, Zap } from 'lucide-react';
import { useAlertRulesStore, ruleTemplates } from '../../store/alertRules';
import { useServicesStore } from '../../store/services';

const metricOptions = [
    { value: 'response_time', label: 'Response Time', unit: 'ms' },
    { value: 'uptime', label: 'Uptime Percentage', unit: '%' },
    { value: 'status', label: 'Service Status', unit: '' },
];

const operatorOptions = {
    response_time: [
        { value: 'greater_than', label: 'Greater than (>)' },
        { value: 'less_than', label: 'Less than (<)' },
        { value: 'greater_than_or_equal', label: 'Greater than or equal (≥)' },
        { value: 'less_than_or_equal', label: 'Less than or equal (≤)' },
    ],
    uptime: [
        { value: 'less_than', label: 'Less than (<)' },
        { value: 'greater_than', label: 'Greater than (>)' },
    ],
    status: [
        { value: 'equals', label: 'Equals (=)' },
        { value: 'not_equals', label: 'Not equals (≠)' },
    ]
};

const statusValues = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
];

const AlertRuleBuilder = ({ onClose, editingRule = null }) => {
    const { addRule, updateRule } = useAlertRulesStore();
    const services = useServicesStore((state) => state.services);

    const [ruleName, setRuleName] = useState('');
    const [metric, setMetric] = useState('response_time');
    const [operator, setOperator] = useState('greater_than');
    const [value, setValue] = useState('');
    const [duration, setDuration] = useState('5');
    const [service, setService] = useState('all');
    const [severity, setSeverity] = useState('warning');
    const [notifyDashboard, setNotifyDashboard] = useState(true);
    const [notifyEmail, setNotifyEmail] = useState(false);
    const [notifyWebhook, setNotifyWebhook] = useState(false);
    const [autoResolve, setAutoResolve] = useState(true);
    const [cooldown, setCooldown] = useState('15');
    const [testResult, setTestResult] = useState(null);
    const [errors, setErrors] = useState({});

    // Load editing rule data
    useEffect(() => {
        if (editingRule) {
            setRuleName(editingRule.name);
            setMetric(editingRule.conditions.metric);
            setOperator(editingRule.conditions.operator);
            setValue(editingRule.conditions.value.toString());
            setDuration(editingRule.conditions.duration.toString());
            setService(editingRule.conditions.service);
            setSeverity(editingRule.severity);
            setNotifyDashboard(editingRule.notifications.dashboard);
            setNotifyEmail(editingRule.notifications.email);
            setNotifyWebhook(editingRule.notifications.webhook);
            setAutoResolve(editingRule.actions.autoResolve);
            setCooldown(editingRule.actions.cooldown.toString());
        }
    }, [editingRule]);

    const loadTemplate = (template) => {
        setRuleName(template.name);
        setMetric(template.conditions.metric);
        setOperator(template.conditions.operator);
        setValue(template.conditions.value.toString());
        setDuration(template.conditions.duration.toString());
        setService(template.conditions.service);
        setSeverity(template.severity);
        setNotifyDashboard(template.notifications.dashboard);
        setNotifyEmail(template.notifications.email);
        setNotifyWebhook(template.notifications.webhook);
        setAutoResolve(template.actions.autoResolve);
        setCooldown(template.actions.cooldown.toString());
    };

    const validate = () => {
        const newErrors = {};

        if (!ruleName.trim()) {
            newErrors.ruleName = 'Rule name is required';
        }

        if (!value || isNaN(value) || Number(value) < 0) {
            newErrors.value = 'Valid threshold value is required';
        }

        if (!duration || isNaN(duration) || Number(duration) <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        }

        if (!cooldown || isNaN(cooldown) || Number(cooldown) < 0) {
            newErrors.cooldown = 'Valid cooldown period is required';
        }

        if (!notifyDashboard && !notifyEmail && !notifyWebhook) {
            newErrors.notifications = 'At least one notification channel must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const rule = {
            name: ruleName,
            conditions: {
                metric,
                operator,
                value: metric === 'status' ? value : Number(value),
                duration: Number(duration),
                service
            },
            severity,
            notifications: {
                dashboard: notifyDashboard,
                email: notifyEmail,
                webhook: notifyWebhook
            },
            actions: {
                autoResolve,
                cooldown: Number(cooldown)
            }
        };

        if (editingRule) {
            updateRule(editingRule.id, rule);
        } else {
            addRule(rule);
        }

        onClose();
    };

    const handleTest = () => {
        // Simulate testing with first service
        if (services.length > 0) {
            const testService = services[0];
            const testRule = {
                conditions: {
                    metric,
                    operator,
                    value: metric === 'status' ? value : Number(value),
                    duration: Number(duration),
                    service
                }
            };

            // Mock service data for testing
            const mockData = {
                response_time_ms: testService.response_time_ms || 150,
                uptime_percentage: 99.5,
                is_active: testService.is_active
            };

            const result = useAlertRulesStore.getState().testRule(testRule, mockData);
            setTestResult(result);

            setTimeout(() => setTestResult(null), 5000);
        }
    };

    const currentMetric = metricOptions.find(m => m.value === metric);
    const availableOperators = operatorOptions[metric] || [];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-card)',
                    zIndex: 1
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={24} style={{ color: 'var(--accent)' }} />
                        {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Templates */}
                    {!editingRule && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Quick Start Templates
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {ruleTemplates.map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadTemplate(template)}
                                        className="btn"
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rule Name */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                            Rule Name *
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder="e.g., High Response Time Alert"
                            style={{ width: '100%' }}
                        />
                        {errors.ruleName && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.ruleName}</div>}
                    </div>

                    {/* Condition Builder */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Trigger Condition</h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Metric */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    When
                                </label>
                                <select
                                    className="input-field"
                                    value={metric}
                                    onChange={(e) => {
                                        setMetric(e.target.value);
                                        setOperator(operatorOptions[e.target.value][0].value);
                                        setValue('');
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    {metricOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Operator & Value */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        is
                                    </label>
                                    <select
                                        className="input-field"
                                        value={operator}
                                        onChange={(e) => setOperator(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        {availableOperators.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {currentMetric?.unit || 'value'}
                                    </label>
                                    {metric === 'status' ? (
                                        <select
                                            className="input-field"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="">Select...</option>
                                            {statusValues.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="0"
                                            style={{ width: '100%' }}
                                        />
                                    )}
                                    {errors.value && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.value}</div>}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    for (minutes)
                                </label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="5"
                                    min="1"
                                    style={{ width: '100%' }}
                                />
                                {errors.duration && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.duration}</div>}
                            </div>

                            {/* Service Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    For Service
                                </label>
                                <select
                                    className="input-field"
                                    value={service}
                                    onChange={(e) => setService(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="all">All Services</option>
                                    {services.map(svc => (
                                        <option key={svc.id} value={svc.id}>{svc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Severity */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                            Severity Level
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { value: 'critical', label: 'Critical', icon: AlertTriangle, color: '#ef4444' },
                                { value: 'warning', label: 'Warning', icon: AlertCircle, color: '#f59e0b' },
                                { value: 'info', label: 'Info', icon: Info, color: '#3b82f6' }
                            ].map(sev => {
                                const Icon = sev.icon;
                                return (
                                    <label
                                        key={sev.value}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem',
                                            border: `2px solid ${severity === sev.value ? sev.color : 'var(--border)'}`,
                                            background: severity === sev.value ? `${sev.color}15` : 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="severity"
                                            value={sev.value}
                                            checked={severity === sev.value}
                                            onChange={(e) => setSeverity(e.target.value)}
                                            style={{ display: 'none' }}
                                        />
                                        <Icon size={18} style={{ color: sev.color }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: severity === sev.value ? '600' : '400' }}>
                                            {sev.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                            Notify via
                        </label>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {[
                                { key: 'dashboard', label: 'Dashboard', value: notifyDashboard, setter: setNotifyDashboard },
                                { key: 'email', label: 'Email', value: notifyEmail, setter: setNotifyEmail },
                                { key: 'webhook', label: 'Webhook', value: notifyWebhook, setter: setNotifyWebhook }
                            ].map(notif => (
                                <label
                                    key={notif.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={notif.value}
                                        onChange={(e) => notif.setter(e.target.checked)}
                                    />
                                    <span>{notif.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.notifications && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.notifications}</div>}
                    </div>

                    {/* Advanced Options */}
                    <details style={{ marginBottom: '1.5rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                            Advanced Options
                        </summary>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '0.75rem' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={autoResolve}
                                    onChange={(e) => setAutoResolve(e.target.checked)}
                                />
                                <span>Auto-resolve when condition clears</span>
                            </label>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Cooldown Period (minutes)
                                </label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={cooldown}
                                    onChange={(e) => setCooldown(e.target.value)}
                                    min="0"
                                    placeholder="15"
                                    style={{ width: '100%' }}
                                />
                                {errors.cooldown && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.cooldown}</div>}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Minimum time between repeated alerts
                                </div>
                            </div>
                        </div>
                    </details>

                    {/* Test Result */}
                    {testResult && (
                        <div style={{
                            padding: '1rem',
                            background: testResult.triggered ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${testResult.triggered ? '#ef4444' : '#22c55e'}`,
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: testResult.triggered ? '#ef4444' : '#22c55e' }}>
                                Test Result:
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>{testResult.message}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    position: 'sticky',
                    bottom: 0,
                    background: 'var(--bg-card)'
                }}>
                    <button
                        className="btn"
                        onClick={handleTest}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <TestTube size={18} />
                        Test Rule
                    </button>
                    <button
                        className="btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={18} />
                        {editingRule ? 'Update Rule' : 'Create Rule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertRuleBuilder;
