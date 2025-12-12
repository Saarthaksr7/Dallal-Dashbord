import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Rule templates for quick setup
export const ruleTemplates = [
    {
        name: "Slow Response Time",
        conditions: {
            metric: "response_time",
            operator: "greater_than",
            value: 1000,
            duration: 5,
            service: "all"
        },
        severity: "warning",
        notifications: { dashboard: true, email: false, webhook: false },
        actions: { autoResolve: true, cooldown: 15 }
    },
    {
        name: "Service Down",
        conditions: {
            metric: "status",
            operator: "equals",
            value: "offline",
            duration: 1,
            service: "all"
        },
        severity: "critical",
        notifications: { dashboard: true, email: false, webhook: false },
        actions: { autoResolve: true, cooldown: 5 }
    },
    {
        name: "Low Uptime",
        conditions: {
            metric: "uptime",
            operator: "less_than",
            value: 99,
            duration: 60,
            service: "all"
        },
        severity: "warning",
        notifications: { dashboard: true, email: false, webhook: false },
        actions: { autoResolve: true, cooldown: 30 }
    }
];

export const useAlertRulesStore = create(
    persist(
        (set, get) => ({
            rules: [],

            addRule: (rule) => {
                const newRule = {
                    ...rule,
                    id: Date.now(),
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    lastTriggered: null
                };
                set((state) => ({
                    rules: [...state.rules, newRule]
                }));
                return newRule;
            },

            updateRule: (id, updates) => set((state) => ({
                rules: state.rules.map(r =>
                    r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
                )
            })),

            deleteRule: (id) => set((state) => ({
                rules: state.rules.filter(r => r.id !== id)
            })),

            toggleRule: (id) => set((state) => ({
                rules: state.rules.map(r =>
                    r.id === id ? { ...r, enabled: !r.enabled } : r
                )
            })),

            duplicateRule: (id) => {
                const state = get();
                const ruleToDuplicate = state.rules.find(r => r.id === id);
                if (ruleToDuplicate) {
                    const duplicated = {
                        ...ruleToDuplicate,
                        id: Date.now(),
                        name: `${ruleToDuplicate.name} (Copy)`,
                        createdAt: new Date().toISOString(),
                        lastTriggered: null
                    };
                    set((state) => ({
                        rules: [...state.rules, duplicated]
                    }));
                    return duplicated;
                }
                return null;
            },

            // Test if a rule would trigger given service data
            testRule: (rule, serviceData) => {
                const { metric, operator, value, duration } = rule.conditions;

                let metricValue;
                switch (metric) {
                    case 'response_time':
                        metricValue = serviceData.response_time_ms || 0;
                        break;
                    case 'uptime':
                        metricValue = serviceData.uptime_percentage || 100;
                        break;
                    case 'status':
                        metricValue = serviceData.is_active ? 'online' : 'offline';
                        break;
                    default:
                        metricValue = 0;
                }

                let triggered = false;
                switch (operator) {
                    case 'greater_than':
                        triggered = metricValue > value;
                        break;
                    case 'less_than':
                        triggered = metricValue < value;
                        break;
                    case 'equals':
                        triggered = metricValue === value;
                        break;
                    case 'not_equals':
                        triggered = metricValue !== value;
                        break;
                    case 'greater_than_or_equal':
                        triggered = metricValue >= value;
                        break;
                    case 'less_than_or_equal':
                        triggered = metricValue <= value;
                        break;
                    default:
                        triggered = false;
                }

                return {
                    triggered,
                    message: triggered
                        ? `Alert would trigger: ${metric} (${metricValue}) ${operator} ${value}`
                        : `Alert would NOT trigger: ${metric} (${metricValue}) not ${operator} ${value}`,
                    metricValue
                };
            },

            getActiveRules: () => {
                return get().rules.filter(r => r.enabled);
            },

            getRulesByService: (serviceId) => {
                return get().rules.filter(r =>
                    r.enabled && (r.conditions.service === 'all' || r.conditions.service === serviceId)
                );
            }
        }),
        {
            name: 'alert-rules',
        }
    )
);
