/**
 * Settings Backup/Restore Utilities
 */

/**
 * Export all settings to JSON
 * @param {Object} settings - Settings object
 * @returns {string} JSON string
 */
export const exportSettings = (settings) => {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings: {
            theme: settings.theme,
            accentColor: settings.accentColor,
            language: settings.language,
            preferences: settings.preferences,
        }
    };

    return JSON.stringify(exportData, null, 2);
};

/**
 * Parse imported settings
 * @param {string} jsonString - JSON string
 * @returns {Object} Settings object
 */
export const parseImportedSettings = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.settings) {
            throw new Error('Invalid settings file format');
        }
        return data.settings;
    } catch (error) {
        throw new Error(`Failed to parse settings: ${error.message}`);
    }
};

/**
 * Download settings file
 * @param {Object} settings - Settings to export
 */
export const downloadSettings = (settings) => {
    const content = exportSettings(settings);
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dallal-settings-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
