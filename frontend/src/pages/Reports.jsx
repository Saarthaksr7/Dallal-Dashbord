import React, { useState } from 'react';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import { Download, FileText, Activity } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const Reports = () => {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);

    if (user?.role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You must be an administrator to access reports.</p>
            </div>
        );
    }

    const downloadReport = async (type, format) => {
        setLoading(true);
        try {
            const response = await api.get(`/reports/${type}`, {
                params: { format },
                responseType: 'blob'
            });

            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename (or fallback)
            const contentDisposition = response.headers['content-disposition'];
            let filename = `${type}_report.${format}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Audit & Reporting</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Services Report */}
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
                            <FileText size={32} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Services Inventory</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Full list of services, status, and metadata.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => downloadReport('services', 'csv')}
                            disabled={loading}
                        >
                            <Download size={16} /> CSV
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => downloadReport('services', 'json')}
                            disabled={loading}
                        >
                            <Download size={16} /> JSON
                        </button>
                    </div>
                </Card>

                {/* Audit Logs Report */}
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                            <Activity size={32} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Audit Logs</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Recent administrative actions and events.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => downloadReport('audit', 'csv')}
                            disabled={loading}
                        >
                            <Download size={16} /> CSV
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => downloadReport('audit', 'json')}
                            disabled={loading}
                        >
                            <Download size={16} /> JSON
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
