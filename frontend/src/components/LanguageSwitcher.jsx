import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    // Only show languages with complete translations
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' }
        // Other languages will be added as translations are completed
        // { code: 'fr', name: 'Français' },
        // { code: 'de', name: 'Deutsch' },
        // { code: 'zh', name: '中文' },
        // { code: 'ru', name: 'Русский' },
        // { code: 'pt', name: 'Português' },
        // { code: 'ar', name: 'العربية' },
        // { code: 'ja', name: '日本語' },
        // { code: 'ko', name: '한국어' },
        // { code: 'hi', name: 'हिन्दी' },
        // { code: 'it', name: 'Italiano' }
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s'
        }}>
            <Globe size={20} style={{ flexShrink: 0 }} />
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '500'
                }}
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;
