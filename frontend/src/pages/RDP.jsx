import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { api } from '../lib/api';
import { Monitor, Download } from 'lucide-react';

const RDP = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        api.post('/services/discover').then(res => { // Actually should fetch saved services or use store
            // Let's fetch saved services instead of discovering
            api.get('/services/group/Default').then(r => setServices(r.data));
            // Ideally fetch all. Using existing endpoint logic.
        });
        // Or better, just fetch all services
        api.get('/services/').then(r => setServices(r.data));
    }, []);

    const generateRDP = (service) => {
        const content = `full address:s:${service.ip}\nusername:s:Administrator\n`;
        const blob = new Blob([content], { type: 'application/x-rdp' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${service.name}.rdp`;
        a.click();
    };

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <h1 className="page-title">
                <Monitor style={{ marginRight: '0.75rem', color: '#10b981' }} />
                Remote Desktop Launcher
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {services.filter(s => s.has_rdp || s.check_type === 'tcp').map(s => ( /* broad filter */
                    <Card key={s.id}>
                        <h3>{s.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.ip}</p>
                        <button
                            className="btn primary"
                            style={{ marginTop: '1rem', width: '100%' }}
                            onClick={() => generateRDP(s)}
                        >
                            <Download size={14} style={{ marginRight: '8px' }} />
                            Download .rdp
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                            <a href={`rdp://${s.ip}`} style={{ color: 'var(--primary)' }}>Try Protocol Handler</a>
                        </div>
                    </Card>
                ))}
            </div>

            {services.length === 0 && <p>No services found.</p>}
        </div>
    );
};

export default RDP;
