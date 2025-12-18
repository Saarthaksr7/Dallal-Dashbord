/**
 * Export/Import utilities for services
 */

/**
 * Export services to JSON
 * @param {Array} services - Array of service objects
 * @returns {string} JSON string
 */
export const exportServicesToJSON = (services) => {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        services: services.map(service => ({
            name: service.name,
            ip: service.ip,
            port: service.port,
            vendor: service.vendor,
            group: service.group,
            tags: service.tags,
            mac_address: service.mac_address,
            maintenance: service.maintenance,
            monitored: service.monitored,
            description: service.description || '',
        }))
    };

    return JSON.stringify(exportData, null, 2);
};

/**
 * Export services to CSV
 * @param {Array} services - Array of service objects
 * @returns {string} CSV string
 */
export const exportServicesToCSV = (services) => {
    const headers = ['Name', 'IP', 'Port', 'Vendor', 'Group', 'Tags', 'MAC Address', 'Maintenance', 'Monitored', 'Description'];
    const rows = services.map(service => [
        service.name,
        service.ip,
        service.port || '',
        service.vendor || '',
        service.group || '',
        service.tags || '',
        service.mac_address || '',
        service.maintenance ? 'Yes' : 'No',
        service.monitored ? 'Yes' : 'No',
        service.description || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'application/json') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Parse imported JSON
 * @param {string} jsonString - JSON string
 * @returns {Array} Array of services
 */
export const parseImportedJSON = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.services || !Array.isArray(data.services)) {
            throw new Error('Invalid format: missing services array');
        }
        return data.services;
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
};

/**
 * Parse imported CSV
 * @param {string} csvString - CSV string
 * @returns {Array} Array of services
 */
export const parseImportedCSV = (csvString) => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const services = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const service = {
            name: values[0] || '',
            ip: values[1] || '',
            port: values[2] ? parseInt(values[2]) : null,
            vendor: values[3] || null,
            group: values[4] || null,
            tags: values[5] || null,
            mac_address: values[6] || null,
            maintenance: values[7] === 'Yes',
            monitored: values[8] === 'Yes',
            description: values[9] || '',
        };

        if (service.name && service.ip) {
            services.push(service);
        }
    }

    return services;
};

/**
 * Validate service data
 * @param {Object} service - Service object
 * @returns {boolean} Is valid
 */
export const validateService = (service) => {
    return !!(service.name && service.ip);
};
