import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../lib/api';
import { X, Play, Square, RotateCw, PenTool, Save, Zap, Terminal, Monitor, Download } from 'lucide-react';
import ServiceHistoryChart from './ServiceHistoryChart';
import ResourceHistoryChart from './ResourceHistoryChart';

const ServiceDetails = ({ service, onClose, onAction }) => {
    // ... existing code ...


    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                ip: service.ip,
                port: service.port,
                mac_address: service.mac_address,
                ssh_username: service.ssh_username,
                group: service.group,
                check_type: service.check_type || 'tcp',
                snmp_community: service.snmp_community || 'public',
                tags: service.tags || '',
                parent_id: service.parent_id || '',
                check_interval: service.check_interval || 60,
                auto_restart: service.auto_restart || false,
                restart_command: service.restart_command || ''
            });
        }
    }, [service]);

    const [traps, setTraps] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/services/${service.id}/history?limit=50`);
                setHistory(res.data);

                // Fetch Traps
                const trapRes = await api.get(`/traps/?service_id=${service.id}&limit=10`);
                setTraps(trapRes.data);
            } catch (err) {
                console.error("Failed to fetch history/traps", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [service.id]);

    const [existingServices, setExistingServices] = useState([]);
    useEffect(() => {
        if (isEditing) {
            api.get('/services/').then(res => setExistingServices(res.data)).catch(console.error);
        }
    }, [isEditing]);

    const handleSave = async () => {
        try {
            await api.put(`/services/${service.id}`, formData);
            alert("Service updated!");
            setIsEditing(false);
            // Ideally notify parent to refresh list, or update local service object if possible
            // window.location.reload(); // simple brute force for now or rely on periodic poll
        } catch (error) {
            alert("Failed to update service");
        }
    };

    if (!service) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            zIndex: 100, display: 'flex', justifyContent: 'flex-end'
        }} onClick={onClose}>
            <div className="glass-panel" style={{
                width: '600px', maxWidth: '100%', height: '100%',
                borderLeft: '1px solid var(--glass-border)',
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                borderRadius: '0', // drawers usually square on the connected side
                display: 'flex', flexDirection: 'column', padding: '0'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                        {isEditing ? (
                            <input
                                className="input-field"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'transparent', border: '1px solid var(--accent)' }}
                            />
                        ) : (
                            <div>
                                <h2 style={{ margin: 0 }}>{service.name}</h2>
                                <div style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '0.25rem' }}>{service.ip}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isEditing ? (
                            <button className="icon-btn" onClick={handleSave} style={{ color: 'var(--accent)' }}><Save /></button>
                        ) : (
                            <button className="icon-btn" onClick={() => setIsEditing(true)}><PenTool size={18} /></button>
                        )}
                        <button className="icon-btn" onClick={onClose}><X /></button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>

                    {isEditing ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Edit Form */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>IP Address</label>
                                <input className="input-field" value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Port</label>
                                    <input className="input-field" type="number" value={formData.port} onChange={e => setFormData({ ...formData, port: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>MAC Address</label>
                                    <input className="input-field" value={formData.mac_address} onChange={e => setFormData({ ...formData, mac_address: e.target.value })} />
                                </div>
                            </div>

                            <h4 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-secondary)' }}>Credentials (SSH/RDP)</h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                                    <input className="input-field" value={formData.ssh_username || ''} onChange={e => setFormData({ ...formData, ssh_username: e.target.value })} placeholder="e.g. root" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                                    <input className="input-field" type="password"
                                        value={formData.ssh_password || ''}
                                        onChange={e => setFormData({ ...formData, ssh_password: e.target.value })}
                                        placeholder="Enter new password to update"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Polling Interval (sec)</label>
                                    <input className="input-field" type="number"
                                        value={formData.check_interval || 60}
                                        onChange={e => setFormData({ ...formData, check_interval: e.target.value })}
                                        min="10"
                                    />
                                </div>
                            </div>

                            {/* Advanced Config */}
                            <h4 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-secondary)' }}>Monitoring Config</h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Check Type</label>
                                    <select className="input-field" value={formData.check_type} onChange={e => setFormData({ ...formData, check_type: e.target.value })}>
                                        <option value="tcp">TCP Connect</option>
                                        <option value="http">HTTP Status</option>
                                        <option value="icmp">Ping (ICMP)</option>
                                        <option value="snmp">SNMP</option>
                                    </select>
                                </div>
                                {formData.check_type === 'snmp' && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>SNMP Community</label>
                                        <input className="input-field" value={formData.snmp_community} onChange={e => setFormData({ ...formData, snmp_community: e.target.value })} />
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tags (comma isolated)</label>
                                    <input className="input-field" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="production, web, db" />
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Parent Service (Dependency)</label>
                                    <select
                                        className="input-field"
                                        value={formData.parent_id || ''}
                                        onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {existingServices.filter(s => s.id !== service.id).map(svc => (
                                            <option key={svc.id} value={svc.id}>{svc.name} ({svc.ip})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Auto-Healing */}
                            <h4 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-secondary)' }}>Auto-Healing</h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        id="auto_restart"
                                        checked={formData.auto_restart || false}
                                        onChange={e => setFormData({ ...formData, auto_restart: e.target.checked })}
                                        style={{ marginRight: '0.75rem', transform: 'scale(1.2)' }}
                                    />
                                    <label htmlFor="auto_restart" style={{ fontSize: '0.9rem' }}>Enable Auto-Restart on Failure</label>
                                </div>
                                {formData.auto_restart && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Restart Command (SSH)</label>
                                        <input
                                            className="input-field"
                                            value={formData.restart_command || ''}
                                            onChange={e => setFormData({ ...formData, restart_command: e.target.value })}
                                            placeholder="e.g. systemctl restart nginx"
                                        />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                            Command executes locally on the target via SSH. Requires valid credentials.
                                            <br />Cooldown: 15 minutes.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ marginTop: '1rem' }}>Cancel</button>
                        </div>
                    ) : (
                        <>
                            {/* View Mode */}

                            {/* Status Badge */}
                            <div style={{
                                background: service.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: service.is_active ? '#22c55e' : '#ef4444',
                                padding: '1rem', borderRadius: '12px', textAlign: 'center',
                                marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.2rem'
                            }}>
                                {service.is_active ? 'ONLINE' : 'OFFLINE'}
                                <span style={{ fontSize: '0.9rem', opacity: 0.8, marginLeft: '0.5rem' }}>
                                    {service.response_time_ms}ms
                                </span>
                            </div>

                            {/* Sys Descr (SNMP or other) */}
                            {service.sys_descr && (
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <strong>System Info:</strong> <br />
                                    {service.sys_descr}
                                </div>
                            )}

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>MAC:</span> <br />
                                    {service.mac_address || 'N/A'}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Port:</span> <br />
                                    {service.port || 'N/A'}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Group:</span> <br />
                                    {service.group || 'Default'}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>User:</span> <br />
                                    {service.ssh_username || 'N/A'}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Parent:</span> <br />
                                    {service.parent_id ? (existingServices.find(s => s.id === service.parent_id)?.name || service.parent_id) : 'None'}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Interval:</span> <br />
                                    {service.check_interval || 60}s
                                </div>
                            </div>


                            {/* Resource Usage (Agentless Stats) */}
                            {service.cpu_usage !== null && service.cpu_usage !== undefined && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Resource Usage</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span>CPU</span>
                                                <span>{service.cpu_usage}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${service.cpu_usage}%`, height: '100%', background: 'var(--accent)' }} />
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span>RAM</span>
                                                <span>{service.ram_usage}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${service.ram_usage}%`, height: '100%', background: '#10b981' }} />
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span>Disk (/)</span>
                                                <span>{service.disk_usage}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${service.disk_usage}%`, height: '100%', background: '#f59e0b' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Connect Actions */}
                            <h3 style={{ marginBottom: '1rem' }}>Connect</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <Link to="/ssh">
                                    <button className="btn btn-secondary">
                                        <Terminal size={16} style={{ marginRight: '0.5rem' }} /> SSH Terminal
                                    </button>
                                </Link>
                                <button className="btn btn-secondary" onClick={() => {
                                    const content = `full address:s:${service.ip}\nusername:s:${service.ssh_username || 'Administrator'}\n`;
                                    const blob = new Blob([content], { type: 'application/x-rdp' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${service.name}.rdp`;
                                    a.click();
                                }}>
                                    <Monitor size={16} style={{ marginRight: '0.5rem' }} /> Launch RDP
                                </button>
                                <button className="btn btn-secondary" disabled title="Not implemented yet">
                                    <Download size={16} style={{ marginRight: '0.5rem' }} /> SFTP
                                </button>
                            </div>

                            {/* Chart */}
                            <h3 style={{ marginBottom: '1rem' }}>Response Time History</h3>
                            <div style={{ height: '300px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
                                {loading ? <p>Loading history...</p> : <ServiceHistoryChart history={history} />}
                            </div>

                            {/* Resource Chart */}
                            {(history.some(h => h.cpu_usage != null || h.ram_usage != null)) && (
                                <>
                                    <h3 style={{ marginBottom: '1rem' }}>Resource Usage History</h3>
                                    <div style={{ height: '200px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
                                        <ResourceHistoryChart history={history} />
                                    </div>
                                </>
                            )}

                            {/* Actions */}
                            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <button className="btn" onClick={() => onAction(service.id, 'start')} disabled={service.status === 'running'}>
                                    <Play size={16} style={{ marginRight: '0.5rem' }} /> Start
                                </button>
                                <button className="btn" onClick={() => onAction(service.id, 'restart')}>
                                    <RotateCw size={16} style={{ marginRight: '0.5rem' }} /> Restart
                                </button>
                                <button className="btn" onClick={() => onAction(service.id, 'wake')} disabled={!service.mac_address}>
                                    <Zap size={16} style={{ marginRight: '0.5rem' }} /> Wake
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                 .input-field {
                    width: 100%;
                    padding: 0.75rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--glass-border);
                    border-radius: 0.375rem;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                 }
            `}</style>
        </div >
    );
};

export default ServiceDetails;
