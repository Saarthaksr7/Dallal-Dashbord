import React from 'react';
import { Edit, Trash2, Copy, Power, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { useAlertRulesStore } from '../../store/alertRules';

const AlertRulesList = ({ onEdit }) => {
    const { rules, toggleRule, deleteRule, duplicateRule } = useAlertRulesStore();

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <AlertTriangle size={16} style={{ color: '#ef4444' }} />;
            case 'warning':
                return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
            case 'info':
                return <Info size={16} style={{ color: '#3b82f6' }} />;
            default:
                return null;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return 'var(--text-secondary)';
        }
    };

    const formatCondition = (rule) => {
        const { metric, operator, value, duration } = rule.conditions;
        const metricLabels = {
            response_time: 'Response Time',
            uptime: 'Uptime',
            status: 'Status'
        };
        const operatorLabels = {
            greater_than: '>',
            less_than: '<',
            equals: '=',
            not_equals: '≠',
            greater_than_or_equal: '≥',
            less_than_or_equal: '≤'
        };

        const unit = metric === 'response_time' ? 'ms' : metric === 'uptime' ? '%' : '';
        return `${metricLabels[metric]} ${operatorLabels[operator]} ${value}${unit} for ${duration}min`;
    };

    const formatLastTriggered = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Delete alert rule "${name}"? This action cannot be undone.`)) {
            deleteRule(id);
        }
    };

    if (rules.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--text-secondary)'
            }}>
                <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No alert rules configured</p>
                <p style={{ fontSize: '0.9rem' }}>Create your first rule to get started with automated alerting</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {rules.map(rule => (
                <div
                    key={rule.id}
                    style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: `1px solid var(--border)`,
                        borderLeft: `4px solid ${getSeverityColor(rule.severity)}`,
                        borderRadius: '8px',
                        opacity: rule.enabled ? 1 : 0.6,
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {getSeverityIcon(rule.severity)}
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                    {rule.name}
                                </h4>
                                {!rule.enabled && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '0.25rem 0.5rem',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '4px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        DISABLED
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                {formatCondition(rule)}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} />
                                    Last triggered: {formatLastTriggered(rule.lastTriggered)}
                                </span>
                                {rule.conditions.service !== 'all' && (
                                    <span>Service ID: {rule.conditions.service}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                                onClick={() => toggleRule(rule.id)}
                                className="icon-btn"
                                title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                                style={{
                                    color: rule.enabled ? 'var(--accent)' : 'var(--text-secondary)'
                                }}
                            >
                                <Power size={18} />
                            </button>
                            <button
                                onClick={() => onEdit(rule)}
                                className="icon-btn"
                                title="Edit rule"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => duplicateRule(rule.id)}
                                className="icon-btn"
                                title="Duplicate rule"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(rule.id, rule.name)}
                                className="icon-btn"
                                title="Delete rule"
                                style={{ color: '#ef4444' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Notification Channels */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border)'
                    }}>
                        {rule.notifications.dashboard && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                borderRadius: '4px',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                                📊 Dashboard
                            </span>
                        )}
                        {rule.notifications.email && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                borderRadius: '4px',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                                ✉️ Email
                            </span>
                        )}
                        {rule.notifications.webhook && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6',
                                borderRadius: '4px',
                                border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}>
                                🔗 Webhook
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AlertRulesList;
