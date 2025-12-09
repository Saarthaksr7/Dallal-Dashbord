import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Card from './ui/Card';
import { api } from '../lib/api';

const ServiceEditDialog = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        ip: '',
        port: '',
        group: 'Default',
        check_type: 'http',
        mac_address: '',
        vendor: '',
        tags: '',
        script_content: '',
        parent_id: '',
        expected_response: '',
        snmp_community: 'public',
        snmp_port: 161,
        sys_descr: '',
        check_interval: 60
    });

    const [existingServices, setExistingServices] = useState([]);

    useEffect(() => {
        // Pre-fill form with service data
        if (service) {
            setFormData({
                name: service.name || '',
                ip: service.ip || '',
                port: service.port || '',
                group: service.group || 'Default',
                check_type: service.check_type || 'http',
                mac_address: service.mac_address || '',
                vendor: service.vendor || '',
                tags: service.tags || '',
                script_content: service.script_content || '',
                parent_id: service.parent_id || '',
                expected_response: service.expected_response || '',
                snmp_community: service.snmp_community || 'public',
                snmp_port: service.snmp_port || 161,
                sys_descr: service.sys_descr || '',
                check_interval: service.check_interval || 60
            });
        }

        // Fetch existing services for parent dropdown
        api.get('/services/')
            .then(res => setExistingServices(res.data.filter(s => s.id !== service?.id)))
            .catch(err => console.error(err));
    }, [service]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/services/${service.id}`, formData);
            if (onSave) onSave();
            onClose();
        } catch (error) {
            alert(error.message || 'Failed to update service');
        }
    };

    return (
        <div className="wizard-overlay" onClick={onClose}>
            <div className="wizard-container" onClick={e => e.stopPropagation()}>
                <Card className="wizard-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Edit Service</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>IP Address</label>
                                <input
                                    type="text"
                                    value={formData.ip}
                                    onChange={e => setFormData({ ...formData, ip: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Check Type</label>
                                <select
                                    className="input-field"
                                    value={formData.check_type}
                                    onChange={e => setFormData({ ...formData, check_type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-primary)' }}
                                >
                                    <option value="tcp">TCP Connect</option>
                                    <option value="http">HTTP Status</option>
                                    <option value="script">Custom Python Script</option>
                                    <option value="snmp">SNMP (v2c)</option>
                                </select>
                            </div>
                        </div>

                        {formData.check_type === 'script' && (
                            <div className="form-group">
                                <label>Python Script (Return 0 for success)</label>
                                <textarea
                                    value={formData.script_content}
                                    onChange={e => setFormData({ ...formData, script_content: e.target.value })}
                                    rows={8}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: '#0d1117',
                                        border: '1px solid var(--border)', borderRadius: '6px',
                                        color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.85rem'
                                    }}
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {formData.check_type === 'snmp' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Community String</label>
                                    <input
                                        type="text"
                                        value={formData.snmp_community || 'public'}
                                        onChange={e => setFormData({ ...formData, snmp_community: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Port</label>
                                    <input
                                        type="number"
                                        value={formData.snmp_port || 161}
                                        onChange={e => setFormData({ ...formData, snmp_port: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {formData.check_type !== 'script' && formData.check_type !== 'snmp' && (
                            <div className="form-group">
                                <label>Port {formData.check_type === 'http' ? '(Optional)' : '(Required)'}</label>
                                <input
                                    type="number"
                                    value={formData.port}
                                    onChange={e => setFormData({ ...formData, port: e.target.value })}
                                    required={formData.check_type === 'tcp'}
                                />
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Group</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Default"
                                    value={formData.group}
                                    onChange={e => setFormData({ ...formData, group: e.target.value })}
                                    list="group-suggestions"
                                />
                                <datalist id="group-suggestions">
                                    <option value="Default" />
                                    <option value="Production" />
                                    <option value="Staging" />
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Tags</label>
                                <input
                                    type="text"
                                    placeholder="e.g., server, linux"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Parent Service (Dependency)</label>
                            <select
                                className="input-field"
                                value={formData.parent_id}
                                onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-primary)' }}
                            >
                                <option value="">None (Top Level)</option>
                                {existingServices.map(svc => (
                                    <option key={svc.id} value={svc.id}>{svc.name} ({svc.ip})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Polling Interval (seconds)</label>
                            <input
                                type="number"
                                value={formData.check_interval || 60}
                                onChange={e => setFormData({ ...formData, check_interval: e.target.value })}
                                min="10"
                            />
                        </div>
                        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={onClose} className="cancel-btn" style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}>Cancel</button>
                            <button type="submit" className="save-btn" style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'var(--accent)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}>Save Changes</button>
                        </div>
                    </form>
                </Card>
            </div>

            <style>{`
                .wizard-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .wizard-container { width: 100%; max-width: 600px; padding: 1rem; max-height: 90vh; overflow-y: auto; }
                .wizard-card { background: rgba(20, 20, 30, 0.95) !important; }
                
                .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
                
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem; }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
                    color: var(--text-primary); font-size: 1rem;
                }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            `}</style>
        </div>
    );
};

export default ServiceEditDialog;
