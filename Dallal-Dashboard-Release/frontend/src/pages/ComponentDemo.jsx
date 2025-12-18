import React, { useState } from 'react';
import OnboardingTour from '../components/OnboardingTour';
import TagManager from '../components/TagManager';
import ProgressIndicator from '../components/ui/ProgressIndicator';
import Tooltip from '../components/ui/Tooltip';
import { Play, Settings, Tag, Loader, Info } from 'lucide-react';
import { resetOnboarding } from '../components/OnboardingTour';
import { useTagStore } from '../store/tags';

/**
 * ComponentDemo Page
 * Demonstrates all new Phase 3 components
 */
const ComponentDemo = () => {
    const [showTour, setShowTour] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [linearProgress, setLinearProgress] = useState(0);
    const [circularProgress, setCircularProgress] = useState(0);
    const [showIndeterminate, setShowIndeterminate] = useState(false);

    const { tags, setTags } = useTagStore();

    const handleStartTour = () => {
        resetOnboarding();
        setShowTour(true);
    };

    const handleSaveTags = (updatedTags) => {
        setTags(updatedTags);
    };

    const simulateProgress = () => {
        setLinearProgress(0);
        setCircularProgress(0);
        const interval = setInterval(() => {
            setLinearProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
            setCircularProgress(prev => {
                if (prev >= 100) {
                    return 100;
                }
                return prev + 5;
            });
        }, 200);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Phase 3 Component Demos</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Interactive demonstrations of newly implemented UX components
                </p>
            </div>

            {/* OnboardingTour Demo */}
            <section style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Play size={24} color="var(--accent)" />
                    <h2 style={{ margin: 0 }}>OnboardingTour Component</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Interactive guided tour with role-based customization, spotlight highlighting, and keyboard navigation.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Tooltip content="Starts the tour as a regular user">
                        <button
                            className="btn btn-primary add-service-btn"
                            onClick={handleStartTour}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            aria-label="Start onboarding tour"
                        >
                            <Play size={18} />
                            Start Tour (User Role)
                        </button>
                    </Tooltip>

                    <Tooltip content="Starts the tour with admin-specific steps">
                        <button
                            className="btn"
                            onClick={handleStartTour}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--border)',
                            }}
                            aria-label="Start admin tour"
                        >
                            <Settings size={18} />
                            Start Tour (Admin Role)
                        </button>
                    </Tooltip>
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                }}>
                    <strong style={{ color: 'var(--accent)' }}>Features:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li>Auto-starts on first visit (localStorage-based)</li>
                        <li>Keyboard navigation (←/→ arrows, Enter, Esc)</li>
                        <li>Spotlight highlighting on target elements</li>
                        <li>Auto-navigation between routes</li>
                        <li>Skippable with confirmation</li>
                    </ul>
                </div>
            </section>

            {/* TagManager Demo */}
            <section style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Tag size={24} color="var(--accent)" />
                    <h2 style={{ margin: 0 }}>TagManager Component</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Full-featured tag management with customizable colors and persistent storage.
                </p>

                <Tooltip content="Open the tag management interface">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowTagManager(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        aria-label="Open tag manager"
                    >
                        <Tag size={18} />
                        Open Tag Manager
                    </button>
                </Tooltip>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                }}>
                    <strong style={{ color: 'var(--accent)' }}>Current Tags ({tags.length}):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {tags.length === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                No tags yet. Click &quot;Open Tag Manager&quot; to create some!
                            </span>
                        ) : (
                            tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        background: tag.color,
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {tag.name}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                }}>
                    <strong style={{ color: 'var(--accent)' }}>Features:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li>Create, edit, delete tags</li>
                        <li>10 preset colors + custom color picker</li>
                        <li>Persistent storage via Zustand</li>
                        <li>Delete confirmation for safety</li>
                        <li>Accessible modal interface</li>
                    </ul>
                </div>
            </section>

            {/* ProgressIndicator Demo */}
            <section style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Loader size={24} color="var(--accent)" />
                    <h2 style={{ margin: 0 }}>ProgressIndicator Component</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Versatile progress indicators with linear and circular variants.
                </p>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Linear Progress (Deterministic)</h3>
                    <ProgressIndicator
                        value={linearProgress}
                        max={100}
                        label="Importing services..."
                        variant="linear"
                    />
                    <div style={{ marginTop: '1rem' }}>
                        <Tooltip content="Simulates a progress animation from 0-100%">
                            <button
                                className="btn"
                                onClick={simulateProgress}
                                style={{
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--border)',
                                }}
                                aria-label="Simulate progress"
                            >
                                Simulate Progress
                            </button>
                        </Tooltip>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Circular Progress (Deterministic)</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                        <ProgressIndicator
                            value={circularProgress}
                            max={100}
                            label="Processing..."
                            variant="circular"
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Indeterminate Progress</h3>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <ProgressIndicator
                                indeterminate={showIndeterminate}
                                label={showIndeterminate ? "Loading..." : "Click to start"}
                                variant="linear"
                            />
                        </div>
                        <Tooltip content="Toggle indeterminate loading animation">
                            <button
                                className="btn"
                                onClick={() => setShowIndeterminate(!showIndeterminate)}
                                style={{
                                    background: showIndeterminate ? 'var(--accent)' : 'var(--glass-bg)',
                                    border: '1px solid var(--border)',
                                    color: showIndeterminate ? 'white' : 'var(--text-primary)',
                                }}
                                aria-label="Toggle indeterminate progress"
                            >
                                {showIndeterminate ? 'Stop' : 'Start'}
                            </button>
                        </Tooltip>
                    </div>
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                }}>
                    <strong style={{ color: 'var(--accent)' }}>Features:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li>Linear and circular variants</li>
                        <li>Deterministic (percentage) mode</li>
                        <li>Indeterminate (loading) mode</li>
                        <li>Accessible with ARIA attributes</li>
                        <li>Smooth CSS animations</li>
                    </ul>
                </div>
            </section>

            {/* Tooltip Demo */}
            <section style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Info size={24} color="var(--accent)" />
                    <h2 style={{ margin: 0 }}>Tooltip Component (Already Exists)</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Context-sensitive help tooltips throughout the application.
                </p>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <Tooltip content="This appears on top!" position="top">
                        <button className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}>
                            Hover Me (Top)
                        </button>
                    </Tooltip>

                    <Tooltip content="This appears on the right!" position="right">
                        <button className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}>
                            Hover Me (Right)
                        </button>
                    </Tooltip>

                    <Tooltip content="This appears on the bottom!" position="bottom">
                        <button className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}>
                            Hover Me (Bottom)
                        </button>
                    </Tooltip>

                    <Tooltip content="This appears on the left!" position="left">
                        <button className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}>
                            Hover Me (Left)
                        </button>
                    </Tooltip>
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                }}>
                    <strong style={{ color: 'var(--accent)' }}>Features:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li>Four positioning options (top, right, bottom, left)</li>
                        <li>Hover and focus triggers</li>
                        <li>Touch-friendly (tap to show)</li>
                        <li>Accessible with aria-describedby</li>
                        <li>Auto-hide on Escape key</li>
                    </ul>
                </div>
            </section>

            {/* Render Components */}
            <OnboardingTour
                isOpen={showTour}
                onClose={() => setShowTour(false)}
                userRole="user"
            />

            <TagManager
                isOpen={showTagManager}
                onClose={() => setShowTagManager(false)}
                tags={tags}
                onSave={handleSaveTags}
            />
        </div>
    );
};

export default ComponentDemo;
