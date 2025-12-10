import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { X, Globe, Activity, Maximize2 } from 'lucide-react';
import { useOpsCenterStore } from '../../store/opsCenter';

const AppWizard = ({ app, isOpen, onClose }) => {
    const [, setLocation] = useLocation();
    const { addConfiguredApp } = useOpsCenterStore();

    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        hostname: `${app?.id || 'app'}.local`,
        protocol: (app?.webUiPort === 443 || app?.webUiPort === 8443) ? 'https' : 'http',
        webUiPort: app?.webUiPort || 80,
        extraPorts: app?.extraPorts?.join(', ') || '',
        defaultSize: app?.defaultSize || 'half',
        scale: app?.scale || 0.85
    });

    if (!isOpen || !app) return null;

    const handleInputChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const buildURL = () => {
        const port = (config.webUiPort && config.webUiPort !== 80 && config.webUiPort !== 443)
            ? `:${config.webUiPort}`
            : '';
        return `${config.protocol}://${config.hostname}${port}`;
    };

    const handleSubmit = () => {
        const finalConfig = {
            appId: app.id,
            name: app.name,
            url: buildURL(),
            webUiPort: config.webUiPort,
            extraPorts: config.extraPorts.split(',').map(p => p.trim()).filter(Boolean),
            size: config.defaultSize,
            scale: parseFloat(config.scale),
            expanded: true,
            color: app.color,
            category: app.category
        };

        addConfiguredApp(finalConfig);
        onClose();
        setLocation('/topology');
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <h3>Connection Settings</h3>
                        <div className="form-group">
                            <label>Protocol</label>
                            <select
                                value={config.protocol}
                                onChange={(e) => handleInputChange('protocol', e.target.value)}
                            >
                                <option value="http">HTTP</option>
                                <option value="https">HTTPS</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Hostname / IP Address</label>
                            <input
                                type="text"
                                value={config.hostname}
                                onChange={(e) => handleInputChange('hostname', e.target.value)}
                                placeholder="example.local or 192.168.1.100"
                            />
                        </div>

                        <div className="form-group">
                            <label>Web UI Port</label>
                            <input
                                type="number"
                                value={config.webUiPort}
                                onChange={(e) => handleInputChange('webUiPort', e.target.value)}
                                placeholder="8080"
                            />
                            <small>Default port for {app.name}</small>
                        </div>

                        <div className="form-group">
                            <label>Extra Ports (comma-separated)</label>
                            <input
                                type="text"
                                value={config.extraPorts}
                                onChange={(e) => handleInputChange('extraPorts', e.target.value)}
                                placeholder="22, 443, 5000"
                            />
                            <small>Additional ports used by this application</small>
                        </div>

                        <div className="url-preview">
                            <Globe size={16} />
                            <span>URL: <strong>{buildURL()}</strong></span>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="wizard-step">
                        <h3>Display Options</h3>

                        <div className="form-group">
                            <label>Default Size</label>
                            <select
                                value={config.defaultSize}
                                onChange={(e) => handleInputChange('defaultSize', e.target.value)}
                            >
                                <option value="third">1/3 Width</option>
                                <option value="half">1/2 Width</option>
                                <option value="full">Full Width</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>CSS Scale ({config.scale}x)</label>
                            <input
                                type="range"
                                min="0.5"
                                max="1.0"
                                step="0.05"
                                value={config.scale}
                                onChange={(e) => handleInputChange('scale', e.target.value)}
                            />
                            <small>Zoom level for iframe content (lower = more content visible)</small>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="wizard-step">
                        <h3>Review & Confirm</h3>

                        <div className="review-section">
                            <div className="review-item">
                                <label>Application</label>
                                <span>{app.name}</span>
                            </div>
                            <div className="review-item">
                                <label>URL</label>
                                <span>{buildURL()}</span>
                            </div>
                            <div className="review-item">
                                <label>Category</label>
                                <span>{app.category}</span>
                            </div>
                            <div className="review-item">
                                <label>Size</label>
                                <span>{config.defaultSize}</span>
                            </div>
                            <div className="review-item">
                                <label>Scale</label>
                                <span>{config.scale}x</span>
                            </div>
                            {config.extraPorts && (
                                <div className="review-item">
                                    <label>Extra Ports</label>
                                    <span>{config.extraPorts}</span>
                                </div>
                            )}
                        </div>

                        <div className="info-box">
                            <Activity size={16} />
                            <span>This app will be added to the <strong>{app.category}</strong> tab in Ops Center</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <div className="wizard-overlay" onClick={onClose} />
            <div className="app-wizard">
                <div className="wizard-header">
                    <div>
                        <h2>Configure {app.name}</h2>
                        <p>Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="wizard-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                    <div className="progress-steps">
                        <span className={step >= 1 ? 'active' : ''}>Connection</span>
                        <span className={step >= 2 ? 'active' : ''}>Display</span>
                        <span className={step >= 3 ? 'active' : ''}>Review</span>
                    </div>
                </div>

                <div className="wizard-content">
                    {renderStep()}
                </div>

                <div className="wizard-footer">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="btn-secondary">
                            Back
                        </button>
                    )}
                    <div className="spacer" />
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} className="btn-primary">
                            Next
                        </button>
                    ) : (
                        <button onClick={handleSubmit} className="btn-primary">
                            <Maximize2 size={16} />
                            Add to Ops Center
                        </button>
                    )}
                </div>

                <style>{`
                    .wizard-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.7);
                        z-index: 999;
                        backdrop-filter: blur(4px);
                    }

                    .app-wizard {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 90%;
                        max-width: 600px;
                        max-height: 85vh;
                        background: var(--bg-card);
                        border-radius: 12px;
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }

                    .wizard-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--border);
                    }

                    .wizard-header h2 {
                        margin: 0;
                        font-size: 1.5rem;
                        font-weight: 600;
                    }

                    .wizard-header p {
                        margin: 0.25rem 0 0 0;
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        cursor: pointer;
                        padding: 0.25rem;
                        border-radius: 4px;
                    }

                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .wizard-progress {
                        padding: 1rem 1.5rem;
                        border-bottom: 1px solid var(--border);
                    }

                    .progress-bar {
                        height: 4px;
                        background: var(--bg-secondary);
                        border-radius: 2px;
                        overflow: hidden;
                        margin-bottom: 0.75rem;
                    }

                    .progress-fill {
                        height: 100%;
                        background: var(--accent);
                        transition: width 0.3s ease;
                    }

                    .progress-steps {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.85rem;
                    }

                    .progress-steps span {
                        color: var(--text-secondary);
                    }

                    .progress-steps span.active {
                        color: var(--accent);
                        font-weight: 600;
                    }

                    .wizard-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1.5rem;
                    }

                    .wizard-step h3 {
                        margin: 0 0 1.5rem 0;
                        font-size: 1.1rem;
                    }

                    .form-group {
                        margin-bottom: 1.5rem;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        font-weight: 500;
                        font-size: 0.9rem;
                    }

                    .form-group input,
                    .form-group select {
                        width: 100%;
                        padding: 0.75rem;
                        background: var(--bg-secondary);
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        color: var(--text-primary);
                        font-size: 0.95rem;
                    }

                    .form-group input[type="range"] {
                        padding: 0;
                    }

                    .form-group small {
                        display: block;
                        margin-top: 0.5rem;
                        color: var(--text-secondary);
                        font-size: 0.85rem;
                    }

                    .url-preview {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 1rem;
                        background: rgba(59, 130, 246, 0.1);
                        border: 1px solid rgba(59, 130, 246, 0.3);
                        border-radius: 6px;
                        margin-top: 1.5rem;
                    }

                    .url-preview strong {
                        color: var(--accent);
                    }

                    .review-section {
                        background: var(--bg-secondary);
                        border-radius: 8px;
                        padding: 1rem;
                        margin-bottom: 1.5rem;
                    }

                    .review-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid var(--border);
                    }

                    .review-item:last-child {
                        border-bottom: none;
                    }

                    .review-item label {
                        color: var(--text-secondary);
                        font-weight: 500;
                    }

                    .review-item span {
                        color: var(--text-primary);
                    }

                    .info-box {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 1rem;
                        background: rgba(34, 197, 94, 0.1);
                        border: 1px solid rgba(34, 197, 94, 0.3);
                        border-radius: 6px;
                    }

                    .wizard-footer {
                        display: flex;
                        gap: 0.75rem;
                        padding: 1.5rem;
                        border-top: 1px solid var(--border);
                    }

                    .spacer {
                        flex: 1;
                    }

                    .btn-primary,
                    .btn-secondary {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem 1.5rem;
                        border: none;
                        border-radius: 6px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .btn-primary {
                        background: var(--accent);
                        color: white;
                    }

                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    }

                    .btn-secondary {
                        background: var(--bg-secondary);
                        color: var(--text-primary);
                        border: 1px solid var(--border);
                    }

                    .btn-secondary:hover {
                        background: rgba(255, 255, 255, 0.05);
                    }

                    @media (max-width: 768px) {
                        .app-wizard {
                            width: 95%;
                            max-height: 90vh;
                        }

                        .wizard-header,
                        .wizard-content,
                        .wizard-footer {
                            padding: 1rem;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default AppWizard;
