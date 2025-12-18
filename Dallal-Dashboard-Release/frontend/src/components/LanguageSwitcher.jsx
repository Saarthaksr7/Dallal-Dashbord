import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LanguageSwitcher = ({ isCollapsed }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Complete list of all 6 supported languages (in order: Hindi, English, Russian, French, Dutch, Korean)
    const languages = [
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
    ];

    // Get current language details
    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    // Collapsed view - just show globe icon
    if (isCollapsed) {
        return (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lang-switcher-trigger-collapsed"
                    aria-label="Language switcher"
                    title={currentLanguage.nativeName}
                >
                    <Globe size={20} />
                </button>

                {isOpen && (
                    <div className="lang-dropdown collapsed-dropdown">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`lang-option ${lang.code === i18n.language ? 'active' : ''}`}
                                title={lang.nativeName}
                            >
                                <span className="lang-flag">{lang.flag}</span>
                                <span className="lang-native">{lang.nativeName}</span>
                                {lang.code === i18n.language && <Check size={16} className="check-icon" />}
                            </button>
                        ))}
                    </div>
                )}

                <style>{collapsedStyles}</style>
            </div>
        );
    }

    // Expanded view
    return (
        <div ref={dropdownRef} className="lang-switcher-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lang-switcher-trigger"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe size={18} className="globe-icon" />
                <span className="lang-current">
                    <span className="lang-flag">{currentLanguage.flag}</span>
                    <span className="lang-name">{currentLanguage.nativeName}</span>
                </span>
                <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="lang-dropdown">
                    <div className="lang-dropdown-header">Select Language</div>
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`lang-option ${lang.code === i18n.language ? 'active' : ''}`}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-info">
                                <span className="lang-native">{lang.nativeName}</span>
                                <span className="lang-english">{lang.name}</span>
                            </span>
                            {lang.code === i18n.language && <Check size={16} className="check-icon" />}
                        </button>
                    ))}
                </div>
            )}

            <style>{styles}</style>
        </div>
    );
};

// Styles for expanded view
const styles = `
    .lang-switcher-container {
        position: relative;
        width: 100%;
    }

    .lang-switcher-trigger {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 0.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
    }

    .lang-switcher-trigger:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(59, 130, 246, 0.3);
        color: var(--text-primary);
    }

    .globe-icon {
        flex-shrink: 0;
        color: var(--accent);
    }

    .lang-current {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        font-weight: 500;
    }

    .lang-flag {
        font-size: 1.25rem;
        line-height: 1;
    }

    .chevron-icon {
        flex-shrink: 0;
        transition: transform 0.2s ease;
        opacity: 0.6;
    }

    .chevron-icon.open {
        transform: rotate(180deg);
    }

    .lang-dropdown {
        position: absolute;
        bottom: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 0.75rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .lang-dropdown-header {
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--glass-border);
    }

    .lang-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        font-size: 0.9rem;
    }

    .lang-option:hover {
        background: rgba(59, 130, 246, 0.1);
        color: var(--text-primary);
    }

    .lang-option.active {
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent);
        font-weight: 500;
    }

    .lang-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        flex: 1;
    }

    .lang-native {
        font-weight: 500;
        color: currentColor;
    }

    .lang-english {
        font-size: 0.75rem;
        opacity: 0.7;
    }

    .check-icon {
        flex-shrink: 0;
        color: var(--accent);
    }

    /* Scrollbar styling */
    .lang-dropdown::-webkit-scrollbar {
        width: 6px;
    }

    .lang-dropdown::-webkit-scrollbar-track {
        background: transparent;
    }

    .lang-dropdown::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }

    .lang-dropdown::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

// Styles for collapsed view
const collapsedStyles = `
    .lang-switcher-trigger-collapsed {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 0.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .lang-switcher-trigger-collapsed:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(59, 130, 246, 0.3);
        color: var(--accent);
    }

    .collapsed-dropdown {
        position: absolute;
        bottom: calc(100% + 0.5rem);
        left: 0;
        width: 200px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 0.75rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        animation: slideUp 0.2s ease;
    }

    .collapsed-dropdown .lang-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
    }

    .collapsed-dropdown .lang-option:hover {
        background: rgba(59, 130, 246, 0.1);
        color: var(--text-primary);
    }

    .collapsed-dropdown .lang-option.active {
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent);
        font-weight: 500;
    }

    .collapsed-dropdown .lang-native {
        flex: 1;
        font-weight: 500;
    }

    .collapsed-dropdown .check-icon {
        flex-shrink: 0;
        color: var(--accent);
    }
`;

export default LanguageSwitcher;
