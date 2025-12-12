import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * OnboardingTour Component
 * Interactive tour system that guides new users through the dashboard
 * Supports role-based customization and saves completion state
 */
const OnboardingTour = ({ isOpen, onClose, userRole = 'user' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [location, setLocation] = useLocation();
    const [highlightedElement, setHighlightedElement] = useState(null);

    // Define tour steps based on user role
    const getTourSteps = useCallback(() => {
        const commonSteps = [
            {
                title: 'Welcome to Dallal Dashboard! 👋',
                content: 'Let\'s take a quick tour to help you get started with managing your services and infrastructure.',
                target: null,
                route: '/dashboard',
                position: 'center',
            },
            {
                title: 'Dashboard Overview',
                content: 'This is your command center. Here you can see an overview of all your services, their status, and key metrics at a glance.',
                target: '.dashboard-grid',
                route: '/dashboard',
                position: 'bottom',
            },
            {
                title: 'Services Page',
                content: 'The Services page is where you manage all your services. You can add, edit, monitor, and control services from here.',
                target: '[href="/services"]',
                route: '/services',
                position: 'right',
            },
            {
                title: 'Add Your First Service',
                content: 'Click the "+ Service" button to add a new service. The wizard will guide you through the process.',
                target: '.add-service-btn',
                route: '/services',
                position: 'bottom',
            },
            {
                title: 'Search and Filter',
                content: 'Use the search bar to quickly find services. You can also filter by status, tags, and other criteria.',
                target: '.search-input',
                route: '/services',
                position: 'bottom',
            },
            {
                title: 'Settings & Customization',
                content: 'Personalize your experience in Settings. Change themes, configure alerts, manage API keys, and more.',
                target: '[href="/settings"]',
                route: '/settings',
                position: 'right',
            },
            {
                title: 'Keyboard Shortcuts',
                content: 'Power users love shortcuts! Press "?" anytime to see available keyboard shortcuts.',
                target: null,
                route: null,
                position: 'center',
            },
            {
                title: 'You\'re All Set! 🎉',
                content: 'You can restart this tour anytime from Settings. Happy monitoring!',
                target: null,
                route: null,
                position: 'center',
            },
        ];

        const adminSteps = [
            ...commonSteps.slice(0, 6),
            {
                title: 'Admin Features',
                content: 'As an admin, you have access to advanced features like user management, audit logs, and system configuration.',
                target: '[href="/admin"]',
                route: '/admin',
                position: 'right',
            },
            ...commonSteps.slice(6),
        ];

        return userRole === 'admin' ? adminSteps : commonSteps;
    }, [userRole]);

    const steps = getTourSteps();
    const totalSteps = steps.length;
    const currentStepData = steps[currentStep];

    // Handle step navigation
    const goToNextStep = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    }, [currentStep, totalSteps]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const skipTour = useCallback(() => {
        if (window.confirm('Are you sure you want to skip the tour? You can restart it anytime from Settings.')) {
            completeTour();
        }
    }, []);

    const completeTour = useCallback(() => {
        localStorage.setItem('dallal_onboarding_completed', 'true');
        localStorage.setItem('dallal_onboarding_completed_at', new Date().toISOString());
        onClose();
    }, [onClose]);

    // Navigate to step route if needed
    useEffect(() => {
        if (isOpen && currentStepData?.route && location !== currentStepData.route) {
            setLocation(currentStepData.route);
        }
    }, [currentStep, currentStepData, isOpen, location, setLocation]);

    // Highlight target element
    useEffect(() => {
        if (isOpen && currentStepData?.target) {
            // Wait for route navigation to complete
            const timer = setTimeout(() => {
                const element = document.querySelector(currentStepData.target);
                setHighlightedElement(element);

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setHighlightedElement(null);
        }
    }, [currentStep, currentStepData, isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                goToNextStep();
            } else if (e.key === 'ArrowLeft') {
                goToPreviousStep();
            } else if (e.key === 'Escape') {
                skipTour();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, goToNextStep, goToPreviousStep, skipTour]);

    if (!isOpen) return null;

    // Calculate tooltip position
    const getTooltipStyle = () => {
        if (!highlightedElement || currentStepData.position === 'center') {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const rect = highlightedElement.getBoundingClientRect();
        const tooltipWidth = 400;
        const tooltipHeight = 200;
        const gap = 20;

        let style = { position: 'fixed' };

        switch (currentStepData.position) {
            case 'bottom':
                style.top = `${rect.bottom + gap}px`;
                style.left = `${rect.left + rect.width / 2}px`;
                style.transform = 'translateX(-50%)';
                break;
            case 'top':
                style.bottom = `${window.innerHeight - rect.top + gap}px`;
                style.left = `${rect.left + rect.width / 2}px`;
                style.transform = 'translateX(-50%)';
                break;
            case 'right':
                style.top = `${rect.top + rect.height / 2}px`;
                style.left = `${rect.right + gap}px`;
                style.transform = 'translateY(-50%)';
                break;
            case 'left':
                style.top = `${rect.top + rect.height / 2}px`;
                style.right = `${window.innerWidth - rect.left + gap}px`;
                style.transform = 'translateY(-50%)';
                break;
            default:
                style.top = '50%';
                style.left = '50%';
                style.transform = 'translate(-50%, -50%)';
        }

        return style;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="onboarding-overlay"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9998,
                    transition: 'all 0.3s ease',
                }}
                onClick={skipTour}
            />

            {/* Spotlight on highlighted element */}
            {highlightedElement && (
                <div
                    className="onboarding-spotlight"
                    style={{
                        position: 'fixed',
                        top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
                        left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
                        width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
                        height: `${highlightedElement.getBoundingClientRect().height + 16}px`,
                        border: '3px solid var(--accent)',
                        borderRadius: '8px',
                        boxShadow: '0 0 0 4px rgba(var(--accent-rgb), 0.2), 0 0 20px rgba(var(--accent-rgb), 0.4)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease',
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className="onboarding-tooltip"
                style={{
                    ...getTooltipStyle(),
                    zIndex: 10000,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    maxWidth: '400px',
                    width: '90vw',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                }}
                role="dialog"
                aria-labelledby="tour-title"
                aria-describedby="tour-content"
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 id="tour-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        {currentStepData.title}
                    </h3>
                    <button
                        onClick={skipTour}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                        }}
                        aria-label="Skip tour"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <p id="tour-content" style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    {currentStepData.content}
                </p>

                {/* Progress */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    flex: 1,
                                    height: '4px',
                                    background: idx <= currentStep ? 'var(--accent)' : 'var(--glass-border)',
                                    borderRadius: '2px',
                                    transition: 'background 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Step {currentStep + 1} of {totalSteps}
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                    <button
                        onClick={goToPreviousStep}
                        disabled={currentStep === 0}
                        style={{
                            padding: '0.625rem 1rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                            opacity: currentStep === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500,
                        }}
                        aria-label="Previous step"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>

                    <button
                        onClick={goToNextStep}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                        }}
                        aria-label={currentStep === totalSteps - 1 ? 'Finish tour' : 'Next step'}
                    >
                        {currentStep === totalSteps - 1 ? (
                            <>
                                Finish <Check size={18} />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </div>

                {/* Skip link */}
                {currentStep < totalSteps - 1 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            onClick={skipTour}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                textDecoration: 'underline',
                            }}
                        >
                            Skip tour
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

// Helper function to check if tour should be shown
export const shouldShowOnboarding = () => {
    return !localStorage.getItem('dallal_onboarding_completed');
};

// Helper function to reset tour
export const resetOnboarding = () => {
    localStorage.removeItem('dallal_onboarding_completed');
    localStorage.removeItem('dallal_onboarding_completed_at');
};

export default OnboardingTour;
