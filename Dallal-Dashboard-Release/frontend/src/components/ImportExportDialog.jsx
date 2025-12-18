import React, { useState } from 'react';
import { Download, Upload, X, FileJson, FileText, AlertCircle } from 'lucide-react';
import { exportServicesToJSON, exportServicesToCSV, downloadFile, parseImportedJSON, parseImportedCSV } from '../utils/exportImport';

/**
 * Import/Export Dialog for Services
 */
const ImportExportDialog = ({ services, onImport, onClose }) => {
    const [activeTab, setActiveTab] = useState('export');
    const [importFile, setImportFile] = useState(null);
    const [importError, setImportError] = useState('');
    const [importPreview, setImportPreview] = useState([]);

    const handleExport = (format) => {
        const timestamp = new Date().toISOString().split('T')[0];

        if (format === 'json') {
            const content = exportServicesToJSON(services);
            downloadFile(content, `services-${timestamp}.json`, 'application/json');
        } else if (format === 'csv') {
            const content = exportServicesToCSV(services);
            downloadFile(content, `services-${timestamp}.csv`, 'text/csv');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportFile(file);
        setImportError('');
        setImportPreview([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                let parsedServices = [];

                if (file.name.endsWith('.json')) {
                    parsedServices = parseImportedJSON(content);
                } else if (file.name.endsWith('.csv')) {
                    parsedServices = parseImportedCSV(content);
                } else {
                    throw new Error('Unsupported file format. Please use .json or .csv');
                }

                setImportPreview(parsedServices);
            } catch (error) {
                setImportError(error.message);
            }
        };

        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        if (importPreview.length > 0) {
            onImport(importPreview);
            onClose();
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div
                className="import-export-dialog"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Import / Export Services</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('export')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'export' ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === 'export' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'export' ? 600 : 400,
                        }}
                    >
                        <Download size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Export
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'import' ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === 'import' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'import' ? 600 : 400,
                        }}
                    >
                        <Upload size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Import
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {activeTab === 'export' ? (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Export {services.length} services to a file for backup or migration.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={() => handleExport('json')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                                >
                                    <FileJson size={32} color="var(--accent)" />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Export as JSON</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Best for re-importing into Dallal Dashboard
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExport('csv')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                                >
                                    <FileText size={32} color="var(--accent)" />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Export as CSV</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            For use in Excel, Google Sheets, or other tools
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Import services from a JSON or CSV file. This will add new services (not replace existing ones).
                            </p>

                            <input
                                type="file"
                                accept=".json,.csv"
                                onChange={handleFileChange}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '1rem',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                }}
                            />

                            {importError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #ef4444',
                                    borderRadius: '0.5rem',
                                    color: '#ef4444',
                                    marginBottom: '1rem',
                                }}>
                                    <AlertCircle size={20} />
                                    {importError}
                                </div>
                            )}

                            {importPreview.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: '0.75rem' }}>Preview ({importPreview.length} services)</h4>
                                    <div style={{
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        background: 'var(--bg-primary)',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        marginBottom: '1rem',
                                    }}>
                                        {importPreview.slice(0, 10).map((service, idx) => (
                                            <div key={idx} style={{
                                                padding: '0.5rem 0',
                                                borderBottom: idx < 9 ? '1px solid var(--glass-border)' : 'none',
                                            }}>
                                                <strong>{service.name}</strong> - {service.ip}
                                            </div>
                                        ))}
                                        {importPreview.length > 10 && (
                                            <div style={{ paddingTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                ...and {importPreview.length - 10} more
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleConfirmImport}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--accent)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Import {importPreview.length} Services
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportExportDialog;
