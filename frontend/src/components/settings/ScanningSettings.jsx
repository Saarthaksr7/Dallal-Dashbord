import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Network, Plus, Trash2, Info } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/api';

const ScanningSettings = () => {
    const { token } = useAuthStore();
    const [subnets, setSubnets] = useState([]);
    const [newCidr, setNewCidr] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/settings/');
            const setting = res.data.find(s => s.key === 'scan_subnets');
            if (setting && setting.value) {
                try {
                    setSubnets(JSON.parse(setting.value));
                } catch (e) { console.error("Parse error", e); }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const saveSubnets = async (updatedList) => {
        setSubnets(updatedList);
        try {
            await api.put('/settings/scan_subnets', { value: JSON.stringify(updatedList) });
        } catch (error) {
            console.error(error);
            alert("Failed to save settings");
        }
    };

    const handleAdd = () => {
        if (!newCidr) return;
        // Basic validation
        // Regex for CIDR: ^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$
        // For simplicity allow non-strict
        const list = [...subnets, newCidr];
        saveSubnets(list);
        setNewCidr('');
    };

    const handleDelete = (index) => {
        const list = subnets.filter((_, i) => i !== index);
        saveSubnets(list);
    };

    // Scaning Logic
    const [scanning, setScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState(null);

    useEffect(() => {
        // Initial check
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const res = await api.get('/discovery/status');
            setScanStatus(res.data);
            setScanning(res.data.is_scanning);
        } catch (e) {
            // ignore
        }
    };

    const handleScanNow = async () => {
        setScanning(true);
        try {
            await api.post('/discovery/scan');
            // Toast?
        } catch (e) {
            if (e.response && e.response.status !== 409) {
                alert("Scan failed to start: " + e.message);
                setScanning(false);
            }
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="Network Scanning">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Configure which IP ranges to scan. If empty, the system will attempt to scan the local subnet of the server.</span>

                    <button
                        className="btn-primary"
                        onClick={handleScanNow}
                        disabled={scanning}
                        style={{ opacity: scanning ? 0.7 : 1, background: scanning ? 'var(--bg-secondary)' : 'var(--accent)' }}
                    >
                        {scanning ? (
                            <>
                                <span className="loader-mini" style={{ marginRight: '8px' }}></span>
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Network size={18} style={{ marginRight: '8px' }} /> Scan Network Now
                            </>
                        )}
                    </button>
                    {scanStatus && scanStatus.last_scan_time && (
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '1rem' }}>
                            Last scan: {new Date(scanStatus.last_scan_time).toLocaleTimeString()}
                        </span>
                    )}
                </p>

                <style>{`
                    .loader-mini {
                        width: 12px; height: 12px; border: 2px solid #FFF;
                        border-bottom-color: transparent; border-radius: 50%;
                        display: inline-block; animation: rotation 1s linear infinite;
                    }
                `}</style>

                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <Info className="flex-shrink-0" size={24} color="#3b82f6" />
                    <div style={{ fontSize: '0.9rem', color: '#93c5fd' }}>
                        Scanning large ranges (like /16 or /8) can take a very long time and consume significant resources.
                        It is recommended to use specific /24 subnets (e.g., <code>192.168.1.0/24</code>).
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        className="input-field"
                        placeholder="e.g. 192.168.1.0/24"
                        value={newCidr}
                        onChange={e => setNewCidr(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        style={{ flex: 1 }}
                    />
                    <button className="btn-primary" onClick={handleAdd}>
                        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Range
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {subnets.map((cidr, idx) => (
                        <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Network size={20} style={{ opacity: 0.5 }} />
                                <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{cidr}</span>
                            </div>
                            <button className="icon-btn" onClick={() => handleDelete(idx)} style={{ color: '#ef4444' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    {subnets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '2px dashed var(--glass-border)', borderRadius: '8px' }}>
                            No custom ranges configured. Using updated local subnet detection.
                        </div>
                    )}
                </div>

            </Card>

            <style>{`
                .input-field {
                    padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--glass-border);
                    border-radius: 6px; color: var(--text-primary); font-size: 0.95rem;
                }
                .input-field:focus { outline: none; border-color: var(--accent); }
                .btn-primary {
                    background: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem;
                    border-radius: 6px; cursor: pointer; display: flex; alignItems: center; fontWeight: 500;
                }
                .icon-btn { background: none; border: none; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; }
                .icon-btn:hover { opacity: 1; }
            `}</style>
        </div>
    );
};

export default ScanningSettings;
