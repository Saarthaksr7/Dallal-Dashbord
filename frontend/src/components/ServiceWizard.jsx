import React, { useState } from 'react';
import { X, Search, Plus, Server, Globe, Monitor, Cpu, Eye, EyeOff } from 'lucide-react';
import Card from './ui/Card';
import { scanNetwork, createService, api } from '../lib/api';

const ServiceWizard = ({ onClose, onServiceAdded }) => {
    const [step, setStep] = useState(1);
    const [scanResults, setScanResults] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        ip: '',
        port: '',
        group: 'Default',
        check_type: 'http',
        mac_address: '',
        vendor: '',
        tags: '',
        script_content: 'import sys\n\n# Return 0 for ONLINE, 1 for OFFLINE\nsys.exit(0)',
        parent_id: '',
        expected_response: '',
        snmp_community: 'public',
        snmp_port: 161,
        sys_descr: '',
        check_interval: 60,
        ssh_username: '',
        ssh_password: '',
        ssh_private_key: '',
        rdp_username: '',
        rdp_password: '',
        rdp_domain: ''
    });

    const [showSSHPassword, setShowSSHPassword] = useState(false);
    const [showRDPPassword, setShowRDPPassword] = useState(false);

    const [existingServices, setExistingServices] = useState([]);
    const [entryMethod, setEntryMethod] = useState('manual'); // 'scan' | 'manual'

    const [pollInterval, setPollInterval] = useState(null);
    const [scanLogs, setScanLogs] = useState([]); // Scan progress logs

    const handleScan = async () => {
        setEntryMethod('scan');
        setStep(2);
        setScanning(true);
        setScanResults([]);
        setScanLogs(['🚀 Starting network scan...']);

        try {
            await api.post('/services/discovery/scan');
        } catch (error) {
            // If 409, it means scan is already running, which is fine, we just join it.
            if (error.response && error.response.status !== 409) {
                console.error("Scan failed to start", error);
                setScanning(false);
                alert("Failed to start scan: " + error.message);
                return;
            }
        }

        // Start Polling
        const intervalId = setInterval(checkScanStatus, 2000);
        setPollInterval(intervalId);
    };

    const checkScanStatus = async () => {
        try {
            const res = await api.get('/services/discovery/status');
            const status = res.data;

            // Update logs with current status
            if (status.is_scanning) {
                const progress = `📊 Progress: ${status.progress}/${status.total} IPs scanned, ${status.result_count} devices found`;
                setScanLogs(prev => {
                    const lastLog = prev[prev.length - 1];
                    // Only add if different from last log
                    if (lastLog !== progress) {
                        return [...prev, progress];
                    }
                    return prev;
                });
            }

            if (status.is_scanning === false) {
                // Scan finished
                setScanLogs(prev => [...prev, '✨ Scan complete! Loading results...']);
                if (pollInterval) clearInterval(pollInterval);
                finishScan();
            }
        } catch (error) {
            console.error("Status check failed", error);
        }
    };

    const finishScan = async () => {
        try {
            const res = await api.get('/services/discovery/results');
            setScanResults(res.data);
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setScanning(false);
            setPollInterval(null);
        }
    };

    // Cleanup interval
    React.useEffect(() => {
        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [pollInterval]);

    const fetchServices = async () => {
        try {
            const res = await api.get('/services/');
            setExistingServices(res.data);
        } catch (error) {
            console.error("Failed to load services for dependency", error);
        }
    };

    const handleSelectDevice = (device) => {
        fetchServices();
        setSelectedDevice(device);

        let initialPort = '';
        let initialCheckType = 'tcp';
        let initialCommunity = 'public';
        let initialSysDescr = '';

        if (device.has_https || device.has_http) {
            initialCheckType = 'http';
            initialPort = device.has_https ? '443' : '80';
        } else if (device.has_snmp) {
            initialCheckType = 'snmp';
            initialPort = '161';
            initialCommunity = 'public';
            if (device.snmp_descr) {
                initialSysDescr = device.snmp_descr;
            }
        } else if (device.has_ssh) {
            initialCheckType = 'tcp';
            initialPort = '22';
        } else if (device.has_rdp) {
            initialCheckType = 'tcp';
            initialPort = '3389';
        }

        setFormData({
            ...formData,
            name: device.hostname || `Device ${device.ip}`,
            ip: device.ip,
            port: initialPort,
            mac_address: device.mac_address || '',
            vendor: device.vendor || '',
            check_type: initialCheckType,
            snmp_community: initialCommunity,
            sys_descr: initialSysDescr
        });
        setStep(3);
    };

    const handleManual = async () => {
        setEntryMethod('manual');
        fetchServices();
        setStep(3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createService(formData);
            onServiceAdded();

            if (entryMethod === 'scan') {
                alert("Service added! You can select another device.");
                setStep(2); // Go back to results
                // Optional: remove added device from results?
                setScanResults(prev => prev.filter(d => d.ip !== formData.ip));
            } else {
                onClose();
            }
        } catch (error) {
            console.error("Failed to add service", error);
            alert("Failed to add service: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="wizard-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
            <div className="wizard-container">
                <Card title={<span id="wizard-title">Add New Service</span>} className="wizard-card" actions={<button onClick={onClose} className="close-btn" aria-label="Close wizard"><X size={20} /></button>}>

                    {step === 1 && (
                        <div className="wizard-step step-1">
                            <h3>How would you like to add a service?</h3>
                            <div className="options-grid">
                                <button className="option-card" onClick={handleScan}>
                                    <Search size={32} />
                                    <span>Scan Network</span>
                                    <p>Automatically find devices on your local network.</p>
                                </button>
                                <button className="option-card" onClick={handleManual}>
                                    <Plus size={32} />
                                    <span>Manual Entry</span>
                                    <p>Enter IP and details manually.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="wizard-step step-2">
                            <div className="step-header">
                                <button className="back-btn" onClick={() => setStep(1)}>Back</button>
                                <h3>Network Scan</h3>
                            </div>

                            {scanning ? (
                                <div className="scanning-state">
                                    <div className="loader"></div>
                                    <p>Scanning local network...</p>

                                    {/* Real-time Scan Logs */}
                                    <div className="scan-logs">
                                        <div className="logs-header">
                                            <strong>Scan Progress</strong>
                                        </div>
                                        <div className="logs-content">
                                            {scanLogs.map((log, idx) => (
                                                <div key={idx} className="log-entry">
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="results-list">
                                    {scanResults.length === 0 ? (
                                        <p>No devices found.</p>
                                    ) : (
                                        scanResults.map((device, idx) => (
                                            <div key={idx} className="result-item" onClick={() => handleSelectDevice(device)}>
                                                <div className="device-icon">
                                                    <Monitor size={20} />
                                                </div>
                                                <div className="device-info">
                                                    <strong>{device.hostname || device.ip}</strong>
                                                    <span>{device.ip} {device.vendor && `• ${device.vendor}`}</span>
                                                    <div className="capabilities" style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                        {device.has_ssh && <span className="badge">SSH</span>}
                                                        {device.has_rdp && <span className="badge">RDP</span>}
                                                        {device.has_vnc && <span className="badge">VNC</span>}
                                                        {device.has_snmp && <span className="badge" style={{ background: '#8b5cf6' }}>SNMP</span>}
                                                    </div>
                                                </div>
                                                <button className="select-btn">Select</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="wizard-step step-3">
                            <div className="step-header">
                                <button className="back-btn" onClick={() => setStep(step === 2 ? 2 : 1)}>Back</button>
                                <h3>Service Details</h3>
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

                                {/* SSH Credentials Section */}
                                {(formData.tags?.toLowerCase().includes('ssh') ||
                                    formData.tags?.toLowerCase().includes('linux') ||
                                    formData.tags?.toLowerCase().includes('unix') ||
                                    selectedDevice?.has_ssh) && (
                                        <>
                                            <div style={{
                                                marginTop: '1.5rem',
                                                marginBottom: '1rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                                                    SSH Credentials (Optional)
                                                </h3>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>SSH Username</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., root, admin"
                                                        value={formData.ssh_username}
                                                        onChange={e => setFormData({ ...formData, ssh_username: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>SSH Password</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input
                                                            type={showSSHPassword ? 'text' : 'password'}
                                                            placeholder="Leave empty for key-based"
                                                            value={formData.ssh_password}
                                                            onChange={e => setFormData({ ...formData, ssh_password: e.target.value })}
                                                            style={{ paddingRight: '2.5rem' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowSSHPassword(!showSSHPassword)}
                                                            style={{
                                                                position: 'absolute',
                                                                right: '0.5rem',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            {showSSHPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                {/* RDP Credentials Section */}
                                {(formData.tags?.toLowerCase().includes('rdp') ||
                                    formData.tags?.toLowerCase().includes('windows') ||
                                    selectedDevice?.has_rdp) && (
                                        <>
                                            <div style={{
                                                marginTop: '1.5rem',
                                                marginBottom: '1rem',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                                                    RDP Credentials (Optional)
                                                </h3>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>RDP Username</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., Administrator"
                                                        value={formData.rdp_username}
                                                        onChange={e => setFormData({ ...formData, rdp_username: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>RDP Domain (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., WORKGROUP"
                                                        value={formData.rdp_domain}
                                                        onChange={e => setFormData({ ...formData, rdp_domain: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>RDP Password</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type={showRDPPassword ? 'text' : 'password'}
                                                        placeholder="Windows password"
                                                        value={formData.rdp_password}
                                                        onChange={e => setFormData({ ...formData, rdp_password: e.target.value })}
                                                        style={{ paddingRight: '2.5rem' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRDPPassword(!showRDPPassword)}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '0.5rem',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem'
                                                        }}
                                                    >
                                                        {showRDPPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                <div className="form-group">
                                    <label>Polling Interval (seconds)</label>
                                    <input
                                        type="number"
                                        value={formData.check_interval || 60}
                                        onChange={e => setFormData({ ...formData, check_interval: e.target.value })}
                                        min="10"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="save-btn">Add Service</button>
                                </div>
                            </form>
                        </div>
                    )}

                </Card>
            </div>

            <style>{`
                .wizard-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .wizard-container { 
                    width: 100%; 
                    max-width: 600px; 
                    padding: 1rem; 
                    max-height: 90vh; 
                    overflow-y: auto;
                }
                .wizard-card { background: rgba(20, 20, 30, 0.95) !important; }
                
                .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
                
                .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
                .option-card {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; padding: 2rem;
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                    color: var(--text-primary); cursor: pointer; transition: all 0.2s;
                }
                .option-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-3px); border-color: var(--accent); }
                .option-card span { margin: 1rem 0 0.5rem; font-weight: 600; font-size: 1.1rem; }
                .option-card p { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }
                
                .step-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
                .back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.9rem; }
                
                .results-list { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
                .result-item {
                    display: flex; align-items: center; gap: 1rem;
                    padding: 1rem; background: rgba(255,255,255,0.03);
                    border-radius: 8px; cursor: pointer; transition: background 0.2s;
                }
                .result-item:hover { background: rgba(255,255,255,0.07); }
                .device-info { flex: 1; }
                .device-info strong { display: block; }
                .device-info span { font-size: 0.85rem; color: var(--text-secondary); }
                .select-btn {
                    padding: 6px 12px; border-radius: 4px; border: 1px solid var(--accent);
                    background: none; color: var(--accent); cursor: pointer;
                }
                
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem; }
                .form-group input {
                    width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
                    color: var(--text-primary);
                }
                .form-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
                .save-btn {
                    width: 100%; padding: 0.75rem; background: var(--accent);
                    border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;
                }
                
                .loader { 
                    width: 48px; height: 48px; border: 5px solid #FFF;
                    border-bottom-color: transparent; border-radius: 50%;
                    display: inline-block; box-sizing: border-box;
                    animation: rotation 1s linear infinite; margin-bottom: 1rem;
                }
                .scanning-state { text-align: center; padding: 2rem; }
                .badge { font-size: 0.7rem; background: var(--accent); color: white; padding: 2px 6px; border-radius: 4px; }
                @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ServiceWizard;
