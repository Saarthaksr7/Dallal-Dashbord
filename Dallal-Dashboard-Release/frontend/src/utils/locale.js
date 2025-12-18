/**
 * Locale Utilities - Production-ready internationalization helpers
 * Provides locale-aware formatting for dates, numbers, and currency
 */

/**
 * Format date according to locale
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale code (e.g., 'en', 'es', 'fr')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en', options = {}) => {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return String(date);
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };

        return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    } catch (error) {
        console.error('Date formatting error:', error);
        return String(date);
    }
};

/**
 * Format date and time according to locale
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale code
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date, locale = 'en', options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };

    return formatDate(date, locale, defaultOptions);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale code
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, locale = 'en') => {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return String(date);
        }

        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        if (diffSec < 60) {
            return rtf.format(-diffSec, 'second');
        } else if (diffMin < 60) {
            return rtf.format(-diffMin, 'minute');
        } else if (diffHour < 24) {
            return rtf.format(-diffHour, 'hour');
        } else if (diffDay < 30) {
            return rtf.format(-diffDay, 'day');
        } else {
            return formatDate(dateObj, locale);
        }
    } catch (error) {
        console.error('Relative time formatting error:', error);
        return String(date);
    }
};

/**
 * Format number according to locale
 * @param {number} number - Number to format
 * @param {string} locale - Locale code
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, locale = 'en', options = {}) => {
    try {
        if (typeof number !== 'number' || isNaN(number)) {
            return String(number);
        }

        return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
        console.error('Number formatting error:', error);
        return String(number);
    }
};

/**
 * Format currency according to locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - Locale code
 * @param {object} options - Additional options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en', options = {}) => {
    const defaultOptions = {
        style: 'currency',
        currency: currency,
        ...options
    };

    return formatNumber(amount, locale, defaultOptions);
};

/**
 * Format percentage according to locale
 * @param {number} value - Value to format (0.5 = 50%)
 * @param {string} locale - Locale code
 * @param {object} options - Additional options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, locale = 'en', options = {}) => {
    const defaultOptions = {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
    };

    return formatNumber(value, locale, defaultOptions);
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @param {string} locale - Locale code
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes, locale = 'en', decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = bytes / Math.pow(k, i);
    const formattedValue = formatNumber(value, locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return `${formattedValue} ${sizes[i]}`;
};

/**
 * Format duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @param {string} locale - Locale code
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds, locale = 'en') => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];

    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
        parts.push(`${secs}s`);
    }

    return parts.join(' ');
};

/**
 * Get language direction (LTR or RTL)
 * @param {string} locale - Locale code
 * @returns {string} 'rtl' or 'ltr'
 */
export const getLanguageDirection = (locale) => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const lang = locale.split('-')[0].toLowerCase();
    return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

/**
 * Get native language name
 * @param {string} locale - Locale code
 * @returns {string} Native language name
 */
export const getNativeLanguageName = (locale) => {
    const languageNames = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'zh': '中文',
        'ru': 'Русский',
        'pt': 'Português',
        'ar': 'العربية',
        'ja': '日本語',
        'ko': '한국어',
        'hi': 'हिन्दी',
        'it': 'Italiano'
    };

    return languageNames[locale] || locale;
};

/**
 * Apply locale to document
 * @param {string} locale - Locale code
 */
export const applyLocaleToDocument = (locale) => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getLanguageDirection(locale);
};

export default {
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatFileSize,
    formatDuration,
    getLanguageDirection,
    getNativeLanguageName,
    applyLocaleToDocument
};
